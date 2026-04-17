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
  onShelfPress?: (shelf: Shelf, zone: WarehouseZone) => void;
}

export const WarehouseGridView: React.FC<WarehouseGridViewProps> = ({
  structure,
  highlightedShelf,
  recommendedShelves,
  highlightedBins,
  onShelfPress,
}) => {
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

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => onShelfPress?.(shelf, zone)}
        className="bg-white rounded-2xl border-[1.5px] overflow-hidden shadow-sm elevation-2"
        style={[
          {
            borderColor: COLORS.borderLight,
            shadowColor: COLORS.slate900,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
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
                {levels.length} levels · {totalBins} bins
              </Text>
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
                <Feather name="star" size={10} color={COLORS.success} />
                <Text
                  className="text-[11px] font-extrabold tracking-[0.3px]"
                  style={{ color: COLORS.success }}
                >
                  Recommended
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
              No bins available
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

                    return (
                      <View
                        key={bin.id}
                        className={`px-2.5 py-1.5 rounded-lg border-[1.5px] items-center justify-center min-w-[44px] ${isDimmed ? "opacity-30" : ""}`}
                        style={[
                          {
                            borderColor: COLORS.slate200,
                            backgroundColor: COLORS.slate50,
                          },
                          isSuggested && {
                            borderColor: COLORS.success + "70",
                            backgroundColor: COLORS.success + "10",
                          },
                          isHighlighted &&
                            !isSuggested &&
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
                            isSuggested && { color: COLORS.successText },
                            isDimmed && { color: COLORS.slate300 },
                            isHighlighted &&
                              !isSuggested &&
                              !isDimmed && { color: COLORS.primary },
                          ]}
                        >
                          {bin.code}
                        </Text>
                        {isRecommendedBin && (
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
            contentContainerClassName="px-4 py-2.5 flex-row gap-2"
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
            levels
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
            bins
          </Text>
        </View>
        <View
          className="w-px h-4"
          style={{ backgroundColor: COLORS.borderLight }}
        />
        <View className="flex-row items-center justify-center gap-1 flex-1">
          <Feather name="layers" size={13} color={COLORS.slate400} />
          <Text className="text-xs text-slate-500 font-semibold">
            {currentZone?.shelves?.length || 0} shelves
          </Text>
        </View>
      </View>

      {/* Racks grid */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-[14px] gap-2.5 pb-8"
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
              No shelves in this zone
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
