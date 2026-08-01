import { create } from 'zustand';
import { cartApi } from '../api/cart.api';
import { couponApi } from '../api/coupon.api';

export const useCartStore = create((set, get) => ({
  cartId: null,
  items: [],
  subtotal: 0.0,
  taxAmount: 0.0,
  discountAmount: 0.0,
  totalAmount: 0.0,
  totalItems: 0,
  couponCode: null,
  notes: '',
  isLoading: false,
  error: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await cartApi.getCart();
      get().syncBackendCart(data);
      set({ isLoading: false });
      return data;
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.detail || 'Failed to fetch cart' });
    }
  },

  syncBackendCart: (data) => {
    if (!data) return;
    set({
      cartId: data.id,
      items: data.items || [],
      subtotal: data.subtotal || 0.0,
      taxAmount: data.tax_amount || 0.0,
      discountAmount: data.discount_amount || 0.0,
      totalAmount: data.total || 0.0,
      totalItems: data.total_items || 0,
      couponCode: data.coupon_code || null,
      notes: data.notes || '',
    });
  },

  addItem: async (menuItemId, quantity = 1, notes = '', variantSelected = null, addOnsSelected = null) => {
    set({ isLoading: true, error: null });
    try {
      const data = await cartApi.addItem(menuItemId, quantity, notes, variantSelected, addOnsSelected);
      get().syncBackendCart(data);
      set({ isLoading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to add item to cart';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  updateQuantity: async (cartItemId, quantity) => {
    set({ isLoading: true, error: null });
    try {
      const data = await cartApi.updateItemQuantity(cartItemId, quantity);
      get().syncBackendCart(data);
      set({ isLoading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update quantity';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  removeItem: async (cartItemId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await cartApi.removeItem(cartItemId);
      get().syncBackendCart(data);
      set({ isLoading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to remove item';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  clearCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await cartApi.clearCart();
      get().syncBackendCart(data);
      set({ isLoading: false });
      return data;
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.detail || 'Failed to clear cart' });
    }
  },

  applyCoupon: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const data = await couponApi.applyCoupon(code);
      get().syncBackendCart(data);
      set({ isLoading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to apply coupon';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  removeCoupon: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await couponApi.removeCoupon();
      get().syncBackendCart(data);
      set({ isLoading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to remove coupon';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  // Helpers matching UI props
  getSubtotal: () => get().subtotal,
  getTax: () => get().taxAmount,
  getDiscount: () => get().discountAmount,
  getGrandTotal: () => get().totalAmount,
  getItemCount: () => get().totalItems,
}));
