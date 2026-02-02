import type { RequisitionStatus } from '@/types/requisition';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatusBadgeProps {
    status: RequisitionStatus;
    size?: 'small' | 'medium' | 'large';
}

const STATUS_CONFIG = {
    pending: {
        label: 'Chờ duyệt',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        icon: 'clock' as const,
    },
    approved: {
        label: 'Đã duyệt',
        color: '#10B981',
        bgColor: '#D1FAE5',
        icon: 'check-circle' as const,
    },
    rejected: {
        label: 'Từ chối',
        color: '#EF4444',
        bgColor: '#FEE2E2',
        icon: 'x-circle' as const,
    },
};

export function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status];
    const sizeStyles = SIZE_STYLES[size];

    return (
        <View style={[styles.badge, { backgroundColor: config.bgColor }, sizeStyles.container]}>
            <Feather name={config.icon} size={sizeStyles.iconSize} color={config.color} />
            <Text style={[styles.label, { color: config.color }, sizeStyles.text]}>
                {config.label}
            </Text>
        </View>
    );
}

const SIZE_STYLES = {
    small: {
        container: { paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
        iconSize: 12,
        text: { fontSize: 11 },
    },
    medium: {
        container: { paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
        iconSize: 14,
        text: { fontSize: 12 },
    },
    large: {
        container: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
        iconSize: 16,
        text: { fontSize: 14 },
    },
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    label: {
        fontWeight: '600',
    },
});
