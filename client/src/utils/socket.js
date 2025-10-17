import { io } from 'socket.io-client';

// ✅ Use environment variable or fallback to localhost
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ✅ Initialize Socket.io with proper config
const socket = io(BACKEND_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling'], // ensures compatibility across devices
  reconnectionAttempts: 5,              // retry 5 times before failing
  reconnectionDelay: 1000,              // 1 second delay between attempts
});

export default socket;
