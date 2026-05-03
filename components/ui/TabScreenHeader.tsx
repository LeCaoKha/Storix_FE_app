import { COLORS } from '@/constants/color';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabScreenHeaderProps {
  title?: string;
  subtitle?: string;
  onAddPress?: () => void;
  showAddButton?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  showSearch?: boolean;
  useTopSafeArea?: boolean;
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
  useTopSafeArea = true,
  children,
}) => {
  const insets = useSafeAreaInsets();
  const showAddInHeader = Boolean(title && showAddButton && onAddPress);
  const showAddInSearchRow = Boolean(!title && showSearch && showAddButton && onAddPress);
  const fallbackTopInset = Platform.OS === 'android' ? 28 : 44;
  const resolvedTopInset = useTopSafeArea ? Math.max(insets.top, fallbackTopInset) : 0;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
      <SafeAreaView edges={[]} style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: resolvedTopInset + 8 }]}>
          {title && (
            <View style={styles.headerTop}>
              <View style={styles.titleWrap}>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </View>
              {showAddInHeader && (
                <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
                  <Feather name="plus" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {showSearch && onSearchChange && (
            <View style={styles.searchRow}>
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
              {showAddInSearchRow && (
                <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
                  <Feather name="plus" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {children}
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
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
  titleWrap: {
    flex: 1,
    paddingRight: 12,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F8FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#11181C',
    marginLeft: 8,
  },
});
