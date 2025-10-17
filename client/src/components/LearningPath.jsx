import React, { useEffect, useState } from "react";

// Utility: safely decode HTML entities (e.g., &quot; → “)
function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

export default function LearningPath({ subject }) {
  const [path, setPath] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!subject) return;
    setLoading(true);
    setError(null);

    // ✅ Use environment variable or fallback to deployed backend
    const apiUrl =
      import.meta.env.VITE_API_URL || "https://skillswap-1-1iic.onrender.com";

    // ✅ Fetch learning path data
    fetch(`${apiUrl}/api/learning-path/${encodeURIComponent(subject)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch learning path");
        return res.json();
      })
      .then((data) => {
        // ✅ Clean text formatting & remove numbering (1. / 2) )
        const cleaned =
          data.path?.map((step) =>
            decodeHtml(step).replace(/^\d+[\.\)]\s*/, "").trim()
          ) || [];
        setPath(cleaned);
      })
      .catch((err) => {
        console.error("Learning Path Fetch Error:", err);
        setError("Unable to load learning path. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, [subject]);

  if (!subject) return null;

  return (
    <div className="bg-white/10 rounded-lg p-4 mb-8 shadow-lg border border-white/10">
      <h2 className="font-bold mb-3 text-lg text-white">
        🚀 Recommended Learning Path for{" "}
        <span className="text-blue-400">{subject}</span>
      </h2>

      {/* Loading state */}
      {loading && <p className="text-gray-300 animate-pulse">⏳ Loading path...</p>}

      {/* Error state */}
      {error && <p className="text-red-400">{error}</p>}

      {/* Empty state */}
      {!loading && !error && path.length === 0 && (
        <p className="text-gray-300">No learning path found.</p>
      )}

      {/* Display path */}
      {!loading && !error && path.length > 0 && (
        <ol className="list-decimal ml-6 text-white space-y-2">
          {path.map((step, idx) => (
            <li key={idx} className="leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
