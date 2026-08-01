import api from './axios';

export const cartApi = {
  getCart: async () => {
    const res = await api.get('/customer/cart');
    return res.data;
  },

  addItem: async (menuItemId, quantity = 1, notes = '', variantSelected = null, addOnsSelected = null) => {
    const res = await api.post('/customer/cart/items', {
      menu_item_id: menuItemId,
      quantity,
      notes,
      variant_selected: variantSelected,
      add_ons_selected: addOnsSelected,
    });
    return res.data;
  },

  updateItemQuantity: async (cartItemId, quantity, notes = null) => {
    const res = await api.put(`/customer/cart/items/${cartItemId}`, {
      quantity,
      notes,
    });
    return res.data;
  },

  removeItem: async (cartItemId) => {
    const res = await api.delete(`/customer/cart/items/${cartItemId}`);
    return res.data;
  },

  clearCart: async () => {
    const res = await api.delete('/customer/cart');
    return res.data;
  },
};
