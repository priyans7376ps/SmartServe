import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '../store/useCartStore';
import { cartApi } from '../api/cart.api';

export function useCart() {
  const store = useCartStore();

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (cartQuery.data) {
      store.syncBackendCart(cartQuery.data);
    }
  }, [cartQuery.data]);

  return {
    cartId: store.cartId,
    items: store.items,
    subtotal: store.subtotal,
    taxAmount: store.taxAmount,
    discountAmount: store.discountAmount,
    totalAmount: store.totalAmount,
    totalItems: store.totalItems,
    couponCode: store.couponCode,
    notes: store.notes,
    isLoading: store.isLoading || cartQuery.isLoading,
    error: store.error || cartQuery.error,

    addItem: store.addItem,
    updateQuantity: store.updateQuantity,
    removeItem: store.removeItem,
    clearCart: store.clearCart,
    applyCoupon: store.applyCoupon,
    removeCoupon: store.removeCoupon,
    refetchCart: cartQuery.refetch,
  };
}
