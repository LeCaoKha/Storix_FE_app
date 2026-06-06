import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/color';
import { useTranslation } from '@/hooks/useTranslation';

interface ShelfOperationItemRowProps {
    item: any;
    qty: number;
    maxAllowed: number;
    accentColor: string;
    accentLight: string;
    activeBinCode?: string;
    isRecommended?: boolean;
    onUpdateQty: (increment: boolean) => void;
    onManualQtyChange: (value: string) => void;
    onReset: () => void;
}

export const ShelfOperationItemRow: React.FC<ShelfOperationItemRowProps> = ({
    item,
    qty,
    maxAllowed,
    accentColor,
    accentLight,
    activeBinCode,
    isRecommended,
    onUpdateQty,
    onManualQtyChange,
    onReset,
}) => {
    const { t } = useTranslation();
    const targetQty = Math.max(0, Number(item.targetQuantity || 0));
    const done = Number(item.currentQuantity || 0);
    const projectedDone = Math.min(done + qty, targetQty);
    const projectedRemaining = Math.max(0, targetQty - projectedDone);
    const progress = targetQty > 0 ? Math.min(projectedDone / targetQty, 1) : 0;

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
                        {isRecommended && (
                            <View className="px-2 py-[3px] rounded-md" style={{ backgroundColor: COLORS.warning + '12' }}>
                                <Text className="text-[10px] font-extrabold" style={{ color: COLORS.warning }}>
                                    {t('warehouse.suggested')}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View className="flex-row items-center gap-1.5 flex-wrap">
                        {item.sku && (
                            <Text className="text-[11px] text-slate-400 font-semibold bg-slate-100 px-2 py-[3px] rounded-md">
                                {item.sku}
                            </Text>
                        )}
                        <View className="flex-row items-center gap-1 px-2 py-[3px] rounded-md" style={{ backgroundColor: accentLight }}>
                            <Feather name="map-pin" size={10} color={accentColor} />
                            <Text className="text-[11px] font-bold" style={{ color: accentColor }}>
                                {activeBinCode || t('common.notAvailable')}
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={onReset}
                    className="w-8 h-8 rounded-full bg-white border border-slate-100 items-center justify-center shadow-sm"
                >
                    <Feather name="refresh-ccw" size={14} color={COLORS.slate400} />
                </TouchableOpacity>
            </View>

            {/* Progress bar */}
            <View className="gap-1.5">
                <View className="flex-row justify-between items-end">
                    <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                        {t('warehouse.completionProgress')}
                    </Text>
                    <Text className="text-[11px] font-bold" style={{ color: accentColor }}>
                        {projectedDone}/{targetQty}
                    </Text>
                </View>
                <View className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <View
                        className="h-full rounded-full"
                        style={{ backgroundColor: accentColor, width: `${progress * 100}%` }}
                    />
                </View>
                {projectedRemaining > 0 && (
                    <Text className="text-[10px] font-medium text-slate-400 text-right italic">
                        {t('warehouse.remainingToPick', { count: projectedRemaining })}
                    </Text>
                )}
            </View>

            {/* Qty controls */}
            <View className="flex-row items-center justify-between pt-1">
                <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-600">
                        {t('warehouse.quantityToOperate')}
                    </Text>
                    <Text className="text-[10px] text-slate-400 font-medium">
                        {t('warehouse.maxAllowedByBin', { count: maxAllowed })}
                    </Text>
                </View>

                <View className="flex-row items-center bg-white rounded-xl border-[1.5px] border-slate-100 p-0.5 shadow-sm">
                    <TouchableOpacity
                        className="w-8 h-8 rounded-lg items-center justify-center"
                        onPress={() => onUpdateQty(false)}
                    >
                        <Feather name="minus" size={16} color={accentColor} />
                    </TouchableOpacity>

                    <TextInput
                        className="min-w-[40px] px-1 text-center font-extrabold text-slate-700 text-base"
                        value={String(qty)}
                        keyboardType="numeric"
                        onChangeText={onManualQtyChange}
                    />

                    <TouchableOpacity
                        className="w-8 h-8 rounded-lg items-center justify-center"
                        onPress={() => onUpdateQty(true)}
                    >
                        <Feather name="plus" size={16} color={accentColor} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
