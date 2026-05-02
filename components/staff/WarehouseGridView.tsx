import { useTranslation } from "@/hooks/useTranslation";
import { Shelf, WarehouseStructure, WarehouseZone } from "@/types/warehouse";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "@/constants/color";

interface WarehouseGridViewProps {
  structure: WarehouseStructure;
  highlightedShelf?: string;
  recommendedShelves?: string[];
  highlightedBins?: (string | number)[];
  inventorySummary?: { shelfId?: string | number; shelfCode?: string; quantity: number }[];
  onShelfPress?: (shelf: Shelf, zone: WarehouseZone) => void;
  isCounting?: boolean;
}

export const WarehouseGridView: React.FC<WarehouseGridViewProps> = ({
  structure,
  highlightedShelf,
  recommendedShelves,
  highlightedBins,
  inventorySummary,
  onShelfPress,
  isCounting = false,
}) => {
  const { t } = useTranslation();
  const [selectedZone, setSelectedZone] = useState<string | null>(
    (structure.zones ?? [])[0]?.id || null,
  );

  const currentZone = (structure.zones ?? []).find(
    (z) => z.id === selectedZone,
  );

  const renderBinGrid = (shelf: Shelf, zone: WarehouseZone) => {
    const levels = shelf.levels ?? [];
    const isRecommendedShelf = (recommendedShelves ?? []).includes(shelf.id);
    const isHighlighted = highlightedShelf === shelf.id;
    const totalBins = levels.reduce(
      (acc, level) => acc + (level.bins?.length ?? 0),
      0,
    );
    const shelfInventory = inventorySummary?.find(
      (entry) =>
        String(entry.shelfId ?? "").trim() === String(shelf.id).trim() ||
        String(entry.shelfCode ?? "").trim() === String(shelf.code).trim(),
    );

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => onShelfPress?.(shelf, zone)}
        className="bg-white rounded-2xl border-[1.5px] overflow-hidden"
        style={[
          {
            borderColor: COLORS.borderLight,
            shadowColor: COLORS.slate900,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 2,
            elevation: 2,
          },
          isRecommendedShelf && {
            borderColor: COLORS.success + "60",
            backgroundColor: "#FBFFFE",
            shadowColor: COLORS.success,
            shadowOpacity: 0.08,
            elevation: 3,
          },
          isHighlighted &&
            !isRecommendedShelf && {
              borderColor: COLORS.primary + "50",
              backgroundColor: "#FAFFFE",
              shadowColor: COLORS.primary,
              shadowOpacity: 0.08,
            },
        ]}
      >
        {/* Rack Header */}
        <View
          className="flex-row items-center justify-between px-[14px] py-3 border-b"
          style={{ borderBottomColor: COLORS.borderLight }}
        >
          <View className="flex-row items-center gap-2.5 flex-1">
            <View
              className="w-[34px] h-[34px] rounded-lg bg-slate-100 items-center justify-center"
              style={[
                isRecommendedShelf && {
                  backgroundColor: COLORS.success + "18",
                },
                isHighlighted &&
                  !isRecommendedShelf && {
                    backgroundColor: COLORS.primaryLight,
                  },
              ]}
            >
              <Feather
                name="layers"
                size={16}
                color={
                  isRecommendedShelf
                    ? COLORS.success
                    : isHighlighted
                      ? COLORS.primary
                      : COLORS.slate500
                }
              />
            </View>
            <View>
              <Text
                className="text-base font-extrabold tracking-[-0.3px]"
                style={[
                  { color: COLORS.slate800 },
                  isRecommendedShelf && { color: COLORS.successText },
                  isHighlighted &&
                    !isRecommendedShelf && { color: COLORS.primary },
                ]}
              >
                {shelf.code}
              </Text>
              <Text className="text-[11px] text-slate-400 font-medium mt-px">
                {levels.length} {t('warehouse.levels')} · {totalBins} {t('warehouse.bins')}
              </Text>
              {shelfInventory && shelfInventory.quantity > 0 && (
                <View
                  className="mt-1 self-start px-2 py-1 rounded-md border"
                  style={{
                    borderColor: COLORS.info + "30",
                    backgroundColor: COLORS.info + "12",
                  }}
                >
                  <Text className="text-[10px] font-bold" style={{ color: COLORS.info }}>
                    {t('warehouse.itemsInShelf', { count: shelfInventory.quantity })}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            {isRecommendedShelf && (
              <View
                className="flex-row items-center gap-1 px-2 py-1 rounded-lg border"
                style={{
                  backgroundColor: COLORS.success + "18",
                  borderColor: COLORS.success + "30",
                }}
              >
                <Feather name={isCounting ? "check-circle" : "star"} size={10} color={COLORS.success} />
                <Text
                  className="text-[11px] font-extrabold tracking-[0.3px]"
                  style={{ color: COLORS.success }}
                >
                  {isCounting ? t('tasks.countItems') : t('warehouse.recommended')}
                </Text>
              </View>
            )}
            <View
              className="w-7 h-7 rounded-lg bg-slate-100 items-center justify-center"
              style={[
                isRecommendedShelf && {
                  backgroundColor: COLORS.success + "18",
                },
                isHighlighted &&
                  !isRecommendedShelf && {
                    backgroundColor: COLORS.primaryLight,
                  },
              ]}
            >
              <Feather
                name="chevron-right"
                size={16}
                color={
                  isRecommendedShelf
                    ? COLORS.success
                    : isHighlighted
                      ? COLORS.primary
                      : COLORS.slate400
                }
              />
            </View>
          </View>
        </View>

        {levels.length === 0 ? (
          <View className="flex-row items-center justify-center gap-2 py-4 px-[14px] bg-slate-50">
            <Feather name="inbox" size={20} color={COLORS.slate300} />
            <Text className="text-[13px] text-slate-400 font-medium">
              {t('warehouse.noInventoryData')}
            </Text>
          </View>
        ) : (
          <View className="px-[14px] py-3 gap-2.5">
            {levels.map((level, levelIndex) => (
              <View key={level.id} className="flex-row items-start gap-2.5">
                {/* Level tag */}
                <View
                  className="min-w-[36px] px-2 py-1.25 rounded-lg bg-slate-100 border items-center justify-center mt-px"
                  style={[
                    { borderColor: COLORS.borderLight },
                    isRecommendedShelf && {
                      backgroundColor: COLORS.success + "18",
                      borderColor: COLORS.success + "30",
                    },
                  ]}
                >
                  <Text
                    className="text-[11px] font-bold tracking-[0.3px]"
                    style={[
                      { color: COLORS.slate500 },
                      isRecommendedShelf && { color: COLORS.success },
                    ]}
                  >
                    {level.code}
                  </Text>
                </View>

                {/* Bins */}
                <View className="flex-1 flex-row flex-wrap gap-1.5">
                    {(level.bins ?? []).map((bin) => {
                      const isRecommendedBin = (highlightedBins ?? []).some(
                        (code) =>
                          String(code) === bin.code || String(code) === bin.id,
                      );
                      const hasAnyRecommendations =
                        (recommendedShelves?.length ?? 0) > 0 ||
                        (highlightedBins?.length ?? 0) > 0;
                      const isSuggested = isRecommendedShelf || isRecommendedBin;
                      const isDimmed = hasAnyRecommendations && !isSuggested;

                      const occupancy = Math.min(100, Math.max(0, Number(bin.percentage ?? bin.occupancyPercentage ?? 0)));
                      const isFull = occupancy >= 100;

                      return (
                        <View
                          key={bin.id}
                          className="px-2.5 py-1.5 rounded-lg border-[1.5px] items-center justify-center min-w-[44px]"
                          style={[
                            {
                              borderColor: COLORS.slate200,
                              backgroundColor: COLORS.slate50,
                              opacity: isDimmed ? 0.3 : 1,
                            },
                            isFull && {
                              borderColor: COLORS.danger + "60",
                              backgroundColor: COLORS.danger + "10",
                            },
                            isSuggested && !isFull && {
                              borderColor: COLORS.success + "70",
                              backgroundColor: COLORS.success + "10",
                            },
                            isHighlighted &&
                              !isSuggested &&
                              !isFull &&
                              !isDimmed && {
                                borderColor: COLORS.primary + "60",
                                backgroundColor: COLORS.primaryLight,
                              },
                          ]}
                        >
                          <Text
                            className={`text-xs tracking-[0.2px] ${isSuggested || (isHighlighted && !isDimmed) ? "font-bold" : "font-semibold"}`}
                            style={[
                              { color: COLORS.slate600 },
                              isFull && { color: COLORS.danger },
                              isSuggested && !isFull && { color: COLORS.successText },
                              isDimmed && { color: COLORS.slate300 },
                              isHighlighted &&
                                !isSuggested &&
                                !isFull &&
                                !isDimmed && { color: COLORS.primary },
                            ]}
                          >
                            {bin.code}
                          </Text>
                          {isFull ? (
                            <View className="absolute top-[-4px] right-[-4px] bg-white rounded-full">
                              <Feather name="x-circle" size={10} color={COLORS.danger} />
                            </View>
                          ) : isRecommendedBin && (
                            <View
                              className="absolute top-[3px] right-[3px] w-[5px] h-[5px] rounded-full"
                              style={{ backgroundColor: COLORS.success }}
                            />
                          )}
                        </View>
                      );
                    })}
                </View>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
      {/* Zone tabs */}
      {structure.zones && structure.zones.length > 1 && (
        <View
          className="bg-white border-b"
          style={{ borderBottomColor: COLORS.borderLight }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: "row",
              gap: 8,
            }}
          >
            {(structure.zones ?? []).map((zone) => (
              <TouchableOpacity
                key={zone.id}
                className="flex-row items-center gap-1.5 px-4 py-2 rounded-full border-[1.5px]"
                style={[
                  {
                    backgroundColor: COLORS.slate100,
                    borderColor: "transparent",
                  },
                  selectedZone === zone.id && {
                    backgroundColor: COLORS.primary + "15",
                    borderColor: COLORS.primary + "40",
                  },
                ]}
                onPress={() => setSelectedZone(zone.id)}
                activeOpacity={0.8}
              >
                {selectedZone === zone.id && (
                  <View
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: COLORS.primary }}
                  />
                )}
                <Text
                  className={`text-[13px] tracking-[0.2px] ${selectedZone === zone.id ? "font-bold" : "font-semibold text-slate-500"}`}
                  style={[
                    selectedZone === zone.id && { color: COLORS.primary },
                  ]}
                >
                  {zone.code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Stats bar */}
      <View
        className="flex-row items-center justify-center py-2.5 px-5 bg-white border-b"
        style={{ borderBottomColor: COLORS.borderLight }}
      >
        <View className="flex-row items-center justify-center gap-1 flex-1">
          <Feather name="package" size={13} color={COLORS.slate400} />
          <Text className="text-xs text-slate-500 font-semibold">
            {currentZone?.shelves?.reduce(
              (acc, s) => acc + (s.levels?.length ?? 0),
              0,
            ) || 0}{" "}
            {t('warehouse.levels')}
          </Text>
        </View>
        <View
          className="w-px h-4"
          style={{ backgroundColor: COLORS.borderLight }}
        />
        <View className="flex-row items-center justify-center gap-1 flex-1">
          <Feather name="grid" size={13} color={COLORS.slate400} />
          <Text className="text-xs text-slate-500 font-semibold">
            {currentZone?.shelves?.reduce(
              (acc, s) =>
                acc +
                (s.levels ?? []).reduce(
                  (sum, l) => sum + (l.bins?.length ?? 0),
                  0,
                ),
              0,
            ) || 0}{" "}
            {t('warehouse.bins')}
          </Text>
        </View>
        <View
          className="w-px h-4"
          style={{ backgroundColor: COLORS.borderLight }}
        />
        <View className="flex-row items-center justify-center gap-1 flex-1">
          <Feather name="layers" size={13} color={COLORS.slate400} />
          <Text className="text-xs text-slate-500 font-semibold">
            {currentZone?.shelves?.length || 0} {t('warehouse.shelf').toLowerCase() + 's'}
          </Text>
        </View>
      </View>

      {/* Racks grid */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 14,
          gap: 10,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {currentZone?.shelves?.map((shelf) => (
          <View key={shelf.id}>{renderBinGrid(shelf, currentZone)}</View>
        ))}

        {(!currentZone?.shelves || currentZone.shelves.length === 0) && (
          <View className="items-center justify-center py-[60px] gap-3">
            <View className="w-16 h-16 rounded-[20px] bg-slate-100 items-center justify-center">
              <Feather name="inbox" size={32} color={COLORS.slate300} />
            </View>
            <Text className="text-sm text-slate-400 font-medium">
              {t('warehouse.noItemsForShelf')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
