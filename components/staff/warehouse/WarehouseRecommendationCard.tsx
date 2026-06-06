import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/color';
import { useTranslation } from '@/hooks/useTranslation';

interface RecommendationEntry {
    itemName?: string;
    reason?: string;
    binIdCode?: string;
}

interface WarehouseRecommendationCardProps {
    isPicking: boolean;
    focusedItemName?: string;
    recommendationsLoading: boolean;
    effectiveHighlightedBins: string[];
    recommendationPreview: RecommendationEntry[];
    hasFirstShelf: boolean;
    handleFindPathToRecommended: () => void;
}

export const WarehouseRecommendationCard: React.FC<WarehouseRecommendationCardProps> = ({
    isPicking,
    focusedItemName,
    recommendationsLoading,
    effectiveHighlightedBins,
    recommendationPreview,
    hasFirstShelf,
    handleFindPathToRecommended,
}) => {
    const { t } = useTranslation();
    const [expandedIndices, setExpandedIndices] = React.useState<Record<number, boolean>>({});

    const toggleExpanded = (index: number) => {
        setExpandedIndices(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    return (
        <View
            className="mx-3 mb-2.5 mt-0.5 px-3 py-2.5 rounded-xl bg-white border-[1.5px]"
            style={{
                borderColor: isPicking
                    ? COLORS.primary + "20"
                    : COLORS.success + "20",
            }}
        >
            <View className="flex-row items-start gap-2 mb-2">
                <Feather
                    name={isPicking ? "shopping-cart" : "map-pin"}
                    size={14}
                    color={isPicking ? COLORS.primary : COLORS.success}
                    style={{ marginTop: 2 }}
                />
                <Text
                    className="flex-1 text-[13px] font-bold text-slate-800"
                    style={!isPicking ? { color: COLORS.successText } : {}}
                >
                    {focusedItemName
                        ? `${isPicking ? t('tasks.outbound') : t('tasks.inbound')}: ${focusedItemName}`
                        : isPicking
                            ? t('warehouse.suggestedPickLocations')
                            : t('warehouse.suggestedStowLocations')}
                </Text>
            </View>
            {recommendationsLoading ? (
                <Text
                    className="text-xs leading-[18px]"
                    style={{ color: COLORS.textMuted }}
                >
                    {t('warehouse.loadingSuggestions')}
                </Text>
            ) : effectiveHighlightedBins.length === 0 ? (
                <Text
                    className="text-xs leading-[18px]"
                    style={{ color: COLORS.textMuted }}
                >
                    {t('warehouse.noSuggestions')}
                </Text>
            ) : (
                <>
                    {recommendationPreview.length > 0 ? (
                        recommendationPreview.map((entry, index) => {
                            const hasLongReason = (entry.reason?.length ?? 0) > 30;
                            const bubbleStyle = isPicking
                                ? {
                                    color: COLORS.primary,
                                    backgroundColor: COLORS.primaryLight,
                                    borderColor: COLORS.primary + "20",
                                }
                                : {
                                    color: COLORS.successText,
                                    backgroundColor: COLORS.successLight,
                                    borderColor: COLORS.success + "20",
                                };

                            return (
                                <View
                                    key={`preview-${index}`}
                                    className="py-2.5 border-b"
                                    style={{ borderBottomColor: COLORS.borderLight }}
                                >
                                    <View className="flex-row items-center justify-between mb-1">
                                        <Text
                                            className="flex-1 mr-2 text-xs font-bold text-slate-800"
                                            numberOfLines={1}
                                        >
                                            {entry.itemName || `${t('common.item')} ${index + 1}`}
                                        </Text>
                                        {!hasLongReason && (
                                            <Text
                                                className="text-[11px] border rounded-full px-2.5 py-0.5 font-bold"
                                                style={bubbleStyle}
                                            >
                                                {entry.reason || entry.binIdCode}
                                            </Text>
                                        )}
                                    </View>

                                    {hasLongReason && (
                                        <View
                                            className="mt-1.5 p-3 rounded-2xl border"
                                            style={bubbleStyle}
                                        >
                                            <TouchableOpacity
                                                onPress={() => toggleExpanded(index)}
                                                activeOpacity={0.7}
                                            >
                                                <Text
                                                    className="text-[11px] font-medium leading-[16px]"
                                                    style={{ color: bubbleStyle.color }}
                                                    numberOfLines={expandedIndices[index] ? undefined : 2}
                                                >
                                                    {entry.reason}
                                                </Text>
                                                <Text className="font-bold underline text-[10px] mt-1.5" style={{ color: bubbleStyle.color }}>
                                                    {expandedIndices[index] ? t('common.viewLess') : t('common.viewMore')}
                                                </Text>
                                            </TouchableOpacity>
                                            {entry.binIdCode && (
                                                <View className="mt-2 pt-2 border-t flex-row items-center opacity-60" style={{ borderTopColor: bubbleStyle.color + '20' }}>
                                                    <Feather name="map-pin" size={10} color={bubbleStyle.color} />
                                                    <Text className="text-[10px] font-bold ml-1" style={{ color: bubbleStyle.color }}>
                                                        {entry.binIdCode}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    ) : (
                        <Text
                            className="text-xs leading-[18px]"
                            style={{ color: COLORS.textMuted }}
                        >
                            {t('warehouse.foundLocations', {
                                count: effectiveHighlightedBins.length,
                                type: isPicking ? t('warehouse.pick') : t('warehouse.suggested')
                            })}
                        </Text>
                    )}
                    {hasFirstShelf && (
                        <TouchableOpacity
                            className="mt-2.5 h-[34px] rounded-lg flex-row items-center justify-center gap-1.5"
                            style={{
                                backgroundColor: !isPicking
                                    ? COLORS.success
                                    : COLORS.primary,
                            }}
                            onPress={handleFindPathToRecommended}
                        >
                            <Feather name="navigation" size={14} color="#fff" />
                            <Text
                                className="text-white text-xs font-bold"
                                numberOfLines={1}
                                adjustsFontSizeToFit
                            >
                                {t('warehouse.findPathToSuggested')}
                            </Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
        </View>
    );
};
