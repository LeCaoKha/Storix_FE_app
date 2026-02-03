import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { HorizontalFilterBar, type FilterOption } from '@/components/ui/HorizontalFilterBar';
import { SafeAreaHeader } from '@/components/ui/SafeAreaHeader';
import { TaskCard } from '@/components/ui/TaskCard';
import { COLORS } from '@/constants/color';
import type { TaskType } from '@/types/order';

import { useTasks } from './task.hooks';

export default function TasksScreen() {
    const [activeFilter, setActiveFilter] = useState<'all' | TaskType>('all');
    const { data: tasks = [], isLoading } = useTasks();

    // Helper functions
    const getFilterLabel = (type: 'all' | TaskType) => {
        switch (type) {
            case 'all': return 'Tất cả';
            case 'outbound': return 'Xuất kho';
            case 'inbound': return 'Nhập kho';
            case 'putaway': return 'Xếp hàng';
            case 'count': return 'Kiểm kê';
        }
    };

    // Prepare filter options with counts - MUST be before early return
    const filterOptions = useMemo<FilterOption<'all' | TaskType>[]>(() => {
        const filters: ('all' | TaskType)[] = ['all', 'outbound', 'inbound', 'putaway', 'count'];
        return filters.map(filter => ({
            value: filter,
            label: getFilterLabel(filter),
            count: filter === 'all' ? tasks.length : tasks.filter(t => t.type === filter).length,
        }));
    }, [tasks]);

    // Early return AFTER all hooks
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Đang tải...</Text>
            </View>
        );
    }

    const filteredTasks = tasks.filter(task =>
        activeFilter === 'all' || task.type === activeFilter
    );

    const getTaskSummary = () => {
        const pending = tasks.filter(t => t.status === 'pending').length;
        const inProgress = tasks.filter(t => t.status === 'in_progress').length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        return { pending, inProgress, completed, total: tasks.length };
    };

    const summary = getTaskSummary();

    return (
        <View style={styles.container}>
            {/* Header */}
            <SafeAreaHeader backgroundColor="#fff" style={styles.header}>
                <Text style={styles.title}>Nhiệm Vụ Của Tôi</Text>
            </SafeAreaHeader>

            {/* Summary Cards and Filter */}
            <View style={styles.summaryAndFilterContainer}>
                <View style={styles.summaryContainer}>
                    <TouchableOpacity
                        style={[styles.summaryCard, { backgroundColor: '#FFFBEB' }]}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.summaryNumber, { color: '#F59E0B' }]}>{summary.pending}</Text>
                        <Text style={styles.summaryLabel}>Chờ xử lý</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.summaryCard, { backgroundColor: '#EFF6FF' }]}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.summaryNumber, { color: '#3B82F6' }]}>{summary.inProgress}</Text>
                        <Text style={styles.summaryLabel}>Đang làm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.summaryCard, { backgroundColor: '#F0FDF4' }]}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.summaryNumber, { color: '#10B981' }]}>{summary.completed}</Text>
                        <Text style={styles.summaryLabel}>Hoàn thành</Text>
                    </TouchableOpacity>
                </View>

                {/* Filter Tabs */}
                <HorizontalFilterBar
                    options={filterOptions}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                />
            </View>

            {/* Tasks List */}
            <ScrollView
                style={styles.tasksList}
                showsVerticalScrollIndicator={false}
            >
                {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Feather name="inbox" size={48} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>Không có nhiệm vụ nào</Text>
                        <Text style={styles.emptySubtext}>
                            {activeFilter === 'all'
                                ? 'Bạn chưa có nhiệm vụ nào được giao'
                                : `Không có nhiệm vụ ${getFilterLabel(activeFilter).toLowerCase()} nào`}
                        </Text>
                    </View>
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
    header: {
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    summaryAndFilterContainer: {
        backgroundColor: '#fff',
    },
    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
        gap: 10,
    },
    summaryCard: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    summaryNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    summaryLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    tasksList: {
        flex: 1,
        padding: 20,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 16,
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
});
