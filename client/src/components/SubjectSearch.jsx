import React, { useState, useEffect } from "react";
import LearningPath from "./LearningPath";
import LearningResources from "./LearningResources";

function SubjectSearch() {
  const [subject, setSubject] = useState("");
  const [selected, setSelected] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);

  // 🔹 Auto fetch when user types (with debounce of 800ms)
  useEffect(() => {
    if (!subject.trim()) return;

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      setSelected(subject.trim().toLowerCase());
    }, 800);

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
      {/* <label className="text-white block mb-2">
        Enter a subject to get personalized recommendations:
      </label> */}

      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. java, python, ai, sql"
        className="p-2 rounded w-full text-black"
      />

      {selected && (
        <div className="mt-6">
          <LearningPath subject={selected} />
          <LearningResources subject={selected} />
        </div>
      )}
    </div>
  );
}

export default SubjectSearch;
