import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface PriorityBadgeProps {
    priority: 'low' | 'medium' | 'high' | 'urgent';
    size?: 'small' | 'medium';
}

export function PriorityBadge({ priority, size = 'medium' }: PriorityBadgeProps) {
    const getPriorityConfig = () => {
        switch (priority) {
            case 'low':
                return {
                    icon: 'arrow-down',
                    label: 'Low',
                    color: '#6B7280',
                    background: '#F3F4F6',
                };
            case 'medium':
                return {
                    icon: 'minus',
                    label: 'Medium',
                    color: '#3B82F6',
                    background: '#EFF6FF',
                };
            case 'high':
                return {
                    icon: 'arrow-up',
                    label: 'High',
                    color: '#F59E0B',
                    background: '#FEF3C7',
                };
            case 'urgent':
                return {
                    icon: 'alert-triangle',
                    label: 'Urgent',
                    color: '#EF4444',
                    background: '#FEE2E2',
                };
        }
    };

    const config = getPriorityConfig();
    const isSmall = size === 'small';

    return (
        <View style={[styles.badge, { backgroundColor: config.background }]}>
            <Feather
                name={config.icon as any}
                size={isSmall ? 12 : 14}
                color={config.color}
            />
            <Text style={[
                styles.label,
                { color: config.color, fontSize: isSmall ? 11 : 12 }
            ]}>
                {config.label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    label: {
        fontWeight: '600',
    },
});
