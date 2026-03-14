import { Button, Card, ScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { 
    useTransferOrder, 
    useSubmitTransferOrder, 
    useApproveTransferOrder, 
    useRejectTransferOrder, 
    useCancelTransferOrder 
} from '@/hooks/transfer.hooks';
import { AlertService } from '@/stores/alert.store';
import { TransferOrderItem } from '@/types/transfer';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';

export default function TransferDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const transferId = parseInt(id || '0', 10);

    const { data: transfer, isLoading } = useTransferOrder(transferId);
    
    // Mutations
    const submitMutation = useSubmitTransferOrder();
    const approveMutation = useApproveTransferOrder();
    const rejectMutation = useRejectTransferOrder();
    const cancelMutation = useCancelTransferOrder();

    const [reason, setReason] = useState('');
    const [showReasonInput, setShowReasonInput] = useState<'reject' | 'cancel' | null>(null);

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
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return COLORS.success;
            case 'approved': return COLORS.primary;
            case 'submitted': return COLORS.warning;
            case 'picking': return '#F59E0B';
            case 'packed': return '#8B5CF6';
            case 'shipped': return '#3B82F6';
            case 'draft': return COLORS.slate500;
            case 'cancelled':
            case 'rejected': return COLORS.danger;
            default: return COLORS.slate500;
        }
    };

    const statusColor = getStatusColor(transfer.status);
    const normalizedStatus = transfer.status.toLowerCase();

    // Action Handlers
    const handleSubmit = () => {
        submitMutation.mutate(transferId, {
            onSuccess: () => AlertService.success('Thành công', 'Đã trình duyệt phiếu luân chuyển.'),
            onError: (error: any) => AlertService.error('Lỗi', error.response?.data?.message || 'Không thể trình duyệt.')
        });
    };

    const handleApprove = () => {
        approveMutation.mutate(transferId, {
            onSuccess: () => AlertService.success('Thành công', 'Đã phê duyệt phiếu luân chuyển.'),
            onError: (error: any) => AlertService.error('Lỗi', error.response?.data?.message || 'Không thể phê duyệt.')
        });
    };

    const handleReject = () => {
        if (!reason.trim()) {
            AlertService.error('Lỗi', 'Vui lòng nhập lý do từ chối.');
            return;
        }
        rejectMutation.mutate({ id: transferId, payload: { reason } }, {
            onSuccess: () => {
                AlertService.success('Thành công', 'Đã từ chối phiếu luân chuyển.');
                setShowReasonInput(null);
                setReason('');
            },
            onError: (error: any) => AlertService.error('Lỗi', error.response?.data?.message || 'Không thể thao tác.')
        });
    };

    const handleCancel = () => {
        cancelMutation.mutate({ id: transferId, payload: { reason: reason.trim() || undefined } }, {
            onSuccess: () => {
                AlertService.success('Thành công', 'Đã hủy phiếu luân chuyển.');
                setShowReasonInput(null);
                setReason('');
            },
            onError: (error: any) => AlertService.error('Lỗi', error.response?.data?.message || 'Không thể hủy.')
        });
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

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
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
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '10' }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <Text style={[styles.statusText, { color: statusColor }]}>{transfer.status}</Text>
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
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Feather name="calendar" size={16} color={COLORS.textMuted} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Ngày tạo</Text>
                            <Text style={styles.detailValue}>{new Date(transfer.createdAt).toLocaleString('vi-VN')}</Text>
                        </View>
                    </View>
                </Card>

                {/* Items */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Danh sách sản phẩm</Text>
                    <Text style={styles.itemCount}>{(transfer.items || []).length} mặt hàng</Text>
                </View>
                <View style={styles.list}>
                    {(transfer.items || []).map((item, index) => (
                        <View key={item.id}>
                            {renderItem(item)}
                            {index < (transfer.items || []).length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>

                {/* Reason Input Card (if rejecting or cancelling) */}
                {showReasonInput && (
                    <Card style={[styles.card, { marginTop: 16 }]}>
                        <Text style={styles.sectionTitle}>
                            {showReasonInput === 'reject' ? 'Lý do từ chối' : 'Lý do hủy'}
                        </Text>
                        <TextInput
                            style={styles.reasonInput}
                            placeholder="Nhập lý do..."
                            value={reason}
                            onChangeText={setReason}
                            multiline
                            numberOfLines={3}
                        />
                        <View style={styles.reasonActions}>
                            <Button 
                                title="Bỏ qua" 
                                variant="outline" 
                                onPress={() => { setShowReasonInput(null); setReason(''); }}
                                style={{ flex: 1 }}
                            />
                            <Button 
                                title="Xác nhận" 
                                onPress={showReasonInput === 'reject' ? handleReject : handleCancel}
                                loading={rejectMutation.isPending || cancelMutation.isPending}
                                style={{ flex: 1 }}
                                variant={showReasonInput === 'reject' ? 'outline' : 'primary'}
                            />
                        </View>
                    </Card>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Actions Footer */}
            {!showReasonInput && (
                <View style={styles.actionBar}>
                    {normalizedStatus === 'draft' && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.actionButton, styles.cancelBtn]} onPress={() => setShowReasonInput('cancel')}>
                                <Text style={styles.cancelBtnText}>Hủy phiếu</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionButton, styles.primaryBtn]} onPress={handleSubmit} disabled={submitMutation.isPending}>
                                <Text style={styles.primaryBtnText}>{submitMutation.isPending ? 'Đang...' : 'Trình duyệt'}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {normalizedStatus === 'submitted' && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.actionButton, styles.rejectBtn]} onPress={() => setShowReasonInput('reject')}>
                                <Text style={styles.rejectBtnText}>Từ chối</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionButton, styles.primaryBtn]} onPress={handleApprove} disabled={approveMutation.isPending}>
                                <Text style={styles.primaryBtnText}>{approveMutation.isPending ? 'Đang...' : 'Phê duyệt'}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {/* Hủy khi đã duyệt, đang lấy hàng (picking) tùy logic, nhưng gen thường manager luôn được quyền Hủy */}
                    {(normalizedStatus === 'approved' || normalizedStatus === 'picking' || normalizedStatus === 'packed' || normalizedStatus === 'shipped') && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.actionButton, styles.cancelBtn]} onPress={() => setShowReasonInput('cancel')}>
                                <Text style={styles.cancelBtnText}>Hủy phiếu luân chuyển</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 20,
        marginBottom: 16,
    },
    backButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    card: {
        marginBottom: 16,
        padding: 16,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    typeIconLarge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeLabel: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    transferNumber: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.text,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    itemCount: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
    },
    detailIcon: {
        width: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    detailDivider: {
        height: 1,
        backgroundColor: COLORS.border,
    },
    list: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    itemContainer: {
        padding: 16,
    },
    itemMainInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemHeader: {
        flex: 1,
        marginRight: 12,
    },
    productName: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    itemSku: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    qtyBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    quantityText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginHorizontal: 16,
    },
    reasonInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    reasonActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtn: {
        backgroundColor: COLORS.primary,
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    rejectBtn: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: COLORS.danger,
    },
    rejectBtnText: {
        color: COLORS.danger,
        fontSize: 15,
        fontWeight: '700',
    },
    cancelBtn: {
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cancelBtnText: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: '600',
    },
});
