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
            router.push(`/staff/outbound/${task.orderId}` as any);
        } else if (task.type === 'inbound') {
            router.push(`/staff/inbound/${task.orderId}` as any);
        } else if (task.type === 'putaway') {
            router.push(`/staff/putaway/${task.orderId}` as any);
        } else if (task.type === 'count') {
            router.push(`/staff/count/${task.orderId}` as any);
        }
    };

    const getTaskTypeConfig = (type: Task['type']) => {
        switch (type) {
            case 'outbound':
                return {
                    label: 'OUTBOUND',
                    icon: 'arrow-up-circle',
                    color: '#EF4444',
                };
            case 'inbound':
                return {
                    label: 'INBOUND',
                    icon: 'arrow-down-circle',
                    color: '#10B981',
                };
            case 'putaway':
                return {
                    label: 'PUTAWAY',
                    icon: 'package',
                    color: '#3B82F6',
                };
            case 'count':
                return {
                    label: 'COUNT',
                    icon: 'clipboard',
                    color: '#F59E0B',
                };
        }
    };

    const getStatusConfig = (status: Task['status']) => {
        switch (status) {
            case 'pending':
                return { label: 'Pending', color: '#B45309', bgColor: '#FEF3C7' };
            case 'in_progress':
                return { label: 'In Progress', color: '#0D9488', bgColor: '#CCFBF1' };
            case 'completed':
                return { label: 'Completed', color: '#065F46', bgColor: '#D1FAE5' };
        }
    };

    const typeConfig = getTaskTypeConfig(task.type);
    const statusConfig = getStatusConfig(task.status);

    // Format date: dd/m/yyyy to match image
    const date = new Date(task.assignedDateTime);
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

    return (
        <TouchableOpacity onPress={handlePress} style={styles.container}>
            <View style={styles.header}>
                <View style={styles.typeContainer}>
                    <Feather name={typeConfig.icon as any} size={18} color={typeConfig.color} />
                    <Text style={[styles.typeLabel, { color: typeConfig.color }]}>{typeConfig.label}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.orderNumber}>{task.orderNumber}</Text>
                {task.customerOrSupplier && (
                    <Text style={styles.customerOrSupplier}>{task.customerOrSupplier}</Text>
                )}
            </View>

            <View style={styles.divider} />

            <View style={styles.footer}>
                <View style={styles.footerInfo}>
                    <View style={styles.metaItem}>
                        <Feather name="package" size={16} color={COLORS.textMuted} />
                        <Text style={styles.metaText}>{task.itemCount} items</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Feather name="clock" size={16} color={COLORS.textMuted} />
                        <Text style={styles.metaText}>{formattedDate}</Text>
                    </View>
                </View>
                <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    typeLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        marginBottom: 16,
    },
    orderNumber: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 2,
    },
    customerOrSupplier: {
        fontSize: 14,
        color: COLORS.textMuted,
        fontWeight: '400',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerInfo: {
        flexDirection: 'row',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
});
