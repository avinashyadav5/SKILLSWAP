import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const API_URL =
  import.meta.env.VITE_API_URL || "https://skillswap-1-1iic.onrender.com";
const socket = io(API_URL);

function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // ✅ Keep Navbar reactive to login changes
  useEffect(() => {
    const updateUser = () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      setIsLoggedIn(!!token);
      setUser(parsedUser);

      if (parsedUser?.avatar) {
        setAvatar(
          parsedUser.avatar.startsWith("http")
            ? parsedUser.avatar
            : `${API_URL}/uploads/${parsedUser.avatar}`
        );
      } else if (parsedUser?.name) {
        setAvatar(
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            parsedUser.name
          )}`
        );
      } else {
        setAvatar("");
      }
    };

    updateUser();
    const interval = setInterval(updateUser, 1000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Real-time notifications
  useEffect(() => {
    if (!user) return;

    socket.emit("join_room", user.id);
    socket.on(`notification-${user.id}`, () =>
      setUnreadCount((prev) => prev + 1)
    );

    return () => {
      socket.off(`notification-${user.id}`);
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center fixed top-0 w-full z-50 shadow-md">
      <Link to="/" className="font-bold text-xl tracking-wide">
        SkillSwap
      </Link>

      <div className="space-x-4 flex items-center">
        {!isLoggedIn ? (
          <>
            <Link to="/login" className="hover:underline">
              Login
            </Link>
            <Link to="/register" className="hover:underline">
              Register
            </Link>
          </>
        ) : (
          <>
            {/* ✅ Admin link only for logged-in admins */}
            {isLoggedIn && user && user.isAdmin && (
              <Link to="/admin" className="hover:underline">
                Admin
              </Link>
            )}

            <Link to="/dashboard" className="hover:underline">
              Dashboard
            </Link>

            {/* 🔔 Notifications */}
            <Link to="/notifications" className="relative hover:underline">
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* 🚪 Logout */}
            <button onClick={handleLogout} className="hover:underline">
              Logout
            </button>

            {/* 🧑‍💻 Avatar */}
            <Link to="/profile">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile"
                  className="w-9 h-9 rounded-full border border-white object-cover hover:scale-105 transition"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.name || "P"
                    )}`;
                  }}
                />
              ) : (
                <div className="w-9 h-9 bg-white text-blue-600 font-bold rounded-full flex items-center justify-center">
                  P
                </div>
              )}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
