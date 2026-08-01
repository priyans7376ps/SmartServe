import { useQuery } from '@tanstack/react-query';
import { couponApi } from '../api/coupon.api';

export function useCoupons() {
  const query = useQuery({
    queryKey: ['coupons'],
    queryFn: couponApi.getCoupons,
    staleTime: 1000 * 60 * 10,
  });

  return {
    coupons: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
