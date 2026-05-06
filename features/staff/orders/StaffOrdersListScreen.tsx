import { RefreshContainer, TabScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useInboundOrdersByStaff } from '@/hooks';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth.store';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TabType = 'all' | 'waiting' | 'partial' | 'completed';

const TABS: { key: TabType; label: string }[] = [
    { key: 'all', label: 'all' },
    { key: 'waiting', label: 'pending' },
    { key: 'partial', label: 'inProgress' },
    { key: 'completed', label: 'completed' },
];

export default function StaffOrdersListScreen() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const { t, language } = useTranslation();
    const { data: tickets = [], isLoading, refetch } = useInboundOrdersByStaff(user?.companyId ?? 0, user?.id ?? 0);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTickets = useMemo(() => {
        let results = tickets;

        // Apply search
        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            results = results.filter(ticket =>
                ticket.referenceCode?.toLowerCase().includes(lowerQuery) ||
                ticket.warehouse?.name?.toLowerCase().includes(lowerQuery) ||
                ticket.inboundOrderItems?.some((item: any) =>
                    item.name?.toLowerCase().includes(lowerQuery) ||
                    item.sku?.toLowerCase().includes(lowerQuery)
                )
            );
        }

        // Apply status filter - match BE: "Waiting for payment" / "Partially Completed" / "Completed"
        if (activeTab !== 'all') {
            const statusMap: Record<string, string> = {
                waiting: 'Waiting for payment',
                partial: 'Partially Completed',
                completed: 'Completed',
            };
            results = results.filter(ticket => 
                ticket.status === statusMap[activeTab]
            );
        }

        // Sort by date (newest first)
        return [...results].sort((a: any, b: any) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
    }, [tickets, searchQuery, activeTab]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>{t('common.loading')}</Text>
            </View>
        );
    }

    const handleTicketPress = (id: number) => {
        router.push({
            pathname: '/(staff-tabs)/orders/[id]',
            params: {
                id: String(id),
                from: '/(staff-tabs)/orders',
            },
        } as any);
    };

    const handleRefresh = async () => {
        await refetch();
    };

    const getStatusBadgeStyle = (status: string) => {
        switch (status) {
            case 'Waiting for payment':
                return { bg: '#EFF6FF', text: '#1E40AF', label: t('common.pending') };
            case 'Partially Completed':
                return { bg: '#FEF3C7', text: '#92400E', label: t('common.inProgress') };
            case 'Completed':
                return { bg: '#D1FAE5', text: '#065F46', label: t('common.completed') };
            default:
                return { bg: '#F3F4F6', text: '#6B7280', label: status || t('common.notAvailable') };
        }
    };

    return (
        <View style={styles.container}>
            <TabScreenHeader
                showSearch
                searchPlaceholder={t('tasks.searchOrders')}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
            >
                {/* Tabs */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tabsScroll}
                    contentContainerStyle={styles.tabsContainer}
                >
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.key;
                        const count = tab.key === 'all'
                            ? filteredTickets.length
                            : tickets.filter((t: any) => {
                                const statusMap: Record<string, string> = {
                                    waiting: 'Waiting for payment',
                                    partial: 'Partially Completed',
                                    completed: 'Completed',
                                };
                                return t.status === statusMap[tab.key];
                            }).length;

                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.tab, isActive && styles.tabActive]}
                                onPress={() => setActiveTab(tab.key)}
                            >
                                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                    {t(`common.${tab.label}`)}
                                </Text>
                                <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                                    <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                                        {count}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </TabScreenHeader>
            
            <RefreshContainer 
                style={styles.content} 
                contentContainerStyle={styles.contentContainer}
                onRefresh={handleRefresh}
            >
                {filteredTickets.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Feather name="package" size={64} color={COLORS.border} />
                        <Text style={styles.emptyTitle}>
                            {searchQuery ? t('tasks.noResults') : t('tasks.noInboundTickets')}
                        </Text>
                        <Text style={styles.emptyText}>
                            {searchQuery ? t('tasks.noResultsDesc') : t('tasks.noInboundTicketsDesc')}
                        </Text>
                    </View>
                ) : (
                    filteredTickets.map((ticket: any) => {
                        const statusStyle = getStatusBadgeStyle(ticket.status);
                        const itemCount = ticket.inboundOrderItems?.length || 0;

                        return (
                            <TouchableOpacity
                                key={ticket.id}
                                style={styles.ticketCard}
                                onPress={() => handleTicketPress(ticket.id)}
                            >
                                <View style={styles.ticketHeader}>
                                    <View style={styles.ticketInfo}>
                                        <Text style={styles.ticketCode}>{ticket.referenceCode || `INB-${ticket.id}`}</Text>
                                        <Text style={styles.ticketDate}>
                                            {new Date(ticket.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                            {statusStyle.label}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.ticketDivider} />

                                <View style={styles.ticketDetails}>
                                    <View style={styles.detailRow}>
                                        <Feather name="map-pin" size={16} color={COLORS.textMuted} />
                                        <Text style={styles.detailLabel}>{t('tasks.warehouse')}:</Text>
                                        <Text style={styles.detailValue}>{ticket.warehouse?.name || t('common.notAvailable')}</Text>
                                    </View>
                                    
                                    <View style={styles.detailRow}>
                                        <Feather name="truck" size={16} color={COLORS.textMuted} />
                                        <Text style={styles.detailLabel}>{t('inbound.supplier')}:</Text>
                                        <Text style={styles.detailValue}>{ticket.supplier?.name || t('common.notAvailable')}</Text>
                                    </View>
                                    
                                    <View style={styles.detailRow}>
                                        <Feather name="package" size={16} color={COLORS.textMuted} />
                                        <Text style={styles.detailLabel}>{t('common.products')}:</Text>
                                        <Text style={styles.detailValue}>{itemCount} {t('common.items')}</Text>
                                    </View>
                                </View>

                                <View style={styles.ticketFooter}>
                                    <Text style={styles.viewDetailText}>{t('common.viewDetails')}</Text>
                                    <Feather name="chevron-right" size={18} color={COLORS.primary} />
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}

                <View style={{ height: 20 }} />
            </RefreshContainer>
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
    tabsScroll: {
        maxHeight: 50,
    },
    tabsContainer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 12,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        gap: 4,
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
        backgroundColor: '#fff',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    tabCountActive: {
        backgroundColor: '#fff',
    },
    tabCountText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.textMuted,
    },
    tabCountTextActive: {
        color: COLORS.primary,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    ticketCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    ticketInfo: {
        flex: 1,
    },
    ticketCode: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    ticketDate: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    ticketDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginBottom: 12,
    },
    ticketDetails: {
        gap: 8,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    detailValue: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
        flex: 1,
    },
    ticketFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    viewDetailText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
});
