import api from './axios';

export const loyaltyApi = {
  getLoyalty: async () => {
    const res = await api.get('/customer/loyalty');
    return res.data;
  },

  getTransactions: async (skip = 0, limit = 20) => {
    const res = await api.get('/customer/loyalty/transactions', { params: { skip, limit } });
    return res.data;
  },

  getRewards: async () => {
    const res = await api.get('/customer/loyalty/rewards');
    return res.data;
  },

  redeemReward: async (rewardId) => {
    const res = await api.post('/customer/loyalty/redeem-placeholder', null, { params: { reward_id: rewardId } });
    return res.data;
  },
};
