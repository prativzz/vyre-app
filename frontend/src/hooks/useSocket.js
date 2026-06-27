import { WS_URL } from '../config';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export default function useSocket(token) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      console.warn('⚠️ No token provided to useSocket');
      return;
    }

    console.log('🔑 Connecting socket with token:', token.slice(0, 20) + '...');

    const newSocket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
    });
    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
      console.error('🔍 Full error:', err);
    });
    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });
    newSocket.on('error', (err) => {
      console.error('❌ Socket error:', err);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return { socket };
}