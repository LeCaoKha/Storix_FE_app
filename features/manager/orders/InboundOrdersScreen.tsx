import { Card, TabScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useInboundTickets } from '@/hooks/inbound-orders.hooks';
import { InboundOrder } from '@/types/inbound-order';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Status config cho Ticket
type TicketStatusKey = 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
const TICKET_STATUS_CONFIG: Record<TicketStatusKey, { label: string; color: string; bgColor: string }> = {
    Pending: { label: 'Chờ xử lý', color: COLORS.warning, bgColor: COLORS.warning + '20' },
    Processing: { label: 'Đang xử lý', color: COLORS.primary, bgColor: COLORS.primaryLight + '20' },
    Completed: { label: 'Hoàn tất', color: COLORS.success, bgColor: COLORS.success + '20' },
    Cancelled: { label: 'Đã hủy', color: COLORS.danger, bgColor: COLORS.danger + '20' },
};

const getTicketStatusConfig = (status?: string) => {
    if (!status) return TICKET_STATUS_CONFIG.Pending;
    // Handle case-insensitive status from backend
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    return TICKET_STATUS_CONFIG[normalizedStatus as TicketStatusKey] || TICKET_STATUS_CONFIG.Pending;
};

export default function InboundOrdersScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTicketStatus, setSelectedTicketStatus] = useState<TicketStatusKey | 'all'>('all');

    // Fetch only tickets (not requests)
    const { data: tickets = [], isLoading } = useInboundTickets();

    // Filter tickets
    const filteredTickets = useMemo(() => {
        let items = tickets;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(t =>
                t.referenceCode?.toLowerCase().includes(query) ||
                t.supplier?.name?.toLowerCase().includes(query) ||
                String(t.id).includes(query)
            );
        }
        if (selectedTicketStatus !== 'all') {
            items = items.filter(t => t.status === selectedTicketStatus);
        }
        return items;
    }, [tickets, searchQuery, selectedTicketStatus]);

    // Counts for tabs
    const ticketCounts = useMemo(() => ({
        all: tickets.length,
        Pending: tickets.filter(t => t.status === 'Pending').length,
        Processing: tickets.filter(t => t.status === 'Processing').length,
        Completed: tickets.filter(t => t.status === 'Completed').length,
    }), [tickets]);


    const renderTicketCard = (ticket: InboundOrder) => {
        const statusConfig = getTicketStatusConfig(ticket.status);
        return (
            <TouchableOpacity
                key={`tkt-${ticket.id}`}
                onPress={() => router.push({
                    pathname: `/(manager-tabs)/(orders-inbound)/${ticket.id}`,
                    params: { type: 'ticket' }
                } as any)}
            >
                <Card style={styles.orderCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <Text style={styles.orderNumber}>
                                {ticket.referenceCode || `INB-${ticket.id}`}
                            </Text>
                            {ticket.inboundRequestId && (
                                <Text style={styles.requisitionRef}>
                                    Từ yêu cầu #{ticket.inboundRequestId}
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
                        <Feather name="truck" size={16} color={COLORS.textMuted} />
                        <Text style={styles.cardLabel}>Nhà cung cấp:</Text>
                        <Text style={styles.cardValue}>
                            {ticket.supplier?.name || 'Chưa xác định'}
                        </Text>
                    </View>

                    {ticket.warehouse && (
                        <View style={styles.cardRow}>
                            <Feather name="home" size={16} color={COLORS.textMuted} />
                            <Text style={styles.cardLabel}>Kho:</Text>
                            <Text style={styles.cardValue}>{ticket.warehouse.name}</Text>
                        </View>
                    )}

                    <View style={styles.cardRow}>
                        <Feather name="package" size={16} color={COLORS.textMuted} />
                        <Text style={styles.cardLabel}>Sản phẩm:</Text>
                        <Text style={styles.cardValue}>
                            {ticket.inboundOrderItems?.length || 0} mặt hàng
                        </Text>
                    </View>

                    {ticket.createdAt && (
                        <View style={styles.cardRow}>
                            <Feather name="calendar" size={16} color={COLORS.textMuted} />
                            <Text style={styles.cardLabel}>Ngày tạo:</Text>
                            <Text style={styles.cardValue}>
                                {new Date(ticket.createdAt).toLocaleDateString('vi-VN')}
                            </Text>
                        </View>
                    )}
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <TabScreenHeader
                showSearch
                searchPlaceholder="Tìm theo mã đơn, nhà cung cấp..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
            >
                {/* Status tabs for tickets only */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tabsScroll}
                    contentContainerStyle={styles.tabsContainer}
                >
                    <TouchableOpacity
                        style={[styles.tab, selectedTicketStatus === 'all' && styles.tabActive]}
                        onPress={() => setSelectedTicketStatus('all')}
                    >
                        <Text style={[styles.tabText, selectedTicketStatus === 'all' && styles.tabTextActive]}>
                            Tất cả
                        </Text>
                        <View style={[styles.tabCount, selectedTicketStatus === 'all' && styles.tabCountActive]}>
                            <Text style={[styles.tabCountText, selectedTicketStatus === 'all' && styles.tabCountTextActive]}>
                                {ticketCounts.all}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTicketStatus === 'Pending' && styles.tabActive]}
                        onPress={() => setSelectedTicketStatus('Pending')}
                    >
                        <Text style={[styles.tabText, selectedTicketStatus === 'Pending' && styles.tabTextActive]}>
                            Chờ xử lý
                        </Text>
                        <View style={[styles.tabCount, selectedTicketStatus === 'Pending' && styles.tabCountActive]}>
                            <Text style={[styles.tabCountText, selectedTicketStatus === 'Pending' && styles.tabCountTextActive]}>
                                {ticketCounts.Pending}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTicketStatus === 'Processing' && styles.tabActive]}
                        onPress={() => setSelectedTicketStatus('Processing')}
                    >
                        <Text style={[styles.tabText, selectedTicketStatus === 'Processing' && styles.tabTextActive]}>
                            Đang xử lý
                        </Text>
                        <View style={[styles.tabCount, selectedTicketStatus === 'Processing' && styles.tabCountActive]}>
                            <Text style={[styles.tabCountText, selectedTicketStatus === 'Processing' && styles.tabCountTextActive]}>
                                {ticketCounts.Processing}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTicketStatus === 'Completed' && styles.tabActive]}
                        onPress={() => setSelectedTicketStatus('Completed')}
                    >
                        <Text style={[styles.tabText, selectedTicketStatus === 'Completed' && styles.tabTextActive]}>
                            Hoàn tất
                        </Text>
                        <View style={[styles.tabCount, selectedTicketStatus === 'Completed' && styles.tabCountActive]}>
                            <Text style={[styles.tabCountText, selectedTicketStatus === 'Completed' && styles.tabCountTextActive]}>
                                {ticketCounts.Completed}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </ScrollView>
            </TabScreenHeader>

            {/* Ticket List */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : filteredTickets.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Feather name="inbox" size={48} color={COLORS.border} />
                        <Text style={styles.emptyText}>Không có phiếu nhập kho</Text>
                        <Text style={styles.emptyHint}>
                            {searchQuery ? 'Thử tìm kiếm khác' : 'Phiếu nhập sẽ được tạo từ yêu cầu đã duyệt'}
                        </Text>
                    </Card>
                ) : (
                    filteredTickets.map(renderTicketCard)
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
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
    typeTag: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: '600',
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
    actionHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    actionHintText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
});
