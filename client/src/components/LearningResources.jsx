import React, { useEffect, useState } from "react";

export default function LearningResources({ subject }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!subject) return;

    setLoading(true);
    setError(null);

    // ✅ Use environment variable or fallback to local backend
    const apiUrl =
      import.meta.env.VITE_API_URL || "http://localhost:5000";

    // ✅ Encode subject and append timestamp to bust browser cache
    fetch(`${apiUrl}/api/recommendations/learn/${encodeURIComponent(subject)}?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch learning resources");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setResources(data);
        } else {
          setResources([]);
        }
      })
      .catch((err) => {
        console.error("Learning Resources Fetch Error:", err);
        setError("Unable to load resources. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, [subject]);

  if (!subject) return null;

  return (
    <div className="bg-gray-900 dark:bg-white/10 rounded-lg p-4 mb-8 shadow-lg border border-white/10">
      <h2 className="font-bold mb-3 text-lg text-white">
        📚 Top Resources for Learning{" "}
        <span className="text-blue-400">{subject}</span>
      </h2>

      {/* Loading state */}
      {loading && <p className="text-gray-300 animate-pulse">⏳ Loading resources...</p>}

      {/* Error state */}
      {error && <p className="text-red-400">{error}</p>}

      {/* No results */}
      {!loading && !error && resources.length === 0 && (
        <p className="text-gray-300">No resources found.</p>
      )}

      {/* Resource list */}
      {!loading && !error && resources.length > 0 && (
        <div className="space-y-2">
          {resources.map((r, idx) => (
            <a
              key={idx}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2 bg-gray-900 dark:bg-white/20 text-white rounded-md hover:bg-white/30 hover:scale-[1.02] transition transform"
            >
              🔗 {r.title || "Untitled Resource"}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
