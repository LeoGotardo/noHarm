import socket from '@/services/socket.js';
import { useEffect, useState } from 'react';

export const useWebSocket = () => {
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      socket.auth = { token };
      if (!socket.connected) socket.connect();
    }

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  return { connected };
};

export const emit = (event: string, data: unknown) => socket.emit(event, data);
export { socket };
