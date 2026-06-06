import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/color';
import { useTranslation } from '@/hooks/useTranslation';
import type { OutboundOrderItem } from '@/types/outbound-order';

interface OutboundProductItemProps {
    item: OutboundOrderItem;
    currentStatus: string;
    canEditItems: boolean;
    localQty: number | string;
    isFifoLoading: boolean;
    displayLocations: any[];
    fifoSummary?: {
        requiredQuantity: number;
        totalAvailableQuantity: number;
        remainingQuantity: number;
    };
    getLocationLabels: (sug: any) => { zoneLabel: string; shelfLabel: string; levelLabel: string };
    handleUpdateQty: (itemId: number, isIncrement: boolean) => void;
    onManualQtyChange: (itemId: number, value: string) => void;
}

export const OutboundProductItem: React.FC<OutboundProductItemProps> = ({
    item,
    currentStatus,
    canEditItems,
    localQty,
    isFifoLoading,
    displayLocations,
    fifoSummary,
    getLocationLabels,
    handleUpdateQty,
    onManualQtyChange,
}) => {
    const { t } = useTranslation();
    const pickedQty = Number(localQty) || 0;
    const requiredQty = item.quantity || 0;
    const availableInWarehouse = fifoSummary?.totalAvailableQuantity;

    const isFulfilled = pickedQty >= requiredQty;
    const isExhausted = availableInWarehouse !== undefined && pickedQty >= availableInWarehouse && pickedQty > 0;
    const showDoneBadge = currentStatus !== "Created" && (isFulfilled || isExhausted);

    return (
        <View className="mb-3 bg-white p-4 rounded-xl shadow-sm">
            {/* Header Row: Product Name & Status Badge */}
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 pr-3">
                    <Text className="text-base font-bold text-slate-800 mb-1">
                        {item.productName ||
                            item.name ||
                            item.product?.name ||
                            `${t("common.product")} #${item.productId}`}
                    </Text>
                    {(item.sku || item.product?.sku) && (
                        <View className="bg-slate-100 px-2 py-1 rounded self-start">
                            <Text
                                className="text-xs font-semibold"
                                style={{ color: COLORS.textMuted }}
                            >
                                {item.sku || item.product?.sku}
                            </Text>
                        </View>
                    )}
                </View>

                {showDoneBadge && (
                    <View
                        className="px-2 py-1 rounded-md"
                        style={{ backgroundColor: COLORS.success + "20" }}
                    >
                        <Text className="text-xs font-bold" style={{ color: COLORS.success }}>
                            {t("common.done")}
                        </Text>
                    </View>
                )}
            </View>

            {/* Locations Row */}
            {displayLocations.length > 0 ? (
                <>
                    <View className="flex-row items-center justify-between mb-2 px-1">
                        <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            {t('warehouse.suggestedLocations')}
                        </Text>
                        {displayLocations.length > 2 && (
                            <View className="flex-row items-center">
                                <Text className="text-[10px] text-cyan-600 font-medium mr-1">
                                    {t('common.swipeHint')}
                                </Text>
                                <Feather name="chevron-right" size={12} color={COLORS.primary} />
                            </View>
                        )}
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        className="mb-3"
                        contentContainerStyle={{ paddingRight: 20 }}
                    >
                        {displayLocations.map((sug: any, index: number) => {
                            const labels = getLocationLabels(sug);
                            const isPicked = !!sug.batchId; // Simple heuristic for picked vs suggested
                            const zoneText = sug.zoneCode || sug.zoneName || labels.zoneLabel;
                            const shelfText = sug.shelfCode || sug.shelfName || labels.shelfLabel;
                            const levelText = sug.binCode || sug.binName || sug.binIdCode || labels.levelLabel;
                            const qty = isPicked ? (sug.quantity ?? 0) : (sug.suggestedPickQty ?? sug.availableInBin ?? 0);

                            return (
                                <View
                                    key={`${item.id}-${sug.binId || sug.binCode || sug.binIdCode || index}-${sug.batchId || ''}`}
                                    className="bg-cyan-50/50 border border-cyan-100 px-3 py-2 rounded-lg mr-2"
                                    style={{ minWidth: 110 }}
                                >
                                    <View className="flex-row items-center mb-1">
                                        <Feather name="map-pin" size={10} color={COLORS.primary} style={{ marginRight: 4 }} />
                                        <Text className="text-[11px] font-bold" style={{ color: COLORS.primary }}>
                                            {zoneText || t('common.notAvailable')}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-[10px] text-slate-500 font-medium">
                                            {shelfText || t('common.notAvailable')} • {levelText || t('common.notAvailable')}
                                        </Text>
                                    </View>

                                    <View className="mt-1.5 pt-1.5 border-t border-cyan-100/50 flex-row justify-between items-center">
                                        <Feather name="package" size={10} color={COLORS.primary} style={{ marginRight: 4 }} />
                                        <Text className="text-[11px] font-bold" style={{ color: COLORS.primary }}>
                                            {qty} pcs
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </>
            ) : isFifoLoading ? (
                <View className="flex-row items-center mb-3">
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text className="text-[11px] ml-2 text-slate-400 font-medium">
                        {t('warehouse.loadingSuggestions')}
                    </Text>
                </View>
            ) : (
                <View className="flex-row items-center mb-3 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">
                    <Feather name="info" size={12} color={COLORS.textMuted} />
                    <Text className="text-[11px] ml-1.5 text-slate-400 font-medium">
                        {t('warehouse.noSuggestions')}
                    </Text>
                </View>
            )}

            {/* Quantity Input & Info Row */}
            <View className="flex-row justify-between items-center mt-2 border-t border-slate-50 pt-3">
                <Text className="text-sm font-medium text-slate-700">
                    {currentStatus === "Created"
                        ? t("outbound.itemQty")
                        : currentStatus === "Picking"
                            ? t("outbound.pickedQty")
                            : t("outbound.readyQty")}
                </Text>

                {canEditItems ? (
                    <View className="flex-row items-center bg-slate-100 rounded-xl p-1">
                        <TouchableOpacity
                            className="w-10 h-10 rounded-lg bg-white justify-center items-center shadow-sm"
                            onPress={() => handleUpdateQty(item.id, false)}
                        >
                            <Feather name="minus" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                        <View className="flex-row items-baseline px-2 min-w-[70px] justify-center">
                            <TextInput
                                className="text-lg font-bold text-center p-0 m-0"
                                style={{ color: COLORS.primary, minWidth: 32 }}
                                keyboardType="numeric"
                                value={String(localQty)}
                                onChangeText={(text) => onManualQtyChange(item.id, text)}
                            />
                            <Text
                                className="text-sm ml-1"
                                style={{ color: COLORS.textMuted }}
                            >
                                / {item.quantity || 0}
                            </Text>
                        </View>
                        <TouchableOpacity
                            className="w-10 h-10 rounded-lg bg-white justify-center items-center shadow-sm"
                            onPress={() => handleUpdateQty(item.id, true)}
                        >
                            <Feather name="plus" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="flex-row items-baseline px-2 justify-center">
                        {currentStatus === "Created" ? (
                            <Text
                                className="text-lg font-bold"
                                style={{ color: COLORS.primary }}
                            >
                                {item.quantity || 0}
                            </Text>
                        ) : (
                            <>
                                <Text
                                    className="text-lg font-bold"
                                    style={{
                                        color: currentStatus === "Completed" ? COLORS.success : COLORS.primary,
                                    }}
                                >
                                    {Number(localQty) || 0}
                                </Text>
                                <Text
                                    className="text-sm ml-1"
                                    style={{ color: COLORS.textMuted }}
                                >
                                    / {item.quantity || 0}
                                </Text>
                            </>
                        )}
                    </View>
                )}
            </View>

            {/* FIFO Summary Row */}
            {fifoSummary && (
                <View className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 border border-emerald-100">
                    <Text className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
                        {t("warehouse.readyQuantity")}: {fifoSummary.totalAvailableQuantity} / {fifoSummary.requiredQuantity || item.quantity || 0}
                    </Text>
                    {fifoSummary.remainingQuantity > 0 && (
                        <Text className="text-xs mt-0.5 font-semibold" style={{ color: COLORS.warning }}>
                            {t("warehouse.shortage")}: {fifoSummary.remainingQuantity}
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
};
