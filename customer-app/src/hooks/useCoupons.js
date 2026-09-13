import { useQuery } from '@tanstack/react-query';
import { couponApi } from '../api/coupon.api';

export function useCoupons() {
  const query = useQuery({
    queryKey: ['coupons'],
    queryFn: couponApi.getCoupons,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  const rawData = query.data;
  const coupons = Array.isArray(rawData) ? rawData : [];

  // Always return a safe string — never an object — so callers can render error safely
  const errorMessage = query.error
    ? (query.error?.response?.data?.detail
        ? typeof query.error.response.data.detail === 'string'
          ? query.error.response.data.detail
          : 'Failed to load coupons.'
        : query.error?.message || 'Failed to load coupons.')
    : '';

  return {
    coupons,
    isLoading: query.isLoading,
    isError: query.isError,
    error: errorMessage,
    refetch: query.refetch,
  };
}
