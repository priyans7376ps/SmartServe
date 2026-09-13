import api from './axios';

const extractCoupons = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.coupons)) return data.coupons;
  return [];
};

export const couponApi = {
  getCoupons: async () => {
    const res = await api.get('/customer/coupons');
    return extractCoupons(res.data);
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
