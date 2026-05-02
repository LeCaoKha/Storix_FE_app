import { Button, Card, RefreshContainer, ScreenHeader } from '@/components';
import { getBottomSafePadding } from '@/components/ui/safeArea';
import { COLORS } from '@/constants/color';
import { useCancelStockCountTicket, useStockCountTicket } from '@/hooks/stock-count.hooks';
import { useAppBack } from '@/hooks/useAppBack';
import { useTranslation } from '@/hooks/useTranslation';
import { AlertService } from '@/stores/alert.store';
import { StockCountItem } from '@/types/stock-count';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InventoryCountDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const ticketId = parseInt(Array.isArray(id) ? id[0] : (id || '0'), 10);
    const { t } = useTranslation();
    const goBack = useAppBack();
    const insets = useSafeAreaInsets();

    const { data: ticket, isLoading, refetch } = useStockCountTicket(ticketId);
    const cancelMutation = useCancelStockCountTicket();

    const handleRefresh = async () => {
        await refetch();
    };

    const handleCancel = () => {
        Alert.alert(
            t('common.confirm'),
            'Bạn có chắc chắn muốn hủy phiếu kiểm kê này không?',
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.confirm'),
                    style: 'destructive',
                    onPress: () => {
                        cancelMutation.mutate(ticketId, {
                            onSuccess: () => {
                                AlertService.success(t('common.success'), 'Đã hủy phiếu kiểm kê.');
                                refetch();
                            },
                            onError: (error: any) => {
                                AlertService.error(t('common.error'), error.response?.data?.message || t('common.failed'));
                            }
                        });
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!ticket) {
        return (
            <View style={styles.center}>
                <Feather name="alert-circle" size={48} color={COLORS.border} />
                <Text style={styles.errorText}>{t('common.noData')}</Text>
                <Button title={t('common.back')} onPress={goBack} style={{ marginTop: 12 }} />
            </View>
        );
    }

    const isPending = ticket.status?.toLowerCase() === 'pending' || ticket.status?.toLowerCase() === 'in_progress';
    const isFinished = ticket.status?.toLowerCase() === 'finished' || ticket.status?.toLowerCase() === 'completed';

    const renderItem = (item: StockCountItem) => {
        const hasDiscrepancy = (item.discrepancy || 0) !== 0;
        return (
            <View key={item.id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                    <Text style={styles.productName} numberOfLines={1}>{item.name || `${t('common.product')} #${item.productId}`}</Text>
                    <Text style={styles.itemSku}>SKU: {item.sku || 'N/A'}</Text>
                </View>

                <View style={styles.qtyRow}>
                    <View style={styles.qtyBlock}>
                        <Text style={styles.qtyLabel}>{t('inventoryCount.system')}</Text>
                        <Text style={styles.qtyValue}>{item.systemQuantity}</Text>
                    </View>
                    <View style={styles.qtyBlock}>
                        <Text style={styles.qtyLabel}>{t('inventoryCount.counted')}</Text>
                        <Text style={[styles.qtyValue, { color: COLORS.primary }]}>
                            {item.countedQuantity !== undefined ? item.countedQuantity : '-'}
                        </Text>
                    </View>
                    <View style={styles.qtyBlock}>
                        <Text style={styles.qtyLabel}>{t('inventoryCount.over')}/{t('inventoryCount.short')}</Text>
                        <Text style={[styles.qtyValue, hasDiscrepancy ? { color: COLORS.danger } : { color: COLORS.success }]}>
                            {item.discrepancy !== undefined ? (item.discrepancy > 0 ? `+${item.discrepancy}` : item.discrepancy) : '-'}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title={t('inventoryCount.ticketTitle')}
                subtitle={ticket.name || `#${ticket.id}`}
            />

            <RefreshContainer
                onRefresh={handleRefresh}
                contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
            >
                <Card style={styles.infoCard}>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusBadge, { backgroundColor: (isFinished ? COLORS.success : COLORS.warning) + '15' }]}>
                            <Text style={[styles.statusText, { color: isFinished ? COLORS.success : COLORS.warning }]}>
                                {ticket.status}
                            </Text>
                        </View>
                        <Text style={styles.dateText}>
                            {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ''}
                        </Text>
                    </View>
                    <Text style={styles.description}>{ticket.description || 'No description provided.'}</Text>
                </Card>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('outbound.productList')}</Text>
                    <Text style={styles.itemCount}>{ticket.items?.length || 0} {t('common.item').toLowerCase()}</Text>
                </View>

                <View style={styles.list}>
                    {ticket.items?.map((item, index) => (
                        <View key={item.id}>
                            {renderItem(item)}
                            {index < (ticket.items?.length || 0) - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>
            </RefreshContainer>

            {isPending && (
                <View style={[styles.actionBar, { paddingBottom: getBottomSafePadding(insets.bottom, 16) }]}>
                    <Button
                        title="Hủy phiếu kiểm kê"
                        variant="outline"
                        onPress={handleCancel}
                        loading={cancelMutation.isPending}
                        style={styles.cancelBtn}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16, color: COLORS.textMuted, marginTop: 12 },
    content: { padding: 16 },
    infoCard: { padding: 16, marginBottom: 20 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: '700' },
    dateText: { fontSize: 12, color: COLORS.textMuted },
    description: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    itemCount: { fontSize: 13, color: COLORS.textMuted },
    list: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
    itemContainer: { padding: 16 },
    itemHeader: { marginBottom: 12 },
    productName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
    itemSku: { fontSize: 12, color: COLORS.textMuted },
    qtyRow: { flexDirection: 'row', justifyContent: 'space-between' },
    qtyBlock: { alignItems: 'flex-start' },
    qtyLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4, fontWeight: '600' },
    qtyValue: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16 },
    actionBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border,
    },
    cancelBtn: { borderColor: COLORS.danger, height: 48 },
});
