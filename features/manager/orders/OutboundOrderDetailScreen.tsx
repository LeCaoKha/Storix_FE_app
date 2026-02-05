import { Card, ScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useOutboundRequest, useOutboundTicket } from '@/hooks';
import {
    useConfirmOutboundOrder,
    useCreateOutboundTicket,
    useUpdateOutboundRequestStatus,
} from '@/hooks/outbound-orders.hooks';
import { useAuthStore } from '@/stores/auth.store';
import type { OutboundOrderItem } from '@/types/outbound-order';
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
type OutboundRequestStatusKey = 'Pending' | 'Approved' | 'Rejected';
const REQUEST_STATUS_CONFIG: Record<OutboundRequestStatusKey, { label: string; color: string; bgColor: string }> = {
    Pending: { label: 'Chờ duyệt', color: COLORS.warning, bgColor: COLORS.warning + '20' },
    Approved: { label: 'Đã duyệt', color: COLORS.success, bgColor: COLORS.success + '20' },
    Rejected: { label: 'Từ chối', color: COLORS.danger, bgColor: COLORS.danger + '20' },
};

// Status config cho Ticket (đang xử lý)
type OutboundTicketStatusKey = 'Pending' | 'Picking' | 'Packed' | 'Ready' | 'Shipped' | 'Completed' | 'Cancelled';
const TICKET_STATUS_CONFIG: Record<OutboundTicketStatusKey, { label: string; color: string; bgColor: string }> = {
    Pending: { label: 'Chờ xử lý', color: COLORS.warning, bgColor: COLORS.warning + '20' },
    Picking: { label: 'Đang lấy hàng', color: COLORS.primary, bgColor: COLORS.primaryLight + '20' },
    Packed: { label: 'Đã đóng gói', color: COLORS.slate700, bgColor: COLORS.slate200 },
    Ready: { label: 'Sẵn sàng', color: COLORS.teal600, bgColor: COLORS.teal50 },
    Shipped: { label: 'Đã xuất', color: COLORS.success, bgColor: COLORS.success + '20' },
    Completed: { label: 'Hoàn tất', color: COLORS.success, bgColor: COLORS.success + '20' },
    Cancelled: { label: 'Đã hủy', color: COLORS.danger, bgColor: COLORS.danger + '20' },
};

const getRequestStatusConfig = (status?: string) => {
    return REQUEST_STATUS_CONFIG[status as OutboundRequestStatusKey] || REQUEST_STATUS_CONFIG.Pending;
};

const getTicketStatusConfig = (status?: string) => {
    return TICKET_STATUS_CONFIG[status as OutboundTicketStatusKey] || TICKET_STATUS_CONFIG.Pending;
};

export default function OutboundOrderDetailScreen() {
    const router = useRouter();
    const { id, type = 'request' } = useLocalSearchParams<{ id: string; type?: 'request' | 'ticket' }>();
    const { user } = useAuthStore();
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch data based on type
    const { data: request, isLoading: requestLoading, error: requestError } = useOutboundRequest(
        type === 'request' ? id : undefined
    );
    const { data: ticket, isLoading: ticketLoading, error: ticketError } = useOutboundTicket(
        type === 'ticket' ? id : undefined
    );

    // Mutations
    const updateRequestStatus = useUpdateOutboundRequestStatus();
    const createTicket = useCreateOutboundTicket();
    const confirmOrder = useConfirmOutboundOrder();

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
                    <Text style={styles.errorTitle}>Không tìm thấy đơn xuất kho</Text>
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
    const canConfirmComplete = !isRequest && data.status === 'Ready';

    // Handle approve request
    const handleApprove = () => {
        Alert.alert(
            'Duyệt yêu cầu',
            'Bạn có chắc chắn muốn duyệt yêu cầu xuất kho này?',
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
            'Bạn có chắc chắn muốn từ chối yêu cầu xuất kho này?',
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
            'Tạo phiếu xuất kho',
            'Tạo phiếu xuất kho từ yêu cầu đã duyệt?',
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
                            Alert.alert('Thành công', 'Đã tạo phiếu xuất kho', [
                                { text: 'OK', onPress: () => router.back() },
                            ]);
                        } catch {
                            Alert.alert('Lỗi', 'Không thể tạo phiếu xuất kho. Vui lòng thử lại.');
                        } finally {
                            setIsProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    // Handle confirm complete
    const handleConfirmComplete = () => {
        Alert.alert(
            'Xác nhận hoàn tất',
            'Xác nhận đơn xuất kho đã hoàn tất?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận',
                    style: 'default',
                    onPress: async () => {
                        try {
                            setIsProcessing(true);
                            await confirmOrder.mutateAsync({
                                ticketId: data.id,
                                performedBy: user?.id ?? 0,
                            });
                            Alert.alert('Thành công', 'Đơn xuất kho đã hoàn tất', [
                                { text: 'OK', onPress: () => router.back() },
                            ]);
                        } catch {
                            Alert.alert('Lỗi', 'Không thể xác nhận hoàn tất. Vui lòng thử lại.');
                        } finally {
                            setIsProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    // Get items - support both request and ticket structure
    const items = (data as any).outboundOrderItems || [];
    const warehouse = (data as any).warehouse;

    return (
        <View style={styles.container}>
            <ScreenHeader
                title={isRequest ? 'Chi Tiết Yêu Cầu Xuất' : 'Chi Tiết Phiếu Xuất'}
                subtitle={isRequest ? `REQ-${data.id}` : `OUT-${data.id}`}
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
                        {isRequest ? 'Yêu cầu xuất kho' : 'Phiếu xuất kho'}
                    </Text>
                </Card>

                {/* Destination Info */}
                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>Thông Tin Xuất Kho</Text>
                    <View style={styles.infoRow}>
                        <Feather name="map-pin" size={16} color={COLORS.textMuted} />
                        <Text style={styles.infoLabel}>Điểm đến:</Text>
                        <Text style={styles.infoValue}>
                            {(data as any).destination || 'Chưa xác định'}
                        </Text>
                    </View>
                    {warehouse && (
                        <View style={styles.infoRow}>
                            <Feather name="home" size={16} color={COLORS.textMuted} />
                            <Text style={styles.infoLabel}>Kho:</Text>
                            <Text style={styles.infoValue}>{warehouse.name}</Text>
                        </View>
                    )}
                    {!isRequest && (data as any).outboundRequestId && (
                        <View style={styles.infoRow}>
                            <Feather name="file-text" size={16} color={COLORS.textMuted} />
                            <Text style={styles.infoLabel}>Yêu cầu:</Text>
                            <Text style={styles.infoValue}>#{(data as any).outboundRequestId}</Text>
                        </View>
                    )}
                </Card>

                {/* Time Info */}
                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>Thông Tin Thời Gian</Text>
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
                    {!isRequest && (data as any).staff && (
                        <View style={styles.infoRow}>
                            <Feather name="user" size={16} color={COLORS.textMuted} />
                            <Text style={styles.infoLabel}>Nhân viên:</Text>
                            <Text style={styles.infoValue}>{(data as any).staff.email}</Text>
                        </View>
                    )}
                </Card>

                {/* Items */}
                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>
                        Sản Phẩm ({items.length})
                    </Text>
                    {items.map((item: OutboundOrderItem, index: number) => (
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
                                    <Text style={styles.itemQty}>
                                        {item.quantity || 0} {item.product?.unit || 'cái'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </Card>

                {(data as any).note && (
                    <Card style={styles.card}>
                        <Text style={styles.cardTitle}>Ghi Chú</Text>
                        <Text style={styles.notesText}>{(data as any).note}</Text>
                    </Card>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Action Buttons */}
            {(canApproveReject || canCreateTicket || canConfirmComplete) && (
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
                                    <Text style={styles.actionButtonText}>Tạo phiếu xuất kho</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                    {canConfirmComplete && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton, styles.fullWidth]}
                            onPress={handleConfirmComplete}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Feather name="check-circle" size={18} color="#fff" />
                                    <Text style={styles.actionButtonText}>Xác nhận hoàn tất</Text>
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
    itemLocation: {
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
        backgroundColor: COLORS.card,
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
