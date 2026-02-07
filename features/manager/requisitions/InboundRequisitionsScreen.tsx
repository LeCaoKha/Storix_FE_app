import { RequisitionCard, TabScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useRequisitions } from '@/hooks';
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

export default function InboundRequisitionsScreen() {
    const router = useRouter();
    const { data: requisitions = [], isLoading } = useRequisitions();
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [searchQuery, setSearchQuery] = useState('');

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

    // Filter INBOUND requisitions only
    const filteredRequisitions = useMemo(() => {
        // Filter by type first
        let results = requisitions.filter(req => req.type === 'inbound');

        // Apply search
        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            results = results.filter(req =>
                req.requisitionNumber.toLowerCase().includes(lowerQuery) ||
                req.purpose.toLowerCase().includes(lowerQuery) ||
                req.items.some(item =>
                    item.sku.toLowerCase().includes(lowerQuery) ||
                    item.productName.toLowerCase().includes(lowerQuery)
                )
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
    }, [requisitions, searchQuery, activeTab]);

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

    const handleRequisitionPress = (id: number | string) => {
        router.push(`/(manager-tabs)/requisitions/${id}` as any);
    };

    return (
        <View style={styles.container}>
            <TabScreenHeader
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
                            ? filteredRequisitions.length
                            : requisitions.filter(r => r.type === 'inbound' && r.status === tab.key).length;

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
                {filteredRequisitions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Feather name="inbox" size={64} color={COLORS.border} />
                        <Text style={styles.emptyTitle}>
                            {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có phiếu đề nghị'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {searchQuery
                                ? 'Thử tìm kiếm với từ khóa khác'
                                : 'Tạo phiếu đề nghị nhập kho mới'
                            }
                        </Text>
                        {!searchQuery && (
                            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateNew}>
                                <Feather name="plus" size={18} color="#fff" />
                                <Text style={styles.emptyButtonText}>Tạo đề nghị mới</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    filteredRequisitions.map(requisition => (
                        <RequisitionCard
                            key={requisition.id}
                            requisition={requisition}
                            onPress={() => handleRequisitionPress(requisition.id)}
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
