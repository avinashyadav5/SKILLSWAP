import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function StudyBuddy({ user }) {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [teachSubjects, setTeachSubjects] = useState([]);
  const [learnSubjects, setLearnSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // ✅ Always fetch fresh subjects from DB, not stale localStorage
  useEffect(() => {
    if (!user?.id) return;
    fetch(`${BACKEND_URL}/api/user/${user.id}/subjects`)
      .then(r => r.json())
      .then(data => {
        setTeachSubjects(data.teachSubjects || []);
        setLearnSubjects(data.learnSubjects || []);
      })
      .catch(() => {
        // fallback to localStorage if network fails
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        setTeachSubjects(stored.teach || []);
        setLearnSubjects(stored.learn || []);
      });
  }, [user?.id]);

  const chatContainerRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chat]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text || loading) return;

    setChat(prev => [...prev, { sender: "user", text }]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/study-buddy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, teachSubjects, learnSubjects }),
      });

      const data = await res.json();
      setChat(prev => [...prev, { sender: "ai", text: data.reply || "🤖 No response from Study Buddy." }]);
    } catch {
      setChat(prev => [...prev, { sender: "ai", text: "❌ Server error. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  const allSubjects = [...teachSubjects, ...learnSubjects];

  return (
    <div className="flex flex-col bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-[#111827]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg">🤖</div>
          <div>
            <h2 className="text-white font-bold text-base">AI Study Buddy</h2>
            <p className="text-gray-400 text-xs">Ask anything about your subjects</p>
          </div>
        </div>

        {/* Subject context pills */}
        {allSubjects.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {teachSubjects.map(s => (
              <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 capitalize">{s}</span>
            ))}
            {learnSubjects.map(s => (
              <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 capitalize">{s}</span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-xs italic">No subjects added — add them in your profile!</p>
        )}
      </div>

      {/* Chat messages */}
      <div ref={chatContainerRef} className="flex-1 h-[400px] overflow-y-auto p-4 space-y-3">
        {chat.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
            <span className="text-3xl">💬</span>
            <p className="text-gray-400 text-sm">
              {allSubjects.length > 0
                ? `Ask me anything about ${allSubjects.slice(0, 2).join(", ")}${allSubjects.length > 2 ? "..." : ""}!`
                : "Add subjects to your profile to get started!"}
            </p>
          </div>
        )}

        {chat.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.sender === "user"
                ? "bg-indigo-600 text-white rounded-br-sm"
                : "bg-[#1f2937] text-gray-100 border border-white/10 rounded-bl-sm max-h-[300px] overflow-y-auto overflow-x-auto"
            }`}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1f2937] border border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-white/10 bg-[#111827] flex gap-2">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Ask about your subjects..."
          disabled={loading}
          className="flex-1 bg-[#0d1117] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !message.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
        >
          Send
        </button>
      </div>
    </div>
  );
}
