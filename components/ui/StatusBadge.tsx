import { COLORS } from '@/constants/color';
import type { OrderStatus } from '@/types/order';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatusBadgeProps {
    status: OrderStatus | string;
    size?: 'small' | 'medium' | 'large';
}

export function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
    const getStatusColor = () => {
        switch (status.toLowerCase()) {
            case 'pending':
                return {
                    background: '#FEF3C7',
                    text: '#92400E',
                    border: '#FCD34D',
                };
            case 'in_progress':
            case 'in progress':
                return {
                    background: '#CCFBF1',
                    text: '#115E59',
                    border: COLORS.primary,
                };
            case 'completed':
                return {
                    background: '#D1FAE5',
                    text: '#065F46',
                    border: '#34D399',
                };
            case 'cancelled':
                return {
                    background: '#FEE2E2',
                    text: '#991B1B',
                    border: '#F87171',
                };
            default:
                return {
                    background: COLORS.secondary,
                    text: COLORS.textMuted,
                    border: COLORS.border,
                };
        }
    };

    const getStatusLabel = () => {
        switch (status.toLowerCase()) {
            case 'in_progress':
                return 'In Progress';
            default:
                return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    const colors = getStatusColor();
    const sizeStyles = {
        small: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 11 },
        medium: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12 },
        large: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
    };

    return (
        <View
            style={[
                styles.badge,
                {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    paddingHorizontal: sizeStyles[size].paddingHorizontal,
                    paddingVertical: sizeStyles[size].paddingVertical,
                },
            ]}
        >
            <Text
                style={[
                    styles.text,
                    {
                        color: colors.text,
                        fontSize: sizeStyles[size].fontSize,
                    },
                ]}
            >
                {getStatusLabel()}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        borderRadius: 12,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    text: {
        fontWeight: '600',
    },
});
