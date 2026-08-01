import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../api/order.api';
import { useAuthStore } from '../store/useAuthStore';

export function useOrders(skip = 0, limit = 20) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const activeOrdersQuery = useQuery({
    queryKey: ['orders', 'active', skip, limit],
    queryFn: () => orderApi.getOrders(skip, limit),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
  });

  const historyOrdersQuery = useQuery({
    queryKey: ['orders', 'history', skip, limit],
    queryFn: () => orderApi.getOrderHistory(skip, limit),
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: ({ orderId, reason }) => orderApi.cancelOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderTracking'] });
    },
  });

  const repeatOrderMutation = useMutation({
    mutationFn: (orderId) => orderApi.repeatOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return {
    activeOrders: activeOrdersQuery.data || [],
    isLoadingActive: activeOrdersQuery.isLoading,
    activeError: activeOrdersQuery.error,

    historyOrders: historyOrdersQuery.data || [],
    isLoadingHistory: historyOrdersQuery.isLoading,
    historyError: historyOrdersQuery.error,

    cancelOrder: cancelOrderMutation.mutateAsync,
    isCancelling: cancelOrderMutation.isPending,

    repeatOrder: repeatOrderMutation.mutateAsync,
    isRepeating: repeatOrderMutation.isPending,

    refetchOrders: () => {
      activeOrdersQuery.refetch();
      historyOrdersQuery.refetch();
    },
  };
}
