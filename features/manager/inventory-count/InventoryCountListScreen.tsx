import { Button, Card, RefreshContainer, SafeAreaHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useStockCountTickets } from '@/hooks/stock-count.hooks';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/stores/auth.store';
import { StockCountTicket } from '@/types/stock-count';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function InventoryCountListScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);
    const companyId = user?.companyId ?? 0;

    const [statusFilter, setStatusFilter] = useState<string | undefined>();
    const { data: tickets = [], isLoading, refetch } = useStockCountTickets(companyId, undefined, statusFilter);

    const handleRefresh = async () => {
        await refetch();
    };

    const getStatusConfig = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'finished':
                return { label: t('tasks.completed'), color: COLORS.success };
            case 'pending':
            case 'in_progress':
                return { label: t('tasks.inProgress'), color: COLORS.warning };
            case 'cancelled':
                return { label: t('common.failed'), color: COLORS.danger };
            default:
                return { label: status, color: COLORS.slate500 };
        }
    };

    const renderTicket = (ticket: StockCountTicket) => {
        const { label, color } = getStatusConfig(ticket.status || '');
        return (
            <TouchableOpacity
                key={ticket.id}
                onPress={() => router.push(`/(manager-tabs)/inventory-count/${ticket.id}` as any)}
                activeOpacity={0.7}
            >
                <Card style={styles.ticketCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.ticketInfo}>
                            <Text style={styles.ticketName}>{ticket.name || `${t('inventoryCount.ticketTitle')} #${ticket.id}`}</Text>
                            <Text style={styles.ticketDate}>
                                {ticket.executedDay ? new Date(ticket.executedDay).toLocaleDateString() : t('common.pending')}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: color + '10' }]}>
                            <Text style={[styles.statusText, { color }]}>{label}</Text>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <View style={styles.metaItem}>
                            <Feather name="package" size={14} color={COLORS.textMuted} />
                            <Text style={styles.metaText}>{ticket.itemCount} {t('common.item').toLowerCase()}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Feather name="tag" size={14} color={COLORS.textMuted} />
                            <Text style={styles.metaText}>{ticket.type === 'Blind' ? t('inventoryCount.blindCountMode') : 'Standard'}</Text>
                        </View>
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaHeader backgroundColor="#fff" showBackButton={false}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{t('tasks.inventoryCount')}</Text>
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => router.push('/(manager-tabs)/inventory-count/create' as any)}
                    >
                        <Feather name="plus" size={20} color="#fff" />
                        <Text style={styles.createText}>{t('common.create')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaHeader>

            <View style={styles.filterBar}>
                <TouchableOpacity
                    style={[styles.filterTab, !statusFilter && styles.activeFilterTab]}
                    onPress={() => setStatusFilter(undefined)}
                >
                    <Text style={[styles.filterText, !statusFilter && styles.activeFilterText]}>{t('common.all')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, statusFilter === 'pending' && styles.activeFilterTab]}
                    onPress={() => setStatusFilter('pending')}
                >
                    <Text style={[styles.filterText, statusFilter === 'pending' && styles.activeFilterText]}>{t('tasks.pending')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, statusFilter === 'finished' && styles.activeFilterTab]}
                    onPress={() => setStatusFilter('finished')}
                >
                    <Text style={[styles.filterText, statusFilter === 'finished' && styles.activeFilterText]}>{t('tasks.completed')}</Text>
                </TouchableOpacity>
            </View>

            <RefreshContainer
                onRefresh={handleRefresh}
                contentContainerStyle={styles.listContent}
            >
                {isLoading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
                ) : tickets.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Feather name="clipboard" size={64} color={COLORS.border} />
                        <Text style={styles.emptyText}>{t('common.noData')}</Text>
                    </View>
                ) : (
                    tickets.map(renderTicket)
                )}
            </RefreshContainer>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    createText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    filterBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    filterTab: {
        paddingVertical: 12,
        marginRight: 24,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeFilterTab: { borderBottomColor: COLORS.primary },
    filterText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
    activeFilterText: { color: COLORS.primary },
    listContent: { padding: 16 },
    loader: { marginTop: 40 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, fontSize: 16, color: COLORS.textMuted, fontWeight: '500' },
    ticketCard: { marginBottom: 12, padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    ticketInfo: { flex: 1, marginRight: 12 },
    ticketName: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
    ticketDate: { fontSize: 12, color: COLORS.textMuted },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    cardFooter: { flexDirection: 'row', gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
});
