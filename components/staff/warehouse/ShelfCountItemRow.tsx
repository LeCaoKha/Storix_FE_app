import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/color';
import { useTranslation } from '@/hooks/useTranslation';

interface ShelfCountItemRowProps {
    item: any;
    countValue: string;
    systemQty: number;
    isStaff: boolean;
    onCountChange: (value: string) => void;
}

export const ShelfCountItemRow: React.FC<ShelfCountItemRowProps> = ({
    item,
    countValue,
    systemQty,
    isStaff,
    onCountChange,
}) => {
    const { t } = useTranslation();
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
                    onChangeText={onCountChange}
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
};
