import { Card, RefreshContainer, ScreenHeader } from '@/components';
import { getBottomSafePadding } from '@/components/ui/safeArea';
import { COLORS } from '@/constants/color';
import { useInboundOrdersByStaff, useInboundStorageRecommendations, useInboundTicket, useUpdateInboundTicketItems } from '@/hooks';
import { useAppBack } from '@/hooks/useAppBack';
import { useTranslation } from '@/hooks/useTranslation';
import { useWarehouseStructure } from '@/hooks/warehouse.hooks';
import { AlertService } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useInboundStagingStore } from '@/stores/inbound-staging.store';
import type { InboundItemStorageRecommendations, InboundOrderItem } from '@/types/inbound-order';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InboundDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const goBack = useAppBack();
    const user = useAuthStore((state) => state.user);
    const { t } = useTranslation();
    const companyId = user?.companyId ?? 0;
    const staffId = user?.id ?? 0;

    const { data: staffOrders, isLoading, refetch: refetchOrders } = useInboundOrdersByStaff(companyId, staffId);
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    const { data: inboundTicket, refetch: refetchTicket } = useInboundTicket(numericId);
    const order = useMemo(() => {
        if (inboundTicket?.id === numericId) return inboundTicket;
        return staffOrders?.find((t) => t.id === numericId) ?? null;
    }, [inboundTicket, staffOrders, numericId]);
    const error = !isLoading && !order;
    const { data: recommendationItems = [], isLoading: recommendationsLoading, refetch: refetchRecs } = useInboundStorageRecommendations(order?.id);

    const normalizeBinCode = (value?: string | null) => (value || '').trim().toLowerCase();

    const updateItems = useUpdateInboundTicketItems();
    const recommendationByItemId = useMemo(() => {
        const map = new Map<number, InboundItemStorageRecommendations>();
        recommendationItems.forEach((item) => {
            map.set(item.inboundOrderItemId, item);
        });
        return map;
    }, [recommendationItems]);

    const recommendedBinCodes = useMemo(() => {
        const bins = recommendationItems
            .flatMap((item) => item.storageRecommendations || [])
            .map((recommendation) => recommendation.binIdCode)
            .filter((binCode): binCode is string => !!binCode);
        return Array.from(new Set(bins));
    }, [recommendationItems]);

    const warehouseId = useMemo(() => order?.warehouse?.id || order?.warehouseId, [order]);
    const { data: warehouseStructure, refetch: refetchStructure } = useWarehouseStructure(warehouseId);

    const openWarehouseForItem = (item: InboundOrderItem) => {
        const bins = recommendationByItemId
            .get(item.id)
            ?.storageRecommendations
            ?.map((recommendation) => recommendation.binIdCode)
            .filter((binCode): binCode is string => !!binCode) || [];

        router.push({
            pathname: '/warehouse-view',
            params: {
                warehouseId: String(order?.warehouse?.id || order?.warehouseId || ''),
                inboundOrderId: String(order?.id || ''),
                focusedBins: bins.join(','),
                focusedItemId: String(item.id),
                focusedItemName: item.name || item.product?.name || `SP #${item.productId}`,
            },
        } as any);
    };

    const stagedTickets = useInboundStagingStore((state) => state.tickets);
    const getItemStagedQuantity = useInboundStagingStore((state) => state.getItemStagedQuantity);
    const getItemStagedBins = useInboundStagingStore((state) => state.getItemStagedBins);
    const clearStagedTicket = useInboundStagingStore((state) => state.clearTicket);

    const getReceivedQuantity = React.useCallback((item: InboundOrderItem) => {
        if (!order?.id) return Number(item.receivedQuantity || 0);
        const expected = Math.max(0, Number(item.expectedQuantity ?? 0));
        const baseReceived = Number(item.receivedQuantity ?? 0);
        const stagedReceived = Number(getItemStagedQuantity(order.id, item.id) || 0);
        const total = baseReceived + stagedReceived;
        return expected > 0 ? Math.min(total, expected) : total;
    }, [order?.id, getItemStagedQuantity, stagedTickets]);

    const isItemReceivedEnough = React.useCallback((item: InboundOrderItem) => {
        const expected = Math.max(0, Number(item.expectedQuantity ?? 0));
        if (expected <= 0) return false;
        const actualReceived = getReceivedQuantity(item);
        return actualReceived >= expected;
    }, [getReceivedQuantity]);

    const handleRefresh = async () => {
        await Promise.all([
            refetchOrders(),
            numericId > 0 ? refetchTicket() : Promise.resolve(undefined),
            refetchRecs(),
            refetchStructure(),
        ]);
    };

    useFocusEffect(
        React.useCallback(() => {
            void Promise.all([
                refetchOrders(),
                numericId > 0 ? refetchTicket() : Promise.resolve(),
                refetchRecs(),
                refetchStructure(),
            ]);
        }, [numericId, refetchOrders, refetchTicket, refetchRecs, refetchStructure])
    );

    const isCompleted = order?.status === 'Completed';
    const [isConfirming, setIsConfirming] = useState(false);

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title={t('common.loading')} />
            </View>
        );
    }

    if (!order || error) {
        return (
            <View style={styles.container}>
                <ScreenHeader title={t('common.error')} />
                <View style={styles.centered}>
                    <Feather name="alert-circle" size={48} color={COLORS.danger} />
                    <Text style={styles.errorText}>{t('common.noData')}</Text>
                    <TouchableOpacity style={styles.backButton} onPress={goBack}>
                        <Text style={styles.backButtonText}>{t('common.back')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const allItemsReceived = order?.inboundOrderItems?.every(
        (item: InboundOrderItem) => isItemReceivedEnough(item)
    ) ?? false;

    const handleConfirmComplete = async () => {
        if (!order || !user) return;

        AlertService.confirm(
            t('inbound.confirmComplete'),
            t('inbound.confirmCompleteMsg'),
            async () => {
                setIsConfirming(true);
                try {
                    const updatedItems = order.inboundOrderItems.map((item: InboundOrderItem) => {
                        const baseReceived = Math.max(0, Number(item.receivedQuantity || 0));
                        const stagedBins = getItemStagedBins(order.id, item.id);
                        const locations = Object.entries(stagedBins)
                            .map(([binId, qty]) => ({ binId: String(binId), quantity: Math.max(0, Number(qty || 0)) }))
                            .filter((loc) => loc.quantity > 0);
                        
                        const currentSessionStagedTotal = locations.reduce((sum, loc) => sum + loc.quantity, 0);
                        const finalReceived = baseReceived + currentSessionStagedTotal;

                        return {
                            id: item.id,
                            productId: item.productId || 0,
                            expectedQuantity: item.expectedQuantity,
                            receivedQuantity: finalReceived,
                            locations: locations.length > 0 ? locations : undefined,
                        };
                    });

                    await updateItems.mutateAsync({
                        ticketId: order.id,
                        items: updatedItems,
                    });

                    clearStagedTicket(order.id);

                    AlertService.success(t('common.success'), t('inbound.successMsg'), () => {
                        goBack();
                    });
                } catch {
                    AlertService.error(t('common.error'), t('common.failed'));
                } finally {
                    setIsConfirming(false);
                }
            }
        );
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title={t('inbound.ticketTitle')}
                subtitle={order.referenceCode || `INB-${order.id}`}
            />

            <RefreshContainer 
                style={styles.content} 
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
                onRefresh={handleRefresh}
            >
                <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Feather name="truck" size={16} color={COLORS.textMuted} />
                        <Text style={styles.infoText}>{t('inbound.supplier')}: <Text style={styles.boldText}>{order.supplier?.name || 'N/A'}</Text></Text>
                    </View>
                    {order.referenceCode && (
                        <View style={styles.infoRow}>
                            <Feather name="file-text" size={16} color={COLORS.textMuted} />
                            <Text style={styles.infoText}>Reference Code: <Text style={styles.boldText}>{order.referenceCode}</Text></Text>
                        </View>
                    )}
                </Card>

                <Card style={styles.recommendationCard}>
                    <View style={styles.recommendationHeader}>
                        <Feather name="map-pin" size={16} color={COLORS.primary} />
                        <Text style={styles.recommendationTitle}>{t('inbound.recommendations')}</Text>
                    </View>

                    {recommendationsLoading ? (
                        <Text style={styles.recommendationSubtle}>{t('common.loading')}</Text>
                    ) : recommendedBinCodes.length === 0 ? (
                        <Text style={styles.recommendationSubtle}>{t('common.noData')}</Text>
                    ) : (
                        <>
                            {order.inboundOrderItems.map((item: InboundOrderItem) => {
                                const topRecommendation = recommendationByItemId.get(item.id)?.storageRecommendations?.[0];
                                if (!topRecommendation?.binIdCode) return null;

                                return (
                                    <View key={`inbound-recommendation-${item.id}`} style={styles.recommendationItem}>
                                        <Text style={styles.recommendationProduct} numberOfLines={1}>
                                            {item.name || item.product?.name || `SP #${item.productId}`}
                                        </Text>
                                        <Text style={styles.recommendationBin}>{topRecommendation.binIdCode}</Text>
                                    </View>
                                );
                            })}
                        </>
                    )}
                </Card>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('outbound.productList')}</Text>
                    <Text style={styles.sectionSubtitle}>{order.inboundOrderItems.length} {t('tabs.tasks').toLowerCase()}</Text>
                </View>

                {order.inboundOrderItems.map((item: InboundOrderItem) => (
                    <Card key={item.id} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.productName}>{item.name || item.product?.name || `Product #${item.productId}`}</Text>
                                <Text style={styles.skuText}>SKU: {item.sku || item.product?.sku || 'N/A'}</Text>
                            </View>
                            <View style={[styles.statusBadge, {
                                backgroundColor: (isCompleted || isItemReceivedEnough(item)) ? COLORS.success + '20' : COLORS.warning + '20'
                            }]}>
                                <Text style={[styles.statusBadgeText, {
                                    color: (isCompleted || isItemReceivedEnough(item)) ? COLORS.success : COLORS.warning
                                }]}>
                                    {(isCompleted || isItemReceivedEnough(item)) ? t('common.done') : t('common.pending')}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.counterRow}>
                            <Text style={styles.qtyLabel}>{t('inbound.receivedQty')}</Text>
                            <View style={styles.qtyDisplay}>
                                <Text style={[
                                    styles.qtyValue, 
                                    isCompleted && { color: COLORS.success },
                                    isItemReceivedEnough(item) && !isCompleted && { color: COLORS.success }
                                ]}>
                                    {getReceivedQuantity(item)}
                                </Text>
                                <Text style={styles.qtyTotal}>/ {item.expectedQuantity || 0}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.itemActionButton}
                            onPress={() => openWarehouseForItem(item)}
                        >
                            <Feather name="map-pin" size={14} color={COLORS.primary} />
                            <Text style={styles.itemActionText}>
                                {(() => {
                                    const hasRecommendation = (recommendationByItemId.get(item.id)?.storageRecommendations?.length ?? 0) > 0;
                                    const isItemCompleted = isCompleted || isItemReceivedEnough(item);

                                    if (isItemCompleted) {
                                        return hasRecommendation
                                            ? t('inbound.viewShelfRec') || 'View shelf locations for this product'
                                            : t('inbound.viewShelf') || 'View shelf locations';
                                    }

                                    return hasRecommendation
                                        ? t('inbound.viewShelfSuggested') || 'View suggested shelf for this product'
                                        : t('inbound.viewShelfStore') || 'View shelf to store';
                                })()}
                            </Text>
                        </TouchableOpacity>
                    </Card>
                ))}
            </RefreshContainer>

            {isCompleted ? (
                <View style={[styles.footer, { paddingBottom: getBottomSafePadding(insets.bottom, 20) }]}>
                    <View style={[styles.completedBanner, { flex: 1 }]}>
                        <Feather name="check-circle" size={20} color={COLORS.success} />
                        <Text style={styles.completedBannerText}>{t('outbound.orderCompleted')}</Text>
                    </View>
                </View>
            ) : (
                <View style={[styles.footer, { paddingBottom: getBottomSafePadding(insets.bottom, 20) }]}>
                    <TouchableOpacity
                        style={[
                            styles.confirmBtn, 
                            (isConfirming || !allItemsReceived) && styles.disabledBtn,
                            !allItemsReceived && { backgroundColor: COLORS.slate300, shadowOpacity: 0, elevation: 0 }
                        ]}
                        onPress={handleConfirmComplete}
                        disabled={isConfirming || !allItemsReceived}
                        activeOpacity={0.8}
                    >
                        <Feather 
                            name={allItemsReceived ? "check-circle" : "lock"} 
                            size={20} 
                            color={allItemsReceived ? "#fff" : COLORS.slate500} 
                        />
                        <Text 
                            style={[styles.confirmBtnText, !allItemsReceived && { color: COLORS.slate500 }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {isConfirming ? t('common.loading') : allItemsReceived ? t('inbound.confirmComplete') : t('inbound.notEnoughQty')}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        backgroundColor: '#fff',
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    infoCard: {
        marginBottom: 20,
        backgroundColor: '#fff',
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    boldText: {
        fontWeight: '600',
        color: COLORS.text,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    itemCard: {
        marginBottom: 12,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    itemInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    skuText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    counterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    qtyLabel: {
        fontSize: 14,
        color: COLORS.text,
    },
    counter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        padding: 4,
    },
    counterBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    qtyDisplay: {
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingHorizontal: 16,
        minWidth: 80,
        justifyContent: 'center',
    },
    qtyValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    qtyTotal: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginLeft: 4,
    },
    itemActionButton: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 10,
        paddingVertical: 10,
        backgroundColor: COLORS.primary + '10',
    },
    itemActionText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '700',
    },
    businessLogicSection: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dataGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    dataField: {
        flex: 1,
    },
    dataLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginBottom: 6,
    },
    dataInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 13,
        color: COLORS.text,
    },
    qcOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    qcOption: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    qcOptionActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10',
    },
    qcOptionActiveDanger: {
        borderColor: COLORS.danger,
        backgroundColor: COLORS.danger + '10',
    },
    qcOptionText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    qcOptionTextActive: {
        color: COLORS.primary,
    },
    qcOptionTextActiveDanger: {
        color: COLORS.danger,
    },
    scanItemBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
        backgroundColor: COLORS.primary + '08',
    },
    scanItemBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        flexDirection: 'row',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    reportBtn: {
        width: 56,
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.danger + '30',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.danger + '05',
    },
    reportBtnText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.danger,
        marginTop: 2,
    },
    saveBtn: {
        flex: 1,
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textLight,
    },
    confirmBtn: {
        flex: 1,
        height: 56,
        backgroundColor: COLORS.success,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    disabledBtn: {
        opacity: 0.6,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: COLORS.textMuted,
        marginTop: 12,
        marginBottom: 24,
        textAlign: 'center',
    },
    backButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    priceText: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    discountText: {
        fontSize: 13,
        color: COLORS.success,
        fontWeight: '600',
    },
    completedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 56,
        backgroundColor: COLORS.success + '15',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.success + '30',
    },
    completedBannerText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.success,
    },

    recommendationCard: {
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    recommendationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    recommendationTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },
    recommendationSubtle: {
        fontSize: 13,
        color: COLORS.textMuted,
        lineHeight: 18,
    },
    recommendationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    recommendationProduct: {
        flex: 1,
        marginRight: 10,
        fontSize: 13,
        color: COLORS.text,
        fontWeight: '600',
    },
    recommendationBin: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '700',
        backgroundColor: COLORS.primary + '12',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
});
