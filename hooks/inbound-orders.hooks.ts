import { api } from '@/services/axios.instance';
import { InboundOrder } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// API functions
const getInboundOrders = async (): Promise<InboundOrder[]> => {
  const response = await api.get('/inbound-orders');
  return response.data;
};

const getInboundOrderById = async (id: string): Promise<InboundOrder> => {
  const response = await api.get(`/inbound-orders/${id}`);
  return response.data;
};

const createInboundOrder = async (order: Partial<InboundOrder>): Promise<InboundOrder> => {
  const response = await api.post('/inbound-orders', order);
  return response.data;
};

const updateInboundOrder = async ({ id, updates }: { id: string; updates: Partial<InboundOrder> }): Promise<InboundOrder> => {
  const response = await api.patch(`/inbound-orders/${id}`, updates);
  return response.data;
};

// Hooks
export const useInboundOrders = () => {
  return useQuery({
    queryKey: ['inbound-orders'],
    queryFn: getInboundOrders,
  });
};

export const useInboundOrder = (id: string) => {
  return useQuery({
    queryKey: ['inbound-order', id],
    queryFn: () => getInboundOrderById(id),
    enabled: !!id,
  });
};

export const useCreateInboundOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createInboundOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbound-orders'] });
    },
  });
};

export const useUpdateInboundOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateInboundOrder,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inbound-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inbound-order', variables.id] });
    },
  });
};