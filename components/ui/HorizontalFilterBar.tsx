import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface FilterOption<T = string> {
  label: string;
  value: T;
  count?: number;
}

interface HorizontalFilterBarProps<T = string> {
  options: FilterOption<T>[];
  activeValue: T;
  onSelect: (value: T) => void;
}

export const HorizontalFilterBar = <T extends string>({
  options,
  activeValue,
  onSelect,
}: HorizontalFilterBarProps<T>) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((option) => {
          const isActive = option.value === activeValue;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterOption,
                isActive && styles.activeOption,
              ]}
              onPress={() => onSelect(option.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  isActive && styles.activeText,
                ]}
              >
                {option.label}
                {option.count !== undefined && ` (${option.count})`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  activeOption: {
    backgroundColor: '#008080',
    borderColor: '#008080',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeText: {
    color: '#fff',
  },
});