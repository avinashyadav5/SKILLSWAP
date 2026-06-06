import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Use environment variable (fallback to local)
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setResponse(""); // clear previous response

    try {
      const res = await fetch(`${API_URL}/api/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();

      setResponse(data.reply || "⚠️ No response from AI.");
      setMessage("");
    } catch (err) {
      console.error("Chatbot Error:", err);
      setResponse("⚠️ Unable to reach chatbot. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center text-2xl"
        >
          🤖
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-lg flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b border-gray-700 bg-gray-800 rounded-t-lg">
            <h3 className="text-white font-semibold flex items-center gap-2">
              🤖 SkillSwap AI
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white text-lg"
            >
              ✖
            </button>
          </div>

          {/* Response */}
          <div className="p-3 text-white h-44 overflow-y-auto prose prose-invert">
            {loading ? (
              <p className="text-gray-400 animate-pulse">⏳ Thinking...</p>
            ) : (
              <ReactMarkdown>
                {response || "👋 Hi! How can I help you today?"}
              </ReactMarkdown>
            )}
          </div>

          {/* Input Box */}
          <div className="flex p-3 border-t border-gray-700">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 px-2 py-1 rounded bg-gray-700 text-white outline-none"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="ml-2 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
