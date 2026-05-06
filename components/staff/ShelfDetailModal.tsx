import { COLORS } from "@/constants/color";
import { useUpdateStockCountItem } from "@/hooks/stock-count.hooks";
import { useTranslation } from "@/hooks/useTranslation";
import { AlertService } from "@/stores/alert.store";
import { useAuthStore } from "@/stores/auth.store";
import { useInboundStagingStore } from "@/stores/inbound-staging.store";
import { usePendingQuantitiesStore } from "@/stores/pending-quantities.store";
import type { StockCountItem } from "@/types/stock-count";
import { Bin, Shelf, WarehouseZone } from "@/types/warehouse";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BinSelectionView } from "./BinSelectionView";

export interface ShelfActionItem {
  id: number;
  productId: number;
  name: string;
  sku?: string;
  targetQuantity: number;
  currentQuantity: number;
  recommendedQuantity?: number; // USER REQUEST: suggested for this specific shelf
  binCode: string;
  binId: number | string;
  isRecommended?: boolean;
  pendingQuantity?: number;
  productWidth?: number;
  productHeight?: number;
  productLength?: number;
}

interface ShelfDetailModalProps {
  visible: boolean;
  shelf: Shelf | null;
  zone: WarehouseZone | null;
  onClose: () => void;
  recommendedItems?: ShelfActionItem[];
  inventorySummary?: { shelfId?: string | number; shelfCode?: string; quantity: number }[];
  focusedItemName?: string;
  countItems?: StockCountItem[];
  countExpectedByItemId?: Record<number, number>;
  onConfirmOperation?: (items: ShelfActionItem[]) => void;
  operationType?: "inbound" | "outbound" | "count";
  isProcessing?: boolean;
  ticketId?: number;
  shelfId?: string;
}

const toPositiveNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const getBinOccupancy = (bin?: Bin) => {
  if (!bin) return 0;
  const raw =
    typeof bin.percentage === "number"
      ? bin.percentage
      : typeof bin.occupancyPercentage === "number"
        ? bin.occupancyPercentage
        : 0;
  return Math.min(100, Math.max(0, Number(raw || 0)));
};

const getBinVolume = (bin?: Bin) => {
  if (!bin) return 0;
  const width = toPositiveNumber(bin.width);
  const height = toPositiveNumber(bin.height);
  const length = toPositiveNumber(bin.length);
  return width * height * length;
};

const getProductUnitVolume = (item: ShelfActionItem) => {
  const width = toPositiveNumber(item.productWidth);
  const height = toPositiveNumber(item.productHeight);
  const length = toPositiveNumber(item.productLength);
  return width * height * length;
};

export const ShelfDetailModal: React.FC<ShelfDetailModalProps> = ({
  visible,
  shelf,
  zone,
  onClose,
  recommendedItems = [],
  inventorySummary = [],
  focusedItemName,
  countItems = [],
  countExpectedByItemId = {},
  onConfirmOperation,
  operationType = "inbound",
  isProcessing = false,
  ticketId,
  shelfId,
}) => {
  const { t } = useTranslation();
  const [selectedBinId, setSelectedBinId] = useState<
    string | number | undefined
  >();
  const [selectedQuantities, setSelectedQuantities] = useState<
    Record<number, number>
  >({});
  const [countQuantities, setCountQuantities] = useState<Record<number, string>>({});
  const [countDraftByShelfItem, setCountDraftByShelfItem] = useState<Record<string, number>>({});
  const [isCountProcessing, setIsCountProcessing] = useState(false);
  const getPendingQty = usePendingQuantitiesStore((state) => state.getPendingQty);
  const setPendingQty = usePendingQuantitiesStore((state) => state.setPendingQty);
  const clearShelfPending = usePendingQuantitiesStore((state) => state.clearShelfPending);
  const updateStockCountItem = useUpdateStockCountItem();
  const user = useAuthStore((state) => state.user);
  const isStaff = user?.roleId === 4;

  const getShelfItemDraftKey = useCallback(
    (itemId: number) => {
      const shelfKey = String(shelf?.code || shelf?.id || "").trim();
      return `${ticketId || 0}:${shelfKey}:${itemId}`;
    },
    [shelf?.code, shelf?.id, ticketId],
  );

  const isInbound = operationType === "inbound";
  const isCountMode = operationType === "count";
  const accentColor = isInbound ? COLORS.success : COLORS.primary;
  const accentLight = isInbound ? COLORS.success + "15" : COLORS.primaryLight;
  const actionBusy = isProcessing || isCountProcessing;

  // Reset selectedBinId when modal opens or shelf changes
  React.useEffect(() => {
    if (visible && shelf) {
      const allBins = (shelf.levels ?? []).flatMap((level) => level.bins ?? []);
      const firstSelectableBin = allBins.find((bin) => getBinOccupancy(bin) < 100);

      const recommendedBins = allBins
        .filter((bin) =>
          recommendedItems.some((item) => {
            const binCodes = String(item.binCode)
              .split(",")
              .map((c) => c.trim());
            return binCodes.includes(String(bin.code));
          }),
        )
        .filter((bin) => getBinOccupancy(bin) < 100);

      if (recommendedBins.length > 0) {
        setSelectedBinId(recommendedBins[0].id);
      } else {
        setSelectedBinId(firstSelectableBin?.id);
      }
    }
  }, [visible, shelf, recommendedItems]);

  // Restore draft quantities
  React.useEffect(() => {
    if (!visible) {
      setSelectedQuantities({});
      setCountQuantities({});
      return;
    }

    if (isCountMode) {
      const restoredCounts: Record<number, string> = {};
      countItems.forEach((item) => {
        const draftKey = getShelfItemDraftKey(item.id);
        const shelfDraft = countDraftByShelfItem[draftKey];
        restoredCounts[item.id] = shelfDraft != null ? String(shelfDraft) : "";
      });
      setCountQuantities(restoredCounts);
      setSelectedQuantities({});
      return;
    }

    const restoredQuantities: Record<number, number> = {};
    recommendedItems.forEach((item) => {
      if (ticketId && shelfId) {
        restoredQuantities[item.id] = getPendingQty(ticketId, item.id, shelfId);
      } else {
        restoredQuantities[item.id] = 0;
      }
    });
    setSelectedQuantities(restoredQuantities);
    setCountQuantities({});
  }, [
    visible,
    isCountMode,
    countItems,
    recommendedItems,
    ticketId,
    shelfId,
    // getPendingQty removed to break the loop - we only restore once on visible/shelf change
    countDraftByShelfItem,
    getShelfItemDraftKey,
    getPendingQty,
  ]);

  // Sync selectedQuantities to Zustand store when they change
  React.useEffect(() => {
    if (!ticketId || !shelfId) return;

    Object.entries(selectedQuantities).forEach(([itemIdStr, qty]) => {
      const itemId = Number(itemIdStr);
      setPendingQty(ticketId, itemId, shelfId, qty);
    });
  }, [selectedQuantities, ticketId, shelfId, setPendingQty]);

  // Get all recommended bin codes
  const recommendedBinCodes = useMemo(() => {
    return Array.from(
      new Set(
        recommendedItems
          .filter((item) => item.isRecommended)
          .map((item) => item.binCode),
      ),
    );
  }, [recommendedItems]);

  const selectedBin = useMemo(() => {
    if (!shelf || !selectedBinId) return undefined;
    return (shelf.levels ?? [])
      .flatMap((level) => level.bins ?? [])
      .find((bin) => String(bin.id) === String(selectedBinId));
  }, [shelf, selectedBinId]);

  const selectedBinRemainingVolume = useMemo(() => {
    if (!selectedBin) return undefined;
    const binVolume = getBinVolume(selectedBin);
    if (binVolume <= 0) return undefined;
    const occupancyRatio = getBinOccupancy(selectedBin) / 100;
    return Math.max(0, binVolume * (1 - occupancyRatio));
  }, [selectedBin]);

  const getMaxInboundQuantityForItem = useCallback(
    (item: ShelfActionItem, targetRemaining: number) => {
      if (!isInbound) return Math.max(0, targetRemaining);
      if (targetRemaining <= 0) return 0;
      if (!selectedBin) return 0;
      if (getBinOccupancy(selectedBin) >= 100) return 0;
      if (selectedBinRemainingVolume == null) return Math.max(0, targetRemaining);

      const productUnitVolume = getProductUnitVolume(item);
      if (productUnitVolume <= 0) return Math.max(0, targetRemaining);

      const maxByCapacity = Math.floor(selectedBinRemainingVolume / productUnitVolume);
      return Math.max(0, Math.min(targetRemaining, maxByCapacity));
    },
    [isInbound, selectedBin, selectedBinRemainingVolume],
  );

  const currentShelfCountSummary = useMemo(() => {
    if (!isCountMode) return { totalSystem: 0, totalCounted: 0 };

    return countItems.reduce(
      (acc, item) => {
        const expectedQuantity = countExpectedByItemId[item.id] != null
          ? Number(countExpectedByItemId[item.id])
          : Number(item.systemQuantity || 0);

        acc.totalSystem += Math.max(0, expectedQuantity);
        const rawCount = countQuantities[item.id];
        const countedQuantity = rawCount === "" ? item.countedQuantity : Number(rawCount);
        if (typeof countedQuantity === "number" && Number.isFinite(countedQuantity)) {
          acc.totalCounted += Math.max(0, countedQuantity);
        }
        return acc;
      },
      { totalSystem: 0, totalCounted: 0 },
    );
  }, [countItems, countQuantities, countExpectedByItemId, isCountMode]);

  const currentShelfInventory = useMemo(() => {
    if (!shelf) return undefined;

    return inventorySummary.find(
      (entry) =>
        String(entry.shelfId ?? "").trim() === String(shelf.id).trim() ||
        String(entry.shelfCode ?? "").trim() === String(shelf.code).trim(),
    );
  }, [inventorySummary, shelf]);

  const itemsWithSelectedBin = useMemo(() => {
    return recommendedItems.map((item) => {
      const targetRemaining = Math.max(
        0,
        Number(item.targetQuantity || 0) - Number(item.currentQuantity || 0),
      );
      const maxQuantity = getMaxInboundQuantityForItem(item, targetRemaining);
      const quantity = Math.max(
        0,
        Math.min(Number(selectedQuantities[item.id] || 0), maxQuantity),
      );
      return {
        ...item,
        binId: selectedBin?.id ?? item.binId,
        binCode: selectedBin?.code ?? item.binCode,
        pendingQuantity: quantity,
      };
    });
  }, [recommendedItems, selectedBin, selectedQuantities, getMaxInboundQuantityForItem]);

  const selectedTotalQuantity = useMemo(
    () =>
      itemsWithSelectedBin.reduce(
        (sum, item) => sum + Number(item.pendingQuantity || 0),
        0,
      ),
    [itemsWithSelectedBin],
  );

  const updateItemQuantity = useCallback(
    (itemId: number, increment: boolean, maxQuantity: number) => {
      setSelectedQuantities((prev) => {
        const current = Number(prev?.[itemId] || 0);
        const nextValue = increment
          ? Math.min(current + 1, maxQuantity)
          : Math.max(current - 1, 0);

        return { ...prev, [itemId]: nextValue };
      });
    },
    [],
  );

  const updateItemQuantityFromInput = useCallback(
    (itemId: number, value: string, maxQuantity: number) => {
      const sanitized = value.replace(/[^0-9]/g, "");

      if (sanitized.length === 0) {
        setSelectedQuantities((prev) => ({ ...prev, [itemId]: 0 }));
        return;
      }

      const nextValue = Math.min(Math.max(Number(sanitized), 0), maxQuantity);
      setSelectedQuantities((prev) => ({ ...prev, [itemId]: nextValue }));
    },
    [],
  );

  const handleConfirmPress = useCallback(() => {
    if (isCountMode) {
      if (!ticketId) {
        AlertService.warning(t('warehouse.missingTicket'), t('warehouse.missingTicketMsg'));
        return;
      }

      const payload = countItems.map((item) => {
        const rawValue = countQuantities[item.id];
        const parsedValue = rawValue === undefined || rawValue === "" ? item.countedQuantity : Number(rawValue);
        return {
          item,
          countedQuantity: Number.isFinite(parsedValue as number) ? Math.max(0, Number(parsedValue)) : NaN,
        };
      });

      if (payload.length === 0) {
        AlertService.warning(t('warehouse.noItemsOnShelf'), t('warehouse.noItemsOnShelfMsg'));
        return;
      }

      const invalidItem = payload.find((entry) => !Number.isFinite(entry.countedQuantity));
      if (invalidItem) {
        AlertService.warning(t('warehouse.missingQuantity'), t('warehouse.missingQuantityMsg'));
        return;
      }

      setIsCountProcessing(true);
      void (async () => {
        try {
          const nextDraftByShelfItem = { ...countDraftByShelfItem };

          await Promise.all(
            payload.map((entry) => {
              const draftKey = getShelfItemDraftKey(entry.item.id);
              const previousShelfCount = Number(countDraftByShelfItem[draftKey] || 0);
              const currentInput = Math.max(0, Number(entry.countedQuantity || 0));
              const baseCounted = Math.max(0, Number(entry.item.countedQuantity || 0));
              const hasLocationId = Number(entry.item.locationId || 0) > 0;

              // If ticket item has no locationId, backend stores one total per item,
              // so convert shelf input into aggregated counted quantity to avoid overwrite.
              const countedQuantityToSave = hasLocationId
                ? currentInput
                : Math.max(0, baseCounted - previousShelfCount + currentInput);

              nextDraftByShelfItem[draftKey] = currentInput;

              return updateStockCountItem.mutateAsync({
                ticketId,
                itemId: entry.item.id,
                payload: {
                  productId: entry.item.productId,
                  countedQuantity: countedQuantityToSave,
                  locationId: entry.item.locationId ?? null,
                },
              });
            }),
          );

          setCountDraftByShelfItem(nextDraftByShelfItem);

          const countDifference = currentShelfCountSummary.totalCounted - currentShelfCountSummary.totalSystem;
          AlertService.success(
            t('warehouse.countSaved'),
            isStaff
              ? t('warehouse.countSavedMsg')
              : (countDifference === 0
                ? t('warehouse.countUpdatedMsg')
                : t('warehouse.countSavedDiscrepancyMsg', { count: countDifference })),
            onClose,
          );
          return;
        } catch (error: any) {
          console.error("[ShelfDetailModal] Failed to save stock count", error);
          AlertService.error(
            t('warehouse.countError'),
            String(error?.response?.data?.message || t('warehouse.countErrorMsg')).trim(),
          );
        } finally {
          setIsCountProcessing(false);
        }
      })();

      return;
    }

    if (!onConfirmOperation) return;

    if (selectedTotalQuantity <= 0) {
      AlertService.warning(
        t('warehouse.quantityNotSelected'),
        t('warehouse.quantityNotSelectedMsg'),
      );
      return;
    }

    onConfirmOperation(itemsWithSelectedBin);

    // Clear persisted pending quantities immediately to avoid restoring old value on next render.
    if (ticketId && shelfId) {
      clearShelfPending(ticketId, shelfId);
    }

    // Reset input to 0 after confirm to prep for next bin/item (Sequential Binning).
    const resetMap: Record<number, number> = {};
    recommendedItems.forEach((item) => {
      resetMap[item.id] = 0;
    });
    setSelectedQuantities(resetMap);
  }, [
    isCountMode,
    onClose,
    ticketId,
    countItems,
    countQuantities,
    countDraftByShelfItem,
    getShelfItemDraftKey,
    updateStockCountItem,
    currentShelfCountSummary.totalCounted,
    currentShelfCountSummary.totalSystem,
    itemsWithSelectedBin,
    onConfirmOperation,
    selectedTotalQuantity,
    shelfId,
    clearShelfPending,
    recommendedItems,
    isStaff,
    t,
  ]);

  if (!shelf || !zone) return null;

  const hasItems = isCountMode ? countItems.length > 0 : recommendedItems.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-[#020817]/[0.55] justify-end"
        onPress={onClose}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            className="bg-white rounded-t-3xl h-[92%] w-full shadow-[0_-4px_10px_rgba(0,0,0,0.1)] elevation-[20] shrink"
            onStartShouldSetResponder={() => true}
          >
            {/* Drag handle */}
            <View className="w-9 h-1 rounded-full bg-slate-200 self-center mt-3 mb-1" />

            {/* ── Header ──────────────────────────────────────────────── */}
            <View className="flex-row items-center px-5 py-3.5 border-b border-slate-200 gap-3">
              <View
                className="w-11 h-11 rounded-[13px] items-center justify-center"
                style={{ backgroundColor: accentLight }}
              >
                <Feather
                  name={isInbound ? "arrow-down-circle" : "arrow-up-circle"}
                  size={22}
                  color={accentColor}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[22px] font-extrabold text-slate-800 tracking-tight">
                  {shelf.code}
                </Text>
                <Text className="text-xs text-slate-400 font-medium mt-0.5">
                  {zone.code}
                  {" · "}
                  {(shelf.levels ?? []).length} {t('warehouse.levels')}
                  {" · "}
                  {(shelf.levels ?? []).reduce(
                    (acc, l) => acc + (l.bins?.length ?? 0),
                    0,
                  )}{" "}
                  {t('warehouse.bins')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="w-[34px] h-[34px] rounded-lg bg-slate-100 items-center justify-center"
                activeOpacity={0.7}
              >
                <Feather name="x" size={18} color={COLORS.slate500} />
              </TouchableOpacity>
            </View>

            {/* ── Scrollable content ──────────────────────────────────── */}
            <ScrollView
              className="shrink"
              contentContainerClassName="grow pb-2"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {isCountMode ? (
                <View className="px-5 pt-4">
                  <View
                    className="rounded-2xl border px-4 py-3"
                    style={{
                      borderColor: COLORS.info + "25",
                      backgroundColor: COLORS.info + "08",
                    }}
                  >
                    <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.info }}>
                      {t('warehouse.shelfInventory')}
                    </Text>
                    <Text className="text-sm font-semibold text-slate-800 mt-1">
                      {shelf.code}
                    </Text>
                    <View className="flex-row items-center justify-between mt-2">
                      <Text className="text-xs text-slate-500">
                        {t('warehouse.itemsInShelf', { count: countItems.length })}
                      </Text>
                      {!isStaff && (
                        <Text className="text-sm font-extrabold" style={{ color: COLORS.info }}>
                          {currentShelfCountSummary.totalCounted}/{currentShelfCountSummary.totalSystem}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ) : focusedItemName || currentShelfInventory ? (
                <View className="px-5 pt-4">
                  <View
                    className="rounded-2xl border px-4 py-3"
                    style={{
                      borderColor: COLORS.info + "25",
                      backgroundColor: COLORS.info + "08",
                    }}
                  >
                    <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.info }}>
                      {t('warehouse.shelfInventory')}
                    </Text>
                    <Text className="text-sm font-semibold text-slate-800 mt-1">
                      {focusedItemName ? focusedItemName : shelf.code}
                    </Text>
                    <View className="flex-row items-center justify-between mt-2">
                      <Text className="text-xs text-slate-500">
                        {currentShelfInventory ? t('warehouse.thisShelfHas') : t('warehouse.noInventoryData')}
                      </Text>
                      {currentShelfInventory && (
                        <Text className="text-sm font-extrabold" style={{ color: COLORS.info }}>
                          {currentShelfInventory.quantity}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ) : null}

              {hasItems ? (
                <>
                  {!isCountMode && (
                    <>
                      {/* Bin selection */}
                      <View className="px-5 py-4 gap-3">
                        <View className="flex-row items-center gap-2">
                          <View
                            className="w-1 h-4 rounded-sm"
                            style={{ backgroundColor: accentColor }}
                          />
                          <Text className="text-[15px] font-extrabold text-slate-700 uppercase tracking-wider flex-1">
                            {t('warehouse.selectBin')}
                          </Text>
                        </View>
                        <BinSelectionView
                          shelf={shelf}
                          selectedBinId={selectedBinId}
                          recommendedBinCodes={recommendedBinCodes}
                          onSelectBin={(bin: Bin) => setSelectedBinId(bin.id)}
                          isCounting={isCountMode}
                        />
                        {isInbound && !selectedBin && (
                          <View
                            className="flex-row items-center gap-1.5 px-2.5 py-2 rounded-lg border"
                            style={{
                              borderColor: COLORS.danger + "40",
                              backgroundColor: COLORS.danger + "10",
                            }}
                          >
                            <Feather name="alert-triangle" size={12} color={COLORS.danger} />
                            <Text className="text-[12px] font-semibold" style={{ color: COLORS.danger }}>
                              {t('warehouse.allBinsFull')}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View className="h-px bg-slate-200 mx-5" />
                    </>
                  )}

                  {/* Item list / Count list */}
                  <View className="px-5 py-4 gap-3">
                    <View className="flex-row items-center gap-2">
                      <View
                        className="w-1 h-4 rounded-sm"
                        style={{ backgroundColor: accentColor }}
                      />
                      <Text className="text-[15px] font-extrabold text-slate-700 uppercase tracking-wider flex-1">
                        {isCountMode
                          ? t('warehouse.itemsToCount')
                          : isInbound
                            ? t('warehouse.itemsToInbound')
                            : t('warehouse.itemsToOutbound')}
                      </Text>
                      <View
                        className="px-2 py-[3px] rounded-md"
                        style={{ backgroundColor: accentLight }}
                      >
                        <Text
                          className="text-xs font-extrabold"
                          style={{ color: accentColor }}
                        >
                          {isCountMode ? countItems.length : recommendedItems.length}
                        </Text>
                      </View>
                    </View>

                    {(isCountMode ? countItems : recommendedItems).map((item: any) => {
                      if (isCountMode) {
                        const rawCount = countQuantities[item.id] ?? (item.countedQuantity != null ? String(item.countedQuantity) : "");
                        const countValue = rawCount === "" ? "" : rawCount;
                        const systemQty = Math.max(
                          0,
                          Number(
                            countExpectedByItemId[item.id] != null
                              ? countExpectedByItemId[item.id]
                              : item.systemQuantity || 0,
                          ),
                        );
                        const parsedCount = countValue === "" ? 0 : Number(countValue);
                        const diff = parsedCount - systemQty;

                        return (
                          <View
                            key={item.id}
                            className="bg-slate-50 rounded-[14px] p-3.5 border-[1.5px] border-slate-200 gap-2.5"
                          >
                            <View className="flex-row items-start">
                              <View className="flex-1 gap-1.5">
                                <View className="flex-row items-center gap-2 flex-wrap">
                                  <Text
                                    className="text-[15px] font-bold text-slate-800 flex-1"
                                    numberOfLines={1}
                                  >
                                    {item.name || `${t('common.product')} #${item.productId}`}
                                  </Text>
                                  <View className="px-2 py-[3px] rounded-md" style={{ backgroundColor: COLORS.info + '12' }}>
                                    <Text className="text-[10px] font-extrabold" style={{ color: COLORS.info }}>
                                      {t('warehouse.count')}
                                    </Text>
                                  </View>
                                </View>
                                <View className="flex-row items-center gap-1.5 flex-wrap">
                                  {item.sku && (
                                    <Text className="text-[11px] text-slate-400 font-semibold bg-slate-100 px-2 py-[3px] rounded-md">
                                      {item.sku}
                                    </Text>
                                  )}
                                  {!isStaff && (
                                    <View className="flex-row items-center gap-1 px-2 py-[3px] rounded-md border" style={{ backgroundColor: COLORS.info + '08', borderColor: COLORS.info + '20' }}>
                                      <Feather name="box" size={10} color={COLORS.info} />
                                      <Text className="text-[11px] font-bold" style={{ color: COLORS.info }}>
                                        {t('warehouse.system')} {systemQty}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            </View>

                            <View className="flex-row items-center justify-between pt-1 gap-3">
                              <View className="flex-1 gap-0.5">
                                <Text className="text-xs font-bold text-slate-600">
                                  {t('warehouse.enterActualCount')}
                                </Text>
                                <Text className="text-[11px] text-slate-400 font-medium">
                                  {countValue === "" ? t('warehouse.quantityNotEntered') : (isStaff ? t('warehouse.quantityEntered') : t('warehouse.discrepancy', { count: diff }))}
                                </Text>
                              </View>

                                <TextInput
                                className="w-[92px] h-10 rounded-lg bg-white border-[1.5px] border-slate-200 px-3 py-0 text-[18px] font-extrabold text-slate-700 text-center"
                                style={[{ includeFontPadding: false, lineHeight: 20 }, countValue !== "" && { borderColor: COLORS.info + '40', backgroundColor: COLORS.info + '08', color: COLORS.info }]}
                                value={countValue}
                                onChangeText={(text) => {
                                  const cleaned = text.replace(/[^0-9]/g, "");
                                  setCountQuantities((prev) => ({ ...prev, [item.id]: cleaned }));
                                }}
                                keyboardType="number-pad"
                                inputMode="numeric"
                                returnKeyType="done"
                                textAlign="center"
                                textAlignVertical="center"
                                maxLength={5}
                                  selectTextOnFocus={false}
                                  autoCorrect={false}
                                  autoCapitalize="none"
                              />
                            </View>
                          </View>
                        );
                      }

                      const targetRemaining = Math.max(
                        0,
                        Number(item.targetQuantity || 0) - Number(item.currentQuantity || 0),
                      );
                      const maxAllowedByBin = getMaxInboundQuantityForItem(item, targetRemaining);
                      const qty = Math.max(
                        0,
                        Math.min(Number(selectedQuantities[item.id] ?? 0), maxAllowedByBin),
                      );
                      const targetQty = Math.max(
                        0,
                        Number(item.targetQuantity || 0),
                      );
                      const done = Number(item.currentQuantity || 0);

                      // Logic fix: projectedDone is what's already in other bins + what's being entered now
                      const projectedDone = Math.min(done + qty, targetQty);

                      // Logic fix: projectedRemaining is what's still left to reach the target
                      const projectedRemaining = Math.max(
                        0,
                        targetQty - projectedDone,
                      );

                      const progress =
                        targetQty > 0
                          ? Math.min(projectedDone / targetQty, 1)
                          : 0;
                      const activeBinCode = selectedBin?.code ?? item.binCode;

                      const handleResetItem = () => {
                        AlertService.confirm(
                          t('common.undo') + '?',
                          t('warehouse.reset') + ` item "${item.name}"?`,
                          () => {
                            const { clearItem } =
                              useInboundStagingStore.getState();
                            if (ticketId) clearItem(ticketId, item.id);
                            AlertService.success(
                              t('common.success'),
                              t('warehouse.reset'),
                            );
                          },
                        );
                      };

                      return (
                        <View
                          key={item.id}
                          className="bg-slate-50 rounded-[14px] p-3.5 border-[1.5px] border-slate-200 gap-2.5"
                        >
                          {/* Item info */}
                          <View className="flex-row items-start">
                            <View className="flex-1 gap-1.5">
                              <View className="flex-row items-center gap-2 flex-wrap">
                                <Text
                                  className="text-[15px] font-bold text-slate-800 flex-1"
                                  numberOfLines={1}
                                >
                                  {item.name}
                                </Text>
                                <View className="flex-row items-center gap-1.5">
                                  {item.isRecommended && (
                                    <View
                                      className="flex-row items-center gap-1 px-1.5 py-[3px] rounded-md"
                                      style={{ backgroundColor: accentLight }}
                                    >
                                      <Feather
                                        name="star"
                                        size={9}
                                        color={accentColor}
                                      />
                                      <Text
                                        className="text-[10px] font-extrabold"
                                        style={{ color: accentColor }}
                                      >
                                        {t('warehouse.recommended')}
                                      </Text>
                                    </View>
                                  )}
                                  {projectedDone > 0 && (
                                    <TouchableOpacity
                                      onPress={handleResetItem}
                                      activeOpacity={0.6}
                                    >
                                      <View
                                        className="flex-row items-center gap-1 px-1.5 py-[3px] rounded-md"
                                        style={{
                                          backgroundColor: COLORS.danger + "10",
                                        }}
                                      >
                                        <Feather
                                          name="rotate-ccw"
                                          size={9}
                                          color={COLORS.danger}
                                        />
                                        <Text
                                          className="text-[10px] font-extrabold"
                                          style={{ color: COLORS.danger }}
                                        >
                                          {t('warehouse.reset')}
                                        </Text>
                                      </View>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                              <View className="flex-row items-center gap-1.5 flex-wrap">
                                {item.sku && (
                                  <Text className="text-[11px] text-slate-400 font-semibold bg-slate-100 px-2 py-[3px] rounded-md">
                                    {item.sku}
                                  </Text>
                                )}
                                <View
                                  className="flex-row items-center gap-1 px-2 py-[3px] rounded-md border"
                                  style={{
                                    backgroundColor: accentLight,
                                    borderColor: accentColor + "30",
                                  }}
                                >
                                  <Feather
                                    name="map-pin"
                                    size={10}
                                    color={accentColor}
                                  />
                                  <Text
                                    className="text-[11px] font-bold"
                                    style={{ color: accentColor }}
                                  >
                                    {activeBinCode}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>

                          {/* Progress bar */}
                          <View className="flex-row items-center gap-2.5">
                            <View className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                              <View
                                className="h-full rounded-full"
                                style={{
                                  width: `${progress * 100}%` as any,
                                  backgroundColor: accentColor,
                                }}
                              />
                            </View>
                            <Text className="text-[11px] font-bold text-slate-500 min-w-[36px] text-right">
                              {projectedDone}/{item.targetQuantity}
                            </Text>
                          </View>

                          {/* Quantity controls */}
                          <View className="flex-row items-center justify-between pt-1">
                            <View className="flex-1 gap-0.5">
                              <Text className="text-xs font-bold text-slate-600">
                                {isInbound
                                  ? t('warehouse.willInboundToBin')
                                  : t('warehouse.willOutboundFromBin')}
                              </Text>


                              <Text className="text-[11px] text-slate-400 font-medium">
                                {isInbound && selectedBinRemainingVolume != null && getProductUnitVolume(item) > 0 ? (
                                  <>
                                    <Text className="text-slate-400" style={maxAllowedByBin === 0 ? { color: COLORS.danger } : {}}>
                                      {maxAllowedByBin === 0 ? t('warehouse.binFull') : t('warehouse.maxCapacity', { count: maxAllowedByBin })}
                                    </Text>
                                    {" · "}
                                  </>
                                ) : isInbound && (getProductUnitVolume(item) <= 0 || !selectedBin) ? (
                                  <>
                                    <Text className="text-amber-500 font-bold">
                                      {t('warehouse.dimensionsMissing')}
                                    </Text>
                                    {" · "}
                                  </>
                                ) : null}
                                <Text className="text-slate-400">
                                  {t('warehouse.remaining')}
                                </Text>{" "}
                                <Text
                                  className="font-bold"
                                  style={{
                                    color:
                                      projectedRemaining > 0
                                        ? COLORS.warning
                                        : COLORS.slate700,
                                  }}
                                >
                                  {projectedRemaining}
                                </Text>
                                {" · "}
                                <Text className="text-slate-400">
                                  {t('warehouse.totalDone')}
                                </Text>{" "}
                                <Text
                                  className="font-bold"
                                  style={{
                                    color:
                                      progress >= 1
                                        ? COLORS.success
                                        : accentColor,
                                  }}
                                >
                                  {projectedDone}/{item.targetQuantity}
                                </Text>
                              </Text>
                            </View>

                            <View className="flex-row items-center gap-2">
                              <TouchableOpacity
                                className={`w-9 h-9 rounded-lg bg-slate-100 items-center justify-center border-[1.5px] border-slate-200 ${qty === 0 ? "opacity-40" : ""}`}
                                onPress={() =>
                                  updateItemQuantity(
                                    item.id,
                                    false,
                                    maxAllowedByBin,
                                  )
                                }
                                activeOpacity={0.7}
                                disabled={qty === 0}
                              >
                                <Feather
                                  name="minus"
                                  size={16}
                                  color={
                                    qty === 0 ? COLORS.slate300 : accentColor
                                  }
                                />
                              </TouchableOpacity>

                              <TextInput
                                className="w-[54px] h-9 rounded-lg bg-white border-[1.5px] border-slate-200 px-2 py-0 text-[18px] font-extrabold text-slate-700 text-center"
                                style={[
                                  { includeFontPadding: false, lineHeight: 20 },
                                  qty > 0 && {
                                    borderColor: accentColor + "40",
                                    backgroundColor: accentLight,
                                    color: accentColor,
                                  },
                                ]}
                                value={String(qty)}
                                onChangeText={(text) =>
                                  updateItemQuantityFromInput(
                                    item.id,
                                    text,
                                    maxAllowedByBin,
                                  )
                                }
                                keyboardType="number-pad"
                                inputMode="numeric"
                                returnKeyType="done"
                                textAlign="center"
                                textAlignVertical="center"
                                maxLength={4}
                                selectTextOnFocus
                              />

                              <TouchableOpacity
                                className={`w-9 h-9 rounded-lg bg-slate-100 items-center justify-center border-[1.5px] border-slate-200 ${qty >= maxAllowedByBin ? "opacity-40" : ""}`}
                                onPress={() =>
                                  updateItemQuantity(
                                    item.id,
                                    true,
                                    maxAllowedByBin,
                                  )
                                }
                                activeOpacity={0.7}
                                disabled={qty >= maxAllowedByBin}
                              >
                                <Feather
                                  name="plus"
                                  size={16}
                                  color={
                                    qty >= maxAllowedByBin
                                      ? COLORS.slate300
                                      : accentColor
                                  }
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : (
                /* No items state */
                <View className="items-center py-12 px-8 gap-2.5">
                  <View className="w-16 h-16 rounded-[20px] bg-slate-100 items-center justify-center mb-1">
                    <Feather
                      name="check-circle"
                      size={32}
                      color={COLORS.slate300}
                    />
                  </View>
                  <Text className="text-base font-bold text-slate-600">
                    {t('warehouse.noItemsForShelf')}
                  </Text>
                  <Text className="text-[13px] text-slate-400 text-center leading-[19px]">
                    {t('warehouse.shelfHasNoItems', { code: shelf.code })}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* ── Footer / Confirm button ─────────────────────────────── */}
            {hasItems && (onConfirmOperation || isCountMode) && (
              <View className="px-5 pt-3 pb-6 border-t border-slate-200 gap-2.5">
                {/* Summary row */}
                {isCountMode ? (
                  <View
                    className="flex-row items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: COLORS.info + "10" }}
                  >
                    <Feather name="clipboard" size={13} color={COLORS.info} />
                    <Text
                      className="text-[13px] font-semibold flex-1"
                      style={{ color: COLORS.info }}
                    >
                      {countItems.length > 0
                        ? t('inventoryCount.readyToSave', { count: countItems.length })
                        : t('inventoryCount.noItemsToCount')}
                    </Text>
                  </View>
                ) : selectedTotalQuantity > 0 ? (
                  <View
                    className="flex-row items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: accentLight }}
                  >
                    <Feather name="package" size={13} color={accentColor} />
                    <Text
                      className="text-[13px] font-semibold flex-1"
                      style={{ color: accentColor }}
                    >
                      {isInbound
                        ? t('warehouse.willInboundItemsIntoBin', { count: selectedTotalQuantity, code: selectedBin?.code || '' })
                        : t('warehouse.willOutboundItemsFromBin', { count: selectedTotalQuantity, code: selectedBin?.code || '' })}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  className={`flex-row items-center justify-center gap-2.5 h-[54px] rounded-[14px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] elevation-5 ${actionBusy || (!isCountMode && selectedTotalQuantity === 0) ? "opacity-45 shadow-none elevation-0" : ""}`}
                  style={{ backgroundColor: isCountMode ? COLORS.info : accentColor }}
                  onPress={handleConfirmPress}
                  disabled={actionBusy || (!isCountMode && selectedTotalQuantity === 0) || (isCountMode && countItems.length === 0)}
                  activeOpacity={0.85}
                >
                  {actionBusy ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="check-circle" size={18} color="#fff" />
                      <Text className="text-[15px] font-extrabold text-white tracking-[0.2px]">
                        {isCountMode
                          ? t('inventoryCount.confirmCount')
                          : selectedTotalQuantity === 0
                            ? (isInbound ? t('warehouse.selectQtyToInbound') : t('warehouse.selectQtyToOutbound'))
                            : (isInbound ? t('warehouse.confirmInboundQty', { count: selectedTotalQuantity }) : t('warehouse.confirmOutboundQty', { count: selectedTotalQuantity }))}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};