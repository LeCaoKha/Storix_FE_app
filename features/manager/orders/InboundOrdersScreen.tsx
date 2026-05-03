import { Card, RefreshContainer, TabScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useInboundRequests, useInboundTickets } from '@/hooks/inbound-orders.hooks';
import { InboundOrder, InboundRequest } from '@/types/inbound-order';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';

// Status config cho Request
type RequestStatusKey = 'Pending' | 'Approved' | 'Rejected' | 'Transported';
const REQUEST_STATUS_CONFIG: Record<RequestStatusKey, { label: string; color: string; bgColor: string }> = {
    Pending: { label: 'pending', color: COLORS.warning, bgColor: COLORS.warning + '20' },
    Approved: { label: 'approved', color: COLORS.success, bgColor: COLORS.success + '20' },
    Rejected: { label: 'rejected', color: COLORS.danger, bgColor: COLORS.danger + '20' },
    Transported: { label: 'transported', color: COLORS.primary, bgColor: COLORS.primaryLight + '20' },
};

// Status config cho Ticket - theo BE
// BE statuses: 'Waiting for payment', 'Partially Completed', 'Completed'
type TicketStatusKey = 'Waiting for payment' | 'Partially Completed' | 'Completed';
const TICKET_STATUS_CONFIG: Record<TicketStatusKey, { label: string; color: string; bgColor: string }> = {
    'Waiting for payment': { label: 'awaitingReceive', color: COLORS.warning, bgColor: COLORS.warning + '20' },
    'Partially Completed': { label: 'inProgress', color: COLORS.primary, bgColor: COLORS.primaryLight + '20' },
    'Completed': { label: 'completed', color: COLORS.success, bgColor: COLORS.success + '20' },
};

const getRequestStatusConfig = (status?: string) => {
    if (!status) return REQUEST_STATUS_CONFIG.Pending;
    return REQUEST_STATUS_CONFIG[status as RequestStatusKey] || REQUEST_STATUS_CONFIG.Pending;
};

const getTicketStatusConfig = (status?: string) => {
    if (!status) return TICKET_STATUS_CONFIG['Waiting for payment'];
    // Normalize status từ BE
    const normalizedStatus = status.trim();
    if (normalizedStatus in TICKET_STATUS_CONFIG) {
        return TICKET_STATUS_CONFIG[normalizedStatus as TicketStatusKey];
    }
    // Fallback mapping cho các status cũ
    if (normalizedStatus.toLowerCase() === 'pending' || normalizedStatus.toLowerCase() === 'processing') {
        return TICKET_STATUS_CONFIG['Waiting for payment'];
    }
    return TICKET_STATUS_CONFIG['Waiting for payment'];
};

type ViewMode = 'requests' | 'tickets';

export default function InboundOrdersScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeView, setActiveView] = useState<ViewMode>('requests');
    const [selectedRequestStatus, setSelectedRequestStatus] = useState<RequestStatusKey | 'all'>('all');
    const [selectedTicketStatus, setSelectedTicketStatus] = useState<TicketStatusKey | 'all'>('all');

    const { data: requests = [], isLoading: requestsLoading, refetch: refetchRequests } = useInboundRequests();
    const { data: tickets = [], isLoading: ticketsLoading, refetch: refetchTickets } = useInboundTickets();
    const isLoading = requestsLoading || ticketsLoading;

    const handleRefresh = async () => {
        await Promise.all([
            refetchRequests(),
            refetchTickets()
        ]);
    };

    // Filter requests
    const filteredRequests = useMemo(() => {
        let items = requests;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(r =>
                String(r.id).includes(query) ||
                (r as any).supplier?.name?.toLowerCase().includes(query) ||
                (r as any).warehouse?.name?.toLowerCase().includes(query)
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

    const requestCounts = useMemo(() => ({
        all: requests.length,
        Pending: requests.filter(r => r.status === 'Pending').length,
        Approved: requests.filter(r => r.status === 'Approved').length,
        Transported: requests.filter(r => r.status === 'Transported').length,
    }), [requests]);

    const ticketCounts = useMemo(() => ({
        all: tickets.length,
        'Waiting for payment': tickets.filter(t => t.status === 'Waiting for payment').length,
        'Partially Completed': tickets.filter(t => t.status === 'Partially Completed').length,
        Completed: tickets.filter(t => t.status === 'Completed').length,
    }), [tickets]);

    const renderRequestCard = (request: InboundRequest) => {
        const statusConfig = getRequestStatusConfig(request.status);
        return (
            <TouchableOpacity
                key={`req-${request.id}`}
                onPress={() => router.push({
                    pathname: `/(manager-tabs)/(orders-inbound)/${request.id}`,
                    params: { type: 'request' }
                } as any)}
            >
                <Card style={styles.orderCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <Text style={styles.orderNumber}>REQ-{request.id}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                            <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                {t(`common.${statusConfig.label}`)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cardDivider} />

                    {(request as any).supplier && (
                        <View style={styles.cardRow}>
                            <Feather name="truck" size={16} color={COLORS.textMuted} />
                            <Text style={styles.cardLabel}>{t('inbound.supplier')}:</Text>
                            <Text style={styles.cardValue}>{(request as any).supplier.name}</Text>
                        </View>
                    )}

                    {(request as any).warehouse && (
                        <View style={styles.cardRow}>
                            <Feather name="home" size={16} color={COLORS.textMuted} />
                            <Text style={styles.cardLabel}>{t('tasks.warehouse')}:</Text>
                            <Text style={styles.cardValue}>{(request as any).warehouse.name}</Text>
                        </View>
                    )}

                    <View style={styles.cardRow}>
                        <Feather name="package" size={16} color={COLORS.textMuted} />
                        <Text style={styles.cardLabel}>{t('common.product')}:</Text>
                        <Text style={styles.cardValue}>
                            {request.inboundOrderItems?.length || 0} {t('common.item').toLowerCase()}
                        </Text>
                    </View>

                    {request.createdAt && (
                        <View style={styles.cardRow}>
                            <Feather name="calendar" size={16} color={COLORS.textMuted} />
                            <Text style={styles.cardLabel}>{t('tasks.createdBy')}:</Text>
                            <Text style={styles.cardValue}>
                                {new Date(request.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                </Card>
            </TouchableOpacity>
        );
    };

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
                                    {t('tasks.inbound')} #{ticket.inboundRequestId}
                                </Text>
                            )}
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                            <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                {t(`common.${statusConfig.label}`)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.cardRow}>
                        <Feather name="truck" size={16} color={COLORS.textMuted} />
                        <Text style={styles.cardLabel}>{t('inbound.supplier')}:</Text>
                        <Text style={styles.cardValue}>
                            {ticket.supplier?.name || t('common.noData')}
                        </Text>
                    </View>

                    {ticket.warehouse && (
                        <View style={styles.cardRow}>
                            <Feather name="home" size={16} color={COLORS.textMuted} />
                            <Text style={styles.cardLabel}>{t('tasks.warehouse')}:</Text>
                            <Text style={styles.cardValue}>{ticket.warehouse.name}</Text>
                        </View>
                    )}

                    <View style={styles.cardRow}>
                        <Feather name="package" size={16} color={COLORS.textMuted} />
                        <Text style={styles.cardLabel}>{t('common.product')}:</Text>
                        <Text style={styles.cardValue}>
                            {ticket.inboundOrderItems?.length || 0} {t('common.item').toLowerCase()}
                        </Text>
                    </View>

                    {ticket.createdAt && (
                        <View style={styles.cardRow}>
                            <Feather name="calendar" size={16} color={COLORS.textMuted} />
                            <Text style={styles.cardLabel}>{t('tasks.createdBy')}:</Text>
                            <Text style={styles.cardValue}>
                                {new Date(ticket.createdAt).toLocaleDateString()}
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
                searchPlaceholder={t('common.search')}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                useTopSafeArea={false}
            >
                {/* View toggle: Requests vs Tickets */}
                <View style={styles.viewToggle}>
                    <TouchableOpacity
                        style={[styles.viewToggleBtn, activeView === 'requests' && styles.viewToggleBtnActive]}
                        onPress={() => setActiveView('requests')}
                    >
                        <Text style={[styles.viewToggleBtnText, activeView === 'requests' && styles.viewToggleBtnTextActive]}>
                            {t('tasks.inbound')} ({requests.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.viewToggleBtn, activeView === 'tickets' && styles.viewToggleBtnActive]}
                        onPress={() => setActiveView('tickets')}
                    >
                        <Text style={[styles.viewToggleBtnText, activeView === 'tickets' && styles.viewToggleBtnTextActive]}>
                            {t('inbound.ticketTitle')} ({tickets.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Status filter sub-tabs */}
                {activeView === 'requests' ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.tabsScroll}
                        contentContainerStyle={styles.tabsContainer}
                    >
                        {[
                            { key: 'all' as const, label: t('common.all'), count: requestCounts.all },
                            { key: 'Pending' as const, label: t('common.pending'), count: requestCounts.Pending },
                            { key: 'Approved' as const, label: t('common.approved'), count: requestCounts.Approved },
                            { key: 'Transported' as const, label: t('common.transported'), count: requestCounts.Transported },
                        ].map(({ key, label, count }) => (
                            <TouchableOpacity
                                key={key}
                                style={[styles.tab, selectedRequestStatus === key && styles.tabActive]}
                                onPress={() => setSelectedRequestStatus(key)}
                            >
                                <Text style={[styles.tabText, selectedRequestStatus === key && styles.tabTextActive]}>{label}</Text>
                                <View style={[styles.tabCount, selectedRequestStatus === key && styles.tabCountActive]}>
                                    <Text style={[styles.tabCountText, selectedRequestStatus === key && styles.tabCountTextActive]}>{count}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                ) : (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.tabsScroll}
                        contentContainerStyle={styles.tabsContainer}
                    >
                        {[
                            { key: 'all' as const, label: t('common.all'), count: ticketCounts.all },
                            { key: 'Waiting for payment' as const, label: t('common.awaitingReceive'), count: ticketCounts['Waiting for payment'] },
                            { key: 'Partially Completed' as const, label: t('common.inProgress'), count: ticketCounts['Partially Completed'] },
                            { key: 'Completed' as const, label: t('common.completed'), count: ticketCounts.Completed },
                        ].map(({ key, label, count }) => (
                            <TouchableOpacity
                                key={key}
                                style={[styles.tab, selectedTicketStatus === key && styles.tabActive]}
                                onPress={() => setSelectedTicketStatus(key)}
                            >
                                <Text style={[styles.tabText, selectedTicketStatus === key && styles.tabTextActive]}>{label}</Text>
                                <View style={[styles.tabCount, selectedTicketStatus === key && styles.tabCountActive]}>
                                    <Text style={[styles.tabCountText, selectedTicketStatus === key && styles.tabCountTextActive]}>{count}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </TabScreenHeader>

            {/* Content */}
            <RefreshContainer 
                style={styles.content} 
                contentContainerStyle={styles.contentContainer}
                onRefresh={handleRefresh}
            >
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : activeView === 'requests' ? (
                    filteredRequests.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Feather name="inbox" size={48} color={COLORS.border} />
                            <Text style={styles.emptyText}>{t('common.noData')}</Text>
                            <Text style={styles.emptyHint}>
                                {searchQuery ? 'Thử tìm kiếm khác' : 'Các yêu cầu nhập kho sẽ xuất hiện ở đây'}
                            </Text>
                        </Card>
                    ) : (
                        filteredRequests.map(renderRequestCard)
                    )
                ) : (
                    filteredTickets.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Feather name="inbox" size={48} color={COLORS.border} />
                            <Text style={styles.emptyText}>{t('common.noData')}</Text>
                            <Text style={styles.emptyHint}>
                                {searchQuery ? 'Thử tìm kiếm khác' : 'Phiếu nhập sẽ được tạo từ yêu cầu đã duyệt'}
                            </Text>
                        </Card>
                    ) : (
                        filteredTickets.map(renderTicketCard)
                    )
                )}
            </RefreshContainer>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    viewToggle: {
        flexDirection: 'row',
        marginTop: 12,
        marginBottom: 4,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        padding: 3,
    },
    viewToggleBtn: {
        flex: 1,
        paddingVertical: 7,
        alignItems: 'center',
        borderRadius: 8,
    },
    viewToggleBtnActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    viewToggleBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    viewToggleBtnTextActive: {
        color: COLORS.primary,
    },
    tabsScroll: {
        marginHorizontal: -4,
    },
    tabsContainer: {
        paddingTop: 8,
        paddingBottom: 8,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        gap: 6,
        marginRight: 8,
    },
    tabActive: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    tabTextActive: {
        color: '#fff',
    },
    tabCount: {
        backgroundColor: '#e5e7eb',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    tabCountActive: {
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    tabCountText: {
        fontSize: 10,
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
        textAlign: 'center',
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
        flex: 1,
    },
});
