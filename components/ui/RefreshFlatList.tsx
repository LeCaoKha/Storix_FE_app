import React, { useCallback, useState } from 'react';
import { FlatList, FlatListProps, RefreshControl } from 'react-native';
import { COLORS } from '@/constants/color';
import { useGlobalRefresh } from '@/hooks/useGlobalRefresh';

interface RefreshFlatListProps<T> extends FlatListProps<T> {
  /**
   * Action to perform on refresh. Should be async.
   */
  onRefresh?: () => Promise<void>;
}

/**
 * A wrapper around FlatList that handles:
 * 1. Pull-to-refresh (native gesture)
 * 2. Global refresh broadcast (from tab re-press)
 * 
 * Usage: Replace <FlatList> with <RefreshFlatList> and provide `onRefresh`.
 */
export function RefreshFlatList<T>({ 
  onRefresh, 
  ...props 
}: RefreshFlatListProps<T>) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || refreshing) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('[RefreshFlatList] Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing]);

  // Listen to global signal (e.g. from tab re-press)
  useGlobalRefresh(handleRefresh);

  return (
    <FlatList
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={handleRefresh} 
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
      {...(props as any)}
    />
  );
}
