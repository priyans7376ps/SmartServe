import api from './axios';

export const restaurantApi = {
  getRestaurantDetails: async () => {
    const res = await api.get('/customer/restaurant');
    return res.data;
  },
};

export default restaurantApi;
