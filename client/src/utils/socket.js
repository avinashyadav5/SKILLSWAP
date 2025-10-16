import { io } from 'socket.io-client';

const socket = io('https://skillswap-1-1iic.onrender.com', {
  withCredentials: true,
});

export default socket;
