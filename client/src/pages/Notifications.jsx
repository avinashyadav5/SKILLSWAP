import React, { useEffect, useState } from "react";
import socket from "../utils/socket";
import { motion, AnimatePresence } from "framer-motion";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

const BACKEND_URL =
  import.meta.env.VITE_API_URL || "https://skillswap-1-1iic.onrender.com";

export default function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [muted, setMuted] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    socket.emit("join_room", user.id);

    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/notifications/${user.id}`);
        const data = await res.json();
        setNotifications(data);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();

    // Real-time new notifications
    socket.on("notification", (note) => {
      setNotifications((prev) => [note, ...prev]);
    });

    return () => {
      socket.off("notification");
    };
  }, [user]);

  // ✅ Mark notification as read
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

  // ✅ Toggle mute
  const toggleMute = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications/mute/${user.id}`, {
        method: "POST",
      });
      const data = await res.json();
      setMuted(data.muted);
    } catch (err) {
      console.error("Mute toggle failed:", err);
    }
  };

  return (
    <div className="relative min-h-screen text-white p-6 overflow-hidden bg-gradient-to-br from-[#1b2845] to-[#000f89]">
      {/* 🎆 Animated Background */}
      <Particles
        className="absolute inset-0 z-0"
        init={loadSlim}
        options={{
          background: { color: { value: "#0f172a" } },
          particles: {
            number: { value: 60 },
            color: { value: "#00bfff" },
            links: { enable: true, color: "#ffffff", distance: 120 },
            move: { enable: true, speed: 1 },
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

        <AnimatePresence>
          {notifications.length === 0 ? (
            <motion.p
              className="text-gray-300 text-center"
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
                    ? "bg-gray-600 text-gray-300"
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
