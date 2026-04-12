import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Stores "pending" (draft, not-yet-confirmed) quantities that staff members
 * have entered in the ShelfDetailModal but haven't yet confirmed.
 *
 * Key format: `{ticketId}-{itemId}-{shelfId}`
 * This ensures per-ticket, per-item, per-shelf isolation.
 *
 * Lifecycle:
 *  - Set: when user changes quantity in the modal (real-time)
 *  - Read: when modal opens for a given shelf (restore previous draft)
 *  - Clear shelf: after a successful confirm operation for that shelf
 *  - Clear ticket: when a ticket is fully completed (optional cleanup)
 */

interface PendingQuantitiesState {
  /** Map of `{ticketId}-{itemId}-{shelfId}` → pending quantity */
  quantities: Record<string, number>;

  /** Set (or update) the pending quantity for a specific item on a shelf */
  setPendingQty: (ticketId: number, itemId: number, shelfId: string, qty: number) => void;

  /** Get the pending quantity for a specific item on a shelf (defaults to 0) */
  getPendingQty: (ticketId: number, itemId: number, shelfId: string) => number;

  /** Clear all pending quantities for a specific shelf after a successful confirm */
  clearShelfPending: (ticketId: number, shelfId: string) => void;

  /** Clear all pending quantities for an entire ticket (e.g. ticket completed) */
  clearTicketPending: (ticketId: number) => void;
}

const makeKey = (ticketId: number, itemId: number, shelfId: string) =>
  `${ticketId}-${itemId}-${shelfId}`;

const shelfPrefix = (ticketId: number, shelfId: string) =>
  `${ticketId}-`;

export const usePendingQuantitiesStore = create<PendingQuantitiesState>()(
  persist(
    (set, get) => ({
      quantities: {},

      setPendingQty: (ticketId, itemId, shelfId, qty) => {
        const key = makeKey(ticketId, itemId, shelfId);
        set((state) => ({
          quantities: {
            ...state.quantities,
            [key]: Math.max(0, qty),
          },
        }));
      },

      getPendingQty: (ticketId, itemId, shelfId) => {
        const key = makeKey(ticketId, itemId, shelfId);
        return get().quantities[key] ?? 0;
      },

      clearShelfPending: (ticketId, shelfId) => {
        set((state) => {
          const prefix = `${ticketId}-`;
          const shelfSuffix = `-${shelfId}`;
          const next: Record<string, number> = {};
          for (const [k, v] of Object.entries(state.quantities)) {
            // Keep keys that don't belong to this ticketId+shelfId combo
            const matchesTicket = k.startsWith(prefix);
            const matchesShelf = k.endsWith(shelfSuffix);
            if (!(matchesTicket && matchesShelf)) {
              next[k] = v;
            }
          }
          return { quantities: next };
        });
      },

      clearTicketPending: (ticketId) => {
        set((state) => {
          const prefix = `${ticketId}-`;
          const next: Record<string, number> = {};
          for (const [k, v] of Object.entries(state.quantities)) {
            if (!k.startsWith(prefix)) {
              next[k] = v;
            }
          }
          return { quantities: next };
        });
      },
    }),
    {
      name: 'pending-quantities-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
