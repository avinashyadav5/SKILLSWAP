import { useState } from "react";
import ReactMarkdown from "react-markdown"; // ✅ to render markdown nicely

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();

      setResponse(data.reply || "⚠️ No response");
      setMessage(""); // ✅ clear input after sending
    } catch (err) {
      setResponse("⚠️ Error: " + err.message);
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

      {/* Chatbox */}
      {open && (
        <div className="w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-lg flex flex-col">
          <div className="flex justify-between items-center p-3 border-b border-gray-700 bg-gray-800 rounded-t-lg">
            <h3 className="text-white font-semibold flex items-center gap-2">
              🤖 AI Chatbot
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white text-lg"
            >
              ✖
            </button>
          </div>

          {/* Chat Response */}
          <div className="p-3 text-white h-40 overflow-y-auto prose prose-invert">
            {loading ? (
              "⏳ Thinking..."
            ) : (
              <ReactMarkdown>{response || "Ask me anything!"}</ReactMarkdown>
            )}
          </div>

          {/* Input */}
          <div className="flex p-3 border-t border-gray-700">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 px-2 py-1 rounded bg-gray-700 text-white"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()} // ✅ send on Enter
            />
            <button
              onClick={sendMessage}
              className="ml-2 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
