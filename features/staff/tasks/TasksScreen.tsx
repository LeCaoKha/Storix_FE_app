import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { HorizontalFilterBar, type FilterOption } from '@/components/ui/HorizontalFilterBar';
import { TaskCard } from '@/components/ui/TaskCard';
import { COLORS } from '@/constants/color';
import type { Task, TaskType } from '@/types/order';

export default function TasksScreen() {
    const [activeFilter, setActiveFilter] = useState<'all' | TaskType>('all');

    // Mock data - sẽ được thay thế bằng API call thực tế
    const tasks: Task[] = [
        {
            id: '1',
            type: 'outbound',
            orderNumber: 'OUT-2026-001',
            orderId: '1',
            status: 'in_progress',
            priority: 'high',
            itemCount: 3,
            assignedDateTime: new Date('2026-01-30T10:00:00'),
            warehouse: 'WH-HCM-01',
            customerOrSupplier: 'ABC Electronics Co.',
            progress: 43,
        },
        {
            id: '2',
            type: 'inbound',
            orderNumber: 'IN-2026-002',
            orderId: '2',
            status: 'in_progress',
            priority: 'medium',
            itemCount: 3,
            assignedDateTime: new Date('2026-01-30T09:00:00'),
            warehouse: 'WH-HCM-01',
            customerOrSupplier: 'Tech Supplies Vietnam',
            progress: 14,
        },
        {
            id: '3',
            type: 'outbound',
            orderNumber: 'OUT-2026-003',
            orderId: '3',
            status: 'pending',
            priority: 'medium',
            itemCount: 5,
            assignedDateTime: new Date('2026-01-30T08:00:00'),
            warehouse: 'WH-HCM-01',
            customerOrSupplier: 'XYZ Retail Ltd.',
        },
        {
            id: '4',
            type: 'putaway',
            orderNumber: 'PUT-2026-001',
            orderId: '4',
            status: 'pending',
            priority: 'low',
            itemCount: 12,
            assignedDateTime: new Date('2026-01-30T07:00:00'),
            warehouse: 'WH-HCM-01',
            location: 'Zone A',
        },
        {
            id: '5',
            type: 'count',
            orderNumber: 'CNT-2026-001',
            orderId: '5',
            status: 'completed',
            priority: 'high',
            itemCount: 45,
            assignedDateTime: new Date('2026-01-29T15:00:00'),
            warehouse: 'WH-HCM-01',
            location: 'Zone C',
            progress: 100,
        },
    ];

    const filteredTasks = tasks.filter(task =>
        activeFilter === 'all' || task.type === activeFilter
    );

    const getFilterLabel = (type: 'all' | TaskType) => {
        switch (type) {
            case 'all': return 'Tất cả';
            case 'outbound': return 'Xuất kho';
            case 'inbound': return 'Nhập kho';
            case 'putaway': return 'Xếp hàng';
            case 'count': return 'Kiểm kê';
        }
    };

    const getTaskSummary = () => {
        const pending = tasks.filter(t => t.status === 'pending').length;
        const inProgress = tasks.filter(t => t.status === 'in_progress').length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        return { pending, inProgress, completed, total: tasks.length };
    };

    const summary = getTaskSummary();

    // Prepare filter options with counts
    const filterOptions = useMemo<FilterOption<'all' | TaskType>[]>(() => {
        const filters: ('all' | TaskType)[] = ['all', 'outbound', 'inbound', 'putaway', 'count'];
        return filters.map(filter => ({
            value: filter,
            label: getFilterLabel(filter),
            count: filter === 'all' ? tasks.length : tasks.filter(t => t.type === filter).length,
        }));
    }, [tasks]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Nhiệm Vụ Của Tôi</Text>
                    <Text style={styles.subtitle}>
                        {summary.total} tasks • {summary.inProgress} đang làm • {summary.pending} chờ xử lý
                    </Text>
                </View>
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
                <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
                    <Feather name="clock" size={20} color="#F59E0B" />
                    <Text style={[styles.summaryNumber, { color: '#F59E0B' }]}>{summary.pending}</Text>
                    <Text style={styles.summaryLabel}>Chờ xử lý</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
                    <Feather name="activity" size={20} color="#3B82F6" />
                    <Text style={[styles.summaryNumber, { color: '#3B82F6' }]}>{summary.inProgress}</Text>
                    <Text style={styles.summaryLabel}>Đang làm</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5' }]}>
                    <Feather name="check-circle" size={20} color="#10B981" />
                    <Text style={[styles.summaryNumber, { color: '#10B981' }]}>{summary.completed}</Text>
                    <Text style={styles.summaryLabel}>Hoàn thành</Text>
                </View>
            </View>

            {/* Filter Tabs */}
            <HorizontalFilterBar
                options={filterOptions}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
            />

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
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
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
    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 0,
        gap: 12,
        backgroundColor: '#fff',
    },
    summaryCard: {
        flex: 1,
        padding: 8,
        borderRadius: 12,
        alignItems: 'center',
        gap: 2,
    },
    summaryNumber: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    summaryLabel: {
        fontSize: 11,
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
