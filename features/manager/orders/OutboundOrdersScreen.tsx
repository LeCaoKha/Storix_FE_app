import { Card, TabScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useOutboundOrders } from '@/hooks/outbound-orders.hooks';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Status config khớp với Backend
type OutboundStatusKey = 'Pending' | 'Picking' | 'Packed' | 'Ready' | 'Shipped' | 'Completed' | 'Cancelled';
const STATUS_CONFIG: Record<OutboundStatusKey, { label: string; color: string; bgColor: string }> = {
    Pending: { label: 'Chờ xử lý', color: COLORS.warning, bgColor: COLORS.warning + '20' },
    Picking: { label: 'Đang lấy hàng', color: COLORS.primary, bgColor: COLORS.primaryLight + '20' },
    Packed: { label: 'Đã đóng gói', color: COLORS.slate700, bgColor: COLORS.slate200 },
    Ready: { label: 'Sẵn sàng', color: COLORS.teal600, bgColor: COLORS.teal50 },
    Shipped: { label: 'Đã xuất', color: COLORS.success, bgColor: COLORS.success + '20' },
    Completed: { label: 'Hoàn tất', color: COLORS.success, bgColor: COLORS.success + '20' },
    Cancelled: { label: 'Đã hủy', color: COLORS.danger, bgColor: COLORS.danger + '20' },
};

const getStatusConfig = (status?: string) => {
    return STATUS_CONFIG[status as OutboundStatusKey] || STATUS_CONFIG.Pending;
};

export default function OutboundOrdersScreen() {
    const router = useRouter();
    const { data: outboundOrders = [], isLoading } = useOutboundOrders();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<OutboundStatusKey | 'all'>('all');

    const filteredOrders = useMemo(() => {
        let orders = outboundOrders;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            orders = orders.filter(o =>
                o.destination?.toLowerCase().includes(query) ||
                String(o.id).includes(query)
            );
        }

        // Status filter
        if (selectedStatus !== 'all') {
            orders = orders.filter(o => o.status === selectedStatus);
        }

        return orders;
    }, [outboundOrders, searchQuery, selectedStatus]);

    const statusCounts = useMemo(() => {
        return {
            all: outboundOrders.length,
            Pending: outboundOrders.filter(o => o.status === 'Pending').length,
            Picking: outboundOrders.filter(o => o.status === 'Picking').length,
            Completed: outboundOrders.filter(o => o.status === 'Completed').length,
        };
    }, [outboundOrders]);

    return (
        <View style={styles.container}>
            <TabScreenHeader
                title="Đơn Xuất Kho"
                showAddButton
                onAddPress={() => router.push('/(manager-tabs)/(orders-outbound)/create')}
                showSearch
                searchPlaceholder="Tìm theo mã đơn, khách hàng..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
            >
                {/* Status tabs */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.tabsScroll}
                    contentContainerStyle={styles.tabsContainer}
                >
                    <TouchableOpacity
                        style={[styles.tab, selectedStatus === 'all' && styles.tabActive]}
                        onPress={() => setSelectedStatus('all')}
                    >
                        <Text style={[styles.tabText, selectedStatus === 'all' && styles.tabTextActive]}>
                            Tất cả
                        </Text>
                        <View style={[styles.tabCount, selectedStatus === 'all' && styles.tabCountActive]}>
                            <Text style={[styles.tabCountText, selectedStatus === 'all' && styles.tabCountTextActive]}>
                                {statusCounts.all}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedStatus === 'Pending' && styles.tabActive]}
                        onPress={() => setSelectedStatus('Pending')}
                    >
                        <Text style={[styles.tabText, selectedStatus === 'Pending' && styles.tabTextActive]}>
                            Chờ xử lý
                        </Text>
                        <View style={[styles.tabCount, selectedStatus === 'Pending' && styles.tabCountActive]}>
                            <Text style={[styles.tabCountText, selectedStatus === 'Pending' && styles.tabCountTextActive]}>
                                {statusCounts.Pending}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedStatus === 'Picking' && styles.tabActive]}
                        onPress={() => setSelectedStatus('Picking')}
                    >
                        <Text style={[styles.tabText, selectedStatus === 'Picking' && styles.tabTextActive]}>
                            Đang lấy
                        </Text>
                        <View style={[styles.tabCount, selectedStatus === 'Picking' && styles.tabCountActive]}>
                            <Text style={[styles.tabCountText, selectedStatus === 'Picking' && styles.tabCountTextActive]}>
                                {statusCounts.Picking}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedStatus === 'Completed' && styles.tabActive]}
                        onPress={() => setSelectedStatus('Completed')}
                    >
                        <Text style={[styles.tabText, selectedStatus === 'Completed' && styles.tabTextActive]}>
                            Hoàn tất
                        </Text>
                        <View style={[styles.tabCount, selectedStatus === 'Completed' && styles.tabCountActive]}>
                            <Text style={[styles.tabCountText, selectedStatus === 'Completed' && styles.tabCountTextActive]}>
                                {statusCounts.Completed}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </ScrollView>
            </TabScreenHeader>

            {/* Order List */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {filteredOrders.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Feather name="inbox" size={48} color={COLORS.border} />
                        <Text style={styles.emptyText}>Không có đơn xuất kho</Text>
                        <Text style={styles.emptyHint}>
                            {searchQuery ? 'Thử tìm kiếm khác' : 'Tạo đơn xuất kho mới để bắt đầu'}
                        </Text>
                    </Card>
                ) : (
                    filteredOrders.map(order => {
                        const statusConfig = getStatusConfig(order.status);
                        return (
                            <TouchableOpacity
                                key={order.id}
                                onPress={() => router.push(`/(manager-tabs)/(orders-outbound)/${order.id}` as any)}
                            >
                                <Card style={styles.orderCard}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.cardHeaderLeft}>
                                            <Text style={styles.orderNumber}>{`OUT-${order.id}`}</Text>
                                            {order.outboundRequestId && (
                                                <Text style={styles.requisitionRef}>
                                                    Yêu cầu #{order.outboundRequestId}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                                            <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                                {statusConfig.label}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardDivider} />

                                    <View style={styles.cardRow}>
                                        <Feather name="map-pin" size={16} color={COLORS.textMuted} />
                                        <Text style={styles.cardLabel}>Điểm đến:</Text>
                                        <Text style={styles.cardValue}>
                                            {order.destination || 'Chưa xác định'}
                                        </Text>
                                    </View>

                                    {order.warehouse && (
                                        <View style={styles.cardRow}>
                                            <Feather name="home" size={16} color={COLORS.textMuted} />
                                            <Text style={styles.cardLabel}>Kho:</Text>
                                            <Text style={styles.cardValue}>{order.warehouse.name}</Text>
                                        </View>
                                    )}

                                    <View style={styles.cardRow}>
                                        <Feather name="package" size={16} color={COLORS.textMuted} />
                                        <Text style={styles.cardLabel}>Sản phẩm:</Text>
                                        <Text style={styles.cardValue}>
                                            {order.outboundOrderItems?.length || 0} mặt hàng
                                        </Text>
                                    </View>

                                    {order.createdAt && (
                                        <View style={styles.cardRow}>
                                            <Feather name="calendar" size={16} color={COLORS.textMuted} />
                                            <Text style={styles.cardLabel}>Ngày tạo:</Text>
                                            <Text style={styles.cardValue}>
                                                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                            </Text>
                                        </View>
                                    )}
                                </Card>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        marginHorizontal: 20,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text,
    },
    tabsScroll: {
        maxHeight: 50,
    },
    tabsContainer: {
        paddingHorizontal: 20,
        paddingBottom: 12,
        gap: 8,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        gap: 8,
    },
    tabActive: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    tabTextActive: {
        color: '#fff',
    },
    tabCount: {
        backgroundColor: '#e5e7eb',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 24,
        alignItems: 'center',
    },
    tabCountActive: {
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    tabCountText: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.textMuted,
    },
    tabCountTextActive: {
        color: '#fff',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    emptyCard: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginTop: 16,
    },
    emptyHint: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    orderCard: {
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardHeaderLeft: {
        flex: 1,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    requisitionRef: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    cardDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginBottom: 12,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    cardLabel: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    cardValue: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
    },
});
