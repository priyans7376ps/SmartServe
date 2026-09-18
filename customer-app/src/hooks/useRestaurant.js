import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { restaurantApi } from '../api/restaurant.api';
import { useTableStore } from '../store/useTableStore';

export function useRestaurant() {
  const setRestaurantDetails = useTableStore((s) => s.setRestaurantDetails);

  const query = useQuery({
    queryKey: ['customer', 'restaurant'],
    queryFn: () => restaurantApi.getRestaurantDetails(),
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  useEffect(() => {
    const raw = query.data;
    const rest = raw?.data || raw;
    if (rest && (rest.name || rest.id)) {
      setRestaurantDetails(rest);
      if (typeof document !== 'undefined' && rest.name) {
        document.title = `${rest.name} - SmartServe`;
      }
    }
  }, [query.data, setRestaurantDetails]);

  const resolvedData = query.data?.data || query.data || null;

  return {
    restaurant: resolvedData,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export default useRestaurant;
