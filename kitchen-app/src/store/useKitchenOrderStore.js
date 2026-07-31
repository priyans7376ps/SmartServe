import { create } from 'zustand';
import api from '../api/axios';

// Initial sample orders for KDS display when database is empty
const INITIAL_DEMO_ORDERS = [
  {
    id: 'ord_1001',
    token_number: '101',
    table_number: 5,
    customer_type: 'Guest',
    customer_name: 'Diner #5',
    placed_at: new Date(Date.now() - 8 * 60000).toISOString(), // 8 mins ago
    status: 'pending', // pending, preparing, ready, completed, cancelled
    estimated_prep_time: 15,
    is_priority: true,
    special_instructions: 'Extra spicy for pasta, no onions in soup.',
    items: [
      {
        id: 'item_1',
        name: 'Truffle Mushroom Pasta',
        quantity: 2,
        price: 18.50,
        is_veg: true,
        image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400&q=80',
        instructions: 'Extra parmesan cheese on top',
      },
      {
        id: 'item_2',
        name: 'Creamy Tomato Soup',
        quantity: 1,
        price: 8.00,
        is_veg: true,
        image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&q=80',
        instructions: 'No onions please',
      },
    ],
  },
  {
    id: 'ord_1002',
    token_number: '102',
    table_number: 12,
    customer_type: 'Registered',
    customer_name: 'Alex Johnson',
    placed_at: new Date(Date.now() - 18 * 60000).toISOString(), // 18 mins ago
    status: 'preparing',
    estimated_prep_time: 20,
    is_priority: false,
    special_instructions: 'Well done burger patties.',
    items: [
      {
        id: 'item_3',
        name: 'Smoked Bacon Cheeseburger',
        quantity: 2,
        price: 16.00,
        is_veg: false,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
        instructions: 'Gluten free buns',
      },
      {
        id: 'item_4',
        name: 'Crispy French Fries',
        quantity: 2,
        price: 5.50,
        is_veg: true,
        image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80',
        instructions: '',
      },
    ],
  },
  {
    id: 'ord_1003',
    token_number: '103',
    table_number: 8,
    customer_type: 'Guest',
    customer_name: 'Table #8 Guest',
    placed_at: new Date(Date.now() - 25 * 60000).toISOString(),
    status: 'ready',
    estimated_prep_time: 15,
    is_priority: false,
    special_instructions: 'Serve hot with dip sauce.',
    items: [
      {
        id: 'item_5',
        name: 'Woodfired Pepperoni Pizza',
        quantity: 1,
        price: 21.00,
        is_veg: false,
        image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=400&q=80',
        instructions: '',
      },
    ],
  },
];

export const useKitchenOrderStore = create((set, get) => ({
  orders: JSON.parse(localStorage.getItem('kitchen_orders') || JSON.stringify(INITIAL_DEMO_ORDERS)),
  kitchenStatus: 'online', // 'online' | 'busy' | 'paused'
  statusFilter: 'all', // 'all' | 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
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
      // Try backend endpoint first
      const res = await api.get('/kitchen/orders');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        set({ orders: res.data, isLoading: false });
        localStorage.setItem('kitchen_orders', JSON.stringify(res.data));
        return;
      }
    } catch (err) {
      // Endpoint fallback to saved local state or initial demo orders
    }

    const currentOrders = get().orders;
    set({ orders: currentOrders.length ? currentOrders : INITIAL_DEMO_ORDERS, isLoading: false });
  },

  updateOrderStatus: async (orderId, newStatus, reason = '') => {
    // Optimistic UI update
    const prevOrders = get().orders;
    const updatedOrders = prevOrders.map((ord) => {
      if (ord.id === orderId || ord.order_number === orderId || ord.token_number === orderId) {
        return {
          ...ord,
          status: newStatus,
          cancellation_reason: reason || ord.cancellation_reason,
          updated_at: new Date().toISOString(),
        };
      }
      return ord;
    });

    set({ orders: updatedOrders, lastNotification: { type: newStatus, orderId } });
    localStorage.setItem('kitchen_orders', JSON.stringify(updatedOrders));

    try {
      await api.patch(`/kitchen/orders/${orderId}/status`, { status: newStatus, reason });
    } catch (e) {
      // Keep optimistic update for smooth UI
    }
  },

  addDemoOrder: (newOrder) => {
    const orders = [newOrder, ...get().orders];
    set({ orders, lastNotification: { type: 'new_order', orderId: newOrder.id } });
    localStorage.setItem('kitchen_orders', JSON.stringify(orders));
  },

  resetDemoOrders: () => {
    set({ orders: INITIAL_DEMO_ORDERS });
    localStorage.setItem('kitchen_orders', JSON.stringify(INITIAL_DEMO_ORDERS));
  },
}));
