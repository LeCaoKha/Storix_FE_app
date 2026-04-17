import { RefreshContainer, ScreenHeader } from "@/components";
import {
  PathInstructionsModal,
  ShelfDetailModal,
  WarehouseGridView,
  WarehouseLayout,
} from "@/components/staff";
import { ShelfActionItem } from "@/components/staff/ShelfDetailModal";
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
import {
  useStockCountTicket,
  useWarehouseInventory,
} from "@/hooks/stock-count.hooks";
import { useWarehouses, useWarehouseStructure } from "@/hooks/warehouse.hooks";
import { AlertService } from "@/stores/alert.store";
import { useAuthStore } from "@/stores/auth.store";
import { useInboundStagingStore } from "@/stores/inbound-staging.store";
import { usePendingQuantitiesStore } from "@/stores/pending-quantities.store";
import { PathResult, Shelf, WarehouseZone } from "@/types/warehouse";
import { findNearestNode, findShortestPath } from "@/utils/pathfinding";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WarehouseDiagramScreen() {
  const params = useLocalSearchParams<{
    warehouseId?: string;
    inboundOrderId?: string;
    outboundOrderId?: string;
    inventoryCountTicketId?: string;
    recommendedBins?: string;
    focusedBins?: string;
    focusedItemId?: string;
    focusedItemName?: string;
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
  const user = useAuthStore((state) => state.user);
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
  const getItemStagedBins = useInboundStagingStore(
    (state) => state.getItemStagedBins,
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
  const { clearShelfPending } = usePendingQuantitiesStore();

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

  const productIdsWithMissingLocations = useMemo(() => {
    if (!isCounting || !stockCountTicket) return [];
    return stockCountTicket.items
      .filter((item) => !item.locationId && !!item.productId)
      .map((item) => item.productId!);
  }, [isCounting, stockCountTicket]);

  const { data: suggestedInventory = [] } = useWarehouseInventory(
    selectedWarehouseId,
    productIdsWithMissingLocations,
  );

  const suggestedBins = useMemo(() => {
    if (suggestedInventory.length === 0) return [];

    const bins: string[] = [];
    suggestedInventory.forEach((item) => {
      item.binDetails?.forEach((bin) => {
        if (bin.binCode) bins.push(bin.binCode);
      });
    });
    return Array.from(new Set(bins));
  }, [suggestedInventory]);

  const effectiveHighlightedBins = useMemo(() => {
    if (focusedBinsArray.length > 0) return focusedBinsArray;
    if (isCounting) {
      return Array.from(new Set([...inventoryBins, ...suggestedBins]));
    }
    return recommendedBins;
  }, [
    focusedBinsArray,
    isCounting,
    inventoryBins,
    suggestedBins,
    recommendedBins,
  ]);

  const scopedInboundRecommendationItems = useMemo(() => {
    if (!inboundOrderId || !focusedItemId) {
      return recommendationItems;
    }

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

      // Prefer the shortest-distance recommendation when distance info exists.
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
        const hasRecommendedBin = (shelf.levels ?? []).some((level) =>
          (level.bins ?? []).some((bin) =>
            effectiveHighlightedBins.some(
              (code) => String(code) === bin.code || String(code) === bin.id,
            ),
          ),
        );

        if (hasRecommendedBin) {
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
      if (selectedWarehouseId !== initialWarehouseId) {
        setSelectedWarehouseId(initialWarehouseId);
      }
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
    if (isPicking) return;
    if (!ticketWarehouseId) return;
    if (selectedWarehouseId === ticketWarehouseId) return;

    if (warehouses?.some((warehouse) => warehouse.id === ticketWarehouseId)) {
      setSelectedWarehouseId(ticketWarehouseId);
    }
  }, [isPicking, ticketWarehouseId, selectedWarehouseId, warehouses]);

  React.useEffect(() => {
    // Prevent stale shelf selection/modal when switching to another warehouse structure.
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

  const handleConfirmOperationAtShelf = async (
    actionItems: ShelfActionItem[],
  ) => {
    if (isProcessing) return;

    if (!selectedShelf) {
      AlertService.warning(
        "Missing shelf information",
        "Please reselect the shelf before confirming.",
      );
      return;
    }

    const refreshedStructureResult = await refetchStructure();
    const refreshedStructure = refreshedStructureResult.data ?? structure;
    const currentSelectedShelf =
      refreshedStructure?.zones
        ?.flatMap((zone) => zone.shelves ?? [])
        ?.find((shelf) => shelf.id === selectedShelf.id) ?? selectedShelf;

    // Block if the warehouse for this inbound ticket is unknown or mismatched
    if (!isPicking && inboundOrderId) {
      if (!ticketWarehouseId) {
        AlertService.warning(
          "Undefined warehouse",
          "Cannot determine the warehouse for this inbound ticket. Please refresh and try again.",
        );
        return;
      }
      if (selectedWarehouseId && ticketWarehouseId !== selectedWarehouseId) {
        AlertService.warning(
          "Wrong warehouse",
          "The currently open warehouse does not match the inbound ticket. Please open the correct warehouse diagram.",
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
        "Missing bin location",
        "This shelf does not have a valid bin to update.",
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

      // Always resolve to a bin that exists on currently selected shelf.
      const resolvedBin =
        binById.get(rawBinId) ||
        binById.get(rawBinCode) ||
        binByCode.get(rawBinCode) ||
        selectedShelfBins[0];

      const resolvedBinIdCode = String(
        resolvedBin.id || resolvedBin.code || item.binCode || "",
      ).trim();
      const resolvedBinCode = String(
        resolvedBin.code || resolvedBin.id || item.binCode || "",
      ).trim();

      return {
        ...item,
        // BE expects ShelfLevelBin.IdCode in locations.binId.
        binId: resolvedBinIdCode,
        binCode: resolvedBinCode,
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
        // Inbound: Update only the user-selected quantity in this shelf.
        const validItems = normalizedActionItems.filter((item) => {
          const productId = Number(item.productId || 0);
          const quantity = Number(
            item.pendingQuantity ?? item.targetQuantity ?? 0,
          );
          const binId = String(item.binId || "").trim();
          return productId > 0 && quantity > 0 && binId.length > 0;
        });

        if (validItems.length === 0) {
          console.warn(
            "[WarehouseDiagramScreen] inbound confirm blocked: no valid items",
            {
              inboundOrderId,
              selectedWarehouseId,
              ticketWarehouseId,
              availableShelfBins: selectedShelfBins.map((bin) => ({
                id: String(bin.id),
                code: String(bin.code),
              })),
              rawItems: normalizedActionItems,
            },
          );
          AlertService.warning(
            "Invalid data",
            "No valid items to update (missing productId/binId or quantity).",
          );
          return;
        }

        console.log(
          "[WarehouseDiagramScreen] stage inbound placements (no API call)",
          {
            inboundOrderId,
            selectedWarehouseId,
            ticketWarehouseId,
            selectedShelfId: selectedShelf.id,
            selectedShelfCode: selectedShelf.code,
            staged: validItems.map((item) => ({
              itemId: item.id,
              productId: item.productId,
              binId: String(item.binId),
              binCode: String(item.binCode || ""),
              quantity: Number(
                item.pendingQuantity ?? item.targetQuantity ?? 0,
              ),
            })),
          },
        );

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

          if (safeBinId && quantity > 0) {
            setStagedPlacement(inboundOrderId, item.id, safeBinId, quantity);
          }
        });

        // UX: Show success message IMMEDIATELY (Optimistic UI)
        const shelfCode = selectedShelf.code || "shelf";
        AlertService.success(
          "Recorded successfully",
          `Items saved to ${shelfCode}. You can select another Bin to continue.`,
        );

        // Sync immediately so quantity/progress updates without waiting for idle frame.
        syncLocalReceivedByItemId(inboundTicket);

        // Clear the draft for this shelf right away after successful confirm.
        if (selectedShelf && inboundOrderId) {
          clearShelfPending(inboundOrderId, selectedShelf.id);
        }
      } else if (isPicking && outboundOrderId) {
        // Outbound: Update quantity to match target for these items
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
            // DO NOT use Math.min here, we want to reflect the actual total even if it exceeds target
            next[item.id] = (item.currentQuantity ?? 0) + stagedQty;
          });
          return next;
        });

        await refetchOutboundOrder();

        // Clear the draft for this shelf now that it's confirmed
        if (selectedShelf && outboundOrderId)
          clearShelfPending(outboundOrderId, selectedShelf.id);
      }
      // Only close if it's picking (usually pick whole shelf) or user manually closes
      if (isPicking) {
        setModalVisible(false);
      }
    } catch (error: any) {
      console.error("[WarehouseDiagramScreen] confirm operation failed", {
        inboundOrderId,
        outboundOrderId,
        selectedWarehouseId,
        ticketWarehouseId,
        selectedShelfId: selectedShelf?.id,
        selectedShelfCode: selectedShelf?.code,
        refreshedShelfCode: currentSelectedShelf?.code,
        errorMessage: error?.message,
        errorData: error?.response?.data,
      });
      const backendMessage = String(
        error?.response?.data?.message || "",
      ).trim();
      AlertService.error(
        "Error",
        backendMessage || "Cannot update item status",
      );
    } finally {
      setIsProcessing(false);
    }
  }; // Compute items available for the currently selected shelf
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
      // Inbound: Filter from recommendationItems
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
          const totalExpected = Number(ticketItem?.expectedQuantity ?? 0);
          const totalReceived = getInboundCurrentReceived(
            item.inboundOrderItemId,
          );
          return totalExpected - totalReceived > 0;
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
          // Find quantities from ticket items
          const ticketItem = inboundTicket?.inboundOrderItems?.find(
            (ti) => ti.id === item.inboundOrderItemId,
          );
          const currentReceived = getInboundCurrentReceived(
            item.inboundOrderItemId,
          );

          // USER REQUEST: targetQuantity is the TOTAL expected (e.g. 20), not just for this shelf
          const totalExpected = Number(ticketItem?.expectedQuantity ?? 0);
          const recommendedQuantity = Number(matchedRec?.quantity ?? 0);

          const resolvedProductId =
            item.productId ||
            ticketItem?.productId ||
            ticketItem?.product?.id ||
            0;

          return {
            id: item.inboundOrderItemId,
            productId: resolvedProductId,
            name: item.name || "",
            sku: item.sku,
            targetQuantity: totalExpected,
            recommendedQuantity: recommendedQuantity,
            currentQuantity: currentReceived,
            binCode: matchedBin?.code || firstBin?.code || selectedShelf.code,
            // BE expects ShelfLevelBin.IdCode
            binId: matchedBin?.id || firstBin?.id || "",
            isRecommended: true,
          };
        });

      if (recommended.length > 0) return recommended;

      // Manual fallback: allow placing all remaining quantity of pending items
      return (inboundTicket?.inboundOrderItems || [])
        .filter((item) => !focusedItemId || item.id === focusedItemId)
        .filter((item) => {
          const totalRemaining =
            (item.expectedQuantity ?? 0) - getInboundCurrentReceived(item.id);
          return totalRemaining > 0;
        })
        .map((item) => {
          const targetQty = item.expectedQuantity || 0; // Use total expected
          return {
            id: item.id,
            productId: item.productId || item.product?.id || 0,
            name:
              item.productName ||
              item.product?.name ||
              item.name ||
              `Item #${item.productId}`,
            sku: item.sku || item.product?.sku,
            targetQuantity: targetQty,
            currentQuantity: getInboundCurrentReceived(item.id),
            binCode: firstBin?.code || selectedShelf.code,
            binId: firstBin?.id || "",
            isRecommended: false,
          };
        });
    } else {
      // Outbound: Filter from outboundOrder items
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

      // Manual fallback
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
  ]);

  if (warehousesLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
        <ScreenHeader title="Warehouse Diagram" showBackButton={true} />
        <View className="flex-1 justify-center items-center p-5">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-3 text-sm" style={{ color: COLORS.textMuted }}>
            Loading warehouse list...
          </Text>
        </View>
      </View>
    );
  }

  if (!warehouses || warehouses.length === 0) {
    return (
      <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
        <ScreenHeader title="Warehouse Diagram" showBackButton={true} />
        <View className="flex-1 justify-center items-center p-5">
          <Feather name="inbox" size={64} color="#CCC" />
          <Text className="text-lg font-semibold text-slate-600 mt-4">
            No warehouses available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
      {/* Fixed header - always visible when scrolling */}
      <ScreenHeader
        title="Warehouse Diagram"
        subtitle={
          isStaff ? "View diagram and find path" : "View diagram and shelf info"
        }
        showBackButton={true}
        rightButton={
          isStaff &&
          inboundOrderId && (
            <TouchableOpacity
              onPress={() => {
                AlertService.confirm(
                  "Clear all progress?",
                  "Are you sure you want to clear all placed quantities for all items in this inbound ticket?",
                  () => {
                    const { clearTicket } = useInboundStagingStore.getState();
                    clearTicket(inboundOrderId);
                    setLocalReceivedByItemId({});
                    AlertService.success(
                      "Cleared",
                      "All local progress has been reset.",
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

      {/* Scrollable content area */}
      <RefreshContainer className="flex-1" onRefresh={handleRefresh}>
        {structureLoading ? (
          <View className="flex-1 justify-center items-center p-5">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="mt-3 text-sm" style={{ color: COLORS.textMuted }}>
              Loading warehouse diagram...
            </Text>
          </View>
        ) : structureError ? (
          <View className="flex-1 justify-center items-center p-5">
            <Feather name="alert-circle" size={64} color="#FF6B6B" />
            <Text className="text-lg font-semibold text-slate-800 mt-4">
              Cannot load warehouse diagram
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
            {isCounting && stockCountTicket && (
              <View
                className="mx-3 mb-2.5 mt-0.5 px-3 py-2.5 rounded-xl bg-white border-[1.5px]"
                style={{ borderColor: COLORS.info + "20" }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <Feather name="clipboard" size={14} color={COLORS.info} />
                  <Text
                    className="text-[13px] font-bold"
                    style={{ color: COLORS.info }}
                  >
                    {focusedItemName
                      ? `Count: ${focusedItemName}`
                      : `Count: ${stockCountTicket.name || "Ticket #" + stockCountTicket.id}`}
                  </Text>
                </View>
                {effectiveHighlightedBins.length === 0 ? (
                  <Text
                    className="text-xs leading-[18px]"
                    style={{ color: COLORS.textMuted }}
                  >
                    No count locations found for these products.
                  </Text>
                ) : (
                  <>
                    <Text
                      className="text-xs leading-[18px]"
                      style={{ color: COLORS.textMuted }}
                    >
                      {focusedItemName
                        ? inventoryBins.length > 0
                          ? `Assigned count locations: ${inventoryBins.join(", ")}`
                          : `Suggested inventory locations: ${suggestedBins.join(", ")}`
                        : `Found ${effectiveHighlightedBins.length} shelf locations (${inventoryBins.length} assigned, ${suggestedBins.length} suggested).`}
                    </Text>
                    {recommendationResolution.firstShelf && (
                      <TouchableOpacity
                        className="mt-2.5 h-[34px] rounded-lg flex-row items-center justify-center gap-1.5"
                        style={{ backgroundColor: COLORS.info }}
                        onPress={handleFindPathToRecommended}
                      >
                        <Feather name="navigation" size={14} color="#fff" />
                        <Text className="text-white text-xs font-bold">
                          Find path to count shelf
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            )}

            {!isCounting && !!operationId && (
              <View
                className="mx-3 mb-2.5 mt-0.5 px-3 py-2.5 rounded-xl bg-white border-[1.5px]"
                style={{
                  borderColor: isPicking
                    ? COLORS.primary + "20"
                    : COLORS.success + "20",
                }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <Feather
                    name={isPicking ? "shopping-cart" : "map-pin"}
                    size={14}
                    color={isPicking ? COLORS.primary : COLORS.success}
                  />
                  <Text
                    className="text-[13px] font-bold text-slate-800"
                    style={!isPicking ? { color: COLORS.successText } : {}}
                  >
                    {focusedItemName
                      ? `${isPicking ? "Pick location" : "Stow shelf"}: ${focusedItemName}`
                      : isPicking
                        ? "Suggested pick locations"
                        : "Suggested stow locations"}
                  </Text>
                </View>

                {recommendationsLoading ? (
                  <Text
                    className="text-xs leading-[18px]"
                    style={{ color: COLORS.textMuted }}
                  >
                    Loading suggestions from ticket...
                  </Text>
                ) : effectiveHighlightedBins.length === 0 ? (
                  <Text
                    className="text-xs leading-[18px]"
                    style={{ color: COLORS.textMuted }}
                  >
                    No system suggestions for this ticket yet.
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
                            {entry.itemName || `Item ${index + 1}`}
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
                          Find path to suggested location
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
                  {structure.zones?.length || 0} zones
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
                  shelves
                </Text>
              </View>
              <View
                className="w-px h-[18px] mx-2.5"
                style={{ backgroundColor: COLORS.border }}
              />
              <View className="flex-row items-center gap-1.5 bg-slate-100 rounded-lg p-1">
                <TouchableOpacity
                  className={`w-9 h-9 rounded-lg items-center justify-center ${viewMode === "map" ? "bg-blue-500 shadow-[0_2px_4px_rgba(59,130,246,0.3)] elevation-3" : "bg-transparent"}`}
                  onPress={() => setViewMode("map")}
                >
                  <Feather
                    name="map"
                    size={16}
                    color={viewMode === "map" ? "#FFFFFF" : "#64748B"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  className={`w-9 h-9 rounded-lg items-center justify-center ${viewMode === "grid" ? "bg-blue-500 shadow-[0_2px_4px_rgba(59,130,246,0.3)] elevation-3" : "bg-transparent"}`}
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
                onShelfPress={handleShelfPress}
                onZonePress={handleZonePress}
              />
            ) : (
              <WarehouseGridView
                structure={structure}
                highlightedShelf={activeHighlightedShelf}
                recommendedShelves={recommendedShelvesForRender}
                highlightedBins={effectiveHighlightedBins}
                onShelfPress={handleShelfPress}
              />
            )}
          </>
        ) : (
          <View className="flex-1 justify-center items-center p-5">
            <Feather name="map-pin" size={64} color="#CCC" />
            <Text className="text-lg font-semibold text-slate-600 mt-4">
              No warehouse diagram available
            </Text>
          </View>
        )}

        <ShelfDetailModal
          visible={modalVisible}
          shelf={selectedShelf}
          zone={selectedZone}
          recommendedItems={availableItemsForModal}
          onConfirmOperation={handleConfirmOperationAtShelf}
          operationType={isPicking ? "outbound" : "inbound"}
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
          toLocation={selectedShelf?.code || "Shelf"}
          onClose={() => {
            setPathModalVisible(false);
          }}
        />
      </RefreshContainer>
    </View>
  );
}
