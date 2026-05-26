import { Button, Card, Input, RefreshContainer, ScreenHeader } from '@/components';
import { getBottomSafePadding } from '@/components/ui/safeArea';
import { COLORS } from '@/constants/color';
import { useInboundTicket } from '@/hooks';
import { useAppBack } from '@/hooks/useAppBack';
import { useTranslation } from '@/hooks/useTranslation';
import { submitInboundQualityCheck } from '@/services/inbound-order.api';
import { AlertService } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { InboundOrderItem, QualityCheckItemRequest } from '@/types/inbound-order';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InboundQualityCheckScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const goBack = useAppBack();
    const user = useAuthStore((state) => state.user);
    const { t } = useTranslation();
    
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    const { data: order, isLoading, refetch } = useInboundTicket(numericId);
    
    const [qcItems, setQcItems] = useState<Record<number, QualityCheckItemRequest>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (order) {
            console.log(`[DEBUG] QC Screen - Order #${order.id} Status: "${order.status}"`);
        }
    }, [order?.id, order?.status]);

    useEffect(() => {
        if (order && order.status === 'QUALITY_CHECK') {
            router.replace({
                pathname: '/(tabs)/tasks/inbound/[id]',
                params: { id: String(order.id) },
            } as any);
        }
    }, [order, router]);

    useEffect(() => {
        if (order?.inboundOrderItems) {
            const initialQc: Record<number, QualityCheckItemRequest> = {};
            order.inboundOrderItems.forEach((item: InboundOrderItem) => {
                initialQc[item.id] = {
                    inboundOrderItemId: item.id,
                    productId: item.productId,
                    receivedQuantity: item.expectedQuantity || 0,
                    passedQuantity: item.expectedQuantity || 0,
                    failureReason: '',
                    notes: '',
                };
            });
            setQcItems(initialQc);
        }
    }, [order]);

    const updateQcItem = (itemId: number, fields: Partial<QualityCheckItemRequest>) => {
        setQcItems(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], ...fields }
        }));
    };

    const handleConfirm = async () => {
        if (!user || !order) return;

        // Validation
        const items = Object.values(qcItems);
        const invalidItem = items.find(item => item.passedQuantity > item.receivedQuantity);
        
        if (invalidItem) {
            AlertService.error(t('common.error'), t('inbound.notEnoughPassed'));
            return;
        }

        setIsSubmitting(true);
        console.log(`[DEBUG] Submitting QC for Order #${order.id} (Current Status: "${order.status}")`);
        try {
            await submitInboundQualityCheck(order.id, {
                inspectedBy: user.id,
                items: items,
            });

            AlertService.success(t('common.success'), t('inbound.qcSuccess'));
            
            // Navigate to Detail Screen
            router.replace({
                pathname: '/(tabs)/tasks/inbound/[id]',
                params: { id: String(order.id) },
            } as any);
        } catch (error) {
            console.error('QC Submit Error:', error);
            AlertService.error(t('common.error'), t('inbound.qcError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.centered}>
                <Text>{t('common.noData')}</Text>
                <Button title={t('common.back')} onPress={goBack} style={{ marginTop: 20 }} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader 
                title={t('inbound.qualityCheck')} 
                subtitle={order.referenceCode || `INB-${order.id}`}
            />

            <RefreshContainer 
                style={styles.content}
                onRefresh={async () => { await refetch(); }}
                contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
            >
                <View style={styles.headerInfo}>
                    <Text style={styles.subtitle}>{t('inbound.qualityCheckSubtitle')}</Text>
                </View>

                {order.inboundOrderItems.map((item: InboundOrderItem) => {
                    const qc = qcItems[item.id];
                    if (!qc) return null;

                    const failedQty = Math.max(0, qc.receivedQuantity - qc.passedQuantity);

                    return (
                        <Card key={item.id} style={styles.itemCard}>
                            <View style={styles.itemHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.productName}>{item.name || item.product?.name}</Text>
                                    <Text style={styles.skuText}>{t('common.sku')}: {item.sku || item.product?.sku}</Text>
                                </View>
                                <View style={styles.expectedBadge}>
                                    <Text style={styles.expectedText}>{t('common.expectedQty')}: {item.expectedQuantity}</Text>
                                </View>
                            </View>

                            <View style={styles.inputGrid}>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>{t('inbound.qcReceivedQty')}</Text>
                                    <Input
                                        value={String(qc.receivedQuantity)}
                                        onChangeText={(val) => updateQcItem(item.id, { receivedQuantity: parseInt(val) || 0 })}
                                        keyboardType="number-pad"
                                        style={styles.qtyInput}
                                    />
                                </View>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>{t('inbound.passedQty')}</Text>
                                    <Input
                                        value={String(qc.passedQuantity)}
                                        onChangeText={(val) => updateQcItem(item.id, { passedQuantity: parseInt(val) || 0 })}
                                        keyboardType="number-pad"
                                        style={[styles.qtyInput, { color: COLORS.success, fontWeight: 'bold' }]}
                                    />
                                </View>
                            </View>

                            {failedQty > 0 && (
                                <View style={styles.failureSection}>
                                    <View style={styles.failedBadge}>
                                        <Feather name="alert-triangle" size={12} color={COLORS.danger} />
                                        <Text style={styles.failedText}>{t('inbound.failedQty')}: {failedQty}</Text>
                                    </View>
                                    <Text style={styles.inputLabel}>{t('inbound.failureReason')} *</Text>
                                    <Input
                                        placeholder={t('inbound.failureReasonPlaceholder')}
                                        value={qc.failureReason}
                                        onChangeText={(val) => updateQcItem(item.id, { failureReason: val })}
                                        style={styles.reasonInput}
                                    />
                                </View>
                            )}

                            <View style={{ marginTop: 12 }}>
                                <Text style={styles.inputLabel}>{t('inbound.notes')}</Text>
                                <Input
                                    placeholder="..."
                                    value={qc.notes}
                                    onChangeText={(val) => updateQcItem(item.id, { notes: val })}
                                    style={styles.notesInput}
                                />
                            </View>
                        </Card>
                    );
                })}
            </RefreshContainer>

            <View style={[styles.footer, { paddingBottom: getBottomSafePadding(insets.bottom, 12) }]}>
                <TouchableOpacity 
                    style={[styles.submitBtn, isSubmitting && styles.disabledBtn]}
                    onPress={handleConfirm}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Feather name="check-circle" size={20} color="#fff" />
                            <Text style={styles.submitBtnText}>{t('inbound.submitQC')}</Text>
                        </>
                    )}
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
    content: {
        flex: 1,
        padding: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    itemCard: {
        marginBottom: 16,
        padding: 16,
        backgroundColor: '#fff',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    skuText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    expectedBadge: {
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    expectedText: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    inputGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    inputWrapper: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginBottom: 6,
    },
    qtyInput: {
        height: 48,
        textAlign: 'center',
        fontSize: 16,
    },
    failureSection: {
        marginTop: 12,
        padding: 12,
        backgroundColor: COLORS.danger + '05',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.danger + '20',
    },
    failedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    failedText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.danger,
    },
    reasonInput: {
        height: 40,
        fontSize: 13,
        backgroundColor: '#fff',
    },
    notesInput: {
        height: 40,
        fontSize: 13,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    submitBtn: {
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    disabledBtn: {
        opacity: 0.6,
    }
});
