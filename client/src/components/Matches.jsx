import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../utils/socket";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function initials(name) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  return parts.length > 1
    ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
    : parts[0][0].toUpperCase();
}

function SkillTag({ label, color }) {
  const styles = {
    blue: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${styles[color] || styles.blue}`}>
      {label}
    </span>
  );
}

function MatchCard({ m, userId, onVideoInvite }) {
  const navigate = useNavigate();

  const avatarUrl = m.avatar?.startsWith("http") ? m.avatar : null;

  return (
    <div className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-white/10 via-white/5 to-transparent hover:from-indigo-500/40 hover:via-purple-500/20 hover:to-transparent transition-all duration-500">
      <div className="bg-[#111827] rounded-2xl p-5 flex flex-col gap-4 h-full">

        {/* Top row: avatar + name + score */}
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl} alt={m.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-white/10 flex-shrink-0"
              onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}`; }}
            />
          ) : (
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 bg-gradient-to-br from-indigo-600 to-purple-600">
              {initials(m.name)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-lg leading-tight truncate">{m.name}</h3>
          </div>
        </div>

        {/* Skill overlap */}
        <div className="space-y-2.5">
          {m.canLearnFrom?.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1.5">🎯 Learn from them</p>
              <div className="flex flex-wrap gap-1.5">
                {m.canLearnFrom.map(s => <SkillTag key={s} label={s} color="blue" />)}
              </div>
            </div>
          )}
          {m.canTeachTo?.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1.5">🎓 You can teach them</p>
              <div className="flex flex-wrap gap-1.5">
                {m.canTeachTo.map(s => <SkillTag key={s} label={s} color="green" />)}
              </div>
            </div>
          )}
          {!m.canLearnFrom?.length && !m.canTeachTo?.length && (
            <p className="text-gray-500 text-xs italic">Partial skill overlap detected</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1 mt-auto">
          <button
            onClick={() => navigate(`/chat/${m.id}`)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            💬 Chat
          </button>
          <button
            onClick={() => onVideoInvite(m.id)}
            className="flex-1 bg-gray-900 dark:bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/40 text-white text-sm font-semibold py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            📹 Video
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Matches({ userId, token, onMatchesLoad }) {
  const [matches, setMatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`${API_URL}/api/match/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => {
          const m = Array.isArray(d) ? d : [];
          setMatches(m);
          if (onMatchesLoad) onMatchesLoad(m.length);
      })
      .catch(() => setError("Unable to load matches."))
      .finally(() => setLoading(false));
  }, [userId, token, onMatchesLoad]);

  const handleVideoInvite = async (targetUserId) => {
    try {
      const res = await fetch(`${API_URL}/api/video/create-room`, { method: "POST" });
      const data = await res.json();
      if (data.url) {
        const currentUser = JSON.parse(localStorage.getItem("user"));
        socket.emit("video_room_invite", { to: targetUserId, from: currentUser.id, fromName: currentUser.name, url: data.url });
        navigate(`/group-room?url=${encodeURIComponent(data.url)}`);
      }
    } catch {
      alert("Failed to create video room");
    }
  };

  // Skeleton loading state
  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[1, 2].map(i => (
        <div key={i} className="rounded-2xl bg-[#111827] border border-white/5 p-5 animate-pulse h-52" />
      ))}
    </div>
  );

  if (error) return (
    <div className="text-center py-10 text-red-400">❌ {error}</div>
  );

  const filtered = matches.filter(m => {
    const t = searchQuery.toLowerCase();
    return !t || m.name.toLowerCase().includes(t)
      || (m.canTeachTo || []).some(s => s.toLowerCase().includes(t))
      || (m.canLearnFrom || []).some(s => s.toLowerCase().includes(t));
  });

  return (
    <div className="space-y-5">
      {/* Search bar */}
      {matches.length > 0 && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by name or skill..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0d1117] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
          />
        </div>
      )}

      {/* Empty state */}
      {matches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="text-5xl">🎯</div>
          <h3 className="text-white font-bold text-lg">No matches yet</h3>
          <p className="text-gray-400 text-sm max-w-xs">
            Add subjects you teach and want to learn in your profile — we'll find your perfect skill-swap partners!
          </p>
          <button
            onClick={() => navigate("/profile")}
            className="mt-3 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition"
          >
            Update Profile →
          </button>
        </div>
      )}

      {matches.length > 0 && filtered.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-8">No matches found for "{searchQuery}"</p>
      )}

      {/* Match cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map(m => (
          <MatchCard key={m.id} m={m} userId={userId} onVideoInvite={handleVideoInvite} />
        ))}
      </div>
    </div>
  );
}
