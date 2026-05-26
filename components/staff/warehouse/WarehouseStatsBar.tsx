import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/color';
import { useTranslation } from '@/hooks/useTranslation';

interface WarehouseStatsBarProps {
    zoneCount: number;
    shelfCount: number;
    viewMode: "map" | "grid";
    setViewMode: (mode: "map" | "grid") => void;
}

export const WarehouseStatsBar: React.FC<WarehouseStatsBarProps> = ({
    zoneCount,
    shelfCount,
    viewMode,
    setViewMode,
}) => {
    const { t } = useTranslation();

    return (
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
                    {zoneCount} {t('warehouse.zones')}
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
                    {shelfCount} {t('warehouse.shelves')}
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
    );
};
