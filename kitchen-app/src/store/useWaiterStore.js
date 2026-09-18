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
  allRequests: [],
  activeAlert: null,
  isModalOpen: false,
  isLoading: false,

  setIsModalOpen: (open) => set({ isModalOpen: open }),
  dismissAlert: () => set({ activeAlert: null }),

  fetchRequests: async () => {
    try {
      set({ isLoading: true });
      const res = await waiterApi.getWaiterRequests('all');
      const rawList = Array.isArray(res)
        ? res
        : (Array.isArray(res?.data) ? res.data : (res?.requests || []));

      const normalized = rawList.map((r) => ({
        ...r,
        id: r.id || r.request_id,
        table_number: r.table_number || r.table_id || '1',
        status: (r.status || 'pending').toLowerCase(),
        created_at: r.created_at || new Date().toISOString(),
      }));

      // Active requests: pending, open, acknowledged
      const activeOnly = normalized.filter(
        (r) => r.status === 'pending' || r.status === 'acknowledged' || r.status === 'open'
      );
      set({ requests: activeOnly, allRequests: normalized, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  handleIncomingCall: (callData) => {
    if (!callData) return;
    const payload = callData.data || callData;
    const reqId = payload.id || payload.request_id;
    if (!reqId) return;

    const normalizedStatus = (payload.status || 'pending').toLowerCase();
    const item = {
      ...payload,
      id: reqId,
      status: normalizedStatus,
      table_number: payload.table_number || payload.table_id || '1',
      created_at: payload.created_at || new Date().toISOString(),
    };

    const current = get().requests;
    const existingIndex = current.findIndex((r) => (r.id || r.request_id) === reqId);

    let updatedList;
    if (existingIndex >= 0) {
      if (normalizedStatus === 'resolved' || normalizedStatus === 'cancelled') {
        updatedList = current.filter((r) => (r.id || r.request_id) !== reqId);
      } else {
        updatedList = current.map((r) => ((r.id || r.request_id) === reqId ? { ...r, ...item } : r));
      }
    } else {
      if (normalizedStatus !== 'resolved' && normalizedStatus !== 'cancelled') {
        updatedList = [item, ...current];
      } else {
        updatedList = current;
      }
    }

    // Play chime and trigger visible toast alert if pending or open
    if (normalizedStatus === 'pending' || normalizedStatus === 'open') {
      playWaiterChime();
      set({ requests: updatedList, activeAlert: item });
    } else {
      set({ requests: updatedList });
    }
  },

  acknowledgeRequest: async (requestId) => {
    try {
      const res = await waiterApi.updateRequestStatus(requestId, 'acknowledged');
      const updated = res?.data || res;
      get().handleIncomingCall(updated);
    } catch (err) {
      console.error('Failed to acknowledge waiter request:', err);
    }
  },

  resolveRequest: async (requestId) => {
    try {
      const res = await waiterApi.updateRequestStatus(requestId, 'resolved');
      const updated = res?.data || res;
      get().handleIncomingCall(updated);
      if (get().activeAlert?.id === requestId) {
        set({ activeAlert: null });
      }
    } catch (err) {
      console.error('Failed to resolve waiter request:', err);
    }
  },
}));
