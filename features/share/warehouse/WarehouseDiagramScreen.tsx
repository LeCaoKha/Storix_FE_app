import { RefreshContainer, ScreenHeader } from "@/components";
import {
  PathInstructionsModal,
  ShelfDetailModal,
  WarehouseGridView,
  WarehouseLayout,
} from "@/components/staff";
import { COLORS } from "@/constants/color";
import {
  useInboundOrdersByStaff,
  useInboundStorageRecommendations,
  useInboundTicket,
} from "@/hooks";
import {
  useOutboundTicket,
  useUpdateOutboundTicketItems,
} from "@/hooks/outbound-orders.hooks";
import { useProductInventoryLocations, useProducts } from "@/hooks/product.hooks";
import {
  useStockCountTicket,
  useWarehouseInventory,
} from "@/hooks/stock-count.hooks";
import { useTranslation } from "@/hooks/useTranslation";
import { useWarehouses, useWarehouseStructure } from "@/hooks/warehouse.hooks";
import { getProductInventoryLocations } from "@/services/product.api";
import { AlertService } from "@/stores/alert.store";
import { useAuthStore } from "@/stores/auth.store";
import { useInboundStagingStore } from "@/stores/inbound-staging.store";
import { usePendingQuantitiesStore } from "@/stores/pending-quantities.store";
import type { ProductInventoryLocation } from "@/types/product";
import { PathResult, Shelf, WarehouseZone } from "@/types/warehouse";
import { findNearestNode, findShortestPath } from "@/utils/pathfinding";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";

export default function WarehouseDiagramScreen() {
    const { t } = useTranslation();
  const params = useLocalSearchParams<{
    warehouseId?: string;
    inboundOrderId?: string;
    outboundOrderId?: string;
    inventoryCountTicketId?: string;
    recommendedBins?: string;
    focusedBins?: string;
    focusedItemId?: string;
    focusedItemName?: string;
    status?: string;
  }>();

  const initialWarehouseId = params.warehouseId
    ? Number(params.warehouseId)
    : undefined;
  const inboundOrderId = params.inboundOrderId
    ? Number(params.inboundOrderId)
    : undefined;
  const outboundOrderId = params.outboundOrderId
    ? Number(params.outboundOrderId)
    : undefined;
  const inventoryCountTicketId = params.inventoryCountTicketId
    ? Number(params.inventoryCountTicketId)
    : undefined;

  const isPicking = !!outboundOrderId;
  const isCounting = !!inventoryCountTicketId;
  const operationId =
    inboundOrderId || outboundOrderId || inventoryCountTicketId;

  const [optimizedPath, setOptimizedPath] = useState<string[]>([]);
  const [isFetchingPath, setIsFetchingPath] = useState(false);

  const routeBins = useMemo(
    () =>
      params.recommendedBins
        ? params.recommendedBins
            .split(",")
            .map((code) => code.trim())
            .filter(Boolean)
        : [],
    [params.recommendedBins],
  );
  const focusedBinsArray = useMemo(
    () =>
      params.focusedBins
        ? params.focusedBins
            .split(",")
            .map((code) => code.trim())
            .filter(Boolean)
        : [],
    [params.focusedBins],
  );
  const focusedItemId = params.focusedItemId
    ? Number(params.focusedItemId)
    : undefined;
  const focusedItemName = params.focusedItemName;

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<
    number | undefined
  >();
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);
  const [selectedZone, setSelectedZone] = useState<WarehouseZone | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPath, setCurrentPath] = useState<PathResult | null>(null);
  const [pathModalVisible, setPathModalVisible] = useState(false);
  const [currentLocation] = useState<{ x: number; y: number } | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");
  const [, setLocalReceivedByItemId] = useState<Record<number, number>>({});
  const [countLocationsByProductId, setCountLocationsByProductId] = useState<
    Record<number, ProductInventoryLocation[]>
  >({});

  // Get token and user from auth store
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token); // LẤY TOKEN Ở ĐÂY

  console.log("token day: ", token);

  const isStaff = user?.roleId === 4;
  const companyId = user?.companyId ?? 0;
  const staffId = user?.id ?? 0;

  const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();
  const {
    data: recommendationItems = [],
    isLoading: recommendationsLoading,
    refetch: refetchRecommendations,
  } = useInboundStorageRecommendations(inboundOrderId);
  const { data: inboundTicket, refetch: refetchInboundTicket } =
    useInboundTicket(inboundOrderId);
  const { data: staffInboundOrders = [] } = useInboundOrdersByStaff(
    companyId,
    staffId,
  );
  const { data: outboundOrder, refetch: refetchOutboundOrder } =
    useOutboundTicket(outboundOrderId);
  const { data: stockCountTicket, refetch: refetchStockCountTicket } =
    useStockCountTicket(inventoryCountTicketId || 0, companyId);

  const {
    data: structure,
    isLoading: structureLoading,
    error: structureError,
    refetch: refetchStructure,
  } = useWarehouseStructure(selectedWarehouseId);

  const resolvedProductId = useMemo(() => {
    if (!focusedItemId) return undefined;
    
    if (inboundOrderId && inboundTicket?.inboundOrderItems) {
      const item = inboundTicket.inboundOrderItems.find((i: any) => i.id === focusedItemId);
      if (item?.productId) return Number(item.productId);
    }
    
    if (outboundOrderId && outboundOrder?.outboundOrderItems) {
      const item = outboundOrder.outboundOrderItems.find((i: any) => i.id === focusedItemId);
      if (item?.productId) return Number(item.productId);
    }

    if (inventoryCountTicketId && stockCountTicket?.items) {
      const itemById = stockCountTicket.items.find((i: any) => i.id === focusedItemId);
      if (itemById?.productId) return Number(itemById.productId);

      const itemByProductId = stockCountTicket.items.find((i: any) => Number(i.productId || 0) === focusedItemId);
      if (itemByProductId) return focusedItemId;
    }
    
    const isTicketsLoading = (inboundOrderId && !inboundTicket) || 
                             (outboundOrderId && !outboundOrder) || 
                             (inventoryCountTicketId && !stockCountTicket);
    if (isTicketsLoading) return undefined;

    return focusedItemId;
  }, [focusedItemId, inboundOrderId, inboundTicket, outboundOrderId, outboundOrder, inventoryCountTicketId, stockCountTicket]);

  const { data: focusedProductLocations = [] } =
    useProductInventoryLocations(
      resolvedProductId,
      selectedWarehouseId,
    );
  const { data: products = [] } = useProducts();

  const productDimensionsById = useMemo(() => {
    const map = new Map<number, { width?: number; height?: number; length?: number }>();
    (products || []).forEach((product) => {
      const productId = Number(product.id || 0);
      if (productId <= 0) return;
      map.set(productId, {
        width: product.width,
        height: product.height,
        length: product.length,
      });
    });
    return map;
  }, [products]);

  useEffect(() => {
    if (!isCounting || !stockCountTicket || !selectedWarehouseId || !user?.id) {
      setCountLocationsByProductId({});
      return;
    }

    const productIds = Array.from(
      new Set(
        stockCountTicket.items
          .map((item) => Number(item.productId || 0))
          .filter((id) => id > 0),
      ),
    );

    if (productIds.length === 0) {
      setCountLocationsByProductId({});
      return;
    }

    let cancelled = false;

    const loadLocations = async () => {
      try {
        const results = await Promise.all(
          productIds.map(async (productId) => {
            const locations = await getProductInventoryLocations(
              Number(user.id),
              productId,
              Number(selectedWarehouseId),
            );
            return [productId, locations] as const;
          }),
        );

        if (cancelled) return;

        const next: Record<number, ProductInventoryLocation[]> = {};
        results.forEach(([productId, locations]) => {
          next[productId] = Array.isArray(locations) ? locations : [];
        });
        setCountLocationsByProductId(next);
      } catch (error) {
        if (!cancelled) {
          console.error("[WarehouseDiagramScreen] Failed to load inventory locations for count mode", error);
          setCountLocationsByProductId({});
        }
      }
    };

    void loadLocations();

    return () => {
      cancelled = true;
    };
  }, [isCounting, stockCountTicket, selectedWarehouseId, user?.id]);

  const focusedInventorySummary = useMemo(() => {
    const grouped = new Map<
      string,
      { shelfId?: string; shelfCode?: string; label: string; quantity: number }
    >();

    focusedProductLocations.forEach((location) => {
      const rawLabel =
        location.shelfCode ||
        location.shelfIdCode ||
        (location.shelfId ? `${t('warehouse.shelf')} #${location.shelfId}` : t('warehouse.shelfNotRecognized'));
      const normalizedKey = String(
        location.shelfIdCode || location.shelfCode || location.shelfId || rawLabel,
      )
        .trim()
        .toLowerCase();
      const quantity = Math.max(0, Number(location.quantity || 0));

      if (!grouped.has(normalizedKey)) {
        grouped.set(normalizedKey, {
          shelfId: location.shelfId ? String(location.shelfId) : undefined,
          shelfCode: location.shelfIdCode || location.shelfCode || undefined,
          label: rawLabel,
          quantity: 0,
        });
      }

      grouped.get(normalizedKey)!.quantity += quantity;
    });

    return Array.from(grouped.values()).sort(
      (left, right) => right.quantity - left.quantity || left.label.localeCompare(right.label),
    );
  }, [focusedProductLocations]);

  const focusedInventoryHighlightValues = useMemo(() => {
    const values = focusedProductLocations.flatMap((location) => [
      location.shelfIdCode,
      location.shelfCode,
      location.shelfId ? String(location.shelfId) : undefined,
    ]);

    return Array.from(new Set(values.filter((value): value is string => !!value)));
  }, [focusedProductLocations]);

  // ===== PATH OPTIMIZATION FETCH EFFECT =====
  useEffect(() => {
    const fetchOptimizedPath = async () => {
      const currentStatus = params.status;
      const currentOutboundId = params.outboundOrderId;

      if (currentStatus !== "path_optimization" || !currentOutboundId) return;

      setIsFetchingPath(true);
      try {
        console.log(`[PathOptimization] Fetching path with token...`);
        const response = await fetch(
          `https://storix-docker.onrender.com/api/InventoryOutbound/tickets/${currentOutboundId}/path-optimization`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              // ĐÍNH KÈM TOKEN VÀO HEADER TẠI ĐÂY
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Extracting path array safely
        const pathArray = data?.payload?.[0]?.fullOptimizedPath;

        if (pathArray && Array.isArray(pathArray) && pathArray.length > 0) {
          console.log(
            "[PathOptimization] Path extracted successfully. Nodes:",
            pathArray.length,
          );
          setOptimizedPath(pathArray);
          setViewMode("map");
          AlertService.success(
            t('warehouse.pathFound'),
            t('warehouse.pathFoundMsg'),
          );
        } else {
          AlertService.warning(
            t('warehouse.pathNotFound'),
            t('warehouse.pathNotFoundMsg'),
          );
        }
      } catch (err) {
        console.error("[PathOptimization] Error fetching path:", err);
        // AlertService.error(
        //   t('common.error'),
        //   "Failed to connect to path optimization service.",
        // );
      } finally {
        setIsFetchingPath(false);
      }
    };

    fetchOptimizedPath();
  }, [params.status, params.outboundOrderId, token]); // Added token to dependencies
  // ===== END PATH OPTIMIZATION EFFECT =====

  const updateOutboundItems = useUpdateOutboundTicketItems();
  const { refetch: refetchWarehouses } = useWarehouses();
  const stagedTickets = useInboundStagingStore((state) => state.tickets);
  const inboundStagingTicket = useInboundStagingStore((state) =>
    inboundOrderId ? state.tickets[inboundOrderId] : undefined,
  );
  const setStagedPlacement = useInboundStagingStore(
    (state) => state.setPlacement,
  );
  const getItemStagedQuantity = useInboundStagingStore(
    (state) => state.getItemStagedQuantity,
  );

  const syncLocalReceivedByItemId = React.useCallback(
    (ticket: any) => {
      if (!ticket?.inboundOrderItems) return;
      const nextMap: Record<number, number> = {};
      ticket.inboundOrderItems.forEach((item: any) => {
        const baseReceived = Number(item.receivedQuantity || 0);
        const stagedReceived = inboundOrderId
          ? getItemStagedQuantity(inboundOrderId, item.id)
          : 0;
        nextMap[item.id] = baseReceived + stagedReceived;
      });
      setLocalReceivedByItemId(nextMap);
    },
    [getItemStagedQuantity, inboundOrderId],
  );

  const getInboundCurrentReceived = React.useCallback(
    (itemId: number) => {
      const ticketItem = inboundTicket?.inboundOrderItems?.find(
        (ti) => ti.id === itemId,
      );
      const baseReceived = Number(ticketItem?.receivedQuantity || 0);
      const stagedReceived = Number(
        inboundStagingTicket?.items?.[itemId]?.total || 0,
      );
      return baseReceived + stagedReceived;
    },
    [inboundStagingTicket, inboundTicket],
  );

  const handleRefresh = async () => {
    await Promise.all([
      refetchWarehouses(),
      refetchRecommendations(),
      refetchStructure(),
      inboundOrderId ? refetchInboundTicket() : Promise.resolve(),
      outboundOrderId ? refetchOutboundOrder() : Promise.resolve(),
      inventoryCountTicketId ? refetchStockCountTicket() : Promise.resolve(),
    ]);
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const clearShelfPending = usePendingQuantitiesStore((state) => state.clearShelfPending);

  const recommendedBins = useMemo(() => {
    const binsFromApi = recommendationItems
      .flatMap((item) => item.storageRecommendations || [])
      .map((recommendation) => recommendation.binIdCode)
      .filter((binCode): binCode is string => !!binCode);
    return Array.from(new Set([...routeBins, ...binsFromApi]));
  }, [recommendationItems, routeBins]);

  const inventoryBins = useMemo(() => {
    if (!stockCountTicket) return [];
    return stockCountTicket.items
      .map((item) => item.locationId?.toString())
      .filter((id): id is string => !!id);
  }, [stockCountTicket]);

  const countTicketProductIds = useMemo(() => {
    if (!isCounting || !stockCountTicket) return [];

    return Array.from(
      new Set(
        stockCountTicket.items
          .map((item) => Number(item.productId || 0))
          .filter((productId) => productId > 0),
      ),
    );
  }, [isCounting, stockCountTicket]);

  const { data: suggestedInventory = [] } = useWarehouseInventory(
    selectedWarehouseId,
    countTicketProductIds,
  );

  const normalizeShelfKey = React.useCallback((value: unknown) => {
    return String(value ?? "").trim().toLowerCase();
  }, []);

  const isLocationInSelectedShelf = React.useCallback(
    (location: ProductInventoryLocation, shelf: Shelf | null) => {
      if (!shelf) return false;

      const selectedShelfId = normalizeShelfKey(shelf.id);
      const selectedShelfCode = normalizeShelfKey(shelf.code);
      const locationShelfCode = normalizeShelfKey(location.shelfCode);
      const locationShelfIdCode = normalizeShelfKey(location.shelfIdCode);
      const locationShelfId = normalizeShelfKey(location.shelfId);

      return (
        (!!selectedShelfCode &&
          (locationShelfCode === selectedShelfCode ||
            locationShelfIdCode === selectedShelfCode)) ||
        (!!selectedShelfId &&
          (locationShelfId === selectedShelfId ||
            locationShelfIdCode === selectedShelfId))
      );
    },
    [normalizeShelfKey],
  );

  const selectedShelfQuantityByProductId = useMemo(() => {
    const quantities: Record<number, number> = {};
    if (!selectedShelf) return quantities;

    Object.entries(countLocationsByProductId).forEach(([productIdKey, locations]) => {
      const productId = Number(productIdKey || 0);
      if (productId <= 0) return;

      const qtyOnSelectedShelf = (locations || [])
        .filter((location) => isLocationInSelectedShelf(location, selectedShelf))
        .reduce((sum, location) => sum + Math.max(0, Number(location.quantity || 0)), 0);

      if (qtyOnSelectedShelf > 0) {
        quantities[productId] = qtyOnSelectedShelf;
      }
    });

    suggestedInventory.forEach((inventoryItem) => {
      const productId = Number(inventoryItem.productId || 0);
      if (productId <= 0) return;
      if (Number(quantities[productId] || 0) > 0) return;

      const qtyOnSelectedShelf = (inventoryItem.binDetails || [])
        .filter(
          (bin) =>
            normalizeShelfKey(bin.shelfCode) === normalizeShelfKey(selectedShelf.code),
        )
        .reduce((sum, bin) => sum + Math.max(0, Number(bin.quantity || 0)), 0);

      if (qtyOnSelectedShelf > 0) {
        quantities[productId] = qtyOnSelectedShelf;
      }
    });

    return quantities;
  }, [
    countLocationsByProductId,
    isLocationInSelectedShelf,
    normalizeShelfKey,
    selectedShelf,
    suggestedInventory,
  ]);

  const selectedShelfQuantityByLocationMap = useMemo(() => {
    const quantities: Record<number, number> = {};
    if (!selectedShelf) return quantities;

    Object.values(countLocationsByProductId).forEach((locations) => {
      (locations || []).forEach((location) => {
        const matchesSelectedShelf = isLocationInSelectedShelf(location, selectedShelf);

        if (!matchesSelectedShelf) return;

        const inventoryLocationId = Number(location.inventoryLocationId || 0);
        if (inventoryLocationId <= 0) return;

        quantities[inventoryLocationId] = Math.max(0, Number(location.quantity || 0));
      });
    });

    return quantities;
  }, [countLocationsByProductId, isLocationInSelectedShelf, selectedShelf]);

  const suggestedBins = useMemo(() => {
    const bins: string[] = [];
    
    // Vị trí từ tồn kho tổng quát (cho cả phiếu)
    suggestedInventory.forEach((item) => {
      item.binDetails?.forEach((bin) => {
        if (bin.binCode) bins.push(bin.binCode);
      });
    });

    // Vị trí thực tế của sản phẩm đang focus (dữ liệu chính xác nhất)
    focusedProductLocations.forEach((loc) => {
      if (loc.shelfIdCode) bins.push(String(loc.shelfIdCode));
      if (loc.shelfCode) bins.push(String(loc.shelfCode));
      if (loc.shelfId) bins.push(String(loc.shelfId));
    });

    return Array.from(new Set(bins));
  }, [suggestedInventory, focusedProductLocations]);

  const focusedShelfQuantity = useMemo(() => {
    if (focusedItemId && selectedShelfQuantityByProductId[Number(focusedItemId)]) {
      return Number(selectedShelfQuantityByProductId[Number(focusedItemId)] || 0);
    }

    if (!selectedShelf) return 0;

    const matched = focusedInventorySummary.find(
      (entry) =>
        String(entry.shelfId ?? "").trim() === String(selectedShelf.id).trim() ||
        String(entry.shelfCode ?? "").trim() === String(selectedShelf.code).trim(),
    );

    return Number(matched?.quantity || 0);
  }, [focusedItemId, selectedShelf, selectedShelfQuantityByProductId, focusedInventorySummary]);

  const countItemsForSelectedShelf = useMemo(() => {
    if (!isCounting || !stockCountTicket || !selectedShelf) return [];

    const focusedProductId = Number(focusedItemId || 0);
    const applyFocusedProductFilter = (items: typeof stockCountTicket.items) => {
      if (focusedProductId <= 0) return items;
      return items.filter(
        (item) => Number(item.productId || 0) === focusedProductId,
      );
    };

    const shelfBinValues = new Set(
      (selectedShelf.levels ?? []).flatMap((level) =>
        (level.bins ?? []).flatMap((bin) => [String(bin.id), String(bin.code)]),
      ),
    );

    const shelfIdentityValues = new Set<string>([
      String(selectedShelf.id),
      String(selectedShelf.code),
      ...Array.from(shelfBinValues),
    ]);

    const selectedShelfHasFocusedInventory = focusedInventorySummary.some(
      (entry) =>
        String(entry.shelfId ?? "").trim() === String(selectedShelf.id).trim() ||
        String(entry.shelfCode ?? "").trim() === String(selectedShelf.code).trim(),
    );

    const matchedItems = stockCountTicket.items.filter((item) => {
      const locationValue = item.locationId != null ? String(item.locationId) : "";
      const matchesLocation = locationValue.length > 0 && shelfIdentityValues.has(locationValue);
      const locationIdAsNumber = Number(item.locationId || 0);
      const matchesInventoryLocationMap =
        locationIdAsNumber > 0 &&
        Number(selectedShelfQuantityByLocationMap[locationIdAsNumber] || 0) > 0;

      const matchesFocusedProductOnShelf =
        !!focusedItemId &&
        Number(item.productId || 0) === Number(focusedItemId) &&
        selectedShelfHasFocusedInventory &&
        focusedShelfQuantity > 0;

      return matchesLocation || matchesInventoryLocationMap || matchesFocusedProductOnShelf;
    });

    if (matchedItems.length > 0) return applyFocusedProductFilter(matchedItems);

    const shelfMatchedByInventory = stockCountTicket.items.filter((item) => {
      const productId = Number(item.productId || 0);
      return productId > 0 && Number(selectedShelfQuantityByProductId[productId] || 0) > 0;
    });

    if (shelfMatchedByInventory.length > 0)
      return applyFocusedProductFilter(shelfMatchedByInventory);

    // Fallback: if user is counting a specific focused product, allow counting it on the selected shelf.
    if (focusedItemId && focusedShelfQuantity > 0) {
      return stockCountTicket.items.filter(
        (item) => Number(item.productId || 0) === Number(focusedItemId),
      );
    }

    return applyFocusedProductFilter([]);
  }, [
    isCounting,
    stockCountTicket,
    selectedShelf,
    focusedItemId,
    focusedShelfQuantity,
    selectedShelfQuantityByProductId,
    selectedShelfQuantityByLocationMap,
    focusedInventorySummary,
  ]);

  const countExpectedByItemId = useMemo(() => {
    const map: Record<number, number> = {};

    countItemsForSelectedShelf.forEach((item) => {
      const isFocusedProduct =
        !!focusedItemId && Number(item.productId || 0) === Number(focusedItemId);

      const shelfExpectedByInventory = Number(
        selectedShelfQuantityByProductId[Number(item.productId || 0)] || 0,
      );
      const shelfExpectedByLocation = Number(
        selectedShelfQuantityByLocationMap[Number(item.locationId || 0)] || 0,
      );

      map[item.id] = shelfExpectedByLocation > 0
        ? shelfExpectedByLocation
        : shelfExpectedByInventory > 0
        ? shelfExpectedByInventory
        : isFocusedProduct && focusedShelfQuantity > 0
          ? focusedShelfQuantity
          : Math.max(0, Number(item.systemQuantity || 0));
    });

    return map;
  }, [
    countItemsForSelectedShelf,
    focusedItemId,
    focusedShelfQuantity,
    selectedShelfQuantityByProductId,
    selectedShelfQuantityByLocationMap,
  ]);

  useEffect(() => {
    if (!isCounting) return;

    const selectedShelfBins = (selectedShelf?.levels ?? []).flatMap((level) =>
      (level.bins ?? []).map((bin) => ({ id: String(bin.id), code: String(bin.code) })),
    );

    const ticketItemsDebug = (stockCountTicket?.items ?? []).map((item) => ({
      id: item.id,
      productId: item.productId,
      locationId: item.locationId,
      systemQuantity: item.systemQuantity,
      countedQuantity: item.countedQuantity,
      sku: item.sku,
      name: item.name,
    }));

    const locationsDebug = Object.entries(countLocationsByProductId).map(
      ([productId, locations]) => ({
        productId: Number(productId),
        locations: (locations || []).map((loc) => ({
          inventoryLocationId: loc.inventoryLocationId,
          shelfId: loc.shelfId,
          shelfCode: loc.shelfCode,
          shelfIdCode: loc.shelfIdCode,
          quantity: loc.quantity,
        })),
      }),
    );

    console.log("[CountDebug] Selected shelf", {
      id: selectedShelf?.id,
      code: selectedShelf?.code,
      bins: selectedShelfBins,
    });
    console.log("[CountDebug] Stock count ticket items", ticketItemsDebug);
    console.log("[CountDebug] Product inventory locations", locationsDebug);
    console.log("[CountDebug] Quantity by inventoryLocationId", selectedShelfQuantityByLocationMap);
    console.log("[CountDebug] Quantity by productId", selectedShelfQuantityByProductId);
    console.log("[CountDebug] Matched items for selected shelf", countItemsForSelectedShelf.map((item) => ({
      id: item.id,
      productId: item.productId,
      locationId: item.locationId,
      resolvedExpected: countExpectedByItemId[item.id],
      systemQuantity: item.systemQuantity,
      countedQuantity: item.countedQuantity,
    })));
  }, [
    isCounting,
    selectedShelf,
    stockCountTicket,
    countLocationsByProductId,
    selectedShelfQuantityByLocationMap,
    selectedShelfQuantityByProductId,
    countItemsForSelectedShelf,
    countExpectedByItemId,
  ]);

  const effectiveHighlightedBins = useMemo(() => {
    if (focusedBinsArray.length > 0) return focusedBinsArray;
    if (focusedItemId) {
      return Array.from(
        new Set([...focusedInventoryHighlightValues, ...(isCounting ? [...inventoryBins, ...suggestedBins] : recommendedBins)]),
      );
    }
    if (isCounting)
      return Array.from(new Set([...inventoryBins, ...suggestedBins]));
    return recommendedBins;
  }, [
    focusedBinsArray,
    focusedItemId,
    focusedInventoryHighlightValues,
    isCounting,
    inventoryBins,
    suggestedBins,
    recommendedBins,
  ]);

  const scopedInboundRecommendationItems = useMemo(() => {
    if (!inboundOrderId || !focusedItemId) return recommendationItems;
    return recommendationItems.filter(
      (item) => item.inboundOrderItemId === focusedItemId,
    );
  }, [inboundOrderId, focusedItemId, recommendationItems]);

  const recommendationPreview = useMemo(() => {
    const preview: {
      itemName?: string;
      binIdCode: string;
      distanceInfo?: number;
      reason?: string;
    }[] = [];
    scopedInboundRecommendationItems.forEach((item) => {
      const recs = (item.storageRecommendations || []).filter(
        (recommendation) => !!recommendation.binIdCode,
      );
      if (recs.length === 0) return;
      const best = recs.reduce((currentBest, current) => {
        const bestDistance =
          typeof currentBest.distanceInfo === "number"
            ? currentBest.distanceInfo
            : Number.POSITIVE_INFINITY;
        const currentDistance =
          typeof current.distanceInfo === "number"
            ? current.distanceInfo
            : Number.POSITIVE_INFINITY;
        return currentDistance < bestDistance ? current : currentBest;
      }, recs[0]);
      preview.push({
        itemName: item.name,
        binIdCode: String(best.binIdCode),
        distanceInfo: best.distanceInfo,
        reason: best.reason,
      });
    });
    return preview.slice(0, 4);
  }, [scopedInboundRecommendationItems]);

  const recommendationResolution = useMemo(() => {
    if (!structure || effectiveHighlightedBins.length === 0) {
      return {
        shelfIds: [] as string[],
        firstShelf: null as Shelf | null,
        firstZone: null as WarehouseZone | null,
      };
    }
    const shelfIds = new Set<string>();
    let firstShelf: Shelf | null = null;
    let firstZone: WarehouseZone | null = null;
    for (const zone of structure.zones ?? []) {
      for (const shelf of zone.shelves ?? []) {
        const isShelfDirectlyRecommended = effectiveHighlightedBins.some(
          (code) => String(code) === shelf.id || String(code) === shelf.code,
        );
        const hasRecommendedBin = (shelf.levels ?? []).some((level) =>
          (level.bins ?? []).some((bin) =>
            effectiveHighlightedBins.some(
              (code) => String(code) === bin.code || String(code) === bin.id,
            ),
          ),
        );
        if (isShelfDirectlyRecommended || hasRecommendedBin) {
          shelfIds.add(shelf.id);
          if (!firstShelf) {
            firstShelf = shelf;
            firstZone = zone;
          }
        }
      }
    }
    return { shelfIds: Array.from(shelfIds), firstShelf, firstZone };
  }, [effectiveHighlightedBins, structure]);

  const recommendedShelvesForRender = recommendationResolution.shelfIds;
  const activeHighlightedShelf = selectedShelf?.id;

  React.useEffect(() => {
    if (!warehouses || warehouses.length === 0) return;
    if (
      initialWarehouseId &&
      warehouses.some((warehouse) => warehouse.id === initialWarehouseId)
    ) {
      if (selectedWarehouseId !== initialWarehouseId)
        setSelectedWarehouseId(initialWarehouseId);
      return;
    }
    if (
      !selectedWarehouseId ||
      !warehouses.some((warehouse) => warehouse.id === selectedWarehouseId)
    ) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId, initialWarehouseId]);

  const ticketWarehouseId = React.useMemo(() => {
    const fromTicket =
      inboundTicket?.warehouseId || inboundTicket?.warehouse?.id;
    if (fromTicket) return fromTicket;
    if (!inboundOrderId) return undefined;
    const fromStaffOrders = staffInboundOrders.find(
      (order) => order.id === inboundOrderId,
    );
    return fromStaffOrders?.warehouseId || fromStaffOrders?.warehouse?.id;
  }, [inboundTicket, staffInboundOrders, inboundOrderId]);

  React.useEffect(() => {
    if (
      isPicking ||
      !ticketWarehouseId ||
      selectedWarehouseId === ticketWarehouseId
    )
      return;
    if (warehouses?.some((warehouse) => warehouse.id === ticketWarehouseId)) {
      setSelectedWarehouseId(ticketWarehouseId);
    }
  }, [isPicking, ticketWarehouseId, selectedWarehouseId, warehouses]);

  React.useEffect(() => {
    setModalVisible(false);
    setSelectedShelf(null);
    setSelectedZone(null);
  }, [selectedWarehouseId]);

  React.useEffect(() => {
    syncLocalReceivedByItemId(inboundTicket);
  }, [inboundTicket, stagedTickets, syncLocalReceivedByItemId]);

  const handleShelfPress = (shelf: Shelf, zone: WarehouseZone) => {
    setSelectedShelf(shelf);
    setSelectedZone(zone);
    setModalVisible(true);
  };

  const handleZonePress = (zone: WarehouseZone) => {
    setSelectedZone(zone);
    setSelectedShelf(null);
  };

  const handleFindPath = (shelf: Shelf) => {
    if (!structure) return;
    const startNode = currentLocation
      ? findNearestNode(structure.nodes, currentLocation.x, currentLocation.y)
      : structure.nodes?.[0];
    if (!startNode) return;
    const targetAccessNode = shelf.accessNodes?.[0];
    if (!targetAccessNode) return;
    const endNode = findNearestNode(
      structure.nodes,
      targetAccessNode.x,
      targetAccessNode.y,
    );
    if (!endNode) return;
    const path = findShortestPath(
      structure.nodes,
      structure.edges,
      startNode.id,
      endNode.id,
    );
    if (path) {
      setCurrentPath(path);
      setPathModalVisible(true);
    }
  };

  const handleFindPathToRecommended = () => {
    if (!recommendationResolution.firstShelf) return;
    setSelectedShelf(recommendationResolution.firstShelf);
    setSelectedZone(recommendationResolution.firstZone);
    handleFindPath(recommendationResolution.firstShelf);
  };

  const handleConfirmOperationAtShelf = async (actionItems: any[]) => {
    if (isProcessing) return;
    if (!selectedShelf) {
      AlertService.warning(
        t('warehouse.missingShelfInfo'),
        t('warehouse.missingShelfInfoMsg'),
      );
      return;
    }
    const currentSelectedShelf = selectedShelf;

    if (!isPicking && inboundOrderId) {
      if (!ticketWarehouseId) {
        AlertService.warning(
          t('warehouse.undefinedWarehouse'),
          t('warehouse.undefinedWarehouseMsg'),
        );
        return;
      }
      if (selectedWarehouseId && ticketWarehouseId !== selectedWarehouseId) {
        AlertService.warning(
          t('warehouse.wrongWarehouse'),
          t('warehouse.wrongWarehouseMsg'),
        );
        return;
      }
    }

    const selectedShelfBins = (currentSelectedShelf.levels ?? []).flatMap(
      (level) => level.bins ?? [],
    );
    const defaultBinId = selectedShelfBins[0]?.id
      ? String(selectedShelfBins[0].id)
      : undefined;
    if (!defaultBinId) {
      AlertService.warning(
        t('warehouse.missingBinTitle'),
        t('warehouse.missingBinMsg'),
      );
      return;
    }

    const binById = new Map(
      selectedShelfBins.map((bin) => [String(bin.id), bin] as const),
    );
    const binByCode = new Map(
      selectedShelfBins.map((bin) => [String(bin.code), bin] as const),
    );

    const normalizedActionItems = actionItems.map((item) => {
      const rawBinId = String(item.binId || "").trim();
      const rawBinCode = String(item.binCode || "").trim();
      const resolvedBin =
        binById.get(rawBinId) ||
        binById.get(rawBinCode) ||
        binByCode.get(rawBinCode) ||
        selectedShelfBins[0];
      return {
        ...item,
        binId: String(
          resolvedBin.id || resolvedBin.code || item.binCode || "",
        ).trim(),
        binCode: String(
          resolvedBin.code || resolvedBin.id || item.binCode || "",
        ).trim(),
      };
    });

    const normalizeBinValue = (value?: string | number | null) =>
      String(value ?? "")
        .trim()
        .toLowerCase();
    const resolveRecommendationBinIdCode = (
      inboundOrderItemId: number,
      preferredBinValues: (string | number | undefined)[],
    ) => {
      const recs =
        recommendationItems.find(
          (item) => item.inboundOrderItemId === inboundOrderItemId,
        )?.storageRecommendations || [];
      if (recs.length === 0) return undefined;
      const preferred = preferredBinValues
        .map((value) => normalizeBinValue(value))
        .filter(Boolean);
      const matched = recs.find((rec) => {
        const recValue = normalizeBinValue(rec.binIdCode ?? rec.binId);
        return recValue.length > 0 && preferred.includes(recValue);
      });
      return (
        String(matched?.binIdCode || recs[0]?.binIdCode || "").trim() ||
        undefined
      );
    };

    setIsProcessing(true);
    try {
      if (!isPicking && inboundOrderId) {
        const validItems = normalizedActionItems.filter((item) => {
          const productId = Number(item.productId || 0);
          const quantity = Number(
            item.pendingQuantity ?? item.targetQuantity ?? 0,
          );
          const binId = String(item.binId || "").trim();
          return productId > 0 && quantity > 0 && binId.length > 0;
        });

        if (validItems.length === 0) {
          AlertService.warning(
            "Invalid data",
            "No valid items to update (missing productId/binId or quantity).",
          );
          return;
        }

        validItems.forEach((item) => {
          const quantity = Number(
            item.pendingQuantity ?? item.targetQuantity ?? 0,
          );
          const fallbackBinIdCode = resolveRecommendationBinIdCode(item.id, [
            item.binId,
            item.binCode,
          ]);
          const safeBinId = String(
            item.binId || fallbackBinIdCode || "",
          ).trim();
          if (safeBinId && quantity > 0)
            setStagedPlacement(inboundOrderId, item.id, safeBinId, quantity);
        });

        AlertService.success(
          t('warehouse.recordedSuccessfully'),
          `${t('common.save')}: ${selectedShelf.code || t('warehouse.shelf')}.`,
        );
        syncLocalReceivedByItemId(inboundTicket);
        if (selectedShelf && inboundOrderId)
          clearShelfPending(inboundOrderId, selectedShelf.id);
      } else if (isPicking && outboundOrderId) {
        const validItems = normalizedActionItems.filter(
          (item) =>
            Number(item.pendingQuantity ?? item.targetQuantity ?? 0) > 0,
        );

        if (validItems.length === 0) {
          AlertService.warning(
            "Invalid data",
            "Please select a quantity greater than 0 before confirming.",
          );
          return;
        }

        const itemsToUpdate = validItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          receivedQuantity:
            (item.currentQuantity || 0) +
            Number(item.pendingQuantity ?? item.targetQuantity ?? 0),
          locations: [
            {
              binId: String(item.binId),
              quantity: Number(
                item.pendingQuantity ?? item.targetQuantity ?? 0,
              ),
            },
          ],
        }));

        await updateOutboundItems.mutateAsync({
          ticketId: outboundOrderId,
          items: itemsToUpdate as any,
        });

        setLocalReceivedByItemId((prev) => {
          const next = { ...prev };
          validItems.forEach((item) => {
            const stagedQty = getItemStagedQuantity(outboundOrderId, item.id);
            next[item.id] = (item.currentQuantity ?? 0) + stagedQty;
          });
          return next;
        });

        await refetchOutboundOrder();
        if (selectedShelf && outboundOrderId)
          clearShelfPending(outboundOrderId, selectedShelf.id);
      }

      if (isPicking) setModalVisible(false);
    } catch (error: any) {
      console.error("[WarehouseDiagramScreen] confirm operation failed", error);
      AlertService.error(
        "Error",
        String(error?.response?.data?.message || "").trim() ||
          "Cannot update item status",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const availableItemsForModal = useMemo(() => {
    if (!selectedShelf) return [];
    const shelfBins = (selectedShelf.levels ?? []).flatMap(
      (level) => level.bins ?? [],
    );
    const shelfBinCodes = shelfBins.map((bin) => bin.code);
    const shelfBinValues = new Set(
      shelfBins.flatMap((bin) => [String(bin.code), String(bin.id)]),
    );
    const firstBin = selectedShelf.levels?.[0]?.bins?.[0];

    if (!isPicking) {
      const recommended = scopedInboundRecommendationItems
        .filter((item) =>
          (item.storageRecommendations ?? []).some((r) =>
            shelfBinValues.has(String(r.binIdCode ?? r.binId ?? "")),
          ),
        )
        .filter((item) => {
          const ticketItem = inboundTicket?.inboundOrderItems?.find(
            (ti) => ti.id === item.inboundOrderItemId,
          );
          return (
            Number(ticketItem?.expectedQuantity ?? 0) -
              getInboundCurrentReceived(item.inboundOrderItemId) >
            0
          );
        })
        .map((item) => {
          const matchedRec = item.storageRecommendations!.find((r) =>
            shelfBinValues.has(String(r.binIdCode ?? r.binId ?? "")),
          );
          const matchedBin = (selectedShelf.levels ?? [])
            .flatMap((level) => level.bins ?? [])
            .find(
              (bin) =>
                bin.code === matchedRec?.binIdCode ||
                String(bin.id) ===
                  String(matchedRec?.binIdCode ?? matchedRec?.binId),
            );
          const ticketItem = inboundTicket?.inboundOrderItems?.find(
            (ti) => ti.id === item.inboundOrderItemId,
          );
          return {
            id: item.inboundOrderItemId,
            productId:
              item.productId ||
              ticketItem?.productId ||
              ticketItem?.product?.id ||
              0,
            name: item.name || "",
            sku: item.sku,
            targetQuantity: Number(ticketItem?.expectedQuantity ?? 0),
            recommendedQuantity: Number(matchedRec?.quantity ?? 0),
            currentQuantity: getInboundCurrentReceived(item.inboundOrderItemId),
            binCode: matchedBin?.code || firstBin?.code || selectedShelf.code,
            binId: matchedBin?.id || firstBin?.id || "",
            isRecommended: true,
            productWidth: productDimensionsById.get(Number(item.productId || ticketItem?.productId || ticketItem?.product?.id || 0))?.width,
            productHeight: productDimensionsById.get(Number(item.productId || ticketItem?.productId || ticketItem?.product?.id || 0))?.height,
            productLength: productDimensionsById.get(Number(item.productId || ticketItem?.productId || ticketItem?.product?.id || 0))?.length,
          };
        });

      if (recommended.length > 0) return recommended;

      return (inboundTicket?.inboundOrderItems || [])
        .filter((item) => !focusedItemId || item.id === focusedItemId)
        .filter(
          (item) =>
            (item.expectedQuantity ?? 0) - getInboundCurrentReceived(item.id) >
            0,
        )
        .map((item) => ({
          id: item.id,
          productId: item.productId || item.product?.id || 0,
          name:
            item.productName ||
            item.product?.name ||
            item.name ||
            `Item #${item.productId}`,
          sku: item.sku || item.product?.sku,
          targetQuantity: item.expectedQuantity || 0,
          currentQuantity: getInboundCurrentReceived(item.id),
          binCode: firstBin?.code || selectedShelf.code,
          binId: firstBin?.id || "",
          isRecommended: false,
          productWidth: productDimensionsById.get(Number(item.productId || item.product?.id || 0))?.width,
          productHeight: productDimensionsById.get(Number(item.productId || item.product?.id || 0))?.height,
          productLength: productDimensionsById.get(Number(item.productId || item.product?.id || 0))?.length,
        }));
    } else {
      const orderItems =
        outboundOrder?.items || outboundOrder?.outboundOrderItems || [];
      const recommended = orderItems
        .filter((item) =>
          effectiveHighlightedBins.some((code) =>
            shelfBinCodes.includes(String(code)),
          ),
        )
        .map((item) => {
          const binCode =
            shelfBinCodes.find((code) =>
              effectiveHighlightedBins.includes(String(code)),
            ) || shelfBinCodes[0];
          const bin = (selectedShelf.levels ?? [])
            .flatMap((l) => l.bins ?? [])
            .find((b) => b.code === binCode);
          return {
            id: item.id,
            productId: item.productId || item.product?.id || 0,
            name:
              item.productName ||
              item.product?.name ||
              item.name ||
              `Item #${item.productId}`,
            sku: item.sku || item.product?.sku,
            targetQuantity: (item.quantity || 0) - (item.receivedQuantity || 0),
            currentQuantity: item.receivedQuantity || 0,
            binCode: binCode,
            binId: bin?.id || "",
            isRecommended: true,
          };
        });

      if (recommended.length > 0) return recommended;

      return orderItems
        .filter((item) => (item.quantity || 0) > (item.receivedQuantity || 0))
        .map((item) => ({
          id: item.id,
          productId: item.productId || item.product?.id || 0,
          name:
            item.productName ||
            item.product?.name ||
            item.name ||
            `Item #${item.productId}`,
          sku: item.sku || item.product?.sku,
          targetQuantity: (item.quantity ?? 0) - (item.receivedQuantity ?? 0),
          currentQuantity: item.receivedQuantity || 0,
          binCode: firstBin?.code || selectedShelf.code,
          binId: firstBin?.id || "",
          isRecommended: false,
        }));
    }
  }, [
    selectedShelf,
    isPicking,
    scopedInboundRecommendationItems,
    inboundTicket,
    outboundOrder,
    effectiveHighlightedBins,
    focusedItemId,
    getInboundCurrentReceived,
    productDimensionsById,
  ]);

  if (warehousesLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
        <ScreenHeader title={t('warehouse.map')} showBackButton={true} />
        <View className="flex-1 justify-center items-center p-5">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-3 text-sm" style={{ color: COLORS.textMuted }}>
            {t('common.loading')}
          </Text>
        </View>
      </View>
    );
  }

  if (!warehouses || warehouses.length === 0) {
    return (
      <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
        <ScreenHeader title={t('warehouse.map')} showBackButton={true} />
        <View className="flex-1 justify-center items-center p-5">
          <Feather name="inbox" size={64} color="#CCC" />
          <Text className="text-lg font-semibold text-slate-600 mt-4">
            {t('common.noData')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
      <ScreenHeader
        title={t('warehouse.map')}
        subtitle={
          isStaff ? t('warehouse.map') : t('warehouse.map')
        }
        showBackButton={true}
        rightButton={
          isStaff &&
          inboundOrderId && (
            <TouchableOpacity
              onPress={() => {
                AlertService.confirm(
                  t('warehouse.clearProgressTitle'),
                  t('warehouse.clearProgressMsg'),
                  () => {
                    useInboundStagingStore
                      .getState()
                      .clearTicket(inboundOrderId);
                    setLocalReceivedByItemId({});
                    AlertService.success(
                      t('warehouse.clearedTitle'),
                      t('warehouse.clearedMsg'),
                    );
                  },
                );
              }}
              className="p-2 rounded-lg"
              style={{ backgroundColor: COLORS.danger + "10" }}
            >
              <Feather name="trash-2" size={20} color={COLORS.danger} />
            </TouchableOpacity>
          )
        }
      />

      {warehouses.length > 1 && (
        <View
          className="bg-white py-3 border-b"
          style={{ borderBottomColor: COLORS.border }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="bg-white"
            contentContainerClassName="px-5 pb-3 gap-2"
          >
            {warehouses.map((warehouse) => (
              <TouchableOpacity
                key={warehouse.id}
                className={`px-3.5 py-2 rounded-xl border ${selectedWarehouseId === warehouse.id ? "" : "bg-slate-100 border-slate-200"}`}
                style={
                  selectedWarehouseId === warehouse.id
                    ? {
                        backgroundColor: COLORS.primary,
                        borderColor: COLORS.primary,
                      }
                    : {}
                }
                onPress={() => setSelectedWarehouseId(warehouse.id)}
              >
                <Text
                  className={`text-[13px] font-semibold ${selectedWarehouseId === warehouse.id ? "text-white" : "text-slate-600"}`}
                >
                  {warehouse.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <RefreshContainer className="flex-1" onRefresh={handleRefresh}>
        {structureLoading || isFetchingPath ? (
          <View className="flex-1 justify-center items-center p-5">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="mt-3 text-sm" style={{ color: COLORS.textMuted }}>
              {isFetchingPath
                ? t('warehouse.findingPath') || "Calculating optimized path..."
                : t('common.loading')}
            </Text>
          </View>
        ) : structureError ? (
          <View className="flex-1 justify-center items-center p-5">
            <Feather name="alert-circle" size={64} color="#FF6B6B" />
            <Text className="text-lg font-semibold text-slate-800 mt-4">
              {t('common.noData')}
            </Text>
            <TouchableOpacity
              className="mt-5 px-6 py-3 rounded-lg"
              style={{ backgroundColor: COLORS.primary }}
              onPress={() => setSelectedWarehouseId(undefined)}
            >
              <Text className="text-sm font-bold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : structure ? (
          <>
            {!isCounting && !!operationId && (
              <View
                className="mx-3 mb-2.5 mt-0.5 px-3 py-2.5 rounded-xl bg-white border-[1.5px]"
                style={{
                  borderColor: isPicking
                    ? COLORS.primary + "20"
                    : COLORS.success + "20",
                }}
              >
                <View className="flex-row items-start gap-2 mb-2">
                  <Feather
                    name={isPicking ? "shopping-cart" : "map-pin"}
                    size={14}
                    color={isPicking ? COLORS.primary : COLORS.success}
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    className="flex-1 text-[13px] font-bold text-slate-800"
                    style={!isPicking ? { color: COLORS.successText } : {}}
                  >
                    {focusedItemName
                      ? `${isPicking ? t('tasks.outbound') : t('tasks.inbound')}: ${focusedItemName}`
                      : isPicking
                        ? t('warehouse.suggestedPickLocations')
                        : t('warehouse.suggestedStowLocations')}
                  </Text>
                </View>
                {recommendationsLoading ? (
                  <Text
                    className="text-xs leading-[18px]"
                    style={{ color: COLORS.textMuted }}
                  >
                    {t('warehouse.loadingSuggestions')}
                  </Text>
                ) : effectiveHighlightedBins.length === 0 ? (
                  <Text
                    className="text-xs leading-[18px]"
                    style={{ color: COLORS.textMuted }}
                  >
                    {t('warehouse.noSuggestions')}
                  </Text>
                ) : (
                  <>
                    {recommendationPreview.length > 0 ? (
                      recommendationPreview.map((entry, index) => (
                        <View
                          key={`preview-${index}`}
                          className="flex-row items-center justify-between py-1.5 border-b"
                          style={{ borderBottomColor: COLORS.borderLight }}
                        >
                          <Text
                            className="flex-1 mr-2 text-xs font-semibold"
                            style={{ color: COLORS.text }}
                            numberOfLines={1}
                          >
                            {entry.itemName || `${t('common.item')} ${index + 1}`}
                          </Text>
                          <Text
                            className="text-[11px] border rounded-full px-2.5 py-0.5 font-bold"
                            style={
                              isPicking
                                ? {
                                    color: COLORS.primary,
                                    backgroundColor: COLORS.primaryLight,
                                    borderColor: COLORS.primary + "20",
                                  }
                                : {
                                    color: COLORS.successText,
                                    backgroundColor: COLORS.successLight,
                                    borderColor: COLORS.success + "20",
                                  }
                            }
                          >
                            {entry.binIdCode}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text
                        className="text-xs leading-[18px]"
                        style={{ color: COLORS.textMuted }}
                      >
                        Found {effectiveHighlightedBins.length}{" "}
                        {isPicking ? "pick" : "suggested"} locations in the
                        diagram.
                      </Text>
                    )}
                    {recommendationResolution.firstShelf && (
                      <TouchableOpacity
                        className="mt-2.5 h-[34px] rounded-lg flex-row items-center justify-center gap-1.5"
                        style={{
                          backgroundColor: !isPicking
                            ? COLORS.success
                            : COLORS.primary,
                        }}
                        onPress={handleFindPathToRecommended}
                      >
                        <Feather name="navigation" size={14} color="#fff" />
                        <Text className="text-white text-xs font-bold">
                          {t('warehouse.findPathToSuggested')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            )}

            <View
              className="flex-row items-center mx-3 mb-2.5 mt-0.5 px-3.5 py-2.5 bg-white rounded-xl border"
              style={{ borderColor: COLORS.borderLight }}
            >
              <View className="flex-row items-center gap-2 flex-1">
                <View
                  className="w-[22px] h-[22px] rounded-[7px] items-center justify-center"
                  style={{ backgroundColor: COLORS.infoLight }}
                >
                  <Feather name="grid" size={14} color={COLORS.infoText} />
                </View>
                <Text className="text-[13px] text-slate-700 font-semibold">
                  {structure.zones?.length || 0} {t('warehouse.zones')}
                </Text>
              </View>
              <View
                className="w-px h-[18px] mx-2.5"
                style={{ backgroundColor: COLORS.border }}
              />
              <View className="flex-row items-center gap-2 flex-1">
                <View
                  className="w-[22px] h-[22px] rounded-[7px] items-center justify-center"
                  style={{ backgroundColor: COLORS.infoLight }}
                >
                  <Feather name="package" size={14} color={COLORS.infoText} />
                </View>
                <Text className="text-[13px] text-slate-700 font-semibold">
                  {structure.zones?.reduce(
                    (acc, zone) => acc + (zone.shelves?.length || 0),
                    0,
                  ) || 0}{" "}
                  {t('warehouse.shelves')}
                </Text>
              </View>
              <View
                className="w-px h-[18px] mx-2.5"
                style={{ backgroundColor: COLORS.border }}
              />
              <View className="flex-row items-center gap-1.5 bg-slate-100 rounded-lg p-1">
                <TouchableOpacity
                  className={`w-9 h-9 rounded-lg items-center justify-center ${viewMode === "map" ? "bg-blue-500" : "bg-transparent"}`}
                  style={
                    viewMode === "map"
                      ? {
                          shadowColor: "rgba(59, 130, 246, 0.3)",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 1,
                          shadowRadius: 4,
                          elevation: 3,
                        }
                      : {}
                  }
                  onPress={() => setViewMode("map")}
                >
                  <Feather
                    name="map"
                    size={16}
                    color={viewMode === "map" ? "#FFFFFF" : "#64748B"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  className={`w-9 h-9 rounded-lg items-center justify-center ${viewMode === "grid" ? "bg-blue-500" : "bg-transparent"}`}
                  style={
                    viewMode === "grid"
                      ? {
                          shadowColor: "rgba(59, 130, 246, 0.3)",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 1,
                          shadowRadius: 4,
                          elevation: 3,
                        }
                      : {}
                  }
                  onPress={() => setViewMode("grid")}
                >
                  <Feather
                    name="grid"
                    size={16}
                    color={viewMode === "grid" ? "#FFFFFF" : "#64748B"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {viewMode === "map" ? (
              <WarehouseLayout
                structure={structure}
                highlightedShelf={activeHighlightedShelf}
                recommendedShelves={recommendedShelvesForRender}
                highlightedPath={currentPath?.path}
                optimizedPath={optimizedPath}
                onShelfPress={handleShelfPress}
                onZonePress={handleZonePress}
                isCounting={isCounting}
              />
            ) : (
              <WarehouseGridView
                structure={structure}
                highlightedShelf={activeHighlightedShelf}
                recommendedShelves={recommendedShelvesForRender}
                highlightedBins={effectiveHighlightedBins}
                inventorySummary={focusedInventorySummary}
                onShelfPress={handleShelfPress}
                isCounting={isCounting}
              />
            )}
          </>
        ) : (
          <View className="flex-1 justify-center items-center p-5">
            <Feather name="map-pin" size={64} color="#CCC" />
            <Text className="text-lg font-semibold text-slate-600 mt-4">
              {t('warehouse.noDiagram')}
            </Text>
          </View>
        )}

        <ShelfDetailModal
          visible={modalVisible}
          shelf={selectedShelf}
          zone={selectedZone}
          recommendedItems={availableItemsForModal}
          countItems={countItemsForSelectedShelf}
          countExpectedByItemId={countExpectedByItemId}
          inventorySummary={focusedInventorySummary}
          focusedItemName={focusedItemName}
          onConfirmOperation={isCounting ? undefined : handleConfirmOperationAtShelf}
          operationType={isCounting ? "count" : isPicking ? "outbound" : "inbound"}
          isProcessing={isProcessing}
          ticketId={operationId}
          shelfId={selectedShelf?.id}
          onClose={() => {
            setModalVisible(false);
            setSelectedShelf(null);
            setSelectedZone(null);
          }}
        />

        <PathInstructionsModal
          visible={pathModalVisible}
          pathResult={currentPath}
          toLocation={selectedShelf?.code || t('warehouse.shelf')}
          onClose={() => setPathModalVisible(false)}
        />
      </RefreshContainer>
    </View>
  );
}