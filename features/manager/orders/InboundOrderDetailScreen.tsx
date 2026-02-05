import { Card, ScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useInboundRequest, useInboundTicket } from '@/hooks';
import {
    useCreateInboundTicket,
    useUpdateInboundRequestStatus,
} from '@/hooks/inbound-orders.hooks';
import { useAuthStore } from '@/stores/auth.store';
import type { InboundOrderItem } from '@/types/inbound-order';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Status config cho Request (chờ duyệt)
type InboundRequestStatusKey = 'Pending' | 'Approved' | 'Rejected';
const REQUEST_STATUS_CONFIG: Record<InboundRequestStatusKey, { label: string; color: string; bgColor: string }> = {
    Pending: { label: 'Chờ duyệt', color: COLORS.warning, bgColor: COLORS.warning + '20' },
    Approved: { label: 'Đã duyệt', color: COLORS.success, bgColor: COLORS.success + '20' },
    Rejected: { label: 'Từ chối', color: COLORS.danger, bgColor: COLORS.danger + '20' },
};

// Status config cho Ticket (đang xử lý)
type InboundTicketStatusKey = 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
const TICKET_STATUS_CONFIG: Record<InboundTicketStatusKey, { label: string; color: string; bgColor: string }> = {
    Pending: { label: 'Chờ xử lý', color: COLORS.warning, bgColor: COLORS.warning + '20' },
    Processing: { label: 'Đang xử lý', color: COLORS.primary, bgColor: COLORS.primaryLight + '20' },
    Completed: { label: 'Hoàn tất', color: COLORS.success, bgColor: COLORS.success + '20' },
    Cancelled: { label: 'Đã hủy', color: COLORS.danger, bgColor: COLORS.danger + '20' },
};

const getRequestStatusConfig = (status?: string) => {
    return REQUEST_STATUS_CONFIG[status as InboundRequestStatusKey] || REQUEST_STATUS_CONFIG.Pending;
};

const getTicketStatusConfig = (status?: string) => {
    return TICKET_STATUS_CONFIG[status as InboundTicketStatusKey] || TICKET_STATUS_CONFIG.Pending;
};

export default function InboundOrderDetailScreen() {
    const router = useRouter();
    const { id, type = 'request' } = useLocalSearchParams<{ id: string; type?: 'request' | 'ticket' }>();
    const { user } = useAuthStore();
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch data based on type
    const { data: request, isLoading: requestLoading, error: requestError } = useInboundRequest(
        type === 'request' ? id : undefined
    );
    const { data: ticket, isLoading: ticketLoading, error: ticketError } = useInboundTicket(
        type === 'ticket' ? id : undefined
    );

    // Mutations
    const updateRequestStatus = useUpdateInboundRequestStatus();
    const createTicket = useCreateInboundTicket();

    const isLoading = requestLoading || ticketLoading;
    const error = requestError || ticketError;
    const data = type === 'request' ? request : ticket;

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Đang tải..." />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </View>
        );
    }

    if (!data || error) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Lỗi" />
                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={64} color={COLORS.border} />
                    <Text style={styles.errorTitle}>Không tìm thấy đơn nhập kho</Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backLink}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const isRequest = type === 'request';
    const statusConfig = isRequest ? getRequestStatusConfig(data.status) : getTicketStatusConfig(data.status);
    const canApproveReject = isRequest && data.status === 'Pending';
    const canCreateTicket = isRequest && data.status === 'Approved';

    // Handle approve request
    const handleApprove = () => {
        Alert.alert(
            'Duyệt yêu cầu',
            'Bạn có chắc chắn muốn duyệt yêu cầu nhập kho này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Duyệt',
                    style: 'default',
                    onPress: async () => {
                        try {
                            setIsProcessing(true);
                            await updateRequestStatus.mutateAsync({
                                requestId: data.id,
                                approverId: user?.id ?? 0,
                                status: 'Approved',
                            });
                            Alert.alert('Thành công', 'Yêu cầu đã được duyệt', [
                                { text: 'OK', onPress: () => router.back() },
                            ]);
                        } catch {
                            Alert.alert('Lỗi', 'Không thể duyệt yêu cầu. Vui lòng thử lại.');
                        } finally {
                            setIsProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    // Handle reject request
    const handleReject = () => {
        Alert.alert(
            'Từ chối yêu cầu',
            'Bạn có chắc chắn muốn từ chối yêu cầu nhập kho này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Từ chối',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsProcessing(true);
                            await updateRequestStatus.mutateAsync({
                                requestId: data.id,
                                approverId: user?.id ?? 0,
                                status: 'Rejected',
                            });
                            Alert.alert('Thành công', 'Yêu cầu đã bị từ chối', [
                                { text: 'OK', onPress: () => router.back() },
                            ]);
                        } catch {
                            Alert.alert('Lỗi', 'Không thể từ chối yêu cầu. Vui lòng thử lại.');
                        } finally {
                            setIsProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    // Handle create ticket from approved request
    const handleCreateTicket = () => {
        Alert.alert(
            'Tạo phiếu nhập kho',
            'Tạo phiếu nhập kho từ yêu cầu đã duyệt?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Tạo phiếu',
                    style: 'default',
                    onPress: async () => {
                        try {
                            setIsProcessing(true);
                            await createTicket.mutateAsync({
                                requestId: data.id,
                                createdBy: user?.id ?? 0,
                            });
                            Alert.alert('Thành công', 'Đã tạo phiếu nhập kho', [
                                { text: 'OK', onPress: () => router.back() },
                            ]);
                        } catch {
                            Alert.alert('Lỗi', 'Không thể tạo phiếu nhập kho. Vui lòng thử lại.');
                        } finally {
                            setIsProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    // Get items - support both request and ticket structure
    const items = (data as any).inboundOrderItems || [];
    const supplier = (data as any).supplier;
    const warehouse = (data as any).warehouse;

    return (
        <View style={styles.container}>
            <ScreenHeader
                title={isRequest ? 'Chi Tiết Yêu Cầu Nhập' : 'Chi Tiết Phiếu Nhập'}
                subtitle={isRequest ? `REQ-${data.id}` : ((data as any).referenceCode || `INB-${data.id}`)}
            />

            <ScrollView style={styles.content}>
                {/* Status Card */}
                <Card style={styles.card}>
                    <View style={styles.statusRow}>
                        <Text style={styles.cardTitle}>Trạng Thái</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                            <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                {statusConfig.label}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.typeLabel}>
                        {isRequest ? 'Yêu cầu nhập kho' : 'Phiếu nhập kho'}
                    </Text>
                </Card>

                {/* Supplier Info */}
                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>Thông Tin Nhà Cung Cấp</Text>
                    <View style={styles.infoRow}>
                        <Feather name="truck" size={16} color={COLORS.textMuted} />
                        <Text style={styles.infoLabel}>Nhà cung cấp:</Text>
                        <Text style={styles.infoValue}>
                            {supplier?.name || 'Chưa xác định'}
                        </Text>
                    </View>
                    {warehouse && (
                        <View style={styles.infoRow}>
                            <Feather name="home" size={16} color={COLORS.textMuted} />
                            <Text style={styles.infoLabel}>Kho:</Text>
                            <Text style={styles.infoValue}>{warehouse.name}</Text>
                        </View>
                    )}
                    {!isRequest && (data as any).inboundRequestId && (
                        <View style={styles.infoRow}>
                            <Feather name="file-text" size={16} color={COLORS.textMuted} />
                            <Text style={styles.infoLabel}>Yêu cầu:</Text>
                            <Text style={styles.infoValue}>#{(data as any).inboundRequestId}</Text>
                        </View>
                    )}
                </Card>

                {/* Dates */}
                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>Thời Gian</Text>
                    {(data as any).createdAt && (
                        <View style={styles.infoRow}>
                            <Feather name="calendar" size={16} color={COLORS.textMuted} />
                            <Text style={styles.infoLabel}>Ngày tạo:</Text>
                            <Text style={styles.infoValue}>
                                {new Date((data as any).createdAt).toLocaleDateString('vi-VN')}
                            </Text>
                        </View>
                    )}
                    {isRequest && (data as any).approvedAt && (
                        <View style={styles.infoRow}>
                            <Feather name="check-circle" size={16} color={COLORS.textMuted} />
                            <Text style={styles.infoLabel}>Ngày duyệt:</Text>
                            <Text style={styles.infoValue}>
                                {new Date((data as any).approvedAt).toLocaleDateString('vi-VN')}
                            </Text>
                        </View>
                    )}
                    {!isRequest && (data as any).createdByNavigation && (
                        <View style={styles.infoRow}>
                            <Feather name="user" size={16} color={COLORS.textMuted} />
                            <Text style={styles.infoLabel}>Người tạo:</Text>
                            <Text style={styles.infoValue}>{(data as any).createdByNavigation.email}</Text>
                        </View>
                    )}
                </Card>

                {/* Items */}
                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>
                        Sản Phẩm ({items.length})
                    </Text>
                    {items.map((item: InboundOrderItem, index: number) => (
                        <View key={item.id}>
                            {index > 0 && <View style={styles.itemDivider} />}
                            <View style={styles.itemRow}>
                                <View style={styles.itemLeft}>
                                    <Text style={styles.itemName}>
                                        {item.product?.name || `Sản phẩm #${item.productId}`}
                                    </Text>
                                    {item.product?.sku && (
                                        <Text style={styles.itemSKU}>{item.product.sku}</Text>
                                    )}
                                </View>
                                <View style={styles.itemRight}>
                                    {isRequest ? (
                                        <Text style={styles.itemQty}>
                                            {item.expectedQuantity || 0} {item.product?.unit || 'cái'}
                                        </Text>
                                    ) : (
                                        <Text style={styles.itemQty}>
                                            {item.receivedQuantity || 0}/{item.expectedQuantity || 0} {item.product?.unit || 'cái'}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    ))}
                </Card>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Action Buttons */}
            {(canApproveReject || canCreateTicket) && (
                <View style={styles.actionBar}>
                    {canApproveReject && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.rejectButton]}
                                onPress={handleReject}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator size="small" color={COLORS.danger} />
                                ) : (
                                    <>
                                        <Feather name="x" size={18} color={COLORS.danger} />
                                        <Text style={[styles.actionButtonText, styles.rejectButtonText]}>
                                            Từ chối
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.approveButton]}
                                onPress={handleApprove}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Feather name="check" size={18} color="#fff" />
                                        <Text style={styles.actionButtonText}>Duyệt</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                    {canCreateTicket && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton, styles.fullWidth]}
                            onPress={handleCreateTicket}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Feather name="file-plus" size={18} color="#fff" />
                                    <Text style={styles.actionButtonText}>Tạo phiếu nhập kho</Text>
                                </>
                            )}
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
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    card: {
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
    },
    typeLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 8,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '700',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    infoLabel: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
        flex: 1,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    itemDivider: {
        height: 1,
        backgroundColor: COLORS.border,
    },
    itemLeft: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    itemSKU: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    itemBatch: {
        fontSize: 11,
        color: COLORS.textMuted,
    },
    itemRight: {
        alignItems: 'flex-end',
    },
    itemQty: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    itemCondition: {
        fontSize: 11,
        fontWeight: '600',
    },
    notesText: {
        fontSize: 13,
        color: COLORS.text,
        lineHeight: 20,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginTop: 20,
        marginBottom: 12,
    },
    backLink: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    actionBar: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    fullWidth: {
        flex: undefined,
        width: '100%',
    },
    approveButton: {
        backgroundColor: COLORS.primary,
    },
    rejectButton: {
        backgroundColor: COLORS.danger + '15',
        borderWidth: 1,
        borderColor: COLORS.danger + '40',
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    rejectButtonText: {
        color: COLORS.danger,
    },
});
