import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS } from '@/constants/color';
import type { Task } from '@/types/order';

interface TaskCardProps {
    task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
    const router = useRouter();

    const handlePress = () => {
        if (task.type === 'outbound') {
            router.push('/outbound-order' as any);
        } else if (task.type === 'inbound') {
            router.push('/inbound-order' as any);
        }
        // For putaway and count, we'll need to create those screens later
    };

    const getTaskTypeConfig = (type: Task['type']) => {
        switch (type) {
            case 'outbound':
                return {
                    label: 'Xuất Kho',
                    icon: 'arrow-up-circle',
                    color: '#EF4444',
                    bgColor: '#FEE2E2',
                };
            case 'inbound':
                return {
                    label: 'Nhập Kho',
                    icon: 'arrow-down-circle',
                    color: '#10B981',
                    bgColor: '#D1FAE5',
                };
            case 'putaway':
                return {
                    label: 'Xếp Hàng',
                    icon: 'package',
                    color: '#3B82F6',
                    bgColor: '#DBEAFE',
                };
            case 'count':
                return {
                    label: 'Kiểm Kê',
                    icon: 'clipboard',
                    color: '#F59E0B',
                    bgColor: '#FEF3C7',
                };
        }
    };

    const getStatusConfig = (status: Task['status']) => {
        switch (status) {
            case 'pending':
                return { label: 'Chờ xử lý', color: COLORS.textMuted };
            case 'in_progress':
                return { label: 'Đang thực hiện', color: '#F59E0B' };
            case 'completed':
                return { label: 'Hoàn thành', color: '#10B981' };
        }
    };

    const getPriorityColor = (priority: Task['priority']) => {
        switch (priority) {
            case 'low': return '#64748B';
            case 'medium': return '#F59E0B';
            case 'high': return '#EF4444';
            case 'urgent': return '#DC2626';
        }
    };

    const typeConfig = getTaskTypeConfig(task.type);
    const statusConfig = getStatusConfig(task.status);

    return (
        <TouchableOpacity onPress={handlePress} style={styles.container}>
            <View style={[styles.typeIndicator, { backgroundColor: typeConfig.bgColor }]}>
                <Feather name={typeConfig.icon as any} size={20} color={typeConfig.color} />
                <Text style={[styles.typeLabel, { color: typeConfig.color }]}>{typeConfig.label}</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.orderNumber}>{task.orderNumber}</Text>
                        {task.customerOrSupplier && (
                            <Text style={styles.customerOrSupplier}>{task.customerOrSupplier}</Text>
                        )}
                    </View>
                    <View style={[styles.priorityBadge, { borderColor: getPriorityColor(task.priority) }]}>
                        <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
                    </View>
                </View>

                <View style={styles.meta}>
                    <View style={styles.metaItem}>
                        <Feather name="package" size={14} color={COLORS.textMuted} />
                        <Text style={styles.metaText}>{task.itemCount} items</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Feather name="home" size={14} color={COLORS.textMuted} />
                        <Text style={styles.metaText}>{task.warehouse}</Text>
                    </View>
                </View>

                {task.progress !== undefined && task.status === 'in_progress' && (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${task.progress}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{Math.round(task.progress)}%</Text>
                    </View>
                )}

                <View style={styles.footer}>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    typeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    typeLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    content: {
        padding: 16,
        paddingTop: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        flex: 1,
    },
    orderNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    customerOrSupplier: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    priorityBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    priorityDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    meta: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: COLORS.background,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.text,
        width: 40,
        textAlign: 'right',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
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
});
