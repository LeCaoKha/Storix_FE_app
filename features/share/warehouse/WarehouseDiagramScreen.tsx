import { ScreenHeader } from "@/components";
import {
  PathInstructionsModal,
  ShelfDetailModal,
  WarehouseGridView,
  WarehouseLayout,
} from "@/components/staff";
import { ShelfActionItem } from "@/components/staff/ShelfDetailModal";
import { COLORS } from "@/constants/color";
import {
  useInboundStorageRecommendations,
  useInboundTicket,
  useUpdateInboundTicketItems,
} from "@/hooks";
import {
  useOutboundTicket,
  useUpdateOutboundTicketItems,
} from "@/hooks/outbound-orders.hooks";
import { useWarehouses, useWarehouseStructure } from "@/hooks/warehouse.hooks";
import { AlertService } from "@/stores/alert.store";
import { useAuthStore } from "@/stores/auth.store";
import { PathResult, Shelf, WarehouseZone } from "@/types/warehouse";
import { findNearestNode, findShortestPath } from "@/utils/pathfinding";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WarehouseDiagramScreen() {
  const params = useLocalSearchParams<{
    warehouseId?: string;
    inboundOrderId?: string;
    outboundOrderId?: string;
    recommendedBins?: string;
    focusedBins?: string;
    focusedItemName?: string;
    status?: string; // 1. THÊM DÒNG NÀY ĐỂ ĐỊNH NGHĨA KIỂU DỮ LIỆU
  }>();

  const currentStatus = params.status; // 2. LẤY GIÁ TRỊ STATUS RA ĐÂY
  const initialWarehouseId = params.warehouseId
    ? Number(params.warehouseId)
    : undefined;
  const inboundOrderId = params.inboundOrderId
    ? Number(params.inboundOrderId)
    : undefined;
  const outboundOrderId = params.outboundOrderId
    ? Number(params.outboundOrderId)
    : undefined;
  const isPicking = !!outboundOrderId;
  const operationId = inboundOrderId || outboundOrderId;

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
  const user = useAuthStore((state) => state.user);
  const isStaff = user?.roleId === 4;

  const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();
  const { data: recommendationItems = [], isLoading: recommendationsLoading } =
    useInboundStorageRecommendations(inboundOrderId);
  const { data: inboundTicket } = useInboundTicket(inboundOrderId);
  const { data: outboundOrder } = useOutboundTicket(outboundOrderId);

  const {
    data: structure,
    isLoading: structureLoading,
    error: structureError,
  } = useWarehouseStructure(selectedWarehouseId);

  const updateInboundItems = useUpdateInboundTicketItems();
  const updateOutboundItems = useUpdateOutboundTicketItems();
  const [isProcessing, setIsProcessing] = useState(false);

  const recommendedBins = useMemo(() => {
    const binsFromApi = recommendationItems
      .flatMap((item) => item.storageRecommendations || [])
      .map((recommendation) => recommendation.binIdCode)
      .filter((binCode): binCode is string => !!binCode);

    return Array.from(new Set([...routeBins, ...binsFromApi]));
  }, [recommendationItems, routeBins]);

  const effectiveHighlightedBins =
    focusedBinsArray.length > 0 ? focusedBinsArray : recommendedBins;

  const recommendationPreview = useMemo(() => {
    return recommendationItems
      .flatMap((item) =>
        (item.storageRecommendations || []).map((recommendation) => ({
          itemName: item.name,
          binIdCode: recommendation.binIdCode,
          distanceInfo: recommendation.distanceInfo,
          reason: recommendation.reason,
        })),
      )
      .filter((entry) => !!entry.binIdCode)
      .slice(0, 4);
  }, [recommendationItems]);

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

  const activeHighlightedShelf =
    selectedShelf?.id || recommendationResolution.firstShelf?.id;

  React.useEffect(() => {
    if (!warehouses || warehouses.length === 0 || selectedWarehouseId) return;

    if (
      initialWarehouseId &&
      warehouses.some((warehouse) => warehouse.id === initialWarehouseId)
    ) {
      setSelectedWarehouseId(initialWarehouseId);
      return;
    }

    setSelectedWarehouseId(warehouses[0].id);
  }, [warehouses, selectedWarehouseId, initialWarehouseId]);

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
    setIsProcessing(true);

    try {
      if (!isPicking && inboundOrderId) {
        // Inbound: Update receivedQuantity to match expectedQuantity for these items
        const itemsToUpdate = actionItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          receivedQuantity:
            (item.currentQuantity || 0) + (item.targetQuantity || 0),
          locations: [
            {
              binId: String(item.binId),
              quantity: item.targetQuantity || 0,
            },
          ],
        }));

        await updateInboundItems.mutateAsync({
          ticketId: inboundOrderId,
          items: itemsToUpdate as any,
        });

        AlertService.success(
          "Thành công",
          `Đã xác nhận xếp ${actionItems.length} mặt hàng vào kệ ${selectedShelf?.code}`,
        );
      } else if (isPicking && outboundOrderId) {
        // Outbound: Update quantity to match target for these items
        const itemsToUpdate = actionItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          receivedQuantity:
            (item.currentQuantity || 0) + (item.targetQuantity || 0),
          locations: [
            {
              binId: String(item.binId),
              quantity: item.targetQuantity || 0,
            },
          ],
        }));

        await updateOutboundItems.mutateAsync({
          ticketId: outboundOrderId,
          items: itemsToUpdate as any,
        });

        AlertService.success(
          "Thành công",
          `Đã xác nhận nhặt ${actionItems.length} mặt hàng từ kệ ${selectedShelf?.code}`,
        );
      }
      setModalVisible(false);
    } catch {
      AlertService.error("Lỗi", "Không thể cập nhật trạng thái mặt hàng");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateShelf = (shelf: Shelf) => {
    AlertService.info(
      "Thông tin",
      `Cập nhật thông tin kệ ${shelf.code}. Tính năng này sẽ sớm được hoàn thiện.`,
    );
  };

  // Compute items available for the currently selected shelf
  const availableItemsForModal = useMemo(() => {
    if (!selectedShelf) return [];

    const shelfBinCodes = (selectedShelf.levels ?? []).flatMap((l) =>
      (l.bins ?? []).map((b) => b.code),
    );
    const firstBin = selectedShelf.levels?.[0]?.bins?.[0];

    if (!isPicking) {
      // Inbound: Filter from recommendationItems
      const recommended = recommendationItems
        .filter((item) =>
          (item.storageRecommendations ?? []).some((r) =>
            shelfBinCodes.includes(r.binIdCode || ""),
          ),
        )
        .map((item) => {
          const matchedRec = item.storageRecommendations!.find((r) =>
            shelfBinCodes.includes(r.binIdCode || ""),
          );
          // Find quantities from ticket items
          const ticketItem = inboundTicket?.inboundOrderItems?.find(
            (ti) => ti.id === item.inboundOrderItemId,
          );

          return {
            id: item.inboundOrderItemId,
            productId: item.productId || 0,
            name: item.name || "",
            sku: item.sku,
            // For recommended items, we target the recommended quantity
            targetQuantity:
              matchedRec?.distanceInfo ||
              (ticketItem?.expectedQuantity ?? 0) -
                (ticketItem?.receivedQuantity ?? 0),
            currentQuantity: ticketItem?.receivedQuantity || 0,
            binCode: matchedRec?.binIdCode || "",
            binId: matchedRec?.binId || matchedRec?.binIdCode || "",
            isRecommended: true,
          };
        });

      if (recommended.length > 0) return recommended;

      // Manual fallback: allow placing all remaining quantity of pending items
      return (inboundTicket?.inboundOrderItems || [])
        .filter(
          (item) => (item.expectedQuantity ?? 0) > (item.receivedQuantity ?? 0),
        )
        .map((item) => ({
          id: item.id,
          productId: item.productId || item.product?.id || 0,
          name:
            item.productName ||
            item.product?.name ||
            item.name ||
            `SP #${item.productId}`,
          sku: item.sku || item.product?.sku,
          targetQuantity:
            (item.expectedQuantity || 0) - (item.receivedQuantity || 0),
          currentQuantity: item.receivedQuantity || 0,
          binCode: firstBin?.code || selectedShelf.code,
          binId: firstBin?.id || firstBin?.code || selectedShelf.id,
          isRecommended: false,
        }));
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
              `SP #${item.productId}`,
            sku: item.sku || item.product?.sku,
            targetQuantity: (item.quantity || 0) - (item.receivedQuantity || 0),
            currentQuantity: item.receivedQuantity || 0,
            binCode: binCode,
            binId: bin?.id || bin?.code || binCode,
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
            `SP #${item.productId}`,
          sku: item.sku || item.product?.sku,
          targetQuantity: (item.quantity ?? 0) - (item.receivedQuantity ?? 0),
          currentQuantity: item.receivedQuantity || 0,
          binCode: firstBin?.code || selectedShelf.code,
          binId: firstBin?.id || firstBin?.code || selectedShelf.id,
          isRecommended: false,
        }));
    }
  }, [
    selectedShelf,
    isPicking,
    recommendationItems,
    inboundTicket,
    outboundOrder,
    effectiveHighlightedBins,
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
      <ScreenHeader
        title="Sơ đồ kho"
        subtitle={
          isStaff
            ? "Xem sơ đồ và tìm đường đi"
            : "Xem sơ đồ và thông tin kệ hàng"
        }
        showBackButton={true}
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
                  selectedWarehouseId === warehouse.id &&
                    styles.warehouseChipActive,
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
          {!!operationId && (
            <View
              style={[
                styles.recommendationPanel,
                isPicking && styles.pickingPanel,
              ]}
            >
              <View style={styles.recommendationPanelHeader}>
                <Feather
                  name={isPicking ? "shopping-cart" : "map-pin"}
                  size={14}
                  color={isPicking ? COLORS.primary : COLORS.success}
                />
                <Text
                  style={[
                    styles.recommendationPanelTitle,
                    !isPicking && { color: COLORS.successText },
                  ]}
                >
                  {focusedItemName
                    ? `${isPicking ? "Vị trí nhặt" : "Kệ cần xếp"}: ${focusedItemName}`
                    : isPicking
                      ? "Gợi ý vị trí lấy hàng"
                      : "Gợi ý vị trí xếp hàng"}
                </Text>
              </View>

              {recommendationsLoading ? (
                <Text style={styles.recommendationPanelSubtle}>
                  Đang tải gợi ý từ phiếu...
                </Text>
              ) : effectiveHighlightedBins.length === 0 ? (
                <Text style={styles.recommendationPanelSubtle}>
                  Chưa có gợi ý từ hệ thống cho phiếu này.
                </Text>
              ) : (
                <>
                  {recommendationPreview.length > 0 ? (
                    recommendationPreview.map((entry, index) => (
                      <View
                        key={`preview-${index}`}
                        style={styles.recommendationRow}
                      >
                        <Text
                          style={styles.recommendationItemName}
                          numberOfLines={1}
                        >
                          {entry.itemName || `Mặt hàng ${index + 1}`}
                        </Text>
                        <Text
                          style={[
                            styles.recommendationChip,
                            !isPicking && styles.successChip,
                          ]}
                        >
                          {entry.binIdCode}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.recommendationPanelSubtle}>
                      Tìm thấy {effectiveHighlightedBins.length} vị trí{" "}
                      {isPicking ? "lấy hàng" : "đề xuất"} trong sơ đồ.
                    </Text>
                  )}

                  {recommendationResolution.firstShelf && (
                    <TouchableOpacity
                      style={[
                        styles.recommendationCta,
                        !isPicking && { backgroundColor: COLORS.success },
                      ]}
                      onPress={handleFindPathToRecommended}
                    >
                      <Feather name="navigation" size={14} color="#fff" />
                      <Text style={styles.recommendationCtaText}>
                        Tìm đường đến vị trí gợi ý
                      </Text>
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
                  0,
                ) || 0}{" "}
                kệ hàng
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[
                  styles.viewButton,
                  viewMode === "map" && styles.viewButtonActive,
                ]}
                onPress={() => setViewMode("map")}
              >
                <Feather
                  name="map"
                  size={16}
                  color={viewMode === "map" ? "#FFFFFF" : "#64748B"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewButton,
                  viewMode === "grid" && styles.viewButtonActive,
                ]}
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
              status={currentStatus} // Thêm dòng này để truyền status xuống
              outboundOrderId={outboundOrderId}
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
        onFindPath={isStaff ? handleFindPath : undefined}
        recommendedItems={availableItemsForModal}
        onConfirmOperation={handleConfirmOperationAtShelf}
        onUpdateShelf={handleUpdateShelf}
        operationType={isPicking ? "outbound" : "inbound"}
        isProcessing={isProcessing}
        onClose={() => {
          setModalVisible(false);
          setSelectedShelf(null);
          setSelectedZone(null);
        }}
      />

      <PathInstructionsModal
        visible={pathModalVisible}
        pathResult={currentPath}
        toLocation={selectedShelf?.code || "Kệ hàng"}
        onClose={() => {
          setPathModalVisible(false);
        }}
      />
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  selectorWrap: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  warehouseSelector: {
    backgroundColor: "#fff",
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
    fontWeight: "600",
  },
  warehouseChipTextActive: {
    color: "#fff",
  },
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginBottom: 10,
    marginTop: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  infoIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: COLORS.infoLight,
    alignItems: "center",
    justifyContent: "center",
  },
  infoDivider: {
    width: 1,
    height: 18,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  viewToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 4,
  },
  viewButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  viewButtonActive: {
    backgroundColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.slate700,
    fontWeight: "600",
  },
  recommendationPanel: {
    marginHorizontal: 12,
    marginBottom: 10,
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: COLORS.success + "20",
  },
  pickingPanel: {
    borderColor: COLORS.primary + "20",
  },
  recommendationPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  recommendationPanelTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.slate800,
  },
  recommendationPanelSubtle: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  recommendationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  recommendationItemName: {
    flex: 1,
    marginRight: 8,
    fontSize: 12,
    color: COLORS.text,
    fontWeight: "600",
  },
  recommendationChip: {
    fontSize: 11,
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary + "20",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    fontWeight: "700",
  },
  successChip: {
    color: COLORS.successText,
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.success + "20",
  },
  recommendationCta: {
    marginTop: 10,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  recommendationCtaText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.slate600,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSubtle,
    marginTop: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.slate800,
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: "center",
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
    fontWeight: "700",
    color: "#fff",
  },
});
