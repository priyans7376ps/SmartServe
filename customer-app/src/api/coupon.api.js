import api from './axios';

export const couponApi = {
  getCoupons: async () => {
    const res = await api.get('/customer/coupons');
    return res.data;
  },

  applyCoupon: async (code) => {
    const res = await api.post('/customer/cart/coupon', { code });
    return res.data;
  },

  removeCoupon: async () => {
    const res = await api.delete('/customer/cart/coupon');
    return res.data;
  },
};
