import { create } from 'zustand';

interface RefreshState {
  /**
   * Increment this signal to trigger a refresh on the active screen.
   */
  refreshSignal: number;
  /**
   * Call this to broadcast a refresh event (e.g. on tab re-press).
   */
  triggerRefresh: () => void;
}

export const useRefreshStore = create<RefreshState>((set) => ({
  refreshSignal: 0,
  triggerRefresh: () => set((state) => ({ refreshSignal: state.refreshSignal + 1 })),
}));
