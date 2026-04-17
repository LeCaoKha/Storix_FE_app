import { RefreshContainer, ScreenHeader } from '@/components';
import { PathInstructionsModal, ShelfDetailModal, WarehouseGridView, WarehouseLayout } from '@/components/staff';
import { ShelfActionItem } from '@/components/staff/ShelfDetailModal';
import { COLORS } from '@/constants/color';
import { useInboundOrdersByStaff, useInboundStorageRecommendations, useInboundTicket, useProductInventoryLocations } from '@/hooks';
import { useOutboundTicket, useUpdateOutboundTicketItems } from '@/hooks/outbound-orders.hooks';
import { useStockCountTicket, useUpdateStockCountItem, useWarehouseInventory } from '@/hooks/stock-count.hooks';
import { useWarehouses, useWarehouseStructure } from '@/hooks/warehouse.hooks';
import { AlertService } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useInboundStagingStore } from '@/stores/inbound-staging.store';
import { usePendingQuantitiesStore } from '@/stores/pending-quantities.store';
import { PathResult, Shelf, WarehouseZone } from '@/types/warehouse';
import { findNearestNode, findShortestPath } from '@/utils/pathfinding';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
  const initialWarehouseId = params.warehouseId ? Number(params.warehouseId) : undefined;
  const inboundOrderId = params.inboundOrderId ? Number(params.inboundOrderId) : undefined;
  const outboundOrderId = params.outboundOrderId ? Number(params.outboundOrderId) : undefined;
  const inventoryCountTicketId = params.inventoryCountTicketId ? Number(params.inventoryCountTicketId) : undefined;
  
  const isPicking = !!outboundOrderId;
  const isCounting = !!inventoryCountTicketId;
  const operationId = inboundOrderId || outboundOrderId || inventoryCountTicketId;

  const routeBins = useMemo(
    () => (params.recommendedBins ? params.recommendedBins.split(',').map((code) => code.trim()).filter(Boolean) : []),
    [params.recommendedBins]
  );
  const focusedBinsArray = useMemo(
    () => (params.focusedBins ? params.focusedBins.split(',').map((code) => code.trim()).filter(Boolean) : []),
    [params.focusedBins]
  );
  const focusedItemId = params.focusedItemId ? Number(params.focusedItemId) : undefined;
  const focusedItemName = params.focusedItemName;

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>();
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);
  const [selectedZone, setSelectedZone] = useState<WarehouseZone | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPath, setCurrentPath] = useState<PathResult | null>(null);
  const [pathModalVisible, setPathModalVisible] = useState(false);
  const [currentLocation] = useState<{ x: number; y: number } | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [, setLocalReceivedByItemId] = useState<Record<number, number>>({});
  const user = useAuthStore(state => state.user);
  const isStaff = user?.roleId === 4;
  const companyId = user?.companyId ?? 0;
  const staffId = user?.id ?? 0;

  const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();
  const { data: recommendationItems = [], isLoading: recommendationsLoading, refetch: refetchRecommendations } = useInboundStorageRecommendations(inboundOrderId);
  const { data: inboundTicket, refetch: refetchInboundTicket } = useInboundTicket(inboundOrderId);
  const { data: staffInboundOrders = [] } = useInboundOrdersByStaff(companyId, staffId);
  const { data: outboundOrder, refetch: refetchOutboundOrder } = useOutboundTicket(outboundOrderId);
  const { data: stockCountTicket, refetch: refetchStockCountTicket } = useStockCountTicket(inventoryCountTicketId || 0, companyId);
  const { data: productInventoryLocations = [], isLoading: productInventoryLocationsLoading } = useProductInventoryLocations(
    isCounting ? focusedItemId : undefined,
    isCounting ? (selectedWarehouseId || initialWarehouseId) : undefined,
  );
  
  const {
    data: structure,
    isLoading: structureLoading,
    error: structureError,
    refetch: refetchStructure,
  } = useWarehouseStructure(selectedWarehouseId);

  const updateOutboundItems = useUpdateOutboundTicketItems();
  const updateStockCountItem = useUpdateStockCountItem();
  const { refetch: refetchWarehouses } = useWarehouses();
  const stagedTickets = useInboundStagingStore((state) => state.tickets);
  const inboundStagingTicket = useInboundStagingStore((state) => (inboundOrderId ? state.tickets[inboundOrderId] : undefined));
  const setStagedPlacement = useInboundStagingStore((state) => state.setPlacement);
  const getItemStagedQuantity = useInboundStagingStore((state) => state.getItemStagedQuantity);
  const getItemStagedBins = useInboundStagingStore((state) => state.getItemStagedBins);

  const syncLocalReceivedByItemId = React.useCallback((ticket: any) => {
    if (!ticket?.inboundOrderItems) return;

    const nextMap: Record<number, number> = {};
    ticket.inboundOrderItems.forEach((item: any) => {
      const baseReceived = Number(item.receivedQuantity || 0);
      const stagedReceived = inboundOrderId ? getItemStagedQuantity(inboundOrderId, item.id) : 0;
      nextMap[item.id] = baseReceived + stagedReceived;
    });

    setLocalReceivedByItemId(nextMap);
  }, [getItemStagedQuantity, inboundOrderId]);

  const getInboundCurrentReceived = React.useCallback((itemId: number) => {
    const ticketItem = inboundTicket?.inboundOrderItems?.find((ti) => ti.id === itemId);
    const baseReceived = Number(ticketItem?.receivedQuantity || 0);
    const stagedReceived = Number(inboundStagingTicket?.items?.[itemId]?.total || 0);
    return baseReceived + stagedReceived;
  }, [inboundStagingTicket, inboundTicket]);
  
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
      .map(item => item.locationId?.toString())
      .filter((id): id is string => !!id);
  }, [stockCountTicket]);
  
  const productIdsWithMissingLocations = useMemo(() => {
    if (!isCounting || !stockCountTicket) return [];
    return stockCountTicket.items
      .filter(item => !item.locationId && !!item.productId)
      .map(item => item.productId!);
  }, [isCounting, stockCountTicket]);

  const { data: suggestedInventory = [] } = useWarehouseInventory(
    selectedWarehouseId, 
    productIdsWithMissingLocations
  );

  const suggestedBins = useMemo(() => {
    if (suggestedInventory.length === 0) return [];
    
    const bins: string[] = [];
    suggestedInventory.forEach(item => {
      item.binDetails?.forEach(bin => {
        if (bin.binCode) bins.push(bin.binCode);
      });
    });
    return Array.from(new Set(bins));
  }, [suggestedInventory]);

  const productLocationShelfKeys = useMemo(() => {
    return Array.from(
      new Set(
        productInventoryLocations
          .flatMap((location) => [location.shelfIdCode, location.shelfCode])
          .filter((value): value is string => !!value && value.trim().length > 0)
          .map((value) => value.trim())
      )
    );
  }, [productInventoryLocations]);

  const productLocationShelfResolution = useMemo(() => {
    if (!structure || productLocationShelfKeys.length === 0) {
      return { shelfIds: [] as string[], firstShelf: null as Shelf | null, firstZone: null as WarehouseZone | null };
    }

    const shelfIds = new Set<string>();
    let firstShelf: Shelf | null = null;
    let firstZone: WarehouseZone | null = null;

    for (const zone of structure.zones ?? []) {
      for (const shelf of zone.shelves ?? []) {
        const isMatched = productLocationShelfKeys.some(
          (code) => String(code) === String(shelf.id) || String(code) === String(shelf.code)
        );

        if (isMatched) {
          shelfIds.add(shelf.id);
          if (!firstShelf) {
            firstShelf = shelf;
            firstZone = zone;
          }
        }
      }
    }

    return { shelfIds: Array.from(shelfIds), firstShelf, firstZone };
  }, [productLocationShelfKeys, structure]);
  
  const effectiveHighlightedBins = useMemo(() => {
    if (focusedBinsArray.length > 0) return focusedBinsArray;
    if (isCounting) {
      return Array.from(new Set([...inventoryBins, ...suggestedBins]));
    }
    return recommendedBins;
  }, [focusedBinsArray, isCounting, inventoryBins, suggestedBins, recommendedBins]);

  const scopedInboundRecommendationItems = useMemo(() => {
    if (!inboundOrderId || !focusedItemId) {
      return recommendationItems;
    }

    return recommendationItems.filter((item) => item.inboundOrderItemId === focusedItemId);
  }, [inboundOrderId, focusedItemId, recommendationItems]);

  const recommendationPreview = useMemo(() => {
    const preview: {
      itemName?: string;
      binIdCode: string;
      distanceInfo?: number;
      reason?: string;
    }[] = [];

    scopedInboundRecommendationItems.forEach((item) => {
        const recs = (item.storageRecommendations || []).filter((recommendation) => !!recommendation.binIdCode);
        if (recs.length === 0) return;

        // Prefer the shortest-distance recommendation when distance info exists.
        const best = recs.reduce((currentBest, current) => {
          const bestDistance = typeof currentBest.distanceInfo === 'number' ? currentBest.distanceInfo : Number.POSITIVE_INFINITY;
          const currentDistance = typeof current.distanceInfo === 'number' ? current.distanceInfo : Number.POSITIVE_INFINITY;
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
      return { shelfIds: [] as string[], firstShelf: null as Shelf | null, firstZone: null as WarehouseZone | null };
    }

    const shelfIds = new Set<string>();
    let firstShelf: Shelf | null = null;
    let firstZone: WarehouseZone | null = null;

    for (const zone of structure.zones ?? []) {
      for (const shelf of zone.shelves ?? []) {
        const hasRecommendedBin = (shelf.levels ?? []).some((level) =>
          (level.bins ?? []).some((bin) => effectiveHighlightedBins.some((code) => String(code) === bin.code || String(code) === bin.id))
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

  const activeShelfResolution = isCounting && productLocationShelfResolution.shelfIds.length > 0
    ? productLocationShelfResolution
    : recommendationResolution;

  const recommendedShelvesForRender = activeShelfResolution.shelfIds;

  const activeHighlightedShelf = selectedShelf?.id;

  React.useEffect(() => {
    if (!warehouses || warehouses.length === 0) return;

    if (initialWarehouseId && warehouses.some((warehouse) => warehouse.id === initialWarehouseId)) {
      if (selectedWarehouseId !== initialWarehouseId) {
        setSelectedWarehouseId(initialWarehouseId);
      }
      return;
    }

    if (!selectedWarehouseId || !warehouses.some((warehouse) => warehouse.id === selectedWarehouseId)) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId, initialWarehouseId]);

  const ticketWarehouseId = React.useMemo(() => {
    const fromTicket = inboundTicket?.warehouseId || inboundTicket?.warehouse?.id;
    if (fromTicket) return fromTicket;

    if (!inboundOrderId) return undefined;

    const fromStaffOrders = staffInboundOrders.find((order) => order.id === inboundOrderId);
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
      targetAccessNode.y
    );

    if (!endNode) return;

    const path = findShortestPath(structure.nodes, structure.edges, startNode.id, endNode.id);

    if (path) {
      setCurrentPath(path);
      setPathModalVisible(true);
    }
  };

  const handleFindPathToRecommended = () => {
    if (!activeShelfResolution.firstShelf) return;

    setSelectedShelf(activeShelfResolution.firstShelf);
    setSelectedZone(activeShelfResolution.firstZone);
    handleFindPath(activeShelfResolution.firstShelf);
  };

  const handleConfirmOperationAtShelf = async (actionItems: ShelfActionItem[]) => {
    if (isProcessing) return;

    if (!selectedShelf) {
      AlertService.warning('Thiếu thông tin kệ', 'Vui lòng chọn lại kệ trước khi xác nhận.');
      return;
    }

    const refreshedStructureResult = await refetchStructure();
    const refreshedStructure = refreshedStructureResult.data ?? structure;
    const currentSelectedShelf = refreshedStructure?.zones
      ?.flatMap((zone) => zone.shelves ?? [])
      ?.find((shelf) => shelf.id === selectedShelf.id) ?? selectedShelf;

    // Block if the warehouse for this inbound ticket is unknown or mismatched
    if (!isPicking && inboundOrderId) {
      if (!ticketWarehouseId) {
        AlertService.warning('Chưa xác định kho', 'Không thể xác định kho của phiếu nhập. Vui lòng refresh và thử lại.');
        return;
      }
      if (selectedWarehouseId && ticketWarehouseId !== selectedWarehouseId) {
        AlertService.warning('Sai kho', 'Kho đang mở không khớp với phiếu nhập. Vui lòng mở lại sơ đồ đúng kho của phiếu.');
        return;
      }
    }

    const selectedShelfBins = (currentSelectedShelf.levels ?? []).flatMap((level) => level.bins ?? []);
    const defaultBinId = selectedShelfBins[0]?.id ? String(selectedShelfBins[0].id) : undefined;
    if (!defaultBinId) {
      AlertService.warning('Thiếu vị trí bin', 'Kệ này chưa có bin hợp lệ để cập nhật.');
      return;
    }

    const binById = new Map(selectedShelfBins.map((bin) => [String(bin.id), bin] as const));
    const binByCode = new Map(selectedShelfBins.map((bin) => [String(bin.code), bin] as const));

    const normalizedActionItems = actionItems.map((item) => {
      const rawBinId = String(item.binId || '').trim();
      const rawBinCode = String(item.binCode || '').trim();

      // Always resolve to a bin that exists on currently selected shelf.
      const resolvedBin =
        binById.get(rawBinId) ||
        binById.get(rawBinCode) ||
        binByCode.get(rawBinCode) ||
        selectedShelfBins[0];

      const resolvedBinIdCode = String(resolvedBin.id || resolvedBin.code || item.binCode || '').trim();
      const resolvedBinCode = String(resolvedBin.code || resolvedBin.id || item.binCode || '').trim();

      return {
        ...item,
        // BE expects ShelfLevelBin.IdCode in locations.binId.
        binId: resolvedBinIdCode,
        binCode: resolvedBinCode,
      };
    });

    const normalizeBinValue = (value?: string | number | null) => String(value ?? '').trim().toLowerCase();

    const resolveRecommendationBinIdCode = (inboundOrderItemId: number, preferredBinValues: (string | number | undefined)[]) => {
      const recs = recommendationItems.find((item) => item.inboundOrderItemId === inboundOrderItemId)?.storageRecommendations || [];
      if (recs.length === 0) return undefined;

      const preferred = preferredBinValues.map((value) => normalizeBinValue(value)).filter(Boolean);
      const matched = recs.find((rec) => {
        const recValue = normalizeBinValue(rec.binIdCode ?? rec.binId);
        return recValue.length > 0 && preferred.includes(recValue);
      });

      return String(matched?.binIdCode || recs[0]?.binIdCode || '').trim() || undefined;
    };


    setIsProcessing(true);

    try {
      if (isCounting && inventoryCountTicketId) {
        const validItems = normalizedActionItems.filter((item) => Number(item.pendingQuantity ?? 0) >= 0);

        if (validItems.length === 0) {
          AlertService.warning('Dữ liệu chưa hợp lệ', 'Không có mặt hàng kiểm kê hợp lệ để cập nhật.');
          return;
        }

        await Promise.all(validItems.map((item) =>
          updateStockCountItem.mutateAsync({
            ticketId: inventoryCountTicketId,
            itemId: item.id,
            payload: {
              productId: item.productId,
              countedQuantity: Number(item.pendingQuantity ?? 0),
              locationId: Number.isFinite(Number(item.binId)) ? Number(item.binId) : null,
            },
          })
        ));

        await refetchStockCountTicket();
        AlertService.success('Đã ghi nhận', 'Đã cập nhật số lượng kiểm kê cho kệ này.');
      } else if (!isPicking && inboundOrderId) {
        // Inbound: Update only the user-selected quantity in this shelf.
        const validItems = normalizedActionItems.filter((item) => {
          const productId = Number(item.productId || 0);
          const quantity = Number(item.pendingQuantity ?? item.targetQuantity ?? 0);
          const binId = String(item.binId || '').trim();
          return productId > 0 && quantity > 0 && binId.length > 0;
        });

        if (validItems.length === 0) {
          console.warn('[WarehouseDiagramScreen] inbound confirm blocked: no valid items', {
            inboundOrderId,
            selectedWarehouseId,
            ticketWarehouseId,
            availableShelfBins: selectedShelfBins.map((bin) => ({ id: String(bin.id), code: String(bin.code) })),
            rawItems: normalizedActionItems,
          });
          AlertService.warning('Dữ liệu chưa hợp lệ', 'Không có mặt hàng hợp lệ để cập nhật (thiếu productId/binId hoặc số lượng).');
          return;
        }

        console.log('[WarehouseDiagramScreen] stage inbound placements (no API call)', {
          inboundOrderId,
          selectedWarehouseId,
          ticketWarehouseId,
          selectedShelfId: selectedShelf.id,
          selectedShelfCode: selectedShelf.code,
          staged: validItems.map((item) => ({
            itemId: item.id,
            productId: item.productId,
            binId: String(item.binId),
            binCode: String(item.binCode || ''),
            quantity: Number(item.pendingQuantity ?? item.targetQuantity ?? 0),
          })),
        });

        validItems.forEach((item) => {
          const quantity = Number(item.pendingQuantity ?? item.targetQuantity ?? 0);
          const fallbackBinIdCode = resolveRecommendationBinIdCode(item.id, [item.binId, item.binCode]);
          const safeBinId = String(item.binId || fallbackBinIdCode || '').trim();

          if (safeBinId && quantity > 0) {
            setStagedPlacement(inboundOrderId, item.id, safeBinId, quantity);
          }
        });

        // UX: Show success message IMMEDIATELY (Optimistic UI)
        const shelfCode = selectedShelf.code || 'kệ';
        AlertService.success('Đã ghi nhận', `Đã lưu các mặt hàng vào ${shelfCode}. Bạn có thể chọn Bin khác để nhập tiếp.`);

        // Sync immediately so quantity/progress updates without waiting for idle frame.
        syncLocalReceivedByItemId(inboundTicket);

        // Clear the draft for this shelf right away after successful confirm.
        if (selectedShelf && inboundOrderId) {
          clearShelfPending(inboundOrderId, selectedShelf.id);
        }
      } else if (isPicking && outboundOrderId) {
        // Outbound: Update quantity to match target for these items
        const validItems = normalizedActionItems.filter((item) => Number(item.pendingQuantity ?? item.targetQuantity ?? 0) > 0);

        if (validItems.length === 0) {
          AlertService.warning('Dữ liệu chưa hợp lệ', 'Vui lòng chọn số lượng lớn hơn 0 trước khi xác nhận.');
          return;
        }

        const itemsToUpdate = validItems.map(item => ({
          id: item.id,
          productId: item.productId,
          receivedQuantity: (item.currentQuantity || 0) + Number(item.pendingQuantity ?? item.targetQuantity ?? 0),
          locations: [
            {
              binId: String(item.binId),
              quantity: Number(item.pendingQuantity ?? item.targetQuantity ?? 0)
            }
          ]
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
        if (selectedShelf && outboundOrderId) clearShelfPending(outboundOrderId, selectedShelf.id);
      }
      // Only close if it's picking (usually pick whole shelf) or user manually closes
      if (isPicking) {
        setModalVisible(false);
      }
    } catch (error: any) {
      console.error('[WarehouseDiagramScreen] confirm operation failed', {
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
      const backendMessage = String(error?.response?.data?.message || '').trim();
      AlertService.error('Lỗi', backendMessage || 'Không thể cập nhật trạng thái mặt hàng');
    } finally {
      setIsProcessing(false);
    }
  };  // Compute items available for the currently selected shelf
  const availableItemsForModal = useMemo(() => {
    if (!selectedShelf) return [];
    
    const shelfBins = (selectedShelf.levels ?? []).flatMap((level) => level.bins ?? []);
    const shelfBinCodes = shelfBins.map((bin) => bin.code);
    const shelfBinValues = new Set(shelfBins.flatMap((bin) => [String(bin.code), String(bin.id)]));
    const firstBin = selectedShelf.levels?.[0]?.bins?.[0];

    if (isCounting) {
      const isFocusedShelfByProductLocation =
        productLocationShelfKeys.length === 0 ||
        productLocationShelfKeys.some((code) => String(code) === String(selectedShelf.id) || String(code) === String(selectedShelf.code));

      if (!isFocusedShelfByProductLocation) return [];

      return (stockCountTicket?.items || [])
        .filter((item) => !focusedItemId || item.productId === focusedItemId)
        .map((item) => ({
          id: item.id,
          productId: item.productId || 0,
          name: item.name || `SP #${item.productId}`,
          sku: item.sku,
          targetQuantity: 0,
          currentQuantity: 0,
          binCode: firstBin?.code || selectedShelf.code,
          binId: firstBin?.id || '',
          isRecommended: true,
          pendingQuantity: Number(item.countedQuantity ?? 0),
        }));
    }

    if (!isPicking) {
      // Inbound: Filter from recommendationItems
      const recommended = scopedInboundRecommendationItems
        .filter(item => (item.storageRecommendations ?? []).some(r => shelfBinValues.has(String(r.binIdCode ?? r.binId ?? ''))))
        .filter((item) => {
          const ticketItem = inboundTicket?.inboundOrderItems?.find((ti) => ti.id === item.inboundOrderItemId);
          const totalExpected = Number(ticketItem?.expectedQuantity ?? 0);
          const totalReceived = getInboundCurrentReceived(item.inboundOrderItemId);
          return totalExpected - totalReceived > 0;
        })
        .map(item => {
          const matchedRec = item.storageRecommendations!.find(r => shelfBinValues.has(String(r.binIdCode ?? r.binId ?? '')));
          const matchedBin = (selectedShelf.levels ?? [])
            .flatMap((level) => level.bins ?? [])
            .find((bin) => bin.code === matchedRec?.binIdCode || String(bin.id) === String(matchedRec?.binIdCode ?? matchedRec?.binId));
          // Find quantities from ticket items
          const ticketItem = inboundTicket?.inboundOrderItems?.find(ti => ti.id === item.inboundOrderItemId);
          const currentReceived = getInboundCurrentReceived(item.inboundOrderItemId);
          
          // USER REQUEST: targetQuantity is the TOTAL expected (e.g. 20), not just for this shelf
          const totalExpected = Number(ticketItem?.expectedQuantity ?? 0);
          const recommendedQuantity = Number(matchedRec?.quantity ?? 0);
          
          const resolvedProductId = item.productId || ticketItem?.productId || ticketItem?.product?.id || 0;
          
          return {
            id: item.inboundOrderItemId,
            productId: resolvedProductId,
            name: item.name || '',
            sku: item.sku,
            targetQuantity: totalExpected,
            recommendedQuantity: recommendedQuantity,
            currentQuantity: currentReceived,
            binCode: matchedBin?.code || firstBin?.code || selectedShelf.code,
            // BE expects ShelfLevelBin.IdCode
            binId: matchedBin?.id || firstBin?.id || '',
            isRecommended: true,
          };
        });

      if (recommended.length > 0) return recommended;

      // Manual fallback: allow placing all remaining quantity of pending items
      return (inboundTicket?.inboundOrderItems || [])
        .filter(item => !focusedItemId || item.id === focusedItemId)
        .filter(item => {
          const totalRemaining = (item.expectedQuantity ?? 0) - getInboundCurrentReceived(item.id);
          return totalRemaining > 0;
        })
        .map(item => {
          const targetQty = (item.expectedQuantity || 0); // Use total expected
          return {
            id: item.id,
            productId: item.productId || item.product?.id || 0,
            name: item.productName || item.product?.name || item.name || `SP #${item.productId}`,
            sku: item.sku || item.product?.sku,
            targetQuantity: targetQty,
            currentQuantity: getInboundCurrentReceived(item.id),
            binCode: firstBin?.code || selectedShelf.code,
            binId: firstBin?.id || '',
            isRecommended: false,
          };
        });
    } else {
      // Outbound: Filter from outboundOrder items
      const orderItems = outboundOrder?.items || outboundOrder?.outboundOrderItems || [];
      const recommended = orderItems
        .filter(item => effectiveHighlightedBins.some(code => shelfBinCodes.includes(String(code))))
        .map(item => {
          const binCode = shelfBinCodes.find(code => effectiveHighlightedBins.includes(String(code))) || shelfBinCodes[0];
          const bin = (selectedShelf.levels ?? []).flatMap(l => l.bins ?? []).find(b => b.code === binCode);
          
          return {
            id: item.id,
            productId: item.productId || item.product?.id || 0,
            name: item.productName || item.product?.name || item.name || `SP #${item.productId}`,
            sku: item.sku || item.product?.sku,
            targetQuantity: (item.quantity || 0) - (item.receivedQuantity || 0),
            currentQuantity: item.receivedQuantity || 0,
            binCode: binCode,
            binId: bin?.id || '',
            isRecommended: true,
          };
        });

      if (recommended.length > 0) return recommended;

      // Manual fallback
      return orderItems
        .filter(item => (item.quantity || 0) > (item.receivedQuantity || 0))
        .map(item => ({
          id: item.id,
          productId: item.productId || item.product?.id || 0,
          name: item.productName || item.product?.name || item.name || `SP #${item.productId}`,
          sku: item.sku || item.product?.sku,
          targetQuantity: (item.quantity ?? 0) - (item.receivedQuantity ?? 0),
          currentQuantity: item.receivedQuantity || 0,
          binCode: firstBin?.code || selectedShelf.code,
          binId: firstBin?.id || '',
          isRecommended: false,
        }));
    }
  }, [
    selectedShelf,
    isCounting,
    isPicking,
    stockCountTicket,
    productLocationShelfKeys,
    scopedInboundRecommendationItems,
    inboundTicket,
    outboundOrder,
    effectiveHighlightedBins,
    focusedItemId,
    getInboundCurrentReceived,
  ]);

  if (warehousesLoading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Sơ đồ kho" showBackButton={true} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách kho...</Text>
        </View>
      </View>
    );
  }

  if (!warehouses || warehouses.length === 0) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Sơ đồ kho" showBackButton={true} />
        <View style={styles.centered}>
          <Feather name="inbox" size={64} color="#CCC" />
          <Text style={styles.emptyText}>Chưa có kho nào</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed header - always visible when scrolling */}
      <ScreenHeader 
        title="Sơ đồ kho" 
        subtitle={isStaff ? "Xem sơ đồ và tìm đường đi" : "Xem sơ đồ và thông tin kệ hàng"} 
        showBackButton={true} 
        rightButton={
          isStaff && inboundOrderId && (
            <TouchableOpacity 
              onPress={() => {
                AlertService.confirm(
                  'Xóa tất cả tiến độ?',
                  'Bạn có chắc chắn muốn xóa toàn bộ số lượng đã xếp của tất cả mặt hàng trong phiếu nhập này không?',
                  () => {
                    const { clearTicket } = useInboundStagingStore.getState();
                    clearTicket(inboundOrderId);
                    setLocalReceivedByItemId({});
                    AlertService.success('Đã xóa', 'Toàn bộ tiến độ local đã được reset.');
                  }
                );
              }}
              style={styles.headerResetBtn}
            >
              <Feather name="trash-2" size={20} color={COLORS.danger} />
            </TouchableOpacity>
          )
        }
      />

      {warehouses.length > 1 && (
        <View style={styles.selectorWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.warehouseSelector}
            contentContainerStyle={styles.warehouseSelectorContent}
          >
            {warehouses.map((warehouse) => (
              <TouchableOpacity
                key={warehouse.id}
                style={[
                  styles.warehouseChip,
                  selectedWarehouseId === warehouse.id && styles.warehouseChipActive,
                ]}
                onPress={() => setSelectedWarehouseId(warehouse.id)}
              >
                <Text
                  style={[
                    styles.warehouseChipText,
                    selectedWarehouseId === warehouse.id &&
                      styles.warehouseChipTextActive,
                  ]}
                >
                  {warehouse.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Scrollable content area */}
      <RefreshContainer style={styles.scrollContent} onRefresh={handleRefresh}>

      {structureLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải sơ đồ kho...</Text>
        </View>
      ) : structureError ? (
        <View style={styles.centered}>
          <Feather name="alert-circle" size={64} color="#FF6B6B" />
          <Text style={styles.errorText}>Không thể tải sơ đồ kho</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setSelectedWarehouseId(undefined)}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : structure ? (
        <>
          {isCounting && stockCountTicket && (
            <View style={[styles.recommendationPanel, { borderColor: COLORS.info + '20' }]}>
              <View style={styles.recommendationPanelHeader}>
                <Feather name="clipboard" size={14} color={COLORS.info} />
                <Text style={[styles.recommendationPanelTitle, { color: COLORS.info }]}>
                  {focusedItemName ? `Kiểm kê: ${focusedItemName}` : `Kiểm kê: ${stockCountTicket.name || 'Phiếu #' + stockCountTicket.id}`}
                </Text>
              </View>
              {productInventoryLocationsLoading ? (
                <Text style={styles.recommendationPanelSubtle}>Đang tra vị trí sản phẩm trong kho...</Text>
              ) : isCounting && focusedItemName && productLocationShelfKeys.length > 0 ? (
                <>
                  <Text style={styles.recommendationPanelSubtle}>
                    Vị trí sản phẩm đang có trong kho: {productLocationShelfKeys.join(', ')}
                  </Text>
                  {productInventoryLocations.map((location) => (
                    <View key={location.inventoryLocationId} style={styles.recommendationRow}>
                      <Text style={styles.recommendationItemName} numberOfLines={1}>
                        {location.shelfCode || location.shelfIdCode || `Kệ #${location.shelfId}`}
                      </Text>
                      <Text style={[styles.recommendationChip, { backgroundColor: COLORS.info + '14', color: COLORS.info }]}>Vị trí</Text>
                    </View>
                  ))}
                  {activeShelfResolution.firstShelf && (
                    <TouchableOpacity 
                      style={[styles.recommendationCta, { backgroundColor: COLORS.info }]} 
                      onPress={handleFindPathToRecommended}
                    >
                      <Feather name="navigation" size={14} color="#fff" />
                      <Text style={styles.recommendationCtaText}>Tìm đường đến kệ của sản phẩm</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : effectiveHighlightedBins.length === 0 ? (
                <Text style={styles.recommendationPanelSubtle}>
                  Không tìm thấy vị trí nào cần kiểm kê cho các sản phẩm này.
                </Text>
              ) : (
                <>
                  <Text style={styles.recommendationPanelSubtle}>
                    {focusedItemName 
                      ? (inventoryBins.length > 0 ? `Vị trí kiểm kê đã gán: ${inventoryBins.join(', ')}` : `Gợi ý vị trí tồn kho: ${suggestedBins.join(', ')}`)
                      : `Tìm thấy ${effectiveHighlightedBins.length} vị trí kệ (${inventoryBins.length} đã gán, ${suggestedBins.length} gợi ý).`}
                  </Text>
                  {activeShelfResolution.firstShelf && (
                    <TouchableOpacity 
                      style={[styles.recommendationCta, { backgroundColor: COLORS.info }]} 
                      onPress={handleFindPathToRecommended}
                    >
                      <Feather name="navigation" size={14} color="#fff" />
                      <Text style={styles.recommendationCtaText}>Tìm đường đến kệ kiểm kê</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}

          {!isCounting && !!operationId && (
            <View style={[styles.recommendationPanel, isPicking && styles.pickingPanel]}>
              <View style={styles.recommendationPanelHeader}>
                <Feather name={isPicking ? "shopping-cart" : "map-pin"} size={14} color={isPicking ? COLORS.primary : COLORS.success} />
                <Text style={[styles.recommendationPanelTitle, !isPicking && { color: COLORS.successText }]}>
                  {focusedItemName ? `${isPicking ? 'Vị trí nhặt' : 'Kệ cần xếp'}: ${focusedItemName}` : (isPicking ? 'Gợi ý vị trí lấy hàng' : 'Gợi ý vị trí xếp hàng')}
                </Text>
              </View>

              {recommendationsLoading ? (
                <Text style={styles.recommendationPanelSubtle}>Đang tải gợi ý từ phiếu...</Text>
              ) : effectiveHighlightedBins.length === 0 ? (
                <Text style={styles.recommendationPanelSubtle}>Chưa có gợi ý từ hệ thống cho phiếu này.</Text>
              ) : (
                <>
                  {recommendationPreview.length > 0 ? (
                    recommendationPreview.map((entry, index) => (
                      <View key={`preview-${index}`} style={styles.recommendationRow}>
                        <Text style={styles.recommendationItemName} numberOfLines={1}>
                          {entry.itemName || `Mặt hàng ${index + 1}`}
                        </Text>
                        <Text style={[styles.recommendationChip, !isPicking && styles.successChip]}>{entry.binIdCode}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.recommendationPanelSubtle}>
                      Tìm thấy {effectiveHighlightedBins.length} vị trí {isPicking ? 'lấy hàng' : 'đề xuất'} trong sơ đồ.
                    </Text>
                  )}

                  {recommendationResolution.firstShelf && (
                    <TouchableOpacity style={[styles.recommendationCta, !isPicking && { backgroundColor: COLORS.success }]} onPress={handleFindPathToRecommended}>
                      <Feather name="navigation" size={14} color="#fff" />
                      <Text style={styles.recommendationCtaText}>Tìm đường đến vị trí gợi ý</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}

          <View style={styles.infoBar}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconWrap}>
                <Feather name="grid" size={14} color={COLORS.infoText} />
              </View>
              <Text style={styles.infoText}>
                {structure.zones?.length || 0} khu vực
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <View style={styles.infoIconWrap}>
                <Feather name="package" size={14} color={COLORS.infoText} />
              </View>
              <Text style={styles.infoText}>
                {structure.zones?.reduce(
                  (acc, zone) => acc + (zone.shelves?.length || 0),
                  0
                ) || 0}{' '}
                kệ hàng
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.viewButton, viewMode === 'map' && styles.viewButtonActive]}
                onPress={() => setViewMode('map')}
              >
                <Feather 
                  name="map" 
                  size={16} 
                  color={viewMode === 'map' ? '#FFFFFF' : '#64748B'} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
                onPress={() => setViewMode('grid')}
              >
                <Feather 
                  name="grid" 
                  size={16} 
                  color={viewMode === 'grid' ? '#FFFFFF' : '#64748B'} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {viewMode === 'map' ? (
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
        <View style={styles.centered}>
          <Feather name="map-pin" size={64} color="#CCC" />
          <Text style={styles.emptyText}>Chưa có sơ đồ kho</Text>
        </View>
      )}

      <ShelfDetailModal
        visible={modalVisible}
        shelf={selectedShelf}
        zone={selectedZone}
        recommendedItems={availableItemsForModal}
        onConfirmOperation={handleConfirmOperationAtShelf}
        operationType={isPicking ? 'outbound' : isCounting ? 'counting' : 'inbound'}
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
        toLocation={selectedShelf?.code || 'Kệ hàng'}
        onClose={() => {
          setPathModalVisible(false);
        }}
      />
    </RefreshContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  selectorWrap: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  warehouseSelector: {
    backgroundColor: '#fff',
  },
  warehouseSelectorContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  warehouseChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.slate100,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  warehouseChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  warehouseChipText: {
    fontSize: 13,
    color: COLORS.slate600,
    fontWeight: '600',
  },
  warehouseChipTextActive: {
    color: '#fff',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 10,
    marginTop: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  infoIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoDivider: {
    width: 1,
    height: 18,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
  },
  viewButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  viewButtonActive: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.slate700,
    fontWeight: '600',
  },
  recommendationPanel: {
    marginHorizontal: 12,
    marginBottom: 10,
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.success + '20',
  },
  pickingPanel: {
    borderColor: COLORS.primary + '20',
  },
  recommendationPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  recommendationPanelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  recommendationPanelSubtle: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  recommendationItemName: {
    flex: 1,
    marginRight: 8,
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  recommendationChip: {
    fontSize: 11,
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    fontWeight: '700',
  },
  successChip: {
    color: COLORS.successText,
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.success + '20',
  },
  recommendationCta: {
    marginTop: 10,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  recommendationCtaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.slate600,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSubtle,
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.slate800,
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  scrollContent: {
    flex: 1,
  },
  headerResetBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: COLORS.danger + '10',
  },
});
