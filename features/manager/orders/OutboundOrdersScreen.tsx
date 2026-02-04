import { Card } from '@/components';
import { COLORS } from '@/constants/color';
import { useOutboundOrders } from '@/hooks/outbound-orders.hooks';
import { OutboundStatus } from '@/types/outbound-order';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const STATUS_CONFIG: Record<OutboundStatus, { label: string; color: string; bgColor: string }> = {
    open: { label: 'Mới tạo', color: COLORS.primaryDark, bgColor: COLORS.primaryLight + '40' },
    picking: { label: 'Đang lấy hàng', color: COLORS.warning, bgColor: COLORS.warning + '20' },
    packing: { label: 'Đang đóng gói', color: COLORS.slate700, bgColor: COLORS.slate200 },
    ready: { label: 'Sẵn sàng', color: COLORS.primary, bgColor: COLORS.primaryLight + '20' },
    shipped: { label: 'Đã xuất', color: COLORS.success, bgColor: COLORS.success + '20' },
    completed: { label: 'Hoàn tất', color: COLORS.teal600, bgColor: COLORS.teal50 },
    delivered: { label: 'Đã giao', color: COLORS.success, bgColor: COLORS.success + '20' },
    on_hold: { label: 'Tạm dừng', color: COLORS.slate500, bgColor: COLORS.slate200 },
    cancelled: { label: 'Đã hủy', color: COLORS.danger, bgColor: COLORS.danger + '20' },
};

export default function OutboundOrdersScreen() {
    const router = useRouter();
    const { data: outboundOrders = [], isLoading } = useOutboundOrders();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<OutboundStatus | 'all'>('all');

    const filteredOrders = useMemo(() => {
        let orders = outboundOrders;

        // Search filter
        if (searchQuery) {
            orders = orders.filter(o =>
                o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
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
            open: outboundOrders.filter(o => o.status === 'open').length,
            picking: outboundOrders.filter(o => o.status === 'picking').length,
            completed: outboundOrders.filter(o => o.status === 'completed').length,
        };
    }, [outboundOrders]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.title}>Đơn Xuất Kho</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => router.push('/manager/orders/outbound/create')}
                    >
                        <Feather name="plus" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Feather name="search" size={18} color={COLORS.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm theo mã đơn, khách hàng..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={COLORS.textMuted}
                    />
                </View>

                {/* Status tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, selectedStatus === 'all' && styles.tabActive]}
                        onPress={() => setSelectedStatus('all')}
                    >
                        <Text style={[styles.tabText, selectedStatus === 'all' && styles.tabTextActive]}>
                            Tất cả ({statusCounts.all})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedStatus === 'open' && styles.tabActive]}
                        onPress={() => setSelectedStatus('open')}
                    >
                        <Text style={[styles.tabText, selectedStatus === 'open' && styles.tabTextActive]}>
                            Mới tạo ({statusCounts.open})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedStatus === 'picking' && styles.tabActive]}
                        onPress={() => setSelectedStatus('picking')}
                    >
                        <Text style={[styles.tabText, selectedStatus === 'picking' && styles.tabTextActive]}>
                            Đang lấy ({statusCounts.picking})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedStatus === 'completed' && styles.tabActive]}
                        onPress={() => setSelectedStatus('completed')}
                    >
                        <Text style={[styles.tabText, selectedStatus === 'completed' && styles.tabTextActive]}>
                            Hoàn tất ({statusCounts.completed})
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

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
                        const statusConfig = STATUS_CONFIG[order.status];
                        return (
                            <TouchableOpacity
                                key={order.id}
                                onPress={() => router.push(`/manager/orders/outbound/${order.id}` as any)}
                            >
                                <Card style={styles.orderCard}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.cardHeaderLeft}>
                                            <Text style={styles.orderNumber}>{order.outboundNumber}</Text>
                                            {order.requisitionNumber && (
                                                <Text style={styles.requisitionRef}>
                                                    từ {order.requisitionNumber}
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
                                        <Feather name="user" size={16} color={COLORS.textMuted} />
                                        <Text style={styles.cardLabel}>Khách hàng:</Text>
                                        <Text style={styles.cardValue}>{order.customer}</Text>
                                    </View>

                                    {order.salesOrderRef && (
                                        <View style={styles.cardRow}>
                                            <Feather name="file-text" size={16} color={COLORS.textMuted} />
                                            <Text style={styles.cardLabel}>SO:</Text>
                                            <Text style={styles.cardValue}>{order.salesOrderRef}</Text>
                                        </View>
                                    )}

                                    <View style={styles.cardRow}>
                                        <Feather name="package" size={16} color={COLORS.textMuted} />
                                        <Text style={styles.cardLabel}>Sản phẩm:</Text>
                                        <Text style={styles.cardValue}>{order.items.length} mặt hàng</Text>
                                    </View>

                                    <View style={styles.cardRow}>
                                        <Feather name="calendar" size={16} color={COLORS.textMuted} />
                                        <Text style={styles.cardLabel}>Ngày giao:</Text>
                                        <Text style={styles.cardValue}>
                                            {new Date(order.expectedShipDate).toLocaleDateString('vi-VN')}
                                        </Text>
                                    </View>
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
    tabs: {
        paddingHorizontal: 20,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: '#f5f5f5',
    },
    tabActive: {
        backgroundColor: COLORS.primary + '15',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    tabTextActive: {
        color: COLORS.primary,
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
