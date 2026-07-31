import { useEffect, useState, useRef } from 'react';
import { useKitchenOrderStore } from '../store/useKitchenOrderStore';

/**
 * Hook interface for WebSocket order subscription fallback/polling.
 * Prepared for real-time kitchen order updates.
 */
export function useWebSocketOrderHook() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const fetchOrders = useKitchenOrderStore((s) => s.fetchOrders);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    // Auto polling every 10 seconds as a reliable real-time fallback
    setIsConnected(true);
    fetchOrders();

    pollTimerRef.current = setInterval(() => {
      fetchOrders();
    }, 10000);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [fetchOrders]);

  return {
    isConnected,
    lastMessage,
    sendMessage: (msg) => console.log('WebSocket outbound message placeholder:', msg),
  };
}
