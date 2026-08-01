import { useQuery } from '@tanstack/react-query';
import { menuApi } from '../api/menu.api';

export function useCategories(restaurantId = null) {
  const query = useQuery({
    queryKey: ['categories', restaurantId],
    queryFn: () => menuApi.getCategories(restaurantId),
    staleTime: 1000 * 60 * 10,
  });

  return {
    categories: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
