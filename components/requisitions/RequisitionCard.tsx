import { COLORS } from '@/constants/color';
import type { GoodsRequisition } from '@/types/requisition';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../ui/Card';
import { StatusBadge } from './StatusBadge';

interface RequisitionCardProps {
    requisition: GoodsRequisition;
    onPress: () => void;
}

const TYPE_CONFIG = {
    inbound: {
        label: 'Nhập kho',
        icon: 'arrow-down-circle' as const,
        color: '#3B82F6',
    },
    outbound: {
        label: 'Xuất kho',
        icon: 'arrow-up-circle' as const,
        color: '#8B5CF6',
    },
};

export function RequisitionCard({ requisition, onPress }: RequisitionCardProps) {
    const typeConfig = TYPE_CONFIG[requisition.type];
    const itemCount = requisition.items.length;
    const totalQuantity = requisition.items.reduce((sum, item) => sum + item.quantity, 0);

    // Format date
    const expectedDate = new Date(requisition.expectedDate).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card style={styles.card}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.typeIcon, { backgroundColor: typeConfig.color + '20' }]}>
                            <Feather name={typeConfig.icon} size={18} color={typeConfig.color} />
                        </View>
                        <View>
                            <Text style={styles.requisitionNumber}>{requisition.requisitionNumber}</Text>
                            <Text style={styles.typeLabel}>{typeConfig.label}</Text>
                        </View>
                    </View>
                    <StatusBadge status={requisition.status} size="small" />
                </View>

                {/* Purpose */}
                <Text style={styles.purpose} numberOfLines={2}>
                    {requisition.purpose}
                </Text>

                {/* Info Row */}
                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <Feather name="package" size={14} color={COLORS.textMuted} />
                        <Text style={styles.infoText}>
                            {itemCount} mặt hàng • {totalQuantity} sp
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Feather name="calendar" size={14} color={COLORS.textMuted} />
                        <Text style={styles.infoText}>{expectedDate}</Text>
                    </View>
                </View>

                {/* Linked Order */}
                {requisition.linkedOrderNumber && (
                    <View style={styles.linkedOrder}>
                        <Feather name="link" size={12} color={COLORS.primary} />
                        <Text style={styles.linkedOrderText}>
                            Đã tạo đơn: {requisition.linkedOrderNumber}
                        </Text>
                    </View>
                )}

                {/* Rejection Reason */}
                {requisition.status === 'rejected' && requisition.rejectionReason && (
                    <View style={styles.rejectionBox}>
                        <Feather name="alert-circle" size={14} color="#EF4444" />
                        <Text style={styles.rejectionText} numberOfLines={2}>
                            {requisition.rejectionReason}
                        </Text>
                    </View>
                )}
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    typeIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    requisitionNumber: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },
    typeLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    purpose: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    linkedOrder: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    linkedOrderText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
    },
    rejectionBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 12,
        padding: 10,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#EF4444',
    },
    rejectionText: {
        flex: 1,
        fontSize: 12,
        color: '#991B1B',
        lineHeight: 16,
    },
});
