import { create } from 'zustand';
import api from '../api/axios';

export const useKitchenOrderStore = create((set, get) => ({
  orders: [],
  kitchenStatus: 'online',
  statusFilter: 'all',
  searchQuery: '',
  isVegOnly: false,
  isNonVegOnly: false,
  priorityOnly: false,
  soundEnabled: true,
  lastNotification: null,
  isLoading: false,
  error: null,

  setKitchenStatus: (status) => set({ kitchenStatus: status }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setIsVegOnly: (isVegOnly) => set({ isVegOnly }),
  setIsNonVegOnly: (isNonVegOnly) => set({ isNonVegOnly }),
  setPriorityOnly: (priorityOnly) => set({ priorityOnly }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/kitchen/orders', {
        params: {
          status: get().statusFilter === 'all' ? undefined : get().statusFilter,
          search: get().searchQuery || undefined,
          priority: get().priorityOnly ? 'high' : undefined,
        },
      });
      const orderList = res.data?.orders || (Array.isArray(res.data) ? res.data : []);
      set({ orders: orderList, isLoading: false });
      localStorage.setItem('kitchen_orders', JSON.stringify(orderList));
    } catch (err) {
      const saved = localStorage.getItem('kitchen_orders');
      set({ orders: saved ? JSON.parse(saved) : [], isLoading: false });
    }
  },

  updateOrderStatus: async (orderId, newStatus, reason = '') => {
    const prevOrders = get().orders;
    const updatedOrders = prevOrders.map((ord) => {
      if (ord.id === orderId || ord.order_number === orderId) {
        return {
          ...ord,
          status: newStatus,
          updated_at: new Date().toISOString(),
        };
      }
      return ord;
    });

    set({ orders: updatedOrders, lastNotification: { type: newStatus, orderId } });
    localStorage.setItem('kitchen_orders', JSON.stringify(updatedOrders));

    try {
      if (newStatus === 'confirmed' || newStatus === 'accepted') {
        await api.post(`/kitchen/orders/${orderId}/accept`);
      } else if (newStatus === 'preparing') {
        await api.post(`/kitchen/orders/${orderId}/preparing`);
      } else if (newStatus === 'ready') {
        await api.post(`/kitchen/orders/${orderId}/ready`);
      } else if (newStatus === 'completed') {
        await api.post(`/kitchen/orders/${orderId}/completed`);
      } else if (newStatus === 'cancelled' || newStatus === 'rejected') {
        await api.post(`/kitchen/orders/${orderId}/cancel`, null, { params: { reason } });
      }
      // Refresh list to keep backend state 100% in sync
      get().fetchOrders();
    } catch (e) {
      // Revert if backend error
      get().fetchOrders();
    }
  },

  resetDemoOrders: () => {
    get().fetchOrders();
  },
}));
