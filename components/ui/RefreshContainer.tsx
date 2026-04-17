import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, ScrollViewProps } from 'react-native';
import { COLORS } from '@/constants/color';
import { useGlobalRefresh } from '@/hooks/useGlobalRefresh';

interface RefreshContainerProps extends ScrollViewProps {
  /**
   * Action to perform on refresh. Should be async.
   */
  onRefresh?: () => Promise<void>;
  /**
   * Content inside the container.
   */
  children: React.ReactNode;
}

/**
 * A wrapper around ScrollView that handles:
 * 1. Pull-to-refresh (native gesture)
 * 2. Global refresh broadcast (from tab re-press)
 * 
 * Usage: Replace <ScrollView> with <RefreshContainer> and provide `onRefresh`.
 */
export const RefreshContainer: React.FC<RefreshContainerProps> = ({ 
  onRefresh, 
  children, 
  contentContainerStyle,
  ...props 
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || refreshing) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('[RefreshContainer] Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing]);

  // Listen to global signal (e.g. from tab re-press)
  useGlobalRefresh(handleRefresh);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={handleRefresh} 
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
      contentContainerStyle={contentContainerStyle}
      {...props}
    >
      {children}
    </ScrollView>
  );
};
