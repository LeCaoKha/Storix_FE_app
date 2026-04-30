import { Card, RefreshContainer, ScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useInboundOrdersByStaff, useInboundTicket, useUpdateInboundTicketItems } from '@/hooks';
import { useAppBack } from '@/hooks/useAppBack';
import { useTranslation } from '@/hooks/useTranslation';
import { AlertService } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import type { InboundOrderItem } from '@/types/inbound-order';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function StaffInboundDetailScreen() {
    const { t } = useTranslation();
    const { id, from } = useLocalSearchParams<{ id: string; from?: string | string[] }>();
    const user = useAuthStore((state) => state.user);
    const companyId = user?.companyId ?? 0;
    const staffId = user?.id ?? 0;
    const orderId = parseInt(id || '0', 10);
    const fromPath = Array.isArray(from) ? from[0] : from;
    const goBack = useAppBack(fromPath || '/(staff-tabs)/orders');
    const { data: staffOrders, isLoading, error, refetch: refetchStaffOrders } = useInboundOrdersByStaff(companyId, staffId);
    const { data: inboundTicket, refetch: refetchInboundTicket } = useInboundTicket(orderId);
    const order = useMemo(() => {
        if (inboundTicket?.id === orderId) return inboundTicket;
        return staffOrders?.find((ticket) => ticket.id === orderId) ?? null;
    }, [inboundTicket, staffOrders, orderId]);

    const handleRefresh = async () => {
        await Promise.all([
            refetchStaffOrders(),
            orderId > 0 ? refetchInboundTicket() : Promise.resolve(),
        ]);
    };
    const updateItems = useUpdateInboundTicketItems();
    const [localQuantities, setLocalQuantities] = useState<Record<number, number>>({});
    const [localItemData, setLocalItemData] = useState<Record<number, { batch: string, expiry: string, qc: 'good' | 'damaged' | 'returned' }>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Initialize state when order data is loaded
    useEffect(() => {
        if (order?.inboundOrderItems) {
            const initialQty: Record<number, number> = {};
            const initialData: Record<number, { batch: string, expiry: string, qc: 'good' | 'damaged' | 'returned' }> = {};
            order.inboundOrderItems.forEach((item: InboundOrderItem) => {
                initialQty[item.id] = item.receivedQuantity || 0;
                initialData[item.id] = { batch: '', expiry: '', qc: 'good' };
            });
            setLocalQuantities(initialQty);
            setLocalItemData(initialData);
        }
    }, [order]);

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

    const handleUpdateQty = (itemId: number, increment: boolean) => {
        setLocalQuantities(prev => {
            const current = prev[itemId] || 0;
            const item = order?.inboundOrderItems.find((i: InboundOrderItem) => i.id === itemId);
            const newValue = increment
                ? Math.min(current + 1, item?.expectedQuantity || 9999)
                : Math.max(current - 1, 0);
            return { ...prev, [itemId]: newValue };
        });
    };

    const handleUpdateItemData = (itemId: number, field: string, value: string) => {
        setLocalItemData(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], [field]: value }
        }));
    };

    const handleSave = async () => {
        if (!order) return;
        setIsSaving(true);
        try {
            // Update items with received quantities
            const updatedItems = order.inboundOrderItems.map((item: InboundOrderItem) => ({
                id: item.id,
                productId: item.productId || 0,
                expectedQuantity: item.expectedQuantity,
                receivedQuantity: localQuantities[item.id] || item.receivedQuantity || 0,
            }));

            // Check if all items received
            const allReceived = order.inboundOrderItems.every((item: InboundOrderItem) =>
                (localQuantities[item.id] || 0) >= (item.expectedQuantity || 0)
            );

            await updateItems.mutateAsync({
                ticketId: order.id,
                items: updatedItems,
            });

            AlertService.success(t('common.success'), allReceived ? t('inbound.receiptCompleted') : t('inbound.receiptSaved'), () => {
                goBack();
            });
        } catch {
            AlertService.error(t('common.error'), t('inbound.updateQuantityFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScreenHeader
                title={t('tasks.inbound')}
                subtitle={order.referenceCode || `INB-${order.id}`}
                onBack={goBack}
            />

            <RefreshContainer 
                style={styles.content} 
                contentContainerStyle={styles.scrollContent}
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
                </Card>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('outbound.productList')}</Text>
                    <Text style={styles.sectionSubtitle}>{order.inboundOrderItems.length} {t('common.items')}</Text>
                </View>

                {order.inboundOrderItems.map((item: InboundOrderItem) => (
                    <Card key={item.id} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.productName}>{item.product?.name || `Product #${item.productId}`}</Text>
                                <Text style={styles.skuText}>{t('common.sku')}: {item.product?.sku || t('common.notAvailable')}</Text>
                            </View>
                            <View style={[styles.statusBadge, {
                                backgroundColor: (localQuantities[item.id] || 0) >= (item.expectedQuantity || 0) ? '#D1FAE5' : '#FEF3C7'
                            }]}>
                                <Text style={[styles.statusBadgeText, {
                                    color: (localQuantities[item.id] || 0) >= (item.expectedQuantity || 0) ? '#059669' : '#D97706'
                                }]}>
                                    {(localQuantities[item.id] || 0) >= (item.expectedQuantity || 0) ? t('common.done') : t('common.pending')}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.counterRow}>
                            <Text style={styles.qtyLabel}>{t('inbound.receivedQty')}</Text>
                            <View style={styles.counter}>
                                <TouchableOpacity
                                    style={styles.counterBtn}
                                    onPress={() => handleUpdateQty(item.id, false)}
                                >
                                    <Feather name="minus" size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                                <View style={styles.qtyDisplay}>
                                    <Text style={styles.qtyValue}>{localQuantities[item.id] || 0}</Text>
                                    <Text style={styles.qtyTotal}>/ {item.expectedQuantity || 0}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.counterBtn}
                                    onPress={() => handleUpdateQty(item.id, true)}
                                >
                                    <Feather name="plus" size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Business Logic: Batch & Expiry & QC */}
                        <View style={styles.businessLogicSection}>
                            <View style={styles.dataGrid}>
                                <View style={styles.dataField}>
                                    <Text style={styles.dataLabel}>{t('inbound.batchNumber')}</Text>
                                    <TextInput
                                        style={styles.dataInput}
                                        placeholder={t('inbound.batchNumber')}
                                        value={localItemData[item.id]?.batch}
                                        onChangeText={(v) => handleUpdateItemData(item.id, 'batch', v)}
                                    />
                                </View>
                                <View style={styles.dataField}>
                                    <Text style={styles.dataLabel}>{t('inbound.expiryDate')}</Text>
                                    <TextInput
                                        style={styles.dataInput}
                                        placeholder="DD/MM/YYYY"
                                        value={localItemData[item.id]?.expiry}
                                        onChangeText={(v) => handleUpdateItemData(item.id, 'expiry', v)}
                                    />
                                </View>
                            </View>

                            <Text style={styles.dataLabel}>{t('inbound.qcStatus')}</Text>
                            <View style={styles.qcOptions}>
                                <TouchableOpacity
                                    style={[styles.qcOption, localItemData[item.id]?.qc === 'good' && styles.qcOptionActive]}
                                    onPress={() => handleUpdateItemData(item.id, 'qc', 'good')}
                                >
                                    <Text style={[styles.qcOptionText, localItemData[item.id]?.qc === 'good' && styles.qcOptionTextActive]}>{t('inbound.good')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.qcOption, localItemData[item.id]?.qc === 'damaged' && styles.qcOptionActiveDanger]}
                                    onPress={() => handleUpdateItemData(item.id, 'qc', 'damaged')}
                                >
                                    <Text style={[styles.qcOptionText, localItemData[item.id]?.qc === 'damaged' && styles.qcOptionTextActive]}>{t('inbound.damaged')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.scanItemBtn}>
                            <Feather name="maximize" size={16} color={COLORS.primary} />
                            <Text style={styles.scanItemBtnText}>{t('inbound.scanBarcode')}</Text>
                        </TouchableOpacity>
                    </Card>
                ))}
            </RefreshContainer>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.reportBtn}>
                    <Feather name="alert-triangle" size={20} color={COLORS.danger} />
                    <Text style={styles.reportBtnText}>{t('inbound.reportError')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.saveBtn, isSaving && styles.disabledBtn]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <Text style={styles.saveBtnText}>
                        {isSaving ? t('inbound.saving') : t('inbound.completeReceipt')}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
