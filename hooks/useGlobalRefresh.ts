import { useEffect } from 'react';
import { useRefreshStore } from '@/stores/refresh.store';

/**
 * A hook that listens to the global `refreshSignal` (usually triggered by tab re-press).
 * 
 * @param onRefresh - Function to call when the refresh signal is received.
 */
export const useGlobalRefresh = (onRefresh: () => void | Promise<void>) => {
  const refreshSignal = useRefreshStore((state) => state.refreshSignal);

  useEffect(() => {
    // Only trigger if signal has been incremented at least once
    if (refreshSignal > 0) {
      onRefresh();
    }
  }, [refreshSignal]);
};
