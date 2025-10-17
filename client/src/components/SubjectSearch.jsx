import React, { useState, useEffect } from "react";
import LearningPath from "./LearningPath";
import LearningResources from "./LearningResources";

function SubjectSearch() {
  const [subject, setSubject] = useState("");
  const [selected, setSelected] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Use backend env variable
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // 🔹 Debounced input handling
  useEffect(() => {
    if (!subject.trim()) {
      setSelected("");
      setError("");
      return;
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        // (Optional) Verify subject or log search to backend
        const res = await fetch(`${BACKEND_URL}/api/validate-subject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject }),
        });

        const data = await res.json();
        if (data.valid || data.success) {
          setSelected(subject.trim().toLowerCase());
        } else {
          setError("❌ Subject not recognized. Try another one.");
          setSelected("");
        }
      } catch {
        setError("⚠️ Could not connect to server.");
        setSelected("");
      } finally {
        setLoading(false);
      }
    }, 800); // 800ms debounce

    setTypingTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [subject]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && subject.trim()) {
      setSelected(subject.trim().toLowerCase());
    }
  };

  return (
    <div className="p-4">
      <label className="text-white block mb-2 font-semibold">
        🔎 Enter a subject to explore personalized learning paths:
      </label>

      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. java, python, ai, sql"
        className="p-2 rounded w-full text-black focus:outline-none focus:ring-2 focus:ring-green-400"
      />

      {loading && <p className="text-gray-300 mt-2">⏳ Checking subject...</p>}
      {error && <p className="text-red-400 mt-2">{error}</p>}

      {selected && !error && (
        <div className="mt-6 space-y-4">
          <LearningPath subject={selected} />
          <LearningResources subject={selected} />
        </div>
      )}
    </div>
  );
}

export default SubjectSearch;
