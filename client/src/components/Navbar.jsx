import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import socket from "../utils/socket";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inviteModal, setInviteModal] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Keep Navbar reactive to login/logout changes
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
        setAvatar(`https://ui-avatars.com/api/?name=${encodeURIComponent(parsedUser.name)}&background=6366f1&color=fff`);
      } else {
        setAvatar("");
      }
    };

    updateUser();
    window.addEventListener("storage", updateUser);
    const interval = setInterval(updateUser, 2000);
    return () => { clearInterval(interval); window.removeEventListener("storage", updateUser); };
  }, []);

  // Notifications & socket
  useEffect(() => {
    if (!user) return;

    socket.emit("join_room", user.id);

    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API_URL}/api/notifications/unread/${user.id}`);
        const data = await res.json();
        setUnreadCount(data.count || 0);
      } catch { /* silent */ }
    };
    fetchUnread();

    const onNotification = () => setUnreadCount(prev => prev + 1);
    const onVideoInvite = (data) => setInviteModal(data);

    socket.on("notification", onNotification);
    socket.on("video_room_invite", onVideoInvite);

    return () => {
      socket.off("notification", onNotification);
      socket.off("video_room_invite", onVideoInvite);
    };
  }, [user?.id]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setMenuOpen(false);
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      onClick={() => setMenuOpen(false)}
      className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
        isActive(to)
          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
          : "text-gray-300 hover:text-white hover:bg-gray-900 dark:bg-white/5"
      }`}
    >
      {children}
    </Link>
  );

  return (
    <>
      <nav className="fixed top-0 w-full z-50 border-b border-white/10"
        style={{ background: "rgba(13,17,23,0.85)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-black text-white">S</div>
            <span className="text-white font-bold text-base tracking-tight">SkillSwap</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {!isLoggedIn ? (
              <>
                <NavLink to="/login">Login</NavLink>
                <NavLink to="/register">Register</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/leaderboard">Leaderboard</NavLink>
                {user?.isAdmin && <NavLink to="/admin">Admin</NavLink>}
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <>
                {/* Notifications */}
                <Link
                  to="/notifications"
                  className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-300 hover:text-white hover:bg-gray-900 dark:bg-white/5 transition text-base"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Logout button (desktop) */}
                <button
                  onClick={handleLogout}
                  className="hidden md:block text-sm font-medium text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-900 dark:bg-white/5 transition"
                >
                  Logout
                </button>

                {/* Avatar */}
                <Link to="/profile" className="flex-shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border-2 border-indigo-500/50 object-cover hover:border-indigo-400 transition"
                      onError={e => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=6366f1&color=fff`;
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500/50 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-300 hover:bg-gray-900 dark:bg-white/5 transition"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1"
            style={{ background: "rgba(13,17,23,0.97)" }}>
            {!isLoggedIn ? (
              <>
                <NavLink to="/login">Login</NavLink>
                <NavLink to="/register">Register</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/leaderboard">Leaderboard</NavLink>
                {user?.isAdmin && <NavLink to="/admin">Admin</NavLink>}
                <button
                  onClick={handleLogout}
                  className="text-left text-sm font-medium text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-gray-900 dark:bg-white/5 transition"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Group Video Invite Modal */}
      {inviteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <div className="bg-[#1f2937] border border-white/20 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center text-white">
            <div className="text-4xl mb-3">📹</div>
            <h2 className="text-lg font-bold mb-2">Group Video Invite</h2>
            <p className="text-gray-300 text-sm mb-6">
              <span className="font-semibold text-white">{inviteModal.fromName}</span> has invited you to join a group video room!
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setInviteModal(null)}
                className="px-5 py-2 bg-gray-900 dark:bg-white/10 hover:bg-gray-900 dark:bg-white/20 rounded-xl text-sm font-semibold transition"
              >
                Decline
              </button>
              <button
                onClick={() => {
                  setInviteModal(null);
                  navigate(`/group-room?url=${encodeURIComponent(inviteModal.url)}`);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
