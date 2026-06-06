import { useEffect, useState } from "react";

export default function SkillProgress({ userId, token }) {
  const [progressData, setProgressData] = useState([]);
  const [subjects, setSubjects] = useState({ teach: [], learn: [] });
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    async function fetchData() {
      if (!userId || !token) return;
      try {
        setLoading(true);
        // Fetch user's subjects
        const userRes = await fetch(`${API_URL}/api/user/${userId}/subjects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userData = await userRes.json();
        setSubjects({ teach: userData.teachSubjects || [], learn: userData.learnSubjects || [] });

        // Fetch progress
        const progRes = await fetch(`${API_URL}/api/progress/${userId}`);
        const progData = await progRes.json();
        setProgressData(progData);
      } catch (err) {
        console.error("Failed to fetch progress data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId, token, API_URL]);

  const toggleStatus = async (subject, type, currentStatus) => {
    let nextStatus = "not_started";
    if (currentStatus === "not_started") nextStatus = "in_progress";
    else if (currentStatus === "in_progress") nextStatus = "completed";
    else if (currentStatus === "completed") nextStatus = "not_started";

    try {
      const res = await fetch(`${API_URL}/api/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subject, type, status: nextStatus })
      });
      const updated = await res.json();
      
      setProgressData(prev => {
        const filtered = prev.filter(p => !(p.subject === subject && p.type === type));
        return [...filtered, updated];
      });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const getStatusDisplay = (subject, type) => {
    const entry = progressData.find(p => p.subject === subject && p.type === type);
    const status = entry ? entry.status : "not_started";

    const statusConfig = {
      not_started: { 
        label: "Not Started", 
        icon: "⚪", 
        classes: "bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400" 
      },
      in_progress: { 
        label: "In Progress", 
        icon: "⏳", 
        classes: "bg-yellow-900/30 border-yellow-500/50 text-yellow-400 hover:border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]" 
      },
      completed: { 
        label: "Completed", 
        icon: "✅", 
        classes: "bg-green-900/30 border-green-500/50 text-green-400 hover:border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]" 
      }
    };

    const config = statusConfig[status];

    return (
      <button
        onClick={() => toggleStatus(subject, type, status)}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-300 transform hover:scale-105 cursor-pointer ${config.classes}`}
        title={`Status: ${config.label}. Click to cycle status.`}
      >
        <span className="text-sm">{config.icon}</span>
        <span className="font-medium text-sm capitalize">{subject}</span>
      </button>
    );
  };

  if (loading) return <div className="animate-pulse text-gray-400">Loading progress...</div>;

  return (
    <div className="bg-[#1f2937] p-6 rounded-xl border border-white/10 shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4">📈 Skill Progress</h2>
      
      <div className="mb-6">
        <h3 className="text-blue-400 font-semibold mb-3 border-b border-white/5 pb-2">🎯 Learning Journey</h3>
        <div className="flex flex-wrap gap-3">
          {subjects.learn.length > 0 ? (
            subjects.learn.map(sub => <div key={sub}>{getStatusDisplay(sub, 'learn')}</div>)
          ) : (
            <p className="text-sm text-gray-500 italic">No subjects to learn yet.</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-green-400 font-semibold mb-3 border-b border-white/5 pb-2">💡 Teaching Goals</h3>
        <div className="flex flex-wrap gap-3">
          {subjects.teach.length > 0 ? (
            subjects.teach.map(sub => <div key={sub}>{getStatusDisplay(sub, 'teach')}</div>)
          ) : (
            <p className="text-sm text-gray-500 italic">No subjects to teach yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
