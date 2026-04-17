import { COLORS } from "@/constants/color";
import { AlertService } from "@/stores/alert.store";
import { useInboundStagingStore } from "@/stores/inbound-staging.store";
import { usePendingQuantitiesStore } from "@/stores/pending-quantities.store";
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
}

interface ShelfDetailModalProps {
  visible: boolean;
  shelf: Shelf | null;
  zone: WarehouseZone | null;
  onClose: () => void;
  recommendedItems?: ShelfActionItem[];
  onConfirmOperation?: (items: ShelfActionItem[]) => void;
  operationType?: "inbound" | "outbound";
  isProcessing?: boolean;
  ticketId?: number;
  shelfId?: string;
}

export const ShelfDetailModal: React.FC<ShelfDetailModalProps> = ({
  visible,
  shelf,
  zone,
  onClose,
  recommendedItems = [],
  onConfirmOperation,
  operationType = "inbound",
  isProcessing = false,
  ticketId,
  shelfId,
}) => {
  const [selectedBinId, setSelectedBinId] = useState<
    string | number | undefined
  >();
  const [selectedQuantities, setSelectedQuantities] = useState<
    Record<number, number>
  >({});
  const { getPendingQty, setPendingQty, clearShelfPending } =
    usePendingQuantitiesStore();

  const isInbound = operationType === "inbound";
  const accentColor = isInbound ? COLORS.success : COLORS.primary;
  const accentLight = isInbound ? COLORS.success + "15" : COLORS.primaryLight;

  // Reset selectedBinId when modal opens or shelf changes
  React.useEffect(() => {
    if (visible && shelf) {
      const recommendedBins = (shelf.levels ?? [])
        .flatMap((level) => level.bins ?? [])
        .filter((bin) =>
          recommendedItems.some((item) => {
            const binCodes = String(item.binCode)
              .split(",")
              .map((c) => c.trim());
            return binCodes.includes(String(bin.code));
          }),
        );

      if (recommendedBins.length > 0) {
        setSelectedBinId(recommendedBins[0].id);
      } else {
        const firstBin = (shelf.levels?.[0]?.bins ?? [])[0];
        setSelectedBinId(firstBin?.id);
      }
    }
  }, [visible, shelf, recommendedItems]);

  // Restore draft quantities
  React.useEffect(() => {
    if (!visible) {
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
  }, [visible, recommendedItems, ticketId, shelfId, getPendingQty]);

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

  const itemsWithSelectedBin = useMemo(() => {
    return recommendedItems.map((item) => {
      const maxQuantity = Math.max(0, Number(item.targetQuantity || 0));
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
  }, [recommendedItems, selectedBin, selectedQuantities]);

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
    if (!onConfirmOperation) return;

    if (selectedTotalQuantity <= 0) {
      AlertService.warning(
        "Quantity not selected",
        "Please enter a quantity greater than 0 before confirming.",
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
    itemsWithSelectedBin,
    onConfirmOperation,
    selectedTotalQuantity,
    ticketId,
    shelfId,
    clearShelfPending,
    recommendedItems,
  ]);

  if (!shelf || !zone) return null;

  const hasItems = recommendedItems.length > 0;

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
                  {(shelf.levels ?? []).length} levels
                  {" · "}
                  {(shelf.levels ?? []).reduce(
                    (acc, l) => acc + (l.bins?.length ?? 0),
                    0,
                  )}{" "}
                  bins
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
              {hasItems ? (
                <>
                  {/* Bin selection */}
                  <View className="px-5 py-4 gap-3">
                    <View className="flex-row items-center gap-2">
                      <View
                        className="w-1 h-4 rounded-sm"
                        style={{ backgroundColor: accentColor }}
                      />
                      <Text className="text-[15px] font-extrabold text-slate-700 uppercase tracking-wider flex-1">
                        Select target bin
                      </Text>
                    </View>
                    <BinSelectionView
                      shelf={shelf}
                      selectedBinId={selectedBinId}
                      recommendedBinCodes={recommendedBinCodes}
                      onSelectBin={(bin: Bin) => setSelectedBinId(bin.id)}
                    />
                  </View>

                  <View className="h-px bg-slate-200 mx-5" />

                  {/* Item list */}
                  <View className="px-5 py-4 gap-3">
                    <View className="flex-row items-center gap-2">
                      <View
                        className="w-1 h-4 rounded-sm"
                        style={{ backgroundColor: accentColor }}
                      />
                      <Text className="text-[15px] font-extrabold text-slate-700 uppercase tracking-wider flex-1">
                        {isInbound ? "Items to inbound" : "Items to outbound"}
                      </Text>
                      <View
                        className="px-2 py-[3px] rounded-md"
                        style={{ backgroundColor: accentLight }}
                      >
                        <Text
                          className="text-xs font-extrabold"
                          style={{ color: accentColor }}
                        >
                          {recommendedItems.length}
                        </Text>
                      </View>
                    </View>

                    {recommendedItems.map((item) => {
                      const qty = Number(selectedQuantities[item.id] ?? 0);
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
                          "Reset progress?",
                          `Do you want to reset the entire sorted quantity for item "${item.name}" across all shelves?`,
                          () => {
                            const { clearItem } =
                              useInboundStagingStore.getState();
                            if (ticketId) clearItem(ticketId, item.id);
                            AlertService.success(
                              "Progress reset",
                              "The progress for this item has been reset.",
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
                                        Recommended
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
                                          Reset
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
                                  ? "Will inbound to this bin"
                                  : "Will outbound from this bin"}
                              </Text>

                              {item.recommendedQuantity !== undefined &&
                                item.recommendedQuantity > 0 && (
                                  <View
                                    className="flex-row items-center gap-1 px-2 py-1 rounded-lg my-1 self-start"
                                    style={{
                                      backgroundColor: COLORS.primary + "08",
                                    }}
                                  >
                                    <Feather
                                      name="info"
                                      size={10}
                                      color={COLORS.primary}
                                    />
                                    <Text
                                      className="text-[11px] font-semibold"
                                      style={{ color: COLORS.primary }}
                                    >
                                      Recommended for this shelf:{" "}
                                      <Text className="font-extrabold">
                                        {item.recommendedQuantity}
                                      </Text>
                                    </Text>
                                  </View>
                                )}

                              <Text className="text-[11px] text-slate-400 font-medium">
                                <Text className="text-slate-400">
                                  Remaining:
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
                                  Total done:
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
                                    targetQty - done,
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
                                    targetQty - done,
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
                                className={`w-9 h-9 rounded-lg bg-slate-100 items-center justify-center border-[1.5px] border-slate-200 ${qty >= targetQty - done ? "opacity-40" : ""}`}
                                onPress={() =>
                                  updateItemQuantity(
                                    item.id,
                                    true,
                                    targetQty - done,
                                  )
                                }
                                activeOpacity={0.7}
                                disabled={qty >= targetQty - done}
                              >
                                <Feather
                                  name="plus"
                                  size={16}
                                  color={
                                    qty >= targetQty - done
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
                    No items for this shelf
                  </Text>
                  <Text className="text-[13px] text-slate-400 text-center leading-[19px]">
                    Shelf <Text className="font-bold">{shelf.code}</Text> has no
                    items in this ticket.
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* ── Footer / Confirm button ─────────────────────────────── */}
            {hasItems && onConfirmOperation && (
              <View className="px-5 pt-3 pb-6 border-t border-slate-200 gap-2.5">
                {/* Summary row */}
                {selectedTotalQuantity > 0 && (
                  <View
                    className="flex-row items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: accentLight }}
                  >
                    <Feather name="package" size={13} color={accentColor} />
                    <Text
                      className="text-[13px] font-semibold flex-1"
                      style={{ color: accentColor }}
                    >
                      {isInbound ? "Will inbound" : "Will outbound"}{" "}
                      <Text className="font-extrabold">
                        {selectedTotalQuantity}
                      </Text>{" "}
                      items
                      {selectedBin ? (
                        <>
                          {" "}
                          into bin{" "}
                          <Text className="font-extrabold">
                            {selectedBin.code}
                          </Text>
                        </>
                      ) : (
                        ""
                      )}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  className={`flex-row items-center justify-center gap-2.5 h-[54px] rounded-[14px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] elevation-5 ${isProcessing || selectedTotalQuantity === 0 ? "opacity-45 shadow-none elevation-0" : ""}`}
                  style={{ backgroundColor: accentColor }}
                  onPress={handleConfirmPress}
                  disabled={isProcessing || selectedTotalQuantity === 0}
                  activeOpacity={0.85}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="check-circle" size={18} color="#fff" />
                      <Text className="text-[15px] font-extrabold text-white tracking-[0.2px]">
                        {selectedTotalQuantity === 0
                          ? `Select quantity to ${isInbound ? "inbound" : "outbound"}`
                          : `Confirm ${isInbound ? "inbound" : "outbound"} of ${selectedTotalQuantity} items`}
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