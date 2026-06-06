import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/color';
import { useTranslation } from '@/hooks/useTranslation';

interface OutboundInfoCardProps {
    statusLabel: string;
    statusColor: string;
    statusBgColor: string;
    createdBy: string;
    destination: string;
}

export const OutboundInfoCard: React.FC<OutboundInfoCardProps> = ({
    statusLabel,
    statusColor,
    statusBgColor,
    createdBy,
    destination,
}) => {
    const { t } = useTranslation();

    return (
        <View className="mb-4 bg-white p-4 rounded-xl shadow-sm">
            <View className="flex-row items-center mb-2.5">
                <Text
                    className="text-sm mr-2.5"
                    style={{ color: COLORS.textMuted }}
                >
                    {t("tasks.status")}:
                </Text>
                <View
                    className="px-2 py-1 rounded-md"
                    style={{ backgroundColor: statusBgColor }}
                >
                    <Text
                        className="text-xs font-bold"
                        style={{ color: statusColor }}
                    >
                        {statusLabel}
                    </Text>
                </View>
            </View>
            <View className="flex-row items-center mb-2.5">
                <Feather
                    name="user"
                    size={16}
                    color={COLORS.textMuted}
                    className="mr-2.5"
                />
                <Text className="text-sm" style={{ color: COLORS.textMuted }}>
                    {t("tasks.createdBy")}:{" "}
                    <Text className="font-semibold text-slate-800">
                        {createdBy}
                    </Text>
                </Text>
            </View>
            <View className="flex-row items-center">
                <Feather
                    name="map-pin"
                    size={16}
                    color={COLORS.textMuted}
                    className="mr-2.5"
                />
                <Text className="text-sm" style={{ color: COLORS.textMuted }}>
                    {t("tasks.destination")}:{" "}
                    <Text className="font-semibold text-slate-800">
                        {destination}
                    </Text>
                </Text>
            </View>
        </View>
    );
};
