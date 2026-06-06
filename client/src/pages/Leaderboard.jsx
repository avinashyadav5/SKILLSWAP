import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch(`${API_URL}/api/leaderboard`);
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const data = await res.json();
        setLeaders(data);
      } catch (err) {
        console.error("Leaderboard Error:", err);
        setError("Unable to load leaderboard. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [API_URL]);

  return (
    <div className="min-h-screen bg-[#111827] text-white pt-24 px-4 pb-12">
      <Navbar />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-yellow-400">🏆 Top Mentors Leaderboard</h1>

        {loading && <p className="text-center text-gray-400 animate-pulse">Loading leaders...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="bg-[#1f2937] rounded-xl shadow-xl overflow-hidden border border-white/10">
            {leaders.map((user, index) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-6 border-b border-white/5 hover:bg-gray-900 dark:bg-white/5 transition
                  ${index === 0 ? "bg-yellow-500/10 border-l-4 border-l-yellow-400" : ""}
                  ${index === 1 ? "bg-gray-300/10 border-l-4 border-l-gray-300" : ""}
                  ${index === 2 ? "bg-orange-500/10 border-l-4 border-l-orange-500" : ""}
                `}
              >
                <div className="flex items-center gap-6">
                  <span className="text-2xl font-bold text-gray-500 w-8 text-center">#{index + 1}</span>
                  
                  {user.avatar ? (
                    <img
                      src={user.avatar.startsWith('http') ? user.avatar : `${API_URL}/uploads/${user.avatar}`}
                      alt={user.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold">
                      {user.name[0].toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Teaches: <span className="text-blue-400">{user.teach?.join(", ") || "None"}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-bold text-yellow-400 flex items-center gap-2">
                    ⭐ {parseFloat(user.avgRating).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">Average Rating</div>
                </div>
              </div>
            ))}
            
            {leaders.length === 0 && (
              <div className="p-8 text-center text-gray-400">No rated users yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
