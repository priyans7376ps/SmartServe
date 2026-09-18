import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { restaurantApi } from '../api/restaurant.api';
import { useTableStore } from '../store/useTableStore';

export function useRestaurant() {
  const setRestaurantDetails = useTableStore((s) => s.setRestaurantDetails);

  const query = useQuery({
    queryKey: ['customer', 'restaurant'],
    queryFn: () => restaurantApi.getRestaurantDetails(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (query.data && query.data.name) {
      setRestaurantDetails(query.data);
    }
  }, [query.data, setRestaurantDetails]);

  return {
    restaurant: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export default useRestaurant;
