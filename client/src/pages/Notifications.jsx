import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

export default function Notification({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [muted, setMuted] = useState(false);

  // ✅ Use env variable for backend (Render + Localhost)
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ✅ Initialize socket with dynamic backend
  const socket = io(BACKEND_URL, { transports: ["websocket", "polling"] });

  useEffect(() => {
    if (!userId) return;

    socket.emit("join_room", userId);

    const handleNotification = (note) => {
      if (!muted) {
        const formattedNote =
          typeof note === "string"
            ? { id: Date.now(), message: note, read: false }
            : {
                id: note.id || Date.now(),
                message: note.message,
                read: note.read || false,
              };

        setNotifications((prev) => [formattedNote, ...prev]);
      }
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [userId, muted]);

  // ✅ Toggle mute state (API call to backend)
  const toggleMute = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications/mute/${userId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle mute");
      const data = await res.json();
      setMuted(data.muted);
    } catch (err) {
      console.error("Mute toggle failed:", err);
      alert("⚠️ Failed to toggle notifications mute state");
    }
  };

  // ✅ Mark a notification as read
  const markRead = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/api/notifications/read/${id}`, {
        method: "PATCH",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Mark read failed:", err);
    }
  };

  return (
    <div className="relative min-h-screen text-white p-6 overflow-hidden bg-gradient-to-br from-[#1b2845] to-[#000f89]">
      {/* Background Animation */}
      <Particles
        className="absolute inset-0 z-0"
        init={loadSlim}
        options={{
          background: { color: { value: "#0f172a" } },
          particles: {
            number: { value: 70 },
            color: { value: "#00bfff" },
            links: { enable: true, color: "#ffffff", distance: 120 },
            move: { enable: true, speed: 1 },
            shape: { type: "circle" },
            opacity: { value: 0.5 },
            size: { value: 2 },
          },
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto">
        <motion.h1
          className="text-3xl font-bold mb-6 flex items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          🔔 Notifications
        </motion.h1>

        {/* Mute Button */}
        <motion.button
          onClick={toggleMute}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-4 py-2 mb-6 rounded-lg shadow-md transition ${
            muted
              ? "bg-gray-500 hover:bg-gray-600 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          {muted ? "🔇 Muted" : "🔔 Mute"}
        </motion.button>

        {/* Notifications List */}
        <AnimatePresence>
          {notifications.length === 0 ? (
            <motion.p
              className="text-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              No notifications yet.
            </motion.p>
          ) : (
            notifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4 }}
                className={`px-4 py-3 mb-4 rounded-2xl shadow-lg flex justify-between items-center ${
                  n.read
                    ? "bg-gray-600 text-gray-200"
                    : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white"
                }`}
              >
                <span className="flex-1 pr-3">{n.message}</span>
                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="ml-2 text-xs underline hover:text-yellow-300"
                  >
                    Mark read
                  </button>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
