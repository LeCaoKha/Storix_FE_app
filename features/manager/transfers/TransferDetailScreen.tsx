import { Button, Card, ScreenHeader } from '@/components';
import { AddTransferItemModal } from '@/components/manager/AddTransferItemModal';
import { getBottomSafePadding } from '@/components/ui/safeArea';
import { COLORS } from '@/constants/color';
import {
    useAddTransferOrderItem,
    useApproveTransferOrder,
    useCancelTransferOrder,
    useCheckTransferAvailability,
    useRejectTransferOrder,
    useRemoveTransferOrderItem,
    useSubmitTransferOrder,
    useTransferOrder,
    useUpdateTransferOrderItem
} from '@/hooks/transfer.hooks';
import { useAppBack } from '@/hooks/useAppBack';
import { AlertService } from '@/stores/alert.store';
import { TransferAvailability, TransferOrderItem } from '@/types/transfer';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TransferDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const transferId = parseInt(id || '0', 10);
    const insets = useSafeAreaInsets();
    const goBack = useAppBack();

    const { data: transfer, isLoading } = useTransferOrder(transferId);
    const { data: availability = [], isLoading: isCheckingAvailability } = useCheckTransferAvailability(transferId);
    
    // Mutations
    const submitMutation = useSubmitTransferOrder();
    const approveMutation = useApproveTransferOrder();
    const rejectMutation = useRejectTransferOrder();
    const cancelMutation = useCancelTransferOrder();
    const addItemMutation = useAddTransferOrderItem();
    const updateItemMutation = useUpdateTransferOrderItem();
    const removeItemMutation = useRemoveTransferOrderItem();

    const [reason, setReason] = useState('');
    const [showReasonInput, setShowReasonInput] = useState<'reject' | 'cancel' | null>(null);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

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
                    <TouchableOpacity style={styles.backButton} onPress={goBack}>
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
            case 'pending_approval': return COLORS.warning;
            case 'picking': return '#F59E0B';
            case 'packed': return '#8B5CF6';
            case 'in_transit': return '#3B82F6';
            case 'draft': return COLORS.slate500;
            case 'cancelled':
            case 'rejected': return COLORS.danger;
            default: return COLORS.slate500;
        }
    };

    const statusColor = getStatusColor(transfer.status);
    const normalizedStatus = transfer.status.toLowerCase();
    const canEditTransfer = normalizedStatus === 'draft' || normalizedStatus === 'rejected';
    const hasItems = (transfer.items || []).length > 0;
    const availabilityIssues = availability.filter((item) => !item.isEnough);

    // Action Handlers
    const handleSubmit = () => {
        if (!hasItems) {
            AlertService.error('Lỗi', 'Cần thêm ít nhất 1 sản phẩm trước khi trình duyệt.');
            return;
        }

        submitMutation.mutate(transferId, {
            onSuccess: () => AlertService.success('Thành công', 'Đã trình duyệt phiếu luân chuyển.'),
            onError: (error: any) => AlertService.error('Lỗi', error.response?.data?.message || 'Không thể trình duyệt.')
        });
    };

    const handleApprove = () => {
        if (availabilityIssues.length > 0) {
            const firstIssue = availabilityIssues[0];
            AlertService.error(
                'Thiếu tồn kho',
                `${firstIssue.productName || `Sản phẩm #${firstIssue.productId}`} chỉ còn ${firstIssue.availableQuantity}/${firstIssue.requiredQuantity}.`
            );
            return;
        }

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

    const handleAddItem = (productId: number, quantity: number) => {
        addItemMutation.mutate({ id: transferId, payload: { productId, quantity } }, {
            onSuccess: () => {
                AlertService.success('Thành công', 'Đã thêm sản phẩm vào phiếu.');
                setIsAddModalVisible(false);
            },
            onError: (error: any) => AlertService.error('Lỗi', error.response?.data?.message || 'Không thể thêm sản phẩm.')
        });
    };

    const handleUpdateItemQuantity = (item: TransferOrderItem, nextQuantity: number) => {
        if (!canEditTransfer || !item.productId || nextQuantity <= 0) {
            return;
        }

        setUpdatingItemId(item.id);
        updateItemMutation.mutate(
            {
                id: transferId,
                itemId: item.id,
                payload: {
                    productId: item.productId,
                    quantity: nextQuantity,
                },
            },
            {
                onError: (error: any) => {
                    AlertService.error('Lỗi', error.response?.data?.message || 'Không thể cập nhật số lượng.');
                },
                onSettled: () => {
                    setUpdatingItemId(null);
                },
            }
        );
    };

    const handleRemoveItem = (itemId: number) => {
        Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa sản phẩm này khỏi phiếu?', [
            { text: 'Hủy', style: 'cancel' },
            { 
                text: 'Xóa', 
                style: 'destructive',
                onPress: () => {
                    removeItemMutation.mutate({ id: transferId, itemId }, {
                        onSuccess: () => AlertService.success('Thành công', 'Đã xóa sản phẩm.'),
                        onError: (error: any) => AlertService.error('Lỗi', error.response?.data?.message || 'Không thể xóa sản phẩm.')
                    });
                }
            }
        ]);
    };

    const renderAvailabilityItem = (item: TransferAvailability) => {
        const enough = item.isEnough;

        return (
            <View key={`availability-${item.productId}`} style={styles.availabilityItem}>
                <View style={styles.availabilityTextGroup}>
                    <Text style={styles.availabilityName}>{item.productName || `Sản phẩm #${item.productId}`}</Text>
                    <Text style={styles.availabilityMeta}>Cần {item.requiredQuantity} • Có thể xuất {item.availableQuantity}</Text>
                </View>
                <View style={[styles.availabilityBadge, enough ? styles.availabilityBadgeOk : styles.availabilityBadgeWarn]}>
                    <Text style={[styles.availabilityBadgeText, enough ? styles.availabilityBadgeTextOk : styles.availabilityBadgeTextWarn]}>
                        {enough ? 'Đủ' : 'Thiếu'}
                    </Text>
                </View>
            </View>
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
                {canEditTransfer ? (
                    <View style={styles.itemActionsWrap}>
                        <View style={styles.qtyEditor}>
                            <TouchableOpacity
                                style={styles.qtyActionBtn}
                                onPress={() => handleUpdateItemQuantity(item, Math.max(1, item.quantity - 1))}
                                disabled={updatingItemId === item.id || item.quantity <= 1}
                            >
                                <Feather name="minus" size={14} color={COLORS.primary} />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{item.quantity}</Text>
                            <TouchableOpacity
                                style={styles.qtyActionBtn}
                                onPress={() => handleUpdateItemQuantity(item, item.quantity + 1)}
                                disabled={updatingItemId === item.id}
                            >
                                <Feather name="plus" size={14} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleRemoveItem(item.id)}>
                            <Feather name="trash-2" size={18} color={COLORS.danger} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.qtyBadge}>
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                    </View>
                )}
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

                {/* Warehouse Location Shortcut */}
                <TouchableOpacity
                    style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => router.push('/warehouse-view')}
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


                {normalizedStatus === 'pending_approval' && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Kiểm tra tồn khả dụng</Text>
                            <Text style={styles.itemCount}>{isCheckingAvailability ? 'Đang kiểm tra...' : `${availabilityIssues.length} sản phẩm thiếu`}</Text>
                        </View>
                        <Card style={styles.card}>
                            {availability.length > 0 ? (
                                availability.map(renderAvailabilityItem)
                            ) : (
                                <Text style={styles.emptyAvailabilityText}>Chưa có dữ liệu kiểm tra tồn.</Text>
                            )}
                        </Card>
                    </>
                )}

                {/* Items */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Danh sách sản phẩm</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Text style={styles.itemCount}>{(transfer.items || []).length} mặt hàng</Text>
                        {canEditTransfer && (
                            <TouchableOpacity onPress={() => setIsAddModalVisible(true)} style={styles.addBtnSmall}>
                                <Feather name="plus" size={16} color={COLORS.primary} />
                                <Text style={styles.addBtnTextSmall}>Thêm</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                <View style={styles.list}>
                    {(transfer.items || []).length > 0 ? (
                        (transfer.items || []).map((item, index) => (
                            <View key={item.id}>
                                {renderItem(item)}
                                {index < (transfer.items || []).length - 1 && <View style={styles.divider} />}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyItemsContainer}>
                            <Feather name="package" size={32} color={COLORS.border} />
                            <Text style={styles.emptyItemsText}>Chưa có sản phẩm nào được thêm vào phiếu.</Text>
                            {canEditTransfer && (
                                <Button 
                                    title="Thêm sản phẩm ngay" 
                                    variant="outline" 
                                    onPress={() => setIsAddModalVisible(true)} 
                                    style={{ marginTop: 12 }} 
                                />
                            )}
                        </View>
                    )}
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
            </ScrollView>

            {/* Actions Footer */}
            {!showReasonInput && (
                <View style={[styles.actionBar, { paddingBottom: getBottomSafePadding(insets.bottom, 16) }]}>
                    {normalizedStatus === 'draft' && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.actionButton, styles.cancelBtn]} onPress={() => setShowReasonInput('cancel')}>
                                <Text style={styles.cancelBtnText}>Hủy phiếu</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionButton, styles.primaryBtn, (!hasItems || submitMutation.isPending) && styles.actionButtonDisabled]} onPress={handleSubmit} disabled={!hasItems || submitMutation.isPending}>
                                <Text style={styles.primaryBtnText}>{submitMutation.isPending ? 'Đang...' : 'Trình duyệt'}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {normalizedStatus === 'rejected' && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.actionButton, styles.primaryBtn, (!hasItems || submitMutation.isPending) && styles.actionButtonDisabled]} onPress={handleSubmit} disabled={!hasItems || submitMutation.isPending}>
                                <Text style={styles.primaryBtnText}>{submitMutation.isPending ? 'Đang...' : 'Trình duyệt lại'}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {normalizedStatus === 'pending_approval' && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.actionButton, styles.rejectBtn]} onPress={() => setShowReasonInput('reject')}>
                                <Text style={styles.rejectBtnText}>Từ chối</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionButton, styles.primaryBtn, (approveMutation.isPending || isCheckingAvailability || availabilityIssues.length > 0) && styles.actionButtonDisabled]} onPress={handleApprove} disabled={approveMutation.isPending || isCheckingAvailability || availabilityIssues.length > 0}>
                                <Text style={styles.primaryBtnText}>{approveMutation.isPending ? 'Đang...' : 'Phê duyệt'}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {/* Hủy khi đã duyệt, đang lấy hàng (picking) tùy logic, nhưng gen thường manager luôn được quyền Hủy */}
                    {(normalizedStatus === 'approved' || normalizedStatus === 'picking' || normalizedStatus === 'packed' || normalizedStatus === 'in_transit') && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.actionButton, styles.cancelBtn]} onPress={() => setShowReasonInput('cancel')}>
                                <Text style={styles.cancelBtnText}>Hủy phiếu luân chuyển</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            <AddTransferItemModal
                visible={isAddModalVisible}
                onClose={() => setIsAddModalVisible(false)}
                onAdd={handleAddItem}
                isAdding={addItemMutation.isPending}
            />
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
    availabilityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    availabilityTextGroup: {
        flex: 1,
        marginRight: 12,
    },
    availabilityName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    availabilityMeta: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    availabilityBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    availabilityBadgeOk: {
        backgroundColor: `${COLORS.success}15`,
    },
    availabilityBadgeWarn: {
        backgroundColor: `${COLORS.danger}15`,
    },
    availabilityBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    availabilityBadgeTextOk: {
        color: COLORS.success,
    },
    availabilityBadgeTextWarn: {
        color: COLORS.danger,
    },
    emptyAvailabilityText: {
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
    itemActionsWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    qtyEditor: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 4,
        gap: 8,
    },
    qtyActionBtn: {
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
    },
    deleteBtn: {
        marginLeft: 12,
        padding: 8,
        backgroundColor: COLORS.danger + '10',
        borderRadius: 8,
    },
    addBtnSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    addBtnTextSmall: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    emptyItemsContainer: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyItemsText: {
        color: COLORS.textMuted,
        fontSize: 14,
        marginTop: 12,
        textAlign: 'center',
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
    actionButtonDisabled: {
        opacity: 0.5,
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
