import { COLORS } from '@/constants/color';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface TabScreenHeaderProps {
  title: string;
  subtitle?: string;
  onAddPress?: () => void;
  showAddButton?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  showSearch?: boolean;
  children?: React.ReactNode;
}

export const TabScreenHeader: React.FC<TabScreenHeaderProps> = ({
  title,
  subtitle,
  onAddPress,
  showAddButton = false,
  searchPlaceholder = 'Tìm kiếm...',
  searchValue,
  onSearchChange,
  showSearch = false,
  children,
}) => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {showAddButton && onAddPress && (
            <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
              <Feather name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {showSearch && onSearchChange && (
          <View style={styles.searchContainer}>
            <Feather name="search" size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              value={searchValue}
              onChangeText={onSearchChange}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        )}

        {children}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    paddingTop: 60, // Safe area top + padding
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#11181C',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#687076',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F8FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#11181C',
    marginLeft: 8,
  },
});
