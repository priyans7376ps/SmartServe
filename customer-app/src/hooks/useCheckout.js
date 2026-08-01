import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../api/order.api';
import { useCartStore } from '../store/useCartStore';

export function useCheckout() {
  const queryClient = useQueryClient();
  const cartStore = useCartStore();

  const summaryQuery = useQuery({
    queryKey: ['checkout', 'summary', cartStore.couponCode],
    queryFn: () => orderApi.getCheckoutSummary({ coupon_code: cartStore.couponCode }),
    enabled: cartStore.totalItems > 0,
  });

  const placeOrderMutation = useMutation({
    mutationFn: (orderPayload) => orderApi.placeOrder(orderPayload),
    onSuccess: () => {
      cartStore.clearCart();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const preparePaymentMutation = useMutation({
    mutationFn: ({ amount, paymentMethod }) => orderApi.preparePayment(amount, paymentMethod),
  });

  return {
    summary: summaryQuery.data,
    isLoadingSummary: summaryQuery.isLoading,
    summaryError: summaryQuery.error,

    placeOrder: placeOrderMutation.mutateAsync,
    isPlacingOrder: placeOrderMutation.isPending,
    placeOrderError: placeOrderMutation.error,

    preparePayment: preparePaymentMutation.mutateAsync,
    isPreparingPayment: preparePaymentMutation.isPending,
  };
}
