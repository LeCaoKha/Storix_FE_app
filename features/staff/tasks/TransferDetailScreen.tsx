import { Button, Card, RefreshContainer, ScreenHeader } from '@/components';
import { getBottomSafePadding } from '@/components/ui/safeArea';
import { COLORS } from '@/constants/color';
import {
    useMarkTransferPacked,
    useShipTransfer,
    useStartTransferPicking,
    useTransferOrder
} from '@/hooks/transfer.hooks';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth.store';
import { TransferOrderItem } from '@/types/transfer';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StaffTransferDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const transferId = parseInt(id || '0', 10);
    const insets = useSafeAreaInsets();
    const user = useAuthStore((state) => state.user);
    const { t } = useTranslation();

    const { data: transfer, isLoading, refetch } = useTransferOrder(transferId);

    const handleRefresh = async () => {
        await refetch();
    };

    // Mutations
    const startPickingMutation = useStartTransferPicking();
    const markPackedMutation = useMarkTransferPacked();
    const shipMutation = useShipTransfer();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>{t('common.loading')}</Text>
            </View>
        );
    }

    if (!transfer) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={64} color={COLORS.border} />
                    <Text style={styles.errorTitle}>{t('common.noData')}</Text>
                    <Button title={t('common.back')} onPress={() => router.back()} />
                </View>
            </View>
        );
    }

    const normalizedStatus = transfer.status.toLowerCase();

    const resolveCarrierUserId = () => {
        const timeline = transfer.timeline || [];
        for (let i = timeline.length - 1; i >= 0; i -= 1) {
            const action = timeline[i]?.action || '';
            if (!action.startsWith('CARRIER:')) continue;
            const idValue = Number(action.split(':')[1]);
            if (Number.isFinite(idValue) && idValue > 0) return idValue;
        }
        return null;
    };

    const currentUserId = Number(user?.id || 0);
    const currentWarehouseId = Number(user?.warehouseId || 0);
    const sourceWarehouseId = Number(transfer.sourceWarehouseId || 0);
    const destinationWarehouseId = Number(transfer.destinationWarehouseId || 0);
    const assignedCarrierUserId = resolveCarrierUserId();

    const canProcessSourceFlow =
        sourceWarehouseId > 0 &&
        currentWarehouseId === sourceWarehouseId &&
        (!assignedCarrierUserId || assignedCarrierUserId === currentUserId);

    const canProcessDestinationFlow =
        destinationWarehouseId > 0 && currentWarehouseId === destinationWarehouseId;

    // Action Handlers
    const handleStartPicking = () => {
        startPickingMutation.mutate(transferId);
    };

    const handleMarkPacked = () => {
        markPackedMutation.mutate(transferId);
    };

    const handleShip = () => {
        shipMutation.mutate(transferId);
    };

    const handleReceive = () => {
        router.push(`/(staff-tabs)/tasks/transfer/receive/${transferId}` as any);
    };

    const handleQualityCheck = () => {
        router.push(`/(staff-tabs)/tasks/transfer/quality/${transferId}` as any);
    };

    // Render Items
    const renderItem = (item: TransferOrderItem) => (
        <View key={item.id} style={styles.itemContainer}>
            <View style={styles.itemMainInfo}>
                <View style={styles.itemHeader}>
                    <Text style={styles.productName} numberOfLines={1}>{item.productName || `${t('common.product')} #${item.productId}`}</Text>
                    {item.sku && (
                        <Text style={styles.itemSku}>{t('common.sku')}: {item.sku}</Text>
                    )}
                </View>
                <View style={styles.qtyBadge}>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <ScreenHeader
                title={t('transfer.ticketTitle')}
                subtitle={transfer.referenceCode || `${t('tasks.transfer')} #${transfer.id}`}
            />

            <RefreshContainer 
                style={styles.content} 
                contentContainerStyle={[styles.contentContainer, { paddingBottom: 120 + insets.bottom }]}
                onRefresh={handleRefresh}
            >
                {/* Header Card */}
                <Card style={styles.card}>
                    <View style={styles.statusRow}>
                        <View style={styles.typeContainer}>
                            <View style={[styles.typeIconLarge, { backgroundColor: COLORS.primary + '20' }]}>
                                <Feather name="repeat" size={28} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.typeLabel}>{t('transfer.warehouseTransfer')}</Text>
                                <Text style={styles.transferNumber}>{transfer.referenceCode || `${t('tasks.transfer')} #${transfer.id}`}</Text>
                            </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: COLORS.primary + '10' }]}>
                            <View style={[styles.statusDot, { backgroundColor: COLORS.primary }]} />
                            <Text style={[styles.statusText, { color: COLORS.primary }]}>{transfer.status}</Text>
                        </View>
                    </View>
                </Card>

                {/* Locations Card */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('transfer.warehouseInfo')}</Text>
                </View>
                <Card style={styles.card}>
                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Feather name="log-out" size={16} color={COLORS.danger} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>{t('transfer.sourceWarehouse')}</Text>
                            <Text style={styles.detailValue}>{transfer.sourceWarehouse?.name || `${t('tasks.warehouse')} ${transfer.sourceWarehouseId}`}</Text>
                        </View>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Feather name="log-in" size={16} color={COLORS.success} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>{t('transfer.destinationWarehouse')}</Text>
                            <Text style={styles.detailValue}>{transfer.destinationWarehouse?.name || `${t('tasks.warehouse')} ${transfer.destinationWarehouseId}`}</Text>
                        </View>
                    </View>
                </Card>

                {/* Warehouse Location Shortcut */}
                <TouchableOpacity
                    style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => router.push('/warehouse-view')}
                >
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary + '10', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Feather name="map" size={18} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.slate800 }}>{t('warehouse.map')}</Text>
                        <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{t('outbound.tapToNavigate')}</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>


                {/* Items */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('outbound.productList')} ({transfer.items?.length || 0})</Text>
                </View>
                <View style={styles.list}>
                    {(transfer.items || []).map((item, index) => (
                        <View key={item.id}>
                            {renderItem(item)}
                            {index < (transfer.items || []).length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>
            </RefreshContainer>

            {/* Actions Footer */}
            <View style={[styles.actionBar, { paddingBottom: getBottomSafePadding(insets.bottom, 16) }]}>
                {normalizedStatus === 'approved' && canProcessSourceFlow && (
                    <Button 
                        title={t('transfer.startPicking')} 
                        onPress={handleStartPicking} 
                        loading={startPickingMutation.isPending} 
                    />
                )}
                {normalizedStatus === 'picking' && canProcessSourceFlow && (
                    <Button 
                        title={t('transfer.confirmPacked')} 
                        onPress={handleMarkPacked} 
                        loading={markPackedMutation.isPending} 
                    />
                )}
                {normalizedStatus === 'packed' && canProcessSourceFlow && (
                    <Button 
                        title={t('transfer.handOver')} 
                        onPress={handleShip} 
                        loading={shipMutation.isPending} 
                    />
                )}
                {normalizedStatus === 'in_transit' && canProcessDestinationFlow && (
                    <Button 
                        title={t('transfer.checkReceive')} 
                        onPress={handleReceive} 
                    />
                )}
                {normalizedStatus === 'completed' && canProcessSourceFlow && (
                    <Button 
                        title={t('transfer.confirmQC')} 
                        onPress={handleQualityCheck}
                        variant="outline"
                        style={{ marginTop: 8 }}
                    />
                )}
                {normalizedStatus === 'approved' && !canProcessSourceFlow && (
                    <Text style={styles.permissionNotice}>{t('transfer.permissionNoticeSource')}</Text>
                )}
                {normalizedStatus === 'picking' && !canProcessSourceFlow && (
                    <Text style={styles.permissionNotice}>{t('transfer.permissionNoticeSource')}</Text>
                )}
                {normalizedStatus === 'packed' && !canProcessSourceFlow && (
                    <Text style={styles.permissionNotice}>{t('transfer.permissionNoticeSource')}</Text>
                )}
                {normalizedStatus === 'in_transit' && !canProcessDestinationFlow && (
                    <Text style={styles.permissionNotice}>{t('transfer.permissionNoticeDest')}</Text>
                )}
                {normalizedStatus === 'completed' && !canProcessSourceFlow && (
                    <Text style={styles.permissionNotice}>{t('transfer.permissionNoticeQC')}</Text>
                )}
                {(normalizedStatus === 'quality_checked' || normalizedStatus === 'quality_issue') && (
                    <View style={styles.completedNotice}>
                        <Feather name="check-circle" size={20} color={COLORS.success} />
                        <Text style={styles.completedText}>{t('transfer.completedQC')}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    errorTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 20, marginBottom: 16 },
    content: { flex: 1 },
    contentContainer: { padding: 20 },
    card: { marginBottom: 16, padding: 16 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    typeContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    typeIconLarge: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    typeLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },
    transferNumber: { fontSize: 17, fontWeight: '700', color: COLORS.text },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
    detailIcon: { width: 32, justifyContent: 'center', alignItems: 'center' },
    detailContent: { flex: 1 },
    detailLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
    detailValue: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
    detailDivider: { height: 1, backgroundColor: COLORS.border },
    list: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
    itemContainer: { padding: 16 },
    itemMainInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemHeader: { flex: 1, marginRight: 12 },
    productName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
    itemSku: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
    qtyBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    quantityText: { fontSize: 13, fontWeight: '700', color: COLORS.text },
    divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16 },
    actionBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16,
        borderTopWidth: 1, borderTopColor: COLORS.border,
        elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1, shadowRadius: 12,
    },
    completedNotice: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12
    },
    permissionNotice: {
        fontSize: 13,
        color: COLORS.textMuted,
        textAlign: 'center',
        paddingVertical: 6,
    },
    completedText: { color: COLORS.success, fontWeight: '600' }
});
