import { Card, TabScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useOutboundRequests, useOutboundTickets } from '@/hooks/outbound-orders.hooks';
import { OutboundOrder, OutboundRequest } from '@/types/outbound-order';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// View mode - Requests (chờ duyệt) hoặc Tickets (đã duyệt, đang xử lý)
type ViewMode = 'requests' | 'tickets';

// Status config cho Request
type RequestStatusKey = 'Pending' | 'Approved' | 'Rejected';
const REQUEST_STATUS_CONFIG: Record<RequestStatusKey, { label: string; color: string; bgColor: string }> = {
    Pending: { label: 'Chờ duyệt', color: COLORS.warning, bgColor: COLORS.warning + '20' },
    Approved: { label: 'Đã duyệt', color: COLORS.success, bgColor: COLORS.success + '20' },
    Rejected: { label: 'Từ chối', color: COLORS.danger, bgColor: COLORS.danger + '20' },
};

// Status config cho Ticket - theo BE
// BE statuses: Created -> Picking -> QualityCheck -> IssueReported/Packing -> LoadHandover -> Completed
type TicketStatusKey = 'Created' | 'Picking' | 'QualityCheck' | 'IssueReported' | 'Packing' | 'LoadHandover' | 'Completed';
const TICKET_STATUS_CONFIG: Record<TicketStatusKey, { label: string; color: string; bgColor: string }> = {
    Created: { label: 'Chờ xử lý', color: COLORS.warning, bgColor: COLORS.warning + '20' },
    Picking: { label: 'Đang lấy hàng', color: COLORS.primary, bgColor: COLORS.primaryLight + '20' },
    QualityCheck: { label: 'Kiểm tra CL', color: COLORS.slate700, bgColor: COLORS.slate200 },
    IssueReported: { label: 'Có vấn đề', color: COLORS.danger, bgColor: COLORS.danger + '20' },
    Packing: { label: 'Đóng gói', color: COLORS.teal600, bgColor: COLORS.teal50 },
    LoadHandover: { label: 'Bàn giao', color: COLORS.success, bgColor: COLORS.success + '20' },
    Completed: { label: 'Hoàn tất', color: COLORS.success, bgColor: COLORS.success + '20' },
};

const getRequestStatusConfig = (status?: string) => {
    return REQUEST_STATUS_CONFIG[status as RequestStatusKey] || REQUEST_STATUS_CONFIG.Pending;
};

const getTicketStatusConfig = (status?: string) => {
    if (!status) return TICKET_STATUS_CONFIG.Created;
    // Normalize status từ BE
    const normalizedStatus = status.trim();
    if (normalizedStatus in TICKET_STATUS_CONFIG) {
        return TICKET_STATUS_CONFIG[normalizedStatus as TicketStatusKey];
    }
    // Fallback
    return TICKET_STATUS_CONFIG.Created;
};

export default function OutboundOrdersScreen() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<ViewMode>('tickets');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequestStatus, setSelectedRequestStatus] = useState<RequestStatusKey | 'all'>('all');
    const [selectedTicketStatus, setSelectedTicketStatus] = useState<'all' | 'Created' | 'InProgress' | 'Completed'>('all');

    // Fetch both requests and tickets
    const { data: requests = [], isLoading: requestsLoading } = useOutboundRequests();
    const { data: tickets = [], isLoading: ticketsLoading } = useOutboundTickets();

    const isLoading = requestsLoading || ticketsLoading;

    // Filter requests
    const filteredRequests = useMemo(() => {
        let items = requests;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(r =>
                String(r.id).includes(query) ||
                (r as any).destination?.toLowerCase().includes(query)
            );
        }
        if (selectedRequestStatus !== 'all') {
            items = items.filter(r => r.status === selectedRequestStatus);
        }
        return items;
    }, [requests, searchQuery, selectedRequestStatus]);

    // Filter tickets
    const filteredTickets = useMemo(() => {
        let items = tickets;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(t =>
                t.destination?.toLowerCase().includes(query) ||
                String(t.id).includes(query)
            );
        }
        if (selectedTicketStatus !== 'all') {
            if (selectedTicketStatus === 'Created') {
                items = items.filter(t => t.status === 'Created');
            } else if (selectedTicketStatus === 'InProgress') {
                items = items.filter(t => 
                    t.status === 'Picking' || 
                    t.status === 'QualityCheck' || 
                    t.status === 'IssueReported' || 
                    t.status === 'Packing' || 
                    t.status === 'LoadHandover'
                );
            } else if (selectedTicketStatus === 'Completed') {
                items = items.filter(t => t.status === 'Completed');
            }
        }
        return items;
    }, [tickets, searchQuery, selectedTicketStatus]);

    // Counts for tabs
    const requestCounts = useMemo(() => ({
        all: requests.length,
        Pending: requests.filter(r => r.status === 'Pending').length,
        Approved: requests.filter(r => r.status === 'Approved').length,
    }), [requests]);

    const ticketCounts = useMemo(() => ({
        all: tickets.length,
        Created: tickets.filter(t => t.status === 'Created').length,
        InProgress: tickets.filter(t => 
            t.status === 'Picking' || 
            t.status === 'QualityCheck' || 
            t.status === 'IssueReported' || 
            t.status === 'Packing' || 
            t.status === 'LoadHandover'
        ).length,
        Completed: tickets.filter(t => t.status === 'Completed').length,
    }), [tickets]);

    const renderRequestCard = (request: OutboundRequest) => {
        const statusConfig = getRequestStatusConfig(request.status);
        return (
            <TouchableOpacity
                key={`req-${request.id}`}
                onPress={() => router.push({
                    pathname: `/(manager-tabs)/(orders-outbound)/${request.id}`,
                    params: { type: 'request' }
                } as any)}
            >
                <Card style={styles.orderCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <Text style={styles.orderNumber}>REQ-{request.id}</Text>
                            <Text style={styles.typeTag}>Yêu cầu xuất kho</Text>
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
                            {(request as any).destination || 'Chưa xác định'}
                        </Text>
                    </View>

                    {request.warehouse && (
                        <View style={styles.cardRow}>
                            <Feather name="home" size={16} color={COLORS.textMuted} />
                            <Text style={styles.cardLabel}>Kho:</Text>
                            <Text style={styles.cardValue}>{request.warehouse.name}</Text>
                        </View>
                    )}

                    <View style={styles.cardRow}>
                        <Feather name="package" size={16} color={COLORS.textMuted} />
                        <Text style={styles.cardLabel}>Sản phẩm:</Text>
                        <Text style={styles.cardValue}>
                            {((request as any).items || request.outboundOrderItems)?.length || 0} mặt hàng
                        </Text>
                    </View>

                    {request.createdAt && (
                        <View style={styles.cardRow}>
                            <Feather name="calendar" size={16} color={COLORS.textMuted} />
                            <Text style={styles.cardLabel}>Ngày tạo:</Text>
                            <Text style={styles.cardValue}>
                                {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                            </Text>
                        </View>
                    )}
                </Card>
            </TouchableOpacity>
        );
    };

    const renderTicketCard = (ticket: OutboundOrder) => {
        const statusConfig = getTicketStatusConfig(ticket.status);
        return (
            <TouchableOpacity
                key={`tkt-${ticket.id}`}
                onPress={() => router.push({
                    pathname: `/(manager-tabs)/(orders-outbound)/${ticket.id}`,
                    params: { type: 'ticket' }
                } as any)}
            >
                <Card style={styles.orderCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <Text style={styles.orderNumber}>OUT-{ticket.id}</Text>
                            {ticket.outboundRequestId && (
                                <Text style={styles.requisitionRef}>
                                    Từ yêu cầu #{ticket.outboundRequestId}
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
                            {ticket.destination || 'Chưa xác định'}
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
                            {((ticket as any).items || ticket.outboundOrderItems)?.length || 0} mặt hàng
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
                showAddButton
                onAddPress={() => router.push('/(manager-tabs)/(orders-outbound)/create')}
                showSearch
                searchPlaceholder="Tìm theo mã đơn, khách hàng..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
            >
                {/* View Mode Toggle */}
                <View style={styles.viewModeContainer}>
                    <TouchableOpacity
                        style={[styles.viewModeTab, viewMode === 'requests' && styles.viewModeTabActive]}
                        onPress={() => setViewMode('requests')}
                    >
                        <Feather name="file-text" size={16} color={viewMode === 'requests' ? '#fff' : COLORS.textMuted} />
                        <Text style={[styles.viewModeText, viewMode === 'requests' && styles.viewModeTextActive]}>
                            Yêu cầu ({requestCounts.all})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.viewModeTab, viewMode === 'tickets' && styles.viewModeTabActive]}
                        onPress={() => setViewMode('tickets')}
                    >
                        <Feather name="clipboard" size={16} color={viewMode === 'tickets' ? '#fff' : COLORS.textMuted} />
                        <Text style={[styles.viewModeText, viewMode === 'tickets' && styles.viewModeTextActive]}>
                            Phiếu xuất ({ticketCounts.all})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Status tabs based on view mode */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tabsScroll}
                    contentContainerStyle={styles.tabsContainer}
                >
                    {viewMode === 'requests' ? (
                        <>
                            <TouchableOpacity
                                style={[styles.tab, selectedRequestStatus === 'all' && styles.tabActive]}
                                onPress={() => setSelectedRequestStatus('all')}
                            >
                                <Text style={[styles.tabText, selectedRequestStatus === 'all' && styles.tabTextActive]}>
                                    Tất cả
                                </Text>
                                <View style={[styles.tabCount, selectedRequestStatus === 'all' && styles.tabCountActive]}>
                                    <Text style={[styles.tabCountText, selectedRequestStatus === 'all' && styles.tabCountTextActive]}>
                                        {requestCounts.all}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, selectedRequestStatus === 'Pending' && styles.tabActive]}
                                onPress={() => setSelectedRequestStatus('Pending')}
                            >
                                <Text style={[styles.tabText, selectedRequestStatus === 'Pending' && styles.tabTextActive]}>
                                    Chờ duyệt
                                </Text>
                                <View style={[styles.tabCount, selectedRequestStatus === 'Pending' && styles.tabCountActive]}>
                                    <Text style={[styles.tabCountText, selectedRequestStatus === 'Pending' && styles.tabCountTextActive]}>
                                        {requestCounts.Pending}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, selectedRequestStatus === 'Approved' && styles.tabActive]}
                                onPress={() => setSelectedRequestStatus('Approved')}
                            >
                                <Text style={[styles.tabText, selectedRequestStatus === 'Approved' && styles.tabTextActive]}>
                                    Đã duyệt
                                </Text>
                                <View style={[styles.tabCount, selectedRequestStatus === 'Approved' && styles.tabCountActive]}>
                                    <Text style={[styles.tabCountText, selectedRequestStatus === 'Approved' && styles.tabCountTextActive]}>
                                        {requestCounts.Approved}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
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
                                style={[styles.tab, selectedTicketStatus === 'Created' && styles.tabActive]}
                                onPress={() => setSelectedTicketStatus('Created')}
                            >
                                <Text style={[styles.tabText, selectedTicketStatus === 'Created' && styles.tabTextActive]}>
                                    Chờ xử lý
                                </Text>
                                <View style={[styles.tabCount, selectedTicketStatus === 'Created' && styles.tabCountActive]}>
                                    <Text style={[styles.tabCountText, selectedTicketStatus === 'Created' && styles.tabCountTextActive]}>
                                        {ticketCounts.Created}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, selectedTicketStatus === 'InProgress' && styles.tabActive]}
                                onPress={() => setSelectedTicketStatus('InProgress')}
                            >
                                <Text style={[styles.tabText, selectedTicketStatus === 'InProgress' && styles.tabTextActive]}>
                                    Đang xử lý
                                </Text>
                                <View style={[styles.tabCount, selectedTicketStatus === 'InProgress' && styles.tabCountActive]}>
                                    <Text style={[styles.tabCountText, selectedTicketStatus === 'InProgress' && styles.tabCountTextActive]}>
                                        {ticketCounts.InProgress}
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
                        </>
                    )}
                </ScrollView>
            </TabScreenHeader>

            {/* Order List */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : viewMode === 'requests' ? (
                    filteredRequests.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Feather name="inbox" size={48} color={COLORS.border} />
                            <Text style={styles.emptyText}>Không có yêu cầu xuất kho</Text>
                            <Text style={styles.emptyHint}>
                                {searchQuery ? 'Thử tìm kiếm khác' : 'Tạo yêu cầu xuất kho mới để bắt đầu'}
                            </Text>
                        </Card>
                    ) : (
                        filteredRequests.map(renderRequestCard)
                    )
                ) : (
                    filteredTickets.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Feather name="inbox" size={48} color={COLORS.border} />
                            <Text style={styles.emptyText}>Không có phiếu xuất kho</Text>
                            <Text style={styles.emptyHint}>
                                {searchQuery ? 'Thử tìm kiếm khác' : 'Phiếu xuất sẽ được tạo từ yêu cầu đã duyệt'}
                            </Text>
                        </Card>
                    ) : (
                        filteredTickets.map(renderTicketCard)
                    )
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
    viewModeContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        padding: 4,
    },
    viewModeTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    viewModeTabActive: {
        backgroundColor: COLORS.primary,
    },
    viewModeText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    viewModeTextActive: {
        color: '#fff',
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
});
