import { Card, RefreshContainer, ScreenHeader } from '@/components';
import { getBottomSafePadding } from '@/components/ui/safeArea';
import { COLORS } from '@/constants/color';
import { useInboundOrdersByStaff, useInboundStorageRecommendations, useInboundTicket, useUpdateInboundTicketItems } from '@/hooks';
import { useAppBack } from '@/hooks/useAppBack';
import { useTranslation } from '@/hooks/useTranslation';
import { useWarehouseStructure, useWarehouses } from '@/hooks/warehouse.hooks';
import { getInboundQualityCheckResult } from '@/services/inbound-order.api';
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
    const { refetch: refetchStructure } = useWarehouseStructure(warehouseId);

    const { data: warehouses } = useWarehouses();

    const openWarehouseForItem = (item: InboundOrderItem) => {
        const bins = recommendationByItemId
            .get(item.id)
            ?.storageRecommendations
            ?.map((recommendation) => recommendation.binIdCode)
            .filter((binCode): binCode is string => !!binCode) || [];

        // Resolve warehouseId: prefer order's warehouse, else fallback to first known warehouse
        const resolvedWarehouseId = order?.warehouse?.id || order?.warehouseId || (warehouses && warehouses.length > 0 ? warehouses[0].id : undefined);

        console.log('[DEBUG] openWarehouseForItem -> routing to warehouse-view', {
            resolvedWarehouseId,
            inboundOrderId: order?.id,
            focusedBins: bins,
            focusedItemId: item.id,
            focusedItemName: item.name || item.product?.name,
        });

        router.push({
            pathname: '/warehouse-view',
            params: {
                warehouseId: String(resolvedWarehouseId || ''),
                inboundOrderId: String(order?.id || ''),
                focusedBins: bins.join(','),
                focusedItemId: String(item.id),
                focusedItemName: item.name || item.product?.name || `${t('common.product')} #${item.productId}`,
            },
        } as any);
    };

    const getItemStagedQuantity = useInboundStagingStore((state) => state.getItemStagedQuantity);
    const getItemStagedBins = useInboundStagingStore((state) => state.getItemStagedBins);
    const clearStagedTicket = useInboundStagingStore((state) => state.clearTicket);
    const [qcResults, setQcResults] = useState<Record<number, number>>({});
    const [qcDetails, setQcDetails] = useState<Record<number, { failureReason?: string; notes?: string; failedQuantity?: number }>>({});

    React.useEffect(() => {
        if (order) {
            console.log(`[DEBUG] Inbound Order #${order.id} Status: "${order.status}"`);
        }
    }, [order]);

    const getReceivedQuantity = React.useCallback((item: InboundOrderItem) => {
        if (!order?.id) return Number(item.receivedQuantity || 0);
        // When the ticket is in QUALITY_CHECK, the QC result is the source of truth
        // for how many units can be put away.
        const qcReceived = Number(qcResults[item.id] ?? 0);
        const baseReceived = Math.max(Number(item.receivedQuantity ?? 0), qcReceived);
        const stagedReceived = Number(getItemStagedQuantity(order.id, item.id) || 0);
        const total = baseReceived + stagedReceived;

        const target = qcResults[item.id] !== undefined
            ? Math.max(0, Number(qcResults[item.id] ?? 0))
            : Math.max(0, Number(item.expectedQuantity ?? 0));

        return target > 0 ? Math.min(total, target) : total;
    }, [order?.id, getItemStagedQuantity, qcResults]);

    const isItemReceivedEnough = React.useCallback((item: InboundOrderItem) => {
        const target = qcResults[item.id] !== undefined
            ? Math.max(0, Number(qcResults[item.id] ?? 0))
            : Math.max(0, Number(item.expectedQuantity ?? 0));

        if (target <= 0) return false;
        const actualReceived = getReceivedQuantity(item);
        return actualReceived >= target;
    }, [getReceivedQuantity, qcResults]);

    const workflowSteps = useMemo(
        () => [
            {
                key: 'scan',
                title: t('inbound.workflowStepScanTitle'),
                description: t('inbound.workflowStepScanDesc'),
            },
            {
                key: 'putaway',
                title: t('inbound.workflowStepPutawayTitle'),
                description: t('inbound.workflowStepPutawayDesc'),
            },
            {
                key: 'confirm',
                title: t('inbound.workflowStepConfirmTitle'),
                description: t('inbound.workflowStepConfirmDesc'),
            },
        ],
        [t],
    );

    const workflowStageIndex = useMemo(() => {
        const status = order?.status;
        if (status === 'Completed' || status === 'Partially Completed') return 2;
        if (status === 'QUALITY_CHECK') return 1;
        return 0;
    }, [order?.status]);

    const totalExpectedQuantity = useMemo(
        () => (order?.inboundOrderItems ?? []).reduce(
            (sum, item) => sum + Math.max(0, Number(item.expectedQuantity ?? 0)),
            0,
        ),
        [order?.inboundOrderItems],
    );

    const totalReceivedQuantity = useMemo(
        () => (order?.inboundOrderItems ?? []).reduce(
            (sum, item) => sum + getReceivedQuantity(item),
            0,
        ),
        [order?.inboundOrderItems, getReceivedQuantity],
    );

    const totalRemainingQuantity = Math.max(0, totalExpectedQuantity - totalReceivedQuantity);

    const loadQcResults = React.useCallback(async (orderId: number) => {
        try {
            const res = await getInboundQualityCheckResult(companyId, orderId);
            const map: Record<number, number> = {};
            const detailsMap: Record<number, { failureReason?: string; notes?: string; failedQuantity?: number }> = {};
            res.items.forEach((it) => {
                map[it.inboundOrderItemId] = it.passedQuantity;
                detailsMap[it.inboundOrderItemId] = {
                    failureReason: it.failureReason,
                    notes: it.notes,
                    failedQuantity: it.failedQuantity
                };
            });
            setQcResults(map);
            setQcDetails(detailsMap);
        } catch (err) {
            console.error('Error fetching QC results:', err);
        }
    }, [companyId]);

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

    React.useEffect(() => {
        if (!order?.id) {
            setQcResults({});
            setQcDetails({});
            return;
        }

        if (order.status === 'QUALITY_CHECK' || order.status === 'Partially Completed' || order.status === 'Completed') {
            void loadQcResults(order.id);
            return;
        }

        setQcResults({});
        setQcDetails({});
    }, [order?.id, order?.status, loadQcResults]);

    // Auto-open warehouse modal when navigated from scanner with openWarehouse flag
    const params = useLocalSearchParams<{ openWarehouse?: string }>();
    React.useEffect(() => {
        if (!order || !params?.openWarehouse) return;

        // Find first item that still needs putaway
        const candidate = order.inboundOrderItems?.find((item: InboundOrderItem) => {
            const target = qcResults[item.id] !== undefined ? qcResults[item.id] : Number(item.expectedQuantity ?? 0);
            const already = getItemStagedQuantity(order.id, item.id) || 0;
            return target - already > 0;
        });

        if (candidate) {
            // Clear the openWarehouse flag so that this effect does not re-trigger
            // when returning to InboundDetailScreen from the warehouse view.
            router.setParams({ openWarehouse: '' });

            // Open warehouse-view focused on this item
            openWarehouseForItem(candidate);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order, qcResults, params?.openWarehouse]);

    const isCompleted = order?.status === 'Completed' || order?.status === 'Partially Completed';
    const [isConfirming, setIsConfirming] = useState(false);

    // All items that passed QC must be fully put away (computed before early returns to comply with hook rules)
    const allPutawayCompleted = useMemo(() => {
        if (!order?.inboundOrderItems) return false;
        return order.inboundOrderItems.every((item: InboundOrderItem) => {
            const passed = qcResults[item.id] !== undefined ? Number(qcResults[item.id] ?? 0) : 0;
            if (passed <= 0) return true; // If no items passed QC, it doesn't need putaway

            const stagedBins = getItemStagedBins(order.id, item.id);
            const stagedQty = Object.values(stagedBins || {}).reduce((subSum: number, qty) => subSum + Math.max(0, Number(qty || 0)), 0);

            return stagedQty >= passed;
        });
    }, [order?.inboundOrderItems, order?.id, qcResults, getItemStagedBins]);

    const getStatusInfo = (status?: string) => {
        switch (status) {
            case 'Waiting for payment':
            case 'WAITING_RECEIPT':
                return { label: t('common.pending'), color: COLORS.warning };
            case 'QUALITY_CHECK':
                return { label: t('inbound.qualityCheck'), color: COLORS.primary };
            case 'Partially Completed':
                return { label: t('common.completed'), color: COLORS.success };
            case 'Completed':
                return { label: t('common.completed'), color: COLORS.success };
            default:
                return { label: status || t('common.notAvailable'), color: COLORS.textMuted };
        }
    };

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

    const isQualityCheck = order?.status === 'QUALITY_CHECK';

    const allItemsReceived = order?.inboundOrderItems?.every(
        (item: InboundOrderItem) => isItemReceivedEnough(item)
    ) ?? false;

    const confirmCompleteMessage = (isQualityCheck ? allPutawayCompleted : allItemsReceived)
        ? t('inbound.confirmCompleteMsg')
        : t('inbound.partialPutawayConfirmMsg');

    const handleConfirmComplete = async () => {
        if (!order || !user) return;

        // Check if there are any QC passed quantities
        const totalPassed = order.inboundOrderItems?.reduce((sum: number, item) => sum + (qcResults[item.id] !== undefined ? Number(qcResults[item.id] ?? 0) : 0), 0) ?? 0;

        if (totalPassed > 0) {
            // 1. Check if they have put ANY items in bins at all
            const totalAllocatedAll = order.inboundOrderItems?.reduce((sum: number, item) => {
                const stagedBins = getItemStagedBins(order.id, item.id);
                const stagedQty = Object.values(stagedBins || {}).reduce((subSum: number, qty) => subSum + Math.max(0, Number(qty || 0)), 0);
                return sum + stagedQty;
            }, 0) ?? 0;

            if (totalAllocatedAll === 0) {
                AlertService.error(
                    t('common.error'),
                    t('inbound.noItemsPutawayError')
                );
                return;
            }

            // 2. Check if all received/QC-passed items have been fully put away to bins
            const missingPutawayItem = order.inboundOrderItems?.find((item: InboundOrderItem) => {
                const passedQty = Number(qcResults[item.id] ?? 0);
                if (passedQty <= 0) return false;

                const stagedBins = getItemStagedBins(order.id, item.id);
                const stagedQty = Object.values(stagedBins || {}).reduce((subSum: number, qty) => subSum + Math.max(0, Number(qty || 0)), 0);

                return stagedQty < passedQty;
            });

            if (missingPutawayItem) {
                const passed = Number(qcResults[missingPutawayItem.id] ?? 0);
                const stagedBins = getItemStagedBins(order.id, missingPutawayItem.id);
                const stagedQty = Object.values(stagedBins || {}).reduce((subSum: number, qty) => subSum + Math.max(0, Number(qty || 0)), 0);

                AlertService.error(
                    t('common.error'),
                    t('inbound.putawayMissingError', {
                        name: missingPutawayItem.name || missingPutawayItem.product?.name || `#${missingPutawayItem.productId}`,
                        missing: passed - stagedQty
                    })
                );
                return;
            }
        }

        AlertService.confirm(
            t('inbound.confirmComplete'),
            confirmCompleteMessage,
            async () => {
                setIsConfirming(true);
                try {
                    const updatedItems = order.inboundOrderItems.map((item: InboundOrderItem) => {
                        const baseReceivedFromTicket = Math.max(0, Number(item.receivedQuantity || 0));
                        const baseReceivedFromQc = qcResults[item.id] !== undefined ? Number(qcResults[item.id]) : undefined;
                        const baseReceived = baseReceivedFromQc !== undefined ? Math.max(0, baseReceivedFromQc) : baseReceivedFromTicket;

                        const stagedBins = getItemStagedBins(order.id, item.id);
                        const locations = Object.entries(stagedBins)
                            .map(([binId, qty]) => ({ binId: String(binId), quantity: Math.max(0, Number(qty || 0)) }))
                            .filter((loc) => loc.quantity > 0);

                            // The backend treats the incoming `receivedQuantity` as the desired
                            // total qualified units for the item (i.e., QC passed quantity).
                            // Staged placements are the locations where those units will be stored.
                            // Do NOT add staged amounts on top of QC/persisted receivedQuantity here.
                            const finalReceived = baseReceived;

                            return {
                                id: item.id,
                                productId: item.productId || item.product?.id || 0,
                                expectedQuantity: item.expectedQuantity,
                                receivedQuantity: finalReceived,
                                locations: locations.length > 0 ? locations.map(loc => ({
                                    binId: loc.binId,
                                    quantity: loc.quantity
                                })) : undefined,
                            };
                    });

                    console.log(`[DEBUG] Updating Inbound Ticket #${order.id} with items:`, JSON.stringify(updatedItems, null, 2));

                    await updateItems.mutateAsync({
                        ticketId: order.id,
                        items: updatedItems,
                    });

                    clearStagedTicket(order.id);

                    AlertService.success(t('common.success'), t('inbound.successMsg'));
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
                        <Text style={styles.infoText}>{t('inbound.supplier')}: <Text style={styles.boldText}>{order.supplier?.name || t('common.notAvailable')}</Text></Text>
                    </View>
                    {order.referenceCode && (
                        <View style={styles.infoRow}>
                            <Feather name="file-text" size={16} color={COLORS.textMuted} />
                            <Text style={styles.infoText}>{t('common.referenceCode')}: <Text style={styles.boldText}>{order.referenceCode}</Text></Text>
                        </View>
                    )}
                    <View style={styles.infoRow}>
                        <Feather name="activity" size={16} color={COLORS.textMuted} />
                        <Text style={styles.infoText}>{t('tasks.status')}: </Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusInfo(order.status).color + '20' }]}>
                            <Text style={[styles.statusBadgeText, { color: getStatusInfo(order.status).color }]}>
                                {getStatusInfo(order.status).label}
                            </Text>
                        </View>
                    </View>
                </Card>

                <Card style={styles.workflowCard}>
                    <View style={styles.workflowHeader}>
                        <View style={styles.workflowHeaderLeft}>
                            <Feather name="repeat" size={16} color={COLORS.primary} />
                            <Text style={styles.workflowTitle}>{t('inbound.workflowTitle')}</Text>
                        </View>
                        <View style={styles.workflowBadge}>
                            <Text style={styles.workflowBadgeText}>{`${workflowStageIndex + 1} / ${workflowSteps.length}`}</Text>
                        </View>
                    </View>

                    <Text style={styles.workflowSubtitle}>
                        {workflowSteps[workflowStageIndex]?.description || t('inbound.workflowSubtitle')}
                    </Text>

                    <View style={styles.workflowSteps}>
                        {workflowSteps.map((step, index) => {
                            const isDone = index < workflowStageIndex || isCompleted;
                            const isActive = index === workflowStageIndex && !isCompleted;

                            return (
                                <View key={step.key} style={styles.workflowStepRow}>
                                    <View
                                        style={[
                                            styles.workflowStepIndicator,
                                            isDone && styles.workflowStepIndicatorDone,
                                            isActive && styles.workflowStepIndicatorActive,
                                        ]}
                                    >
                                        {isDone && !isActive ? (
                                            <Feather name="check" size={12} color="#fff" />
                                        ) : (
                                            <Text
                                                style={[
                                                    styles.workflowStepIndicatorText,
                                                    isDone && styles.workflowStepIndicatorTextDone,
                                                    isActive && styles.workflowStepIndicatorTextActive,
                                                ]}
                                            >
                                                {index + 1}
                                            </Text>
                                        )}
                                    </View>

                                    <View style={styles.workflowStepBody}>
                                        <Text style={styles.workflowStepTitle}>{step.title}</Text>
                                        <Text style={styles.workflowStepDescription}>{step.description}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    <View style={styles.workflowStats}>
                        <View style={styles.workflowStatItem}>
                            <Text style={styles.workflowStatLabel}>{t('inbound.workflowSummaryExpected')}</Text>
                            <Text style={styles.workflowStatValue}>{totalExpectedQuantity}</Text>
                        </View>
                        <View style={styles.workflowStatItem}>
                            <Text style={styles.workflowStatLabel}>{t('inbound.workflowSummaryReceived')}</Text>
                            <Text style={styles.workflowStatValue}>{totalReceivedQuantity}</Text>
                        </View>
                        <View style={styles.workflowStatItem}>
                            <Text style={styles.workflowStatLabel}>{t('inbound.workflowSummaryRemaining')}</Text>
                            <Text style={styles.workflowStatValue}>{totalRemainingQuantity}</Text>
                        </View>
                    </View>
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
                                            {item.name || item.product?.name || `${t('common.product')} #${item.productId}`}
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
                    <Text style={styles.sectionSubtitle}>{order.inboundOrderItems.length} {t('common.items')}</Text>
                </View>

                {order.inboundOrderItems.map((item: InboundOrderItem) => {
                    const passedQty = qcResults[item.id] !== undefined ? Number(qcResults[item.id] ?? 0) : 0;
                    const stagedBins = getItemStagedBins(order.id, item.id);
                    const stagedQty = Object.values(stagedBins || {}).reduce((subSum: number, qty) => subSum + Math.max(0, Number(qty || 0)), 0);
                    const isPutawayDone = passedQty > 0 ? stagedQty >= passedQty : true;

                    // Decide what status is displayed
                    const isItemDone = isCompleted ? true : (isQualityCheck ? isPutawayDone : isItemReceivedEnough(item));

                    // Decide what quantities are displayed
                    const qtyValue = isQualityCheck ? stagedQty : getReceivedQuantity(item);
                    const qtyTotal = isQualityCheck ? passedQty : (qcResults[item.id] !== undefined ? qcResults[item.id] : (item.expectedQuantity || 0));

                    // Decide what label is displayed
                    const qtyLabelText = isQualityCheck ? t('inbound.putawayQty') : t('inbound.receivedQty');

                    return (
                        <Card key={item.id} style={styles.itemCard}>
                            <View style={styles.itemHeader}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.productName}>{item.name || item.product?.name || `${t('common.product')} #${item.productId}`}</Text>
                                    {(item.sku || item.product?.sku) && (
                                        <Text style={styles.skuText}>{t('common.sku')}: {item.sku || item.product?.sku}</Text>
                                    )}
                                </View>
                                <View style={[styles.statusBadge, {
                                    backgroundColor: isItemDone ? COLORS.success + '20' : COLORS.warning + '20'
                                }]}>
                                    <Text style={[styles.statusBadgeText, {
                                        color: isItemDone ? COLORS.success : COLORS.warning
                                    }]}>
                                        {isItemDone ? t('common.done') : t('common.pending')}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.counterRow}>
                                <Text style={styles.qtyLabel}>{qtyLabelText}</Text>
                                <View style={styles.qtyDisplay}>
                                    <Text style={[
                                        styles.qtyValue,
                                        isCompleted && { color: COLORS.success },
                                        isItemDone && !isCompleted && { color: COLORS.success }
                                    ]}>
                                        {qtyValue}
                                    </Text>
                                    <Text style={styles.qtyTotal}>
                                        / {qtyTotal}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.itemActionButton,
                                    // disable visually when item hasn't been scanned/received yet (or has 0 QC passed qty in quality check phase)
                                    (isQualityCheck ? passedQty <= 0 : getReceivedQuantity(item) <= 0) && styles.disabledActionButton,
                                ]}
                                onPress={() => {
                                    const itemScanned = isQualityCheck ? passedQty > 0 : getReceivedQuantity(item) > 0;
                                    if (!itemScanned) {
                                        // block putaway if not scanned
                                        AlertService.error(t('common.error'), t('inbound.scanToVerifyMsg'));
                                        return;
                                    }

                                    openWarehouseForItem(item);
                                }}
                            >
                                <Feather name="map-pin" size={14} color={COLORS.primary} />
                                <Text style={[styles.itemActionText, (isQualityCheck ? passedQty <= 0 : getReceivedQuantity(item) <= 0) && styles.disabledActionText]}>
                                    {(() => {
                                        const hasRecommendation = (recommendationByItemId.get(item.id)?.storageRecommendations?.length ?? 0) > 0;

                                        if (isItemDone) {
                                            return hasRecommendation
                                                ? t('inbound.viewShelfRec')
                                                : t('inbound.viewShelf');
                                        }

                                        return hasRecommendation
                                            ? t('inbound.viewShelfSuggested')
                                            : t('inbound.viewShelfStore');
                                    })()}
                                </Text>
                            </TouchableOpacity>

                            {/* Hiển thị lý do lỗi & ghi chú QC (nếu có) */}
                            {(() => {
                                const detail = qcDetails[item.id];
                                if (!detail) return null;

                                const hasReason = !!detail.failureReason;
                                const hasNote = !!detail.notes;
                                const hasFailedQty = Number(detail.failedQuantity ?? 0) > 0;

                                if (!hasReason && !hasNote && !hasFailedQty) return null;

                                return (
                                    <View style={styles.reviewQCDetailContainer}>
                                        {hasFailedQty && (
                                            <View style={styles.reviewQCDetailRow}>
                                                <Feather name="alert-triangle" size={14} color={COLORS.danger} />
                                                <Text style={styles.reviewQCDetailText}>
                                                    <Text style={{ fontWeight: '700', color: COLORS.danger }}>{t('inbound.failedQty')}:</Text> {detail.failedQuantity}
                                                </Text>
                                            </View>
                                        )}
                                        {hasReason && (
                                            <View style={styles.reviewQCDetailRow}>
                                                <Feather name="info" size={14} color={COLORS.textMuted} />
                                                <Text style={styles.reviewQCDetailText}>
                                                    <Text style={{ fontWeight: '700' }}>{t('inbound.failureReason')}:</Text> {detail.failureReason}
                                                </Text>
                                            </View>
                                        )}
                                        {hasNote && (
                                            <View style={styles.reviewQCDetailRow}>
                                                <Feather name="edit-3" size={14} color={COLORS.textMuted} />
                                                <Text style={styles.reviewQCDetailText}>
                                                    <Text style={{ fontWeight: '700' }}>{t('inbound.notes')}:</Text> {detail.notes}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            })()}
                        </Card>
                    );
                })}
            </RefreshContainer>

            {isCompleted ? (
                <View style={[styles.footer, { paddingBottom: getBottomSafePadding(insets.bottom, 12) }]}>
                    <View style={[styles.completedBanner, { flex: 1 }]}>
                        <Feather name="check-circle" size={20} color={COLORS.success} />
                        <Text style={styles.completedBannerText}>{t('outbound.orderCompleted')}</Text>
                    </View>
                </View>
            ) : (
                <View style={[styles.footer, { paddingBottom: getBottomSafePadding(insets.bottom, 12) }]}>
                    {(order.status === 'Waiting for payment' || order.status === 'WAITING_RECEIPT') ? (
                        <TouchableOpacity
                            style={styles.scanModeBtn}
                            onPress={() => router.push({
                                pathname: '/(tabs)/tasks/inbound/scan/[id]',
                                params: { id: String(order.id) }
                            } as any)}
                        >
                            <Feather name="maximize" size={20} color="#fff" />
                            <Text style={styles.confirmBtnText}>{t('inbound.startBarcodeFlow')}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.confirmBtn,
                                (isConfirming || (isQualityCheck && !allPutawayCompleted)) && styles.disabledBtn,
                            ]}
                            onPress={handleConfirmComplete}
                            disabled={isConfirming || (isQualityCheck && !allPutawayCompleted)}
                            activeOpacity={0.8}
                        >
                            <Feather
                                name={(isQualityCheck ? allPutawayCompleted : allItemsReceived) ? "check-circle" : "arrow-right"}
                                size={20}
                                color="#fff"
                            />
                            <Text
                                style={styles.confirmBtnText}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                            >
                                {isConfirming
                                    ? t('common.loading')
                                    : (isQualityCheck ? allPutawayCompleted : allItemsReceived)
                                        ? t('inbound.confirmComplete')
                                        : t('inbound.continuePutaway')}
                            </Text>
                        </TouchableOpacity>
                    )}
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
    disabledActionButton: {
        opacity: 0.6,
        borderColor: COLORS.slate300,
        backgroundColor: COLORS.slate300 + '08',
    },
    itemActionText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '700',
    },
    disabledActionText: {
        color: COLORS.slate500,
    },
    workflowCard: {
        marginBottom: 20,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    workflowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    workflowHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    workflowTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },
    workflowBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: COLORS.primary + '12',
    },
    workflowBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.primary,
    },
    workflowSubtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginBottom: 14,
        lineHeight: 18,
    },
    workflowSteps: {
        gap: 12,
        marginBottom: 16,
    },
    workflowStepRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    workflowStepIndicator: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        marginTop: 1,
    },
    workflowStepIndicatorActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
    },
    workflowStepIndicatorDone: {
        borderColor: COLORS.success,
        backgroundColor: COLORS.success,
    },
    workflowStepIndicatorText: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.textMuted,
    },
    workflowStepIndicatorTextActive: {
        color: '#fff',
    },
    workflowStepIndicatorTextDone: {
        color: '#fff',
    },
    workflowStepBody: {
        flex: 1,
    },
    workflowStepTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 2,
    },
    workflowStepDescription: {
        fontSize: 12,
        color: COLORS.textMuted,
        lineHeight: 17,
    },
    workflowStats: {
        flexDirection: 'row',
        gap: 10,
    },
    workflowStatItem: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    workflowStatLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    workflowStatValue: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
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
        paddingHorizontal: 16,
        paddingTop: 12,
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
    scanModeBtn: {
        flex: 1,
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
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
    reviewQCDetailContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 6,
    },
    reviewQCDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reviewQCDetailText: {
        fontSize: 12,
        color: COLORS.text,
        flex: 1,
    },
});

