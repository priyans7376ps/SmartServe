import { useQuery } from '@tanstack/react-query';
import { menuApi } from '../api/menu.api';

export function useMenu(params = {}) {
  const menuQuery = useQuery({
    queryKey: ['menu', params],
    queryFn: () => menuApi.getMenuItems(params),
    staleTime: 1000 * 60 * 5,
  });

  const specialsQuery = useQuery({
    queryKey: ['menu', 'specials'],
    queryFn: menuApi.getSpecials,
    staleTime: 1000 * 60 * 5,
  });

  const popularQuery = useQuery({
    queryKey: ['menu', 'popular'],
    queryFn: menuApi.getPopular,
    staleTime: 1000 * 60 * 5,
  });

  const recommendedQuery = useQuery({
    queryKey: ['menu', 'recommended'],
    queryFn: menuApi.getRecommended,
    staleTime: 1000 * 60 * 5,
  });

  return {
    items: menuQuery.data?.items || [],
    total: menuQuery.data?.total || 0,
    page: menuQuery.data?.page || 1,
    pageSize: menuQuery.data?.page_size || 20,
    totalPages: menuQuery.data?.total_pages || 1,
    isLoading: menuQuery.isLoading,
    isError: menuQuery.isError,
    error: menuQuery.error,
    refetch: menuQuery.refetch,

    specials: specialsQuery.data || [],
    isLoadingSpecials: specialsQuery.isLoading,

    popular: popularQuery.data || [],
    isLoadingPopular: popularQuery.isLoading,

    recommended: recommendedQuery.data || [],
    isLoadingRecommended: recommendedQuery.isLoading,
  };
}
