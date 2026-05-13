import { io } from 'socket.io-client';

const socket = io(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000', {
  path: '/socket.io',
  auth: { token: localStorage.getItem('accessToken') },
  autoConnect: false,
});

export default socket;
