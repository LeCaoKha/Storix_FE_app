import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS } from '@/constants/color';

export interface FilterOption<T extends string> {
    value: T;
    label: string;
    count?: number;
}

interface HorizontalFilterBarProps<T extends string> {
    options: FilterOption<T>[];
    activeFilter: T;
    onFilterChange: (filter: T) => void;
}

export function HorizontalFilterBar<T extends string>({
    options,
    activeFilter,
    onFilterChange,
}: HorizontalFilterBarProps<T>) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
        >
            {options.map((option) => (
                <TouchableOpacity
                    key={option.value}
                    style={[
                        styles.filterButton,
                        activeFilter === option.value && styles.filterButtonActive,
                    ]}
                    onPress={() => onFilterChange(option.value)}
                >
                    <Text
                        style={
                            activeFilter === option.value
                                ? styles.filterTextActive
                                : styles.filterText
                        }
                    >
                        {option.label}
                    </Text>
                    {option.count !== undefined && (
                        <View
                            style={[
                                styles.filterCount,
                                activeFilter === option.value && styles.filterCountActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.filterCountText,
                                    activeFilter === option.value &&
                                    styles.filterCountTextActive,
                                ]}
                            >
                                {option.count}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    filterScroll: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        height: 40, // Fix: prevent extra vertical whitespace
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 6,
        alignItems: 'center', // Fix: prevent buttons from stretching in horizontal ScrollView
        justifyContent: 'center',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 16,
        backgroundColor: COLORS.background,
        gap: 4,
    },
    filterButtonActive: {
        backgroundColor: COLORS.primary,
    },
    filterText: {
        fontSize: 12,
        color: COLORS.text,
        fontWeight: '500',
    },
    filterTextActive: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
    },
    filterCount: {
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    filterCountActive: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    filterCountText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.text,
    },
    filterCountTextActive: {
        color: '#fff',
    },
});
