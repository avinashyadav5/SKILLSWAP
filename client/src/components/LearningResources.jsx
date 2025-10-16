import React, { useEffect, useState } from "react";

export default function LearningResources({ subject }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!subject) return;
    setLoading(true);
    setError(null);

    // Use proxy-safe fetch (relative) if vite.config.js proxy is set
    const apiUrl =
      import.meta.env.VITE_API_URL || "https://skillswap-1-1iic.onrender.com";

    fetch(`${apiUrl}/api/recommendations/learn/${subject}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch resources");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setResources(data);
        else setResources([]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [subject]);

  if (!subject) return null;

  return (
    <div className="bg-white/10 rounded-lg p-4 mb-8">
      <h2 className="font-bold mb-2 text-lg text-white">
        Top resources for learning {subject}
      </h2>

      {loading && <p className="text-gray-300">⏳ Loading resources...</p>}
      {error && <p className="text-red-400">❌ {error}</p>}
      {!loading && !error && resources.length === 0 && (
        <p className="text-gray-300">No resources found.</p>
      )}

      {!loading && !error && resources.length > 0 && (
        <div className="space-y-2">
          {resources.map((r, idx) => (
            <a
              key={idx}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2 bg-white/20 text-red-600 rounded no-underline hover:bg-white/30"
            >
              {r.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
