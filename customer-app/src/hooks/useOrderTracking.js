import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../api/order.api';

export function useOrderTracking(orderId, pollInterval = 5000) {
  const trackingQuery = useQuery({
    queryKey: ['orderTracking', orderId],
    queryFn: () => orderApi.trackOrder(orderId),
    enabled: !!orderId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'delivered' || status === 'cancelled') {
        return false;
      }
      return pollInterval;
    },
  });

  const detailsQuery = useQuery({
    queryKey: ['orderDetails', orderId],
    queryFn: () => orderApi.getOrderDetails(orderId),
    enabled: !!orderId,
  });

  return {
    tracking: trackingQuery.data,
    orderDetails: detailsQuery.data,
    isLoading: trackingQuery.isLoading || detailsQuery.isLoading,
    isError: trackingQuery.isError || detailsQuery.isError,
    error: trackingQuery.error || detailsQuery.error,
    refetch: () => {
      trackingQuery.refetch();
      detailsQuery.refetch();
    },
  };
}
