import { TabScreenHeader, TransferCard } from '@/components';
import { COLORS } from '@/constants/color';
import { useTransferOrders } from '@/hooks/transfer.hooks';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';

const TABS: { key: string; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'Draft', label: 'Bản nháp' },
    { key: 'Submitted', label: 'Chờ duyệt' },
    { key: 'Approved', label: 'Đã duyệt' },
    { key: 'Picking', label: 'Đang lấy hàng' },
    { key: 'Shipped', label: 'Đang giao' },
    { key: 'Completed', label: 'Hoàn thành' },
];

export default function TransferListScreen() {
    const router = useRouter();
    const { data: transfers = [], isLoading } = useTransferOrders({});
    const [activeTab, setActiveTab] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTransfers = useMemo(() => {
        let results = transfers;

        // Apply search
        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            results = results.filter(req =>
                (req.referenceCode && req.referenceCode.toLowerCase().includes(lowerQuery)) ||
                req.id.toString().includes(lowerQuery) ||
                (req.sourceWarehouse?.name && req.sourceWarehouse.name.toLowerCase().includes(lowerQuery)) ||
                (req.destinationWarehouse?.name && req.destinationWarehouse.name.toLowerCase().includes(lowerQuery))
            );
        }

        // Apply status filter
        if (activeTab !== 'all') {
            results = results.filter(req => req.status === activeTab);
        }

        // Sort by date (newest first)
        return [...results].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [transfers, searchQuery, activeTab]);

    const handleCreateNew = () => {
        router.push('/(manager-tabs)/transfers/create' as any);
    };

    const handleTransferPress = (id: number) => {
        router.push(`/(manager-tabs)/transfers/${id}` as any);
    };

    return (
        <View style={styles.container}>
            <TabScreenHeader
                showAddButton
                onAddPress={handleCreateNew}
                showSearch
                searchPlaceholder="Tìm theo mã phiếu, kho..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                title="Luân Chuyển Kho"
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
                            ? transfers.length
                            : transfers.filter(r => r.status === tab.key).length;

                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.tab, isActive && styles.tabActive]}
                                onPress={() => setActiveTab(tab.key)}
                            >
                                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                    {tab.label}
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

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {isLoading ? (
                    <View style={styles.loadingState}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                    </View>
                ) : filteredTransfers.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Feather name="repeat" size={64} color={COLORS.border} />
                        <Text style={styles.emptyTitle}>
                            {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {searchQuery
                                ? 'Thử tìm kiếm với từ khóa khác'
                                : 'Tạo phiếu luân chuyển mới bằng nút dấu cộng góc phải.'
                            }
                        </Text>
                        {!searchQuery && (
                            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateNew}>
                                <Feather name="plus" size={18} color="#fff" />
                                <Text style={styles.emptyButtonText}>Tạo phiếu luân chuyển</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    filteredTransfers.map(transfer => (
                        <TransferCard
                            key={transfer.id}
                            transfer={transfer}
                            onPress={() => handleTransferPress(transfer.id)}
                        />
                    ))
                )}

                <View style={{ height: 20 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
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
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        gap: 6,
        marginRight: 8,
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
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        minWidth: 24,
        alignItems: 'center',
    },
    tabCountActive: {
        backgroundColor: '#fff',
    },
    tabCountText: {
        fontSize: 11,
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
        padding: 16,
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
        marginBottom: 24,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    loadingState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.textMuted,
    },
});
