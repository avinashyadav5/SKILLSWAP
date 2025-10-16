import React, { useEffect, useState } from "react";

// Utility: decode HTML entities (&quot; → ")
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

    const apiUrl = import.meta.env.VITE_API_URL || "https://skillswap-1-1iic.onrender.com";

    fetch(`${apiUrl}/api/learning-path/${subject}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch learning path");
        return res.json();
      })
      .then((data) => {
        let cleaned = (data.path || []).map((step) =>
          decodeHtml(step).replace(/^\d+[\.\)]\s*/, "") // remove "1. " or "2) "
        );
        setPath(cleaned);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [subject]);

  if (!subject) return null;

  return (
    <div className="bg-white/10 rounded-lg p-4 mb-8">
      <h2 className="font-bold mb-2 text-lg text-white">
        Recommended Learning Path for {subject}
      </h2>

      {loading && <p className="text-gray-300">⏳ Loading path...</p>}
      {error && <p className="text-red-400">❌ {error}</p>}
      {!loading && !error && path.length === 0 && (
        <p className="text-gray-300">No learning path found.</p>
      )}

      {!loading && !error && path.length > 0 && (
        <ol className="list-decimal ml-6 text-white space-y-2">
          {path.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
