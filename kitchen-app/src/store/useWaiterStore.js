import { create } from 'zustand';
import { waiterApi } from '../api/waiter.api';

export function playWaiterChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // Tone 1 - High bell
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Tone 2 - Higher chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.18); // D6
    gain2.gain.setValueAtTime(0.45, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.8);
  } catch (e) {
    // Browser audio policy fallback
  }
}

export const useWaiterStore = create((set, get) => ({
  requests: [],
  activeAlert: null,
  isModalOpen: false,
  isLoading: false,

  setIsModalOpen: (open) => set({ isModalOpen: open }),
  dismissAlert: () => set({ activeAlert: null }),

  fetchRequests: async () => {
    try {
      set({ isLoading: true });
      // Fetch both pending and acknowledged requests
      const data = await waiterApi.getWaiterRequests('all');
      const activeOnly = (Array.isArray(data) ? data : []).filter(
        (r) => r.status === 'pending' || r.status === 'acknowledged'
      );
      set({ requests: activeOnly, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  handleIncomingCall: (callData) => {
    if (!callData || !callData.id) return;
    const current = get().requests;
    const existingIndex = current.findIndex((r) => r.id === callData.id);

    let updatedList;
    if (existingIndex >= 0) {
      // If already marked resolved, remove from active list
      if (callData.status === 'resolved' || callData.status === 'cancelled') {
        updatedList = current.filter((r) => r.id !== callData.id);
      } else {
        updatedList = current.map((r) => (r.id === callData.id ? { ...r, ...callData } : r));
      }
    } else {
      if (callData.status !== 'resolved' && callData.status !== 'cancelled') {
        updatedList = [callData, ...current];
      } else {
        updatedList = current;
      }
    }

    // Play chime and trigger visible toast alert if pending
    if (callData.status === 'pending') {
      playWaiterChime();
      set({ requests: updatedList, activeAlert: callData });
    } else {
      set({ requests: updatedList });
    }
  },

  acknowledgeRequest: async (requestId) => {
    try {
      const updated = await waiterApi.updateRequestStatus(requestId, 'acknowledged');
      get().handleIncomingCall(updated);
    } catch (err) {
      console.error('Failed to acknowledge waiter request:', err);
    }
  },

  resolveRequest: async (requestId) => {
    try {
      const updated = await waiterApi.updateRequestStatus(requestId, 'resolved');
      get().handleIncomingCall(updated);
      if (get().activeAlert?.id === requestId) {
        set({ activeAlert: null });
      }
    } catch (err) {
      console.error('Failed to resolve waiter request:', err);
    }
  },
}));
