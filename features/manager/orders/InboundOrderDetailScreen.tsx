import { Card, SafeAreaHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useInboundOrder, useUpdateInboundOrder } from '@/hooks';
import { InboundStatus } from '@/types/inbound-order';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const STATUS_CONFIG: Record<InboundStatus, { label: string; color: string; bgColor: string }> = {
    scheduled: { label: 'Đã lên lịch', color: COLORS.primaryDark, bgColor: COLORS.primaryLight + '40' },
    arrived: { label: 'Đã đến', color: COLORS.primary, bgColor: COLORS.primaryLight + '20' },
    receiving: { label: 'Đang nhận', color: COLORS.warning, bgColor: COLORS.warning + '20' },
    putaway: { label: 'Đang cất', color: COLORS.slate700, bgColor: COLORS.slate200 },
    completed: { label: 'Hoàn tất', color: COLORS.success, bgColor: COLORS.success + '20' },
    cancelled: { label: 'Đã hủy', color: COLORS.danger, bgColor: COLORS.danger + '20' },
};

export default function InboundOrderDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data: order, isLoading, error } = useInboundOrder(id);
    const updateOrder = useUpdateInboundOrder();

    if (isLoading) {
        return (
            <View style={styles.container}>
                <SafeAreaHeader showBackButton>
                    <Text style={styles.headerTitle}>Đang tải...</Text>
                </SafeAreaHeader>
            </View>
        );
    }

    if (!order || error) {
        return (
            <View style={styles.container}>
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

    const statusConfig = STATUS_CONFIG[order.status];
    const canUpdateStatus = order.status !== 'completed' && order.status !== 'cancelled';

    const handleStatusUpdate = async (newStatus: InboundStatus) => {
        try {
            await updateOrder.mutateAsync({
                id: order.id,
                updates: { status: newStatus }
            });
            Alert.alert('Thành công', 'Đã cập nhật trạng thái');
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            {/* Header */}
            <SafeAreaHeader backgroundColor="#fff" showBackButton style={styles.header}>
                <Text style={styles.headerTitle}>Chi Tiết Đơn Nhập</Text>
                <Text style={styles.headerSubtitle}>{order.inboundNumber}</Text>
            </SafeAreaHeader>

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
                </Card>

                {/* Supplier Info */}
                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>Thông Tin Nhà Cung Cấp</Text>
                    <View style={styles.infoRow}>
                        <Feather name="truck" size={16} color={COLORS.textMuted} />
                        <Text style={styles.infoLabel}>Nhà cung cấp:</Text>
                        <Text style={styles.infoValue}>{order.supplier}</Text>
                    </View>
                    {order.supplierContact && (
                        <View style={styles.infoRow}>
                            <Feather name="phone" size={16} color={COLORS.textMuted} />
                            <Text style={styles.infoLabel}>Liên hệ:</Text>
                            <Text style={styles.infoValue}>{order.supplierContact}</Text>
                        </View>
                    )}
                    {order.poReference && (
                        <View style={styles.infoRow}>
                            <Feather name="file-text" size={16} color={COLORS.textMuted} />
                            <Text style={styles.infoLabel}>PO:</Text>
                            <Text style={styles.infoValue}>{order.poReference}</Text>
                        </View>
                    )}
                </Card>

                {/* Dates */}
                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>Thời Gian</Text>
                    <View style={styles.infoRow}>
                        <Feather name="calendar" size={16} color={COLORS.textMuted} />
                        <Text style={styles.infoLabel}>Dự kiến:</Text>
                        <Text style={styles.infoValue}>
                            {new Date(order.expectedArrivalDate).toLocaleDateString('vi-VN')}
                        </Text>
                    </View>
                    {order.actualArrivalDate && (
                        <View style={styles.infoRow}>
                            <Feather name="check-circle" size={16} color={COLORS.textMuted} />
                            <Text style={styles.infoLabel}>Thực tế:</Text>
                            <Text style={styles.infoValue}>
                                {new Date(order.actualArrivalDate).toLocaleDateString('vi-VN')}
                            </Text>
                        </View>
                    )}
                </Card>

                {/* Items */}
                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>Sản Phẩm ({order.items.length})</Text>
                    {order.items.map((item, index) => (
                        <View key={item.id}>
                            {index > 0 && <View style={styles.itemDivider} />}
                            <View style={styles.itemRow}>
                                <View style={styles.itemLeft}>
                                    <Text style={styles.itemName}>{item.productName}</Text>
                                    <Text style={styles.itemSKU}>{item.sku}</Text>
                                    {item.batchNumber && (
                                        <Text style={styles.itemBatch}>Lô: {item.batchNumber}</Text>
                                    )}
                                </View>
                                <View style={styles.itemRight}>
                                    <Text style={styles.itemQty}>
                                        {item.receivedQty}/{item.expectedQty} {item.unit}
                                    </Text>
                                    {item.condition && (
                                        <Text style={[
                                            styles.itemCondition,
                                            { color: item.condition === 'good' ? COLORS.success : COLORS.danger }
                                        ]}>
                                            {item.condition === 'good' ? 'Tốt' : 'Lỗi'}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    ))}
                </Card>

                {order.notes && (
                    <Card style={styles.card}>
                        <Text style={styles.cardTitle}>Ghi Chú</Text>
                        <Text style={styles.notesText}>{order.notes}</Text>
                    </Card>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Quick Actions */}
            {canUpdateStatus && (
                <View style={styles.actionBar}>
                    {order.status === 'scheduled' && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleStatusUpdate('arrived')}
                        >
                            <Feather name="check" size={18} color="#fff" />
                            <Text style={styles.actionButtonText}>Đánh dấu đã đến</Text>
                        </TouchableOpacity>
                    )}
                    {order.status === 'arrived' && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleStatusUpdate('receiving')}
                        >
                            <Feather name="package" size={18} color="#fff" />
                            <Text style={styles.actionButtonText}>Bắt đầu nhận hàng</Text>
                        </TouchableOpacity>
                    )}
                    {order.status === 'receiving' && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleStatusUpdate('completed')}
                        >
                            <Feather name="check-circle" size={18} color="#fff" />
                            <Text style={styles.actionButtonText}>Hoàn tất</Text>
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
    actionButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
});
