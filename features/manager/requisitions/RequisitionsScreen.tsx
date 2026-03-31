import { RefreshContainer, RequisitionCard, TabScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useRequisitions } from '@/hooks';
import { useAuthStore } from '@/stores/auth.store';
import type { RequisitionStatus } from '@/types/requisition';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TabType = 'all' | RequisitionStatus;

const TABS: { key: TabType; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ duyệt' },
    { key: 'approved', label: 'Đã duyệt' },
    { key: 'rejected', label: 'Từ chối' },
];


export default function RequisitionsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { data: requisitions = [], isLoading, refetch } = useRequisitions(user?.companyId);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const searchRequisitionsLocal = (query: string) => {
        const lowerQuery = query.toLowerCase();
        return requisitions.filter(req =>
            req.requisitionNumber.toLowerCase().includes(lowerQuery) ||
            req.purpose.toLowerCase().includes(lowerQuery) ||
            req.items.some(item =>
                item.sku.toLowerCase().includes(lowerQuery) ||
                item.productName.toLowerCase().includes(lowerQuery)
            )
        );
    };

    // Filter requisitions
    const filteredRequisitions = useMemo(() => {
        let results = requisitions;

        // Apply search
        if (searchQuery.trim()) {
            results = searchRequisitionsLocal(searchQuery);
        }

        // Apply status filter
        if (activeTab !== 'all') {
            results = results.filter(req => req.status === activeTab);
        }

        // Sort by date (newest first)
        return [...results].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [requisitions, searchQuery, activeTab, searchRequisitionsLocal]);

    const handleRefresh = async () => {
        await refetch();
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Đang tải...</Text>
            </View>
        );
    }

    const handleCreateNew = () => {
        router.push('/(manager-tabs)/requisitions/create' as any);
    };

    const handleRequisitionPress = (id: number | string, type: string) => {
        router.push(`/(manager-tabs)/requisitions/${id}?type=${type}` as any);
    };

    return (
        <View style={styles.container}>
            <TabScreenHeader
                title="Phiếu Đề Xuất"
                subtitle="Quản lý đề xuất nhập/xuất kho"
                showAddButton
                onAddPress={handleCreateNew}
                showSearch
                searchPlaceholder="Tìm theo mã phiếu, SKU, mục đích..."
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
                            ? requisitions.length
                            : requisitions.filter(r => r.status === tab.key).length;

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
            <RefreshContainer 
                style={styles.content} 
                contentContainerStyle={styles.contentContainer}
                onRefresh={handleRefresh}
            >
                {filteredRequisitions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Feather name="inbox" size={64} color={COLORS.border} />
                        <Text style={styles.emptyTitle}>
                            {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có phiếu đề xuất'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {searchQuery
                                ? 'Thử tìm kiếm với từ khóa khác'
                                : 'Tạo phiếu đề xuất nhập/xuất kho mới'
                            }
                        </Text>
                        {!searchQuery && (
                            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateNew}>
                                <Feather name="plus" size={18} color="#fff" />
                                <Text style={styles.emptyButtonText}>Tạo đề xuất mới</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    filteredRequisitions.map(requisition => (
                        <RequisitionCard
                            key={requisition.id}
                            requisition={requisition}
                            onPress={() => handleRequisitionPress(requisition.id, requisition.type)}
                        />
                    ))
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
    header: {
        backgroundColor: '#fff',
        paddingBottom: 0,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 60,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    createButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        marginHorizontal: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 10,
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
});
