import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { COLORS } from '@/constants/color';

interface OrderPreview {
    id: string;
    orderNumber: string;
    type: 'inbound' | 'outbound';
    status: 'pending' | 'in_progress' | 'completed';
    itemCount: number;
    createdAt: Date;
    customerOrSupplier: string;
}

export default function OrdersListScreen() {
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState<'all' | 'outbound' | 'inbound'>('all');

    // Sample data
    const orders: OrderPreview[] = [
        {
            id: '1',
            orderNumber: 'OUT-2026-001',
            type: 'outbound',
            status: 'in_progress',
            itemCount: 3,
            createdAt: new Date('2026-01-30T10:00:00'),
            customerOrSupplier: 'ABC Electronics Co.',
        },
        {
            id: '2',
            orderNumber: 'IN-2026-002',
            type: 'inbound',
            status: 'in_progress',
            itemCount: 3,
            createdAt: new Date('2026-01-30T09:00:00'),
            customerOrSupplier: 'Tech Supplies Vietnam',
        },
        {
            id: '3',
            orderNumber: 'OUT-2026-003',
            type: 'outbound',
            status: 'pending',
            itemCount: 5,
            createdAt: new Date('2026-01-30T08:00:00'),
            customerOrSupplier: 'XYZ Retail Ltd.',
        },
        {
            id: '4',
            orderNumber: 'IN-2026-004',
            type: 'inbound',
            status: 'completed',
            itemCount: 8,
            createdAt: new Date('2026-01-29T15:00:00'),
            customerOrSupplier: 'Global Imports Inc.',
        },
    ];

    const handleOrderPress = (order: OrderPreview) => {
        if (order.type === 'outbound') {
            router.push('/outbound-order' as any);
        } else {
            router.push('/inbound-order' as any);
        }
    };

    const getTypeIcon = (type: 'inbound' | 'outbound') => {
        return type === 'outbound' ? 'arrow-up-circle' : 'arrow-down-circle';
    };

    const getTypeColor = (type: 'inbound' | 'outbound') => {
        return type === 'outbound' ? '#EF4444' : '#10B981';
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Order Tickets</Text>
                <Text style={styles.subtitle}>Manage inbound and outbound orders</Text>
            </View>

            <View style={styles.content}>
                {/* Filter Tabs */}
                <View style={styles.filterContainer}>
                    <TouchableOpacity
                        style={[styles.filterButton, activeFilter === 'all' && styles.filterButtonActive]}
                        onPress={() => setActiveFilter('all')}
                    >
                        <Text style={activeFilter === 'all' ? styles.filterTextActive : styles.filterText}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, activeFilter === 'outbound' && styles.filterButtonActive]}
                        onPress={() => setActiveFilter('outbound')}
                    >
                        <Text style={activeFilter === 'outbound' ? styles.filterTextActive : styles.filterText}>Outbound</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, activeFilter === 'inbound' && styles.filterButtonActive]}
                        onPress={() => setActiveFilter('inbound')}
                    >
                        <Text style={activeFilter === 'inbound' ? styles.filterTextActive : styles.filterText}>Inbound</Text>
                    </TouchableOpacity>
                </View>

                {/* Orders List */}
                <View style={styles.ordersList}>
                    {orders
                        .filter(order => activeFilter === 'all' || order.type === activeFilter)
                        .map((order) => (
                            <TouchableOpacity key={order.id} onPress={() => handleOrderPress(order)}>
                                <Card style={styles.orderCard}>
                                    <View style={styles.orderHeader}>
                                        <View style={styles.orderTypeIndicator}>
                                            <Feather
                                                name={getTypeIcon(order.type)}
                                                size={20}
                                                color={getTypeColor(order.type)}
                                            />
                                            <Text style={[styles.orderType, { color: getTypeColor(order.type) }]}>
                                                {order.type === 'outbound' ? 'Outbound' : 'Inbound'}
                                            </Text>
                                        </View>
                                        <StatusBadge status={order.status} size="small" />
                                    </View>

                                    <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                                    <Text style={styles.orderCustomer}>{order.customerOrSupplier}</Text>

                                    <View style={styles.orderFooter}>
                                        <View style={styles.orderMeta}>
                                            <Feather name="package" size={14} color={COLORS.textMuted} />
                                            <Text style={styles.orderMetaText}>{order.itemCount} items</Text>
                                        </View>
                                        <View style={styles.orderMeta}>
                                            <Feather name="clock" size={14} color={COLORS.textMuted} />
                                            <Text style={styles.orderMetaText}>
                                                {order.createdAt.toLocaleDateString('vi-VN')}
                                            </Text>
                                        </View>
                                        <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        ))}
                </View>
            </View>

            <View style={{ height: 20 }} />
        </ScrollView>
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
        fontSize: 14,
        color: COLORS.textMuted,
    },
    content: {
        padding: 20,
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterText: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    filterTextActive: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
    },
    ordersList: {
        gap: 12,
    },
    orderCard: {
        marginBottom: 0,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderTypeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    orderType: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    orderNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    orderCustomer: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginBottom: 12,
    },
    orderFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    orderMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    orderMetaText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
});
