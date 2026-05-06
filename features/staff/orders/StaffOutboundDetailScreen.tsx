import { Card, RefreshContainer, ScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useOutboundOrder, useUpdateOutboundTicketItems } from '@/hooks';
import { useAppBack } from '@/hooks/useAppBack';
import { useTranslation } from '@/hooks/useTranslation';
import { AlertService } from '@/stores/alert.store';
import type { OutboundOrderItem } from '@/types/outbound-order';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StaffOutboundDetailScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const goBack = useAppBack('/(staff-tabs)/tasks');
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data: order, isLoading, error, refetch } = useOutboundOrder(id);

    const handleRefresh = async () => {
        await refetch();
    };
    const updateItems = useUpdateOutboundTicketItems();

    const [localQuantities, setLocalQuantities] = useState<Record<number, number>>({});
    const [verifiedItems, setVerifiedItems] = useState<Record<number, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Normalize items list (handle both items and outboundOrderItems)
    const orderItems = React.useMemo(() => {
        return order?.items || order?.outboundOrderItems || [];
    }, [order]);

    // Initialize state when order data is loaded
    useEffect(() => {
        if (orderItems.length > 0) {
            setLocalQuantities(prev => {
                // If already initialized for this order, don't reset
                if (Object.keys(prev).length > 0) return prev;

                const initialQty: Record<number, number> = {};
                orderItems.forEach((item: OutboundOrderItem) => {
                    initialQty[item.id] = 0;
                });
                return initialQty;
            });
        }
    }, [orderItems]);

    // Sort items by product name
    const sortedItems = React.useMemo(() => {
        return [...orderItems].sort((a, b) => {
            const nameA = a.product?.name || a.productName || '';
            const nameB = b.product?.name || b.productName || '';
            return nameA.localeCompare(nameB);
        });
    }, [orderItems]);

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
                    <Text style={styles.errorText}>{t('common.orderNotFound')}</Text>
                    <TouchableOpacity style={styles.backButton} onPress={goBack}>
                        <Text style={styles.backButtonText}>{t('common.back')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const handleVerifyItem = (itemId: number) => {
        setIsSaving(true);
        // Simulate scanning delay
        setTimeout(() => {
            setIsSaving(false);
            setVerifiedItems(prev => ({ ...prev, [itemId]: true }));
            AlertService.success(t('common.success'), t('outbound.productVerified'));
        }, 600);
    };

    const handleUpdateQty = (itemId: number, increment: boolean) => {
        if (!verifiedItems[itemId]) {
            AlertService.warning(t('common.noticeTitle'), t('outbound.scanToVerifyMsg'));
            return;
        }
        setLocalQuantities(prev => {
            const current = prev[itemId] || 0;
            const item = orderItems.find((i: OutboundOrderItem) => i.id === itemId);
            const maxQty = item?.quantity || 9999;
            const newValue = increment
                ? Math.min(current + 1, maxQty)
                : Math.max(current - 1, 0);
            return { ...prev, [itemId]: newValue };
        });
    };

    const handleSave = async () => {
        if (!order) return;
        setIsSaving(true);
        try {
            // Update items with picked quantities
            const updatedItems = orderItems.map((item: OutboundOrderItem) => ({
                id: item.id,
                productId: item.productId || 0,
                quantity: localQuantities[item.id] ?? item.quantity ?? 0,
            }));

            // Check if all items picked
            const allPicked = orderItems.every((item: OutboundOrderItem) =>
                (localQuantities[item.id] || 0) >= (item.quantity || 0)
            );

            await updateItems.mutateAsync({
                ticketId: order.id,
                items: updatedItems,
            });

            AlertService.success(t('common.success'), allPicked ? t('outbound.pickingCompleted') : t('outbound.pickingUpdated'), () => {
                goBack();
            });
        } catch {
            AlertService.error(t('common.error'), t('outbound.updateQuantityFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title={t('tasks.outbound')}
                subtitle={order.note || `OUT-${order.id}`}
            />

            <RefreshContainer 
                style={styles.content} 
                contentContainerStyle={styles.scrollContent}
                onRefresh={handleRefresh}
            >
                <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Feather name="user" size={16} color={COLORS.textMuted} />
                        <Text style={styles.infoText}>{t('tasks.createdBy')}: <Text style={styles.boldText}>{order.createdByNavigation?.email || t('common.notAvailable')}</Text></Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Feather name="map-pin" size={16} color={COLORS.textMuted} />
                        <Text style={styles.infoText}>{t('tasks.destination')}: <Text style={styles.boldText}>{order.destination || t('common.notAvailable')}</Text></Text>
                    </View>
                </Card>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('outbound.productList')}</Text>
                    <Text style={styles.sectionSubtitle}>{orderItems.length} {t('common.items')}</Text>
                </View>

                {sortedItems.map((item: OutboundOrderItem) => {
                    const cardStyle = verifiedItems[item.id]
                        ? StyleSheet.flatten([styles.itemCard, styles.itemCardVerified])
                        : styles.itemCard;

                    return (
                        <Card key={item.id} style={cardStyle}>
                            <View style={styles.itemHeader}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.productName}>{item.product?.name || `${t('common.product')} #${item.productId}`}</Text>
                                    <View style={styles.skuRow}>
                                        <View style={styles.skuBadge}>
                                            <Text style={styles.skuText}>{t('common.sku')}: {item.product?.sku || t('common.notAvailable')}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={[styles.statusBadge, {
                                    backgroundColor: (localQuantities[item.id] || 0) >= (item.quantity || 0) ? '#D1FAE5' : '#FEF3C7'
                                }]}>
                                    <Text style={[styles.statusBadgeText, {
                                        color: (localQuantities[item.id] || 0) >= (item.quantity || 0) ? '#059669' : '#D97706'
                                    }]}>
                                        {(localQuantities[item.id] || 0) >= (item.quantity || 0) ? t('common.done') : t('common.pending')}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.counterRow}>
                                <View style={styles.qtyLabelContainer}>
                                    <Text style={styles.qtyLabel}>{t('outbound.pickedQty')}</Text>
                                    {!verifiedItems[item.id] && (
                                        <Text style={styles.verificationPrompt}>{t('outbound.scanToVerifyMsg')}</Text>
                                    )}
                                </View>
                                <View style={[styles.counter, !verifiedItems[item.id] && styles.disabledCounter]}>
                                    <TouchableOpacity
                                        style={styles.counterBtn}
                                        onPress={() => handleUpdateQty(item.id, false)}
                                        disabled={!verifiedItems[item.id]}
                                    >
                                        <Feather name="minus" size={20} color={verifiedItems[item.id] ? COLORS.primary : COLORS.border} />
                                    </TouchableOpacity>
                                    <View style={styles.qtyDisplay}>
                                        <Text style={[styles.qtyValue, !verifiedItems[item.id] && { color: COLORS.border }]}>
                                            {localQuantities[item.id] || 0}
                                        </Text>
                                        <Text style={styles.qtyTotal}>/ {item.quantity || 0}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.counterBtn}
                                        onPress={() => handleUpdateQty(item.id, true)}
                                        disabled={!verifiedItems[item.id]}
                                    >
                                        <Feather name="plus" size={20} color={verifiedItems[item.id] ? COLORS.primary : COLORS.border} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.scanItemBtn, verifiedItems[item.id] && styles.scanItemBtnSuccess]}
                                onPress={() => handleVerifyItem(item.id)}
                                disabled={verifiedItems[item.id] || isSaving}
                            >
                                <Feather name={verifiedItems[item.id] ? "check-circle" : "maximize"} size={16} color={verifiedItems[item.id] ? "#059669" : COLORS.primary} />
                                <Text style={[styles.scanItemBtnText, verifiedItems[item.id] && { color: '#059669' }]}>
                                    {verifiedItems[item.id] ? t('outbound.productVerified') : t('outbound.verifyScan')}
                                </Text>
                            </TouchableOpacity>
                        </Card>
                    );
                })}
            </RefreshContainer>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveBtn, isSaving && styles.disabledBtn]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <Text style={styles.saveBtnText}>
                        {isSaving ? t('common.loading') : t('outbound.finishPicking')}
                    </Text>
                </TouchableOpacity>
            </View>
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
        marginBottom: 16,
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
    actionRow: {
        marginBottom: 20,
    },
    pathBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    pathBtnText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#fff',
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
        marginBottom: 6,
    },
    skuRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skuBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    skuText: {
        fontSize: 11,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    locationText: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: 'bold',
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
    qtyLabelContainer: {
        flex: 1,
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

    saveBtn: {
        flex: 1,
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemCardVerified: {
        borderColor: '#059669',
        borderWidth: 1,
    },
    verificationPrompt: {
        fontSize: 11,
        color: COLORS.danger,
        fontWeight: 'bold',
        marginTop: 2,
    },
    disabledCounter: {
        opacity: 0.5,
    },
    scanItemBtnSuccess: {
        backgroundColor: '#05966910',
        borderColor: '#059669',
    },
    saveBtnText: {
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
});
