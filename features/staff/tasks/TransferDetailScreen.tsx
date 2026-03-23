import { Button, Card, ScreenHeader } from '@/components';
import { getBottomSafePadding } from '@/components/ui/safeArea';
import { COLORS } from '@/constants/color';
import {
    useMarkTransferPacked,
    useQualityCheckTransfer,
    useShipTransfer,
    useStartTransferPicking,
    useTransferOrder
} from '@/hooks/transfer.hooks';
import { TransferOrderItem } from '@/types/transfer';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StaffTransferDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const transferId = parseInt(id || '0', 10);
    const insets = useSafeAreaInsets();

    const { data: transfer, isLoading } = useTransferOrder(transferId);

    // Mutations
    const startPickingMutation = useStartTransferPicking();
    const markPackedMutation = useMarkTransferPacked();
    const shipMutation = useShipTransfer();
    const qualityCheckMutation = useQualityCheckTransfer();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Đang tải...</Text>
            </View>
        );
    }

    if (!transfer) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={64} color={COLORS.border} />
                    <Text style={styles.errorTitle}>Không tìm thấy phiếu luân chuyển</Text>
                    <Button title="Quay lại" onPress={() => router.back()} />
                </View>
            </View>
        );
    }

    const normalizedStatus = transfer.status.toLowerCase();

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
        if (!transfer?.items) return;

        const qualityCheckItems = transfer.items.map(item => ({
            productId: item.productId,
            okQuantity: item.quantity,
            badQuantity: 0,
            note: 'Confirmed on mobile'
        }));

        qualityCheckMutation.mutate(
            { 
                id: transferId, 
                payload: { 
                    note: 'Staff confirmed quality check on mobile',
                    items: qualityCheckItems
                } 
            },
            {
                onSuccess: () => {
                    // Logic refresh query đã có trong hook
                }
            }
        );
    };

    // Render Items
    const renderItem = (item: TransferOrderItem) => (
        <View key={item.id} style={styles.itemContainer}>
            <View style={styles.itemMainInfo}>
                <View style={styles.itemHeader}>
                    <Text style={styles.productName} numberOfLines={1}>{item.productName || `Sản phẩm #${item.productId}`}</Text>
                    <Text style={styles.itemSku}>SKU: {item.sku || 'N/A'}</Text>
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
                title="Chi tiết luân chuyển"
                subtitle={transfer.referenceCode || `Phiếu #${transfer.id}`}
            />

            <ScrollView style={styles.content} contentContainerStyle={[styles.contentContainer, { paddingBottom: 120 + insets.bottom }]}>
                {/* Header Card */}
                <Card style={styles.card}>
                    <View style={styles.statusRow}>
                        <View style={styles.typeContainer}>
                            <View style={[styles.typeIconLarge, { backgroundColor: COLORS.primary + '20' }]}>
                                <Feather name="repeat" size={28} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.typeLabel}>Luân chuyển kho</Text>
                                <Text style={styles.transferNumber}>{transfer.referenceCode || `Phiếu #${transfer.id}`}</Text>
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
                    <Text style={styles.sectionTitle}>Thông tin kho</Text>
                </View>
                <Card style={styles.card}>
                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Feather name="log-out" size={16} color={COLORS.danger} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Kho xuất (Từ)</Text>
                            <Text style={styles.detailValue}>{transfer.sourceWarehouse?.name || `Kho ${transfer.sourceWarehouseId}`}</Text>
                        </View>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Feather name="log-in" size={16} color={COLORS.success} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Kho nhập (Đến)</Text>
                            <Text style={styles.detailValue}>{transfer.destinationWarehouse?.name || `Kho ${transfer.destinationWarehouseId}`}</Text>
                        </View>
                    </View>
                </Card>

                {/* Warehouse Location Shortcut */}
                <TouchableOpacity
                    style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => router.push('/(staff-tabs)/tasks/warehouse')}
                >
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary + '10', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Feather name="map" size={18} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.slate800 }}>Sơ đồ kho</Text>
                        <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Nhấn để xem vị trí trên sơ đồ</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>


                {/* Items */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Danh sách sản phẩm ({transfer.items?.length || 0})</Text>
                </View>
                <View style={styles.list}>
                    {(transfer.items || []).map((item, index) => (
                        <View key={item.id}>
                            {renderItem(item)}
                            {index < (transfer.items || []).length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Actions Footer */}
            <View style={[styles.actionBar, { paddingBottom: getBottomSafePadding(insets.bottom, 16) }]}>
                {normalizedStatus === 'approved' && (
                    <Button 
                        title="Bắt đầu lấy hàng" 
                        onPress={handleStartPicking} 
                        loading={startPickingMutation.isPending} 
                    />
                )}
                {normalizedStatus === 'picking' && (
                    <Button 
                        title="Xác nhận đã đóng gói" 
                        onPress={handleMarkPacked} 
                        loading={markPackedMutation.isPending} 
                    />
                )}
                {normalizedStatus === 'packed' && (
                    <Button 
                        title="Giao cho vận chuyển" 
                        onPress={handleShip} 
                        loading={shipMutation.isPending} 
                    />
                )}
                {(normalizedStatus === 'in_transit' || normalizedStatus === 'received_partial') && (
                    <Button 
                        title="Kiểm nhận hàng" 
                        onPress={handleReceive} 
                    />
                )}
                {(normalizedStatus === 'received' || normalizedStatus === 'received_partial') && (
                    <Button 
                        title="Xác nhận kiểm hàng" 
                        onPress={handleQualityCheck}
                        loading={qualityCheckMutation.isPending}
                        variant="outline"
                        style={{ marginTop: 8 }}
                    />
                )}
                {normalizedStatus === 'completed' && (
                    <View style={styles.completedNotice}>
                        <Feather name="check-circle" size={20} color={COLORS.success} />
                        <Text style={styles.completedText}>Phiếu luân chuyển này đã hoàn tất.</Text>
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
    completedText: { color: COLORS.success, fontWeight: '600' }
});
