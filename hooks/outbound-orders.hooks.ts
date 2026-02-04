import { api } from '@/services/axios.instance';
import { OutboundOrder } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// API functions
const getOutboundOrders = async (): Promise<OutboundOrder[]> => {
  const response = await api.get('/outbound-orders');
  return response.data;
};

const getOutboundOrderById = async (id: string): Promise<OutboundOrder> => {
  const response = await api.get(`/outbound-orders/${id}`);
  return response.data;
};

const createOutboundOrder = async (order: Partial<OutboundOrder>): Promise<OutboundOrder> => {
  const response = await api.post('/outbound-orders', order);
  return response.data;
};

const updateOutboundOrder = async ({ id, updates }: { id: string; updates: Partial<OutboundOrder> }): Promise<OutboundOrder> => {
  const response = await api.patch(`/outbound-orders/${id}`, updates);
  return response.data;
};

// Hooks
export const useOutboundOrders = () => {
  return useQuery({
    queryKey: ['outbound-orders'],
    queryFn: getOutboundOrders,
  });
};

export const useOutboundOrder = (id: string) => {
  return useQuery({
    queryKey: ['outbound-order', id],
    queryFn: () => getOutboundOrderById(id),
    enabled: !!id,
  });
};

export const useCreateOutboundOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createOutboundOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-orders'] });
    },
  });
};

export const useUpdateOutboundOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateOutboundOrder,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['outbound-orders'] });
      queryClient.invalidateQueries({ queryKey: ['outbound-order', variables.id] });
    },
  });
};