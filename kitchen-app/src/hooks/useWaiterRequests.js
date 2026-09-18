import { useEffect, useRef } from 'react';
import { useWaiterStore } from '../store/useWaiterStore';

export function useWaiterRequests() {
  const { fetchRequests, handleIncomingCall } = useWaiterStore();
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // 1. Initial fetch of active waiter requests from DB
    fetchRequests();

    // 2. Continuous fallback polling every 10s (recovers events missed if offline)
    pollIntervalRef.current = setInterval(() => {
      fetchRequests();
    }, 10000);

    // 3. Setup WebSocket connection
    const connectWS = () => {
      if (!isMountedRef.current) return;

      const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
      let wsUrl = '';
      if (API_BASE.startsWith('https://')) {
        wsUrl = API_BASE.replace('https://', 'wss://') + '/api/v1/kitchen/ws';
      } else if (API_BASE.startsWith('http://')) {
        wsUrl = API_BASE.replace('http://', 'ws://') + '/api/v1/kitchen/ws';
      } else {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${proto}//${window.location.hostname}:8000/api/v1/kitchen/ws`;
      }

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          // Send join_room for kitchen
          try {
            ws.send(JSON.stringify({ type: 'join_room', room: 'kitchen' }));
          } catch (e) {}
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.event === 'waiter_call' || data.event === 'waiter_call_update') {
              handleIncomingCall(data);
            }
          } catch (e) {
            // Ignore non-JSON messages
          }
        };

        ws.onclose = () => {
          if (isMountedRef.current) {
            reconnectTimeoutRef.current = setTimeout(connectWS, 3000);
          }
        };

        ws.onerror = () => {
          try {
            ws.close();
          } catch (e) {}
        };
      } catch (err) {
        if (isMountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(connectWS, 5000);
        }
      }
    };

    connectWS();

    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {}
      }
    };
  }, [fetchRequests, handleIncomingCall]);
}
