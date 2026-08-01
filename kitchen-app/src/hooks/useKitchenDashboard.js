import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';

export function useKitchenDashboard(restaurantId = null) {
  const statsQuery = useQuery({
    queryKey: ['kitchen-stats', restaurantId],
    queryFn: () => dashboardApi.getStats(restaurantId),
    refetchInterval: 5000,
  });

  const performanceQuery = useQuery({
    queryKey: ['kitchen-performance', restaurantId],
    queryFn: () => dashboardApi.getPerformance(restaurantId),
    refetchInterval: 10000,
  });

  return {
    stats: statsQuery.data || {
      today_orders: 0,
      pending_orders: 0,
      accepted_orders: 0,
      preparing_orders: 0,
      ready_orders: 0,
      completed_orders: 0,
      cancelled_orders: 0,
      average_cooking_time: 15,
      average_waiting_time: 8,
      active_tables: 0,
    },
    performance: performanceQuery.data || {
      completion_rate: 100,
      rejection_rate: 0,
      completed_count: 0,
      cancelled_count: 0,
      average_preparation_time: 15,
      performance_rating: 'Optimal',
    },
    isLoading: statsQuery.isLoading || performanceQuery.isLoading,
    isError: statsQuery.isError || performanceQuery.isError,
    refetch: () => {
      statsQuery.refetch();
      performanceQuery.refetch();
    },
  };
}
