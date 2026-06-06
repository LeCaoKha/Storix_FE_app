import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/color';
import { useTranslation } from '@/hooks/useTranslation';

interface OutboundActionFooterProps {
    currentStatus: string;
    isTransitioning: boolean;
    isSaving: boolean;
    showSaveBtn: boolean;
    prevAction: any;
    nextAction: any;
    handleRevertStatus: () => void;
    handleSaveItems: () => void;
    handleTransition: () => void;
    bottomSafePadding: number;
}

export const OutboundActionFooter: React.FC<OutboundActionFooterProps> = ({
    currentStatus,
    isTransitioning,
    isSaving,
    showSaveBtn,
    prevAction,
    nextAction,
    handleRevertStatus,
    handleSaveItems,
    handleTransition,
    bottomSafePadding,
}) => {
    const { t } = useTranslation();

    return (
        <View
            className="p-5 bg-white flex-row items-center border-t border-slate-200"
            style={{ paddingBottom: bottomSafePadding }}
        >
            {prevAction && (
                <TouchableOpacity
                    className={`flex-1 h-14 rounded-xl border justify-center items-center flex-row shadow-sm ${isTransitioning ? "opacity-60" : ""
                        }`}
                    style={{
                        borderColor: COLORS.borderLight,
                        backgroundColor: "#f8fafc",
                    }}
                    onPress={handleRevertStatus}
                    disabled={isTransitioning}
                >
                    <Feather
                        name="corner-up-left"
                        size={18}
                        color={COLORS.textMuted}
                        className="mr-2"
                    />
                    <Text
                        className="text-sm font-bold"
                        style={{ color: COLORS.textMuted }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {prevAction.label}
                    </Text>
                </TouchableOpacity>
            )}

            {showSaveBtn && (
                <TouchableOpacity
                    className={`flex-[1.5] h-14 rounded-xl justify-center items-center shadow-sm ml-3 ${isSaving ? "opacity-60" : ""
                        }`}
                    style={{ backgroundColor: COLORS.primary }}
                    onPress={handleSaveItems}
                    disabled={isSaving}
                >
                    <Text
                        className="text-base font-bold text-white"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {isSaving ? t("common.loading") : t("common.save")}
                    </Text>
                </TouchableOpacity>
            )}

            {nextAction && (
                <TouchableOpacity
                    className={`flex-[1.5] h-14 rounded-xl flex-row justify-center items-center shadow-sm ml-3 ${isTransitioning ? "opacity-60" : ""
                        }`}
                    style={{ backgroundColor: nextAction.color }}
                    onPress={handleTransition}
                    disabled={isTransitioning}
                >
                    <Feather
                        name="arrow-right-circle"
                        size={20}
                        color="#fff"
                        className="mr-2"
                    />
                    <Text
                        className="text-base font-bold text-white"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {isTransitioning ? "..." : nextAction.label}
                    </Text>
                </TouchableOpacity>
            )}

            {currentStatus === "LoadHandover" && (
                <View
                    className="flex-1 h-14 rounded-xl flex-row justify-center items-center shadow-sm"
                    style={{ backgroundColor: COLORS.warning }}
                >
                    <Feather name="clock" size={20} color="#fff" className="mr-2" />
                    <Text className="text-base font-bold text-white">
                        {t("outbound.awaitingApproval")}
                    </Text>
                </View>
            )}

            {currentStatus === "Completed" && (
                <View
                    className="flex-1 flex-row items-center justify-center h-14 rounded-xl border"
                    style={{
                        backgroundColor: COLORS.success + "15",
                        borderColor: COLORS.success + "30",
                    }}
                >
                    <Feather
                        name="check-circle"
                        size={20}
                        color={COLORS.success}
                        className="mr-2"
                    />
                    <Text
                        className="text-base font-bold"
                        style={{ color: COLORS.success }}
                    >
                        {t("outbound.orderCompleted")}
                    </Text>
                </View>
            )}
        </View>
    );
};
