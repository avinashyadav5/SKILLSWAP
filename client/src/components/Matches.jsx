import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ✅ Utility to build full avatar URL
function toAvatarUrl(avatar, baseUrl) {
  if (!avatar) return null;
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
  return `${baseUrl}/uploads/${avatar}`;
}

// ✅ Utility for fallback initials
function initials(name) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  return parts.length > 1
    ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
    : parts[0][0].toUpperCase();
}

export default function Matches({ userId, token }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ Use environment variable or fallback
  const API_URL = import.meta.env.VITE_API_URL || "https://skillswap-1-1iic.onrender.com";

  useEffect(() => {
    async function fetchMatches() {
      if (!userId || !token) return;
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_URL}/api/match/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch matches");

        const data = await res.json();
        setMatches(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Match Fetch Error:", err);
        setError("Unable to load matches. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, [userId, token]);

  // ✅ UI States
  if (loading) return <p className="text-gray-300 animate-pulse">⏳ Finding matches...</p>;
  if (error) return <p className="text-red-500">❌ {error}</p>;
  if (matches.length === 0) return <p className="text-gray-400">No matches found yet.</p>;

  return (
    <div className="space-y-4">
      {matches.map((m) => (
        <div
          key={m.id}
          className="flex items-center justify-between bg-[#1f2937] border border-white/10 rounded-xl p-4 shadow-md hover:shadow-lg hover:scale-[1.01] transition transform"
        >
          <div className="flex items-center gap-4">
            {m.avatar ? (
              <img
                src={toAvatarUrl(m.avatar, API_URL)}
                alt={m.name}
                className="w-12 h-12 rounded-full object-cover bg-gray-700 border border-white/20"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.insertAdjacentHTML(
                    "afterend",
                    `<div class='w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold'>
                      ${initials(m.name)}
                    </div>`
                  );
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                {initials(m.name)}
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-white">{m.name}</h3>
              <p className="text-sm text-gray-300">
                🎯 Learn from:{" "}
                <span className="text-blue-400">
                  {m.canLearnFrom?.length ? m.canLearnFrom.join(", ") : "—"}
                </span>
              </p>
              <p className="text-sm text-gray-300">
                🎓 Can teach:{" "}
                <span className="text-green-400">
                  {m.canTeachTo?.length ? m.canTeachTo.join(", ") : "—"}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/chat/${m.id}`)}
            className="bg-green-600 hover:bg-green-700 text-white py-1 px-4 rounded transition"
          >
            Chat 💬
          </button>
        </div>
      ))}
    </div>
  );
}
