import { COLORS } from '@/constants/color';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LocationBadgeProps {
    locationCode: string;
    onPress?: () => void;
    showCapacity?: boolean;
    capacity?: number;
    occupied?: number;
}

export function LocationBadge({
    locationCode,
    onPress,
    showCapacity = false,
    capacity,
    occupied
}: LocationBadgeProps) {
    const getCapacityColor = () => {
        if (!capacity || !occupied) return COLORS.textMuted;
        const percentage = (occupied / capacity) * 100;
        if (percentage >= 90) return '#EF4444'; // Red - almost full
        if (percentage >= 70) return '#F59E0B'; // Orange - getting full
        return '#10B981'; // Green - good capacity
    };

    const content = (
        <View style={[styles.badge, onPress && styles.clickable]}>
            <Feather name="map-pin" size={14} color={COLORS.primary} />
            <Text style={styles.code}>{locationCode}</Text>
            {showCapacity && capacity && occupied !== undefined && (
                <View style={styles.capacity}>
                    <Text style={[styles.capacityText, { color: getCapacityColor() }]}>
                        {occupied}/{capacity}
                    </Text>
                </View>
            )}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#CCFBF1',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    clickable: {
        opacity: 0.9,
    },
    code: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
    },
    capacity: {
        marginLeft: 4,
    },
    capacityText: {
        fontSize: 11,
        fontWeight: '600',
    },
});
