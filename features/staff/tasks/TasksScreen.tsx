import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { HorizontalFilterBar, RefreshContainer, SafeAreaHeader, TaskCard, type FilterOption } from '@/components';
import { COLORS } from '@/constants/color';
import { useTasks } from '@/hooks/task.hooks';
import { Task, TaskStatus, TaskType } from '@/types/order';

export default function TasksScreen() {
    const [activeFilter, setActiveFilter] = useState<'all' | TaskType>('all');
    const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
    const { data: tasks = [], isLoading, refetch } = useTasks();

    // Helper functions
    const getFilterLabel = (type: 'all' | TaskType) => {
        switch (type) {
            case 'all': return 'Tất cả';
            case TaskType.OUTBOUND: return 'Xuất kho';
            case TaskType.INBOUND: return 'Nhập kho';
            case TaskType.INVENTORY_COUNT: return 'Kiểm kê';
            case TaskType.TRANSFER: return 'Chuyển kho';
            default: return type.charAt(0).toUpperCase() + type.slice(1);
        }
    };

    // Prepare filter options with counts - MUST be before early return
    const filterOptions = useMemo<FilterOption<'all' | TaskType>[]>(() => {
        const filters: ('all' | TaskType)[] = [
            'all', 
            TaskType.OUTBOUND, 
            TaskType.INBOUND, 
            TaskType.INVENTORY_COUNT, 
            TaskType.TRANSFER
        ];
        return filters.map(filter => ({
            value: filter,
            label: getFilterLabel(filter),
            count: filter === 'all' ? tasks.length : tasks.filter((t: Task) => t.type === filter).length,
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

    const filteredTasks = tasks.filter(task => {
        const matchesType = activeFilter === 'all' || task.type === activeFilter;
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        return matchesType && matchesStatus;
    });

    const getTaskSummary = () => {
        const pending = tasks.filter((t: Task) => t.status === TaskStatus.PENDING).length;
        const inProgress = tasks.filter((t: Task) => t.status === TaskStatus.IN_PROGRESS).length;
        const completed = tasks.filter((t: Task) => t.status === TaskStatus.COMPLETED).length;
        return { pending, inProgress, completed, total: tasks.length };
    };

    const summary = getTaskSummary();

    const handleRefresh = async () => {
        await refetch();
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <SafeAreaHeader backgroundColor="#fff" showBackButton={false} style={styles.header}>
                <Text style={styles.title}>Nhiệm Vụ Của Tôi</Text>
            </SafeAreaHeader>

            {/* Summary Cards and Filter */}
            <View style={styles.summaryAndFilterContainer}>
                <View style={styles.summaryContainer}>
                    <TouchableOpacity
                        style={[
                            styles.summaryCard,
                            { backgroundColor: COLORS.warning + '15' },
                            statusFilter === TaskStatus.PENDING && { borderColor: COLORS.warning, backgroundColor: COLORS.warning + '30' }
                        ]}
                        activeOpacity={0.7}
                        onPress={() => setStatusFilter(statusFilter === TaskStatus.PENDING ? 'all' : TaskStatus.PENDING)}
                    >
                        <Text style={[styles.summaryNumber, { color: COLORS.warning }]}>{summary.pending}</Text>
                        <Text style={styles.summaryLabel}>Chờ xử lý</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.summaryCard,
                            { backgroundColor: COLORS.primary + '15' },
                            statusFilter === TaskStatus.IN_PROGRESS && { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '30' }
                        ]}
                        activeOpacity={0.7}
                        onPress={() => setStatusFilter(statusFilter === TaskStatus.IN_PROGRESS ? 'all' : TaskStatus.IN_PROGRESS)}
                    >
                        <Text style={[styles.summaryNumber, { color: COLORS.primary }]}>{summary.inProgress}</Text>
                        <Text style={styles.summaryLabel}>Đang làm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.summaryCard,
                            { backgroundColor: COLORS.success + '15' },
                            statusFilter === TaskStatus.COMPLETED && { borderColor: COLORS.success, backgroundColor: COLORS.success + '30' }
                        ]}
                        activeOpacity={0.7}
                        onPress={() => setStatusFilter(statusFilter === TaskStatus.COMPLETED ? 'all' : TaskStatus.COMPLETED)}
                    >
                        <Text style={[styles.summaryNumber, { color: COLORS.success }]}>{summary.completed}</Text>
                        <Text style={styles.summaryLabel}>Hoàn thành</Text>
                    </TouchableOpacity>
                </View>

                {/* Filter Tabs */}
                <HorizontalFilterBar
                    options={filterOptions}
                    activeValue={activeFilter}
                    onSelect={setActiveFilter}
                />
            </View>

            {/* Tasks List */}
            <RefreshContainer
                style={styles.tasksList}
                showsVerticalScrollIndicator={false}
                onRefresh={handleRefresh}
            >
                {filteredTasks.length > 0 ? (
                    filteredTasks.map((task: Task) => (
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
        backgroundColor: COLORS.card,
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
