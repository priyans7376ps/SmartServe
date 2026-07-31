import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      specialInstructions: '',

      addItem: (menuItem, quantity = 1, notes = '') => {
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((i) => i.item.id === menuItem.id);

        if (existingIndex > -1) {
          const updated = [...currentItems];
          updated[existingIndex].quantity += quantity;
          if (notes) updated[existingIndex].notes = notes;
          set({ items: updated });
        } else {
          set({
            items: [...currentItems, { item: menuItem, quantity, notes }],
          });
        }
      },

      removeItem: (itemId) => {
        set({ items: get().items.filter((i) => i.item.id !== itemId) });
      },

      updateQuantity: (itemId, delta) => {
        const currentItems = get().items;
        const updated = currentItems
          .map((i) => {
            if (i.item.id === itemId) {
              const newQty = i.quantity + delta;
              return newQty > 0 ? { ...i, quantity: newQty } : null;
            }
            return i;
          })
          .filter(Boolean);

        set({ items: updated });
      },

      setNotes: (itemId, notes) => {
        set({
          items: get().items.map((i) => (i.item.id === itemId ? { ...i, notes } : i)),
        });
      },

      setSpecialInstructions: (text) => set({ specialInstructions: text }),

      applyCoupon: (couponObj) => set({ coupon: couponObj }),
      removeCoupon: () => set({ coupon: null }),

      clearCart: () => set({ items: [], coupon: null, specialInstructions: '' }),

      // Financial Calculations
      getSubtotal: () => {
        return get().items.reduce((sum, i) => sum + i.item.price * i.quantity, 0);
      },

      getTax: () => {
        return get().getSubtotal() * 0.08; // 8% Tax
      },

      getServiceCharge: () => {
        return get().getSubtotal() * 0.05; // 5% Service Charge
      },

      getDiscount: () => {
        const subtotal = get().getSubtotal();
        const coupon = get().coupon;
        if (!coupon) return 0;
        if (coupon.discount_type === 'percentage') {
          return (subtotal * coupon.discount_value) / 100;
        }
        return Math.min(coupon.discount_value || 0, subtotal);
      },

      getGrandTotal: () => {
        const subtotal = get().getSubtotal();
        const tax = get().getTax();
        const service = get().getServiceCharge();
        const discount = get().getDiscount();
        return Math.max(0, subtotal + tax + service - discount);
      },

      getItemCount: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    {
      name: 'smartserve_cart',
    }
  )
);
