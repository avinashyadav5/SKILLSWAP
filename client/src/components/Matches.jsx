import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function toAvatarUrl(avatar) {
  if (!avatar) return null;
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
  return `https://skillswap-1-1iic.onrender.com/uploads/${avatar}`;
}

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

  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true);
        const res = await fetch(`https://skillswap-1-1iic.onrender.com/api/match/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch matches");
        const data = await res.json();
        setMatches(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (userId && token) fetchMatches();
  }, [userId, token]);

  if (loading) return <p className="text-gray-300">Loading matches...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (matches.length === 0) return <p className="text-gray-400">No matches found.</p>;

  return (
    <div className="space-y-4">
      {matches.map(m => (
        <div
          key={m.id}
          className="flex items-center justify-between bg-[#1f2937] border border-white/10 rounded-xl p-4 shadow-md"
        >
          <div className="flex items-center gap-4">
            {m.avatar ? (
              <img
                src={toAvatarUrl(m.avatar)}
                alt={m.name}
                className="w-12 h-12 rounded-full object-cover bg-gray-600"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentNode.innerHTML = `
                    <div class='w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold'>
                      ${initials(m.name)}
                    </div>`;
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold">
                {initials(m.name)}
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-white">{m.name}</h3>
              <p className="text-sm text-gray-300">
                ✨ You can learn:{" "}
                {m.canLearnFrom?.length ? m.canLearnFrom.join(", ") : "—"}
              </p>
              <p className="text-sm text-gray-300">
                🎓 You can teach:{" "}
                {m.canTeachTo?.length ? m.canTeachTo.join(", ") : "—"}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/chat/${m.id}`)}
            className="bg-green-600 hover:bg-green-700 text-white py-1 px-4 rounded"
          >
            Chat
          </button>
        </div>
      ))}
    </div>
  );
}
