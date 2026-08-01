import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kitchenApi } from '../api/kitchen.api';

export function useKitchenOrders(filters = {}) {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['kitchen-orders', filters],
    queryFn: () => kitchenApi.getOrders(filters),
    refetchInterval: 5000,
    keepPreviousData: true,
  });

  const acceptMutation = useMutation({
    mutationFn: ({ orderId, notes }) => kitchenApi.acceptOrder(orderId, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ orderId, reason }) => kitchenApi.rejectOrder(orderId, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] }),
  });

  const startPreparingMutation = useMutation({
    mutationFn: ({ orderId, notes }) => kitchenApi.markPreparing(orderId, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] }),
  });

  const markReadyMutation = useMutation({
    mutationFn: ({ orderId, notes }) => kitchenApi.markReady(orderId, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] }),
  });

  const markCompletedMutation = useMutation({
    mutationFn: ({ orderId, notes }) => kitchenApi.markCompleted(orderId, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, reason }) => kitchenApi.cancelOrder(orderId, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] }),
  });

  return {
    orders: ordersQuery.data?.orders || [],
    total: ordersQuery.data?.total || 0,
    page: ordersQuery.data?.page || 1,
    totalPages: ordersQuery.data?.total_pages || 1,
    isLoading: ordersQuery.isLoading,
    isError: ordersQuery.isError,
    refetch: ordersQuery.refetch,

    acceptOrder: (orderId, notes) => acceptMutation.mutateAsync({ orderId, notes }),
    rejectOrder: (orderId, reason) => rejectMutation.mutateAsync({ orderId, reason }),
    startPreparing: (orderId, notes) => startPreparingMutation.mutateAsync({ orderId, notes }),
    markReady: (orderId, notes) => markReadyMutation.mutateAsync({ orderId, notes }),
    markCompleted: (orderId, notes) => markCompletedMutation.mutateAsync({ orderId, notes }),
    cancelOrder: (orderId, reason) => cancelMutation.mutateAsync({ orderId, reason }),

    isUpdating:
      acceptMutation.isPending ||
      rejectMutation.isPending ||
      startPreparingMutation.isPending ||
      markReadyMutation.isPending ||
      markCompletedMutation.isPending ||
      cancelMutation.isPending,
  };
}
