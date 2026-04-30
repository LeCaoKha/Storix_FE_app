import { Card, RefreshContainer, ScreenHeader } from '@/components';
import { getBottomSafePadding } from '@/components/ui/safeArea';
import { COLORS } from '@/constants/color';
import { useOutboundRequest, useOutboundTicket } from '@/hooks';
import {
    useUpdateOutboundRequestStatus,
} from '@/hooks/outbound-orders.hooks';
import { useAppBack } from '@/hooks/useAppBack';
import { AlertService } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import type { OutboundOrderItem } from '@/types/outbound-order';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Status config cho Request (chờ duyệt)
type OutboundRequestStatusKey = 'Pending' | 'Approved' | 'Rejected';
const REQUEST_STATUS_CONFIG: Record<OutboundRequestStatusKey, { label: string; color: string; bgColor: string }> = {
    Pending: { label: 'Chờ duyệt', color: COLORS.warning, bgColor: COLORS.warning + '20' },
    Approved: { label: 'Đã duyệt', color: COLORS.success, bgColor: COLORS.success + '20' },
    Rejected: { label: 'Từ chối', color: COLORS.danger, bgColor: COLORS.danger + '20' },
};

// Status config cho Ticket (đang xử lý) - match BE: Created→Picking→QualityCheck→IssueReported/Packing→LoadHandover→Completed
type OutboundTicketStatusKey = 'Created' | 'Picking' | 'QualityCheck' | 'IssueReported' | 'Packing' | 'LoadHandover' | 'Completed';
const TICKET_STATUS_CONFIG: Record<OutboundTicketStatusKey, { label: string; color: string; bgColor: string }> = {
    Created: { label: 'Đã tạo', color: COLORS.warning, bgColor: COLORS.warning + '20' },
    Picking: { label: 'Đang lấy hàng', color: COLORS.primary, bgColor: COLORS.primaryLight + '20' },
    QualityCheck: { label: 'Kiểm tra CL', color: COLORS.slate700, bgColor: COLORS.slate200 },
    IssueReported: { label: 'Có vấn đề', color: COLORS.danger, bgColor: COLORS.danger + '20' },
    Packing: { label: 'Đóng gói', color: COLORS.teal600, bgColor: COLORS.teal50 },
    LoadHandover: { label: 'Chờ xác nhận', color: COLORS.warning, bgColor: COLORS.warning + '20' },
    Completed: { label: 'Hoàn tất', color: COLORS.success, bgColor: COLORS.success + '20' },
};

const getRequestStatusConfig = (status?: string) => {
    return REQUEST_STATUS_CONFIG[status as OutboundRequestStatusKey] || REQUEST_STATUS_CONFIG.Pending;
};

const getTicketStatusConfig = (status?: string) => {
    return TICKET_STATUS_CONFIG[status as OutboundTicketStatusKey] || TICKET_STATUS_CONFIG.Created;
};

export default function OutboundOrderDetailScreen() {
    const router = useRouter();
    const goBack = useAppBack('/(manager-tabs)/orders');
    const { id, type = 'request' } = useLocalSearchParams<{ id: string; type?: 'request' | 'ticket' }>();
    const { user } = useAuthStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const insets = useSafeAreaInsets();

    // Fetch data based on type
    const { data: request, isLoading: requestLoading, error: requestError, refetch: refetchRequest } = useOutboundRequest(
        type === 'request' ? id : undefined
    );
    const { data: ticket, isLoading: ticketLoading, error: ticketError, refetch: refetchTicket } = useOutboundTicket(
        type === 'ticket' ? id : undefined
    );

    const handleRefresh = async () => {
        if (type === 'request') await refetchRequest();
        else await refetchTicket();
    };

    // Mutations
    const updateRequestStatus = useUpdateOutboundRequestStatus();

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
                    <TouchableOpacity onPress={goBack}>
                        <Text style={styles.backLink}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const isRequest = type === 'request';
    const statusConfig = isRequest ? getRequestStatusConfig(data.status) : getTicketStatusConfig(data.status);
    // Only Admin (roleId=2) can approve/reject outbound requests
    const isAdmin = user?.roleId === 2;
    const canApproveReject = isRequest && data.status === 'Pending' && isAdmin;
    const canCreateTicket = isRequest && data.status === 'Approved';

    // Handle approve request
    const handleApprove = () => {
        AlertService.confirm(
            'Duyệt yêu cầu',
            'Bạn có chắc chắn muốn duyệt yêu cầu xuất kho này?',
            async () => {
                try {
                    setIsProcessing(true);
                    await updateRequestStatus.mutateAsync({
                        requestId: data.id,
                        approverId: user?.id ?? 0,
                        status: 'Approved',
                    });
                    AlertService.success('Thành công', 'Yêu cầu đã được duyệt', () => {
                        goBack();
                    });
                } catch {
                    AlertService.error('Lỗi', 'Không thể duyệt yêu cầu. Vui lòng thử lại.');
                } finally {
                    setIsProcessing(false);
                }
            }
        );
    };

    // Handle reject request
    const handleReject = () => {
        AlertService.confirm(
            'Từ chối yêu cầu',
            'Bạn có chắc chắn muốn từ chối yêu cầu xuất kho này?',
            async () => {
                try {
                    setIsProcessing(true);
                    await updateRequestStatus.mutateAsync({
                        requestId: data.id,
                        approverId: user?.id ?? 0,
                        status: 'Rejected',
                    });
                    AlertService.success('Thành công', 'Yêu cầu đã bị từ chối', () => {
                        goBack();
                    });
                } catch {
                    AlertService.error('Lỗi', 'Không thể từ chối yêu cầu. Vui lòng thử lại.');
                } finally {
                    setIsProcessing(false);
                }
            }
        );
    };

    // Handle create ticket - navigate to create screen for staff selection
    const handleCreateTicket = () => {
        router.push({
            pathname: '/(manager-tabs)/(orders-outbound)/create',
            params: { requisitionId: data.id }
        } as any);
    };

    // Get items - support both DTO format (items) and raw entity format (outboundOrderItems)
    const items = (data as any).items || (data as any).outboundOrderItems || [];
    const warehouse = (data as any).warehouse;

    return (
        <View style={styles.container}>
            <ScreenHeader
                title={isRequest ? 'Chi Tiết Yêu Cầu Xuất' : 'Chi Tiết Phiếu Xuất'}
                subtitle={isRequest ? `REQ-${data.id}` : `OUT-${data.id}`}
            />

            <RefreshContainer 
                style={styles.content} 
                contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
                onRefresh={handleRefresh}
            >
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

                {/* Warehouse Location Shortcut */}
                <TouchableOpacity
                    onPress={() => router.push('/warehouse-view')}
                >
                    <Card style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}>
                        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary + '10', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            <Feather name="map" size={18} color={COLORS.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.slate800 }}>Sơ đồ kho</Text>
                            <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Nhấn để xem vị trí trên sơ đồ</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
                    </Card>
                </TouchableOpacity>


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
                    {!isRequest && ((data as any).createdByUser || (data as any).staff) && (
                        <View style={styles.infoRow}>
                            <Feather name="user" size={16} color={COLORS.textMuted} />
                            <Text style={styles.infoLabel}>Người tạo:</Text>
                            <Text style={styles.infoValue}>{(data as any).createdByUser?.email || (data as any).staff?.email || 'N/A'}</Text>
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
                                        {item.productName || item.name || item.product?.name || `Sản phẩm #${item.productId}`}
                                    </Text>
                                    {(item.sku || item.product?.sku) && (
                                        <Text style={styles.itemSKU}>{item.sku || item.product?.sku}</Text>
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
            </RefreshContainer>

            {/* Info for Manager: waiting for Admin approval */}
            {isRequest && data.status === 'Pending' && !isAdmin && (
                <View style={[styles.actionBar, { paddingBottom: getBottomSafePadding(insets.bottom, 20) }]}>
                    <View style={[styles.actionButton, { backgroundColor: '#FFF9E6', borderWidth: 1, borderColor: '#F6C90E40' }]}>
                        <Feather name="clock" size={16} color="#B8860B" />
                        <Text style={{ color: '#B8860B', fontWeight: '600', fontSize: 14 }}>
                            Đang chờ Admin duyệt yêu cầu này
                        </Text>
                    </View>
                </View>
            )}

            {/* Action Buttons */}
            {(canApproveReject || canCreateTicket) && (
                <View style={[styles.actionBar, { paddingBottom: getBottomSafePadding(insets.bottom, 20) }]}>
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
    exportRow: {
        flexDirection: 'row',
        gap: 12,
    },
    exportButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 8,
    },
    exportButtonText: {
        fontSize: 14,
        fontWeight: '600',
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
