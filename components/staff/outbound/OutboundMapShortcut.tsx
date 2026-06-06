import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/color';
import { useTranslation } from '@/hooks/useTranslation';

interface OutboundMapShortcutProps {
    onPress: () => void;
}

export const OutboundMapShortcut: React.FC<OutboundMapShortcutProps> = ({ onPress }) => {
    const { t } = useTranslation();

    return (
        <TouchableOpacity
            className="flex-row items-center bg-white mb-4 p-3.5 rounded-xl shadow-sm border border-slate-100"
            onPress={onPress}
        >
            <View
                className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                style={{ backgroundColor: COLORS.primary + "10" }}
            >
                <Feather name="map" size={18} color={COLORS.primary} />
            </View>
            <View className="flex-1">
                <Text className="text-base font-bold text-slate-800">
                    {t("outbound.warehouseMap")}
                </Text>
                <Text
                    className="text-xs mt-0.5"
                    style={{ color: COLORS.textMuted }}
                >
                    {t("outbound.tapToNavigate")}
                </Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
    );
};
