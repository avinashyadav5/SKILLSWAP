import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function StudyBuddy() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [teachSubjects, setTeachSubjects] = useState([]);
  const [learnSubjects, setLearnSubjects] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setTeachSubjects(user.teach || []);
      setLearnSubjects(user.learn || []);
    }
  }, []);

  const handleSend = async () => {
    if (!message.trim()) return;
    const userMsg = { sender: "user", text: message };
    setChat((prev) => [...prev, userMsg]);
    const currentMessage = message;
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/study-buddy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentMessage,
          teachSubjects,
          learnSubjects,
        }),
      });

      const data = await res.json();
      const aiMsg = { sender: "ai", text: data.reply || "No response" };
      setChat((prev) => [...prev, aiMsg]);
    } catch {
      setChat((prev) => [...prev, { sender: "ai", text: "❌ Server error" }]);
    }
  };

  return (
    <div className="flex flex-col h-[80vh] bg-[#111827] text-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-bold mb-2">🤖 AI Study Buddy</h2>
      <div className="text-sm mb-3">
        <p className="text-blue-400">📘 Teach: {teachSubjects.join(", ") || "None"}</p>
        <p className="text-green-400">📗 Learn: {learnSubjects.join(", ") || "None"}</p>
      </div>

      {/* Chat Box */}
      <div className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-4 space-y-2">
        {chat.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg max-w-[80%] ${
              msg.sender === "user"
                ? "bg-green-600 self-end text-right ml-auto"
                : "bg-blue-600 text-left mr-auto"
            }`}
          >
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex mt-3 space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 p-2 rounded text-black"
          placeholder="Ask about your subjects..."
        />
        <button
          onClick={handleSend}
          className="bg-green-500 px-4 py-2 rounded hover:bg-green-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
