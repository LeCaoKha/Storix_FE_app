import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ItemStagingEntry {
  total: number;
  bins: Record<string, number>;
}

interface InboundTicketStaging {
  items: Record<number, ItemStagingEntry>;
}

interface InboundStagingState {
  tickets: Record<number, InboundTicketStaging>;
  /** SET (replace) the quantity for a specific bin. Recomputes total from all bins. */
  setPlacement: (ticketId: number, itemId: number, binId: string, quantity: number) => void;
  getItemStagedQuantity: (ticketId: number, itemId: number) => number;
  getItemStagedBins: (ticketId: number, itemId: number) => Record<string, number>;
  clearTicket: (ticketId: number) => void;
  clearItem: (ticketId: number, itemId: number) => void;
}

const normalizeQuantity = (value: number) => Math.max(0, Math.floor(Number(value) || 0));

export const useInboundStagingStore = create<InboundStagingState>()(
  persist(
    (set, get) => ({
      tickets: {},

      setPlacement: (ticketId, itemId, binId, quantity) => {
        const safeTicketId = Number(ticketId);
        const safeItemId = Number(itemId);
        const safeBinId = String(binId || '').trim();
        const safeQuantity = normalizeQuantity(quantity);

        if (!Number.isFinite(safeTicketId) || safeTicketId <= 0) return;
        if (!Number.isFinite(safeItemId) || safeItemId <= 0) return;
        if (!safeBinId) return;

        set((state) => {
          const currentTicket = state.tickets[safeTicketId] || { items: {} };
          const currentItem = currentTicket.items[safeItemId] || { total: 0, bins: {} };

          // REPLACE the bin quantity (not accumulate)
          const nextBins = { ...currentItem.bins };
          if (safeQuantity > 0) {
            nextBins[safeBinId] = safeQuantity;
          } else {
            // Remove the bin entry if quantity is 0
            delete nextBins[safeBinId];
          }

          // Recompute total from ALL bins to prevent drift
          const nextTotal = Object.values(nextBins).reduce((sum, v) => sum + normalizeQuantity(v), 0);

          const nextItem: ItemStagingEntry = {
            total: nextTotal,
            bins: nextBins,
          };

          return {
            tickets: {
              ...state.tickets,
              [safeTicketId]: {
                items: {
                  ...currentTicket.items,
                  [safeItemId]: nextItem,
                },
              },
            },
          };
        });
      },

      getItemStagedQuantity: (ticketId, itemId) => {
        const safeTicketId = Number(ticketId);
        const safeItemId = Number(itemId);
        if (!Number.isFinite(safeTicketId) || safeTicketId <= 0) return 0;
        if (!Number.isFinite(safeItemId) || safeItemId <= 0) return 0;

        return get().tickets[safeTicketId]?.items?.[safeItemId]?.total || 0;
      },

      getItemStagedBins: (ticketId, itemId) => {
        const safeTicketId = Number(ticketId);
        const safeItemId = Number(itemId);
        if (!Number.isFinite(safeTicketId) || safeTicketId <= 0) return {};
        if (!Number.isFinite(safeItemId) || safeItemId <= 0) return {};

        return get().tickets[safeTicketId]?.items?.[safeItemId]?.bins || {};
      },

      clearTicket: (ticketId) => {
        const safeTicketId = Number(ticketId);
        if (!Number.isFinite(safeTicketId) || safeTicketId <= 0) return;

        set((state) => {
          const nextTickets = { ...state.tickets };
          delete nextTickets[safeTicketId];
          return { tickets: nextTickets };
        });
      },

      clearItem: (ticketId, itemId) => {
        const safeTicketId = Number(ticketId);
        const safeItemId = Number(itemId);
        if (!Number.isFinite(safeTicketId) || !Number.isFinite(safeItemId)) return;

        set((state) => {
          const ticket = state.tickets[safeTicketId];
          if (!ticket) return state;

          const nextItems = { ...ticket.items };
          delete nextItems[safeItemId];

          return {
            tickets: {
              ...state.tickets,
              [safeTicketId]: { items: nextItems },
            },
          };
        });
      },
    }),
    {
      name: 'inbound-staging-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
