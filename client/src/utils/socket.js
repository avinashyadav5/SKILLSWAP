import { io } from "socket.io-client";

// Use environment variable or default to deployed backend
const BACKEND_URL =
  import.meta.env.VITE_API_URL || "https://skillswap-1-1iic.onrender.com";

// ✅ Create one shared socket instance for the whole app
// This ensures connection is reused across pages (Navbar, Chat, Notifications)
const socket = io(BACKEND_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
