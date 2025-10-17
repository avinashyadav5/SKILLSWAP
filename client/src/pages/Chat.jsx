import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import Navbar from "../components/Navbar";
import EmojiPicker from "emoji-picker-react";
import UserReviews from "../components/UserReviews";

// ✅ Dynamic backend URL from environment
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ✅ Connect socket dynamically
const socket = io(BACKEND_URL, {
  transports: ["websocket", "polling"],
});

function Chat() {
  const { userId } = useParams();
  const me = JSON.parse(localStorage.getItem("user"));
  const myId = parseInt(me?.id);
  const otherId = parseInt(userId);

  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });

  const messagesEndRef = useRef(null);

  // ✅ Fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoadingUser(true);
        const res = await fetch(`${BACKEND_URL}/api/user/${userId}`);
        if (!res.ok) throw new Error(`Failed with status ${res.status}`);
        const data = await res.json();
        setOtherUser(data);
      } catch (err) {
        console.error(err);
        setUserError("Could not load user info");
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [userId]);

  // ✅ Socket listeners
  useEffect(() => {
    socket.emit("join_room", myId);

    const handleReceive = (msg) => {
      const sender = parseInt(msg.senderId);
      const receiver = parseInt(msg.receiverId);
      const fromSelf = sender === myId;

      const isRelevant =
        (sender === myId && receiver === otherId) ||
        (sender === otherId && receiver === myId);

      if (!isRelevant) return;

      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, { ...msg, fromSelf, images: msg.images || [] }];
      });
    };

    socket.on("receive_message", handleReceive);
    socket.on("online_users", (list) => setOnlineUsers(list.map(Number)));

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("online_users");
    };
  }, [myId, otherId]);

  // ✅ Load message history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/messages/${myId}/${otherId}`);
        const data = await res.json();
        const formatted = data.map((msg) => ({
          ...msg,
          fromSelf: parseInt(msg.senderId) === myId,
          images: msg.images || [],
        }));
        setMessages(formatted);
      } catch (err) {
        console.error("❌ Failed to load messages:", err);
      }
    };
    fetchMessages();
  }, [myId, otherId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Image handling
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages((prev) => [...prev, ...files]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setSelectedImages((prev) => [...prev, ...files]);
  };

  const handleDragOver = (e) => e.preventDefault();

  // ✅ Send message
  const sendMessage = async () => {
    if (!text.trim() && selectedImages.length === 0) return;

    try {
      const formData = new FormData();
      formData.append("senderId", myId);
      formData.append("receiverId", otherId);
      formData.append("text", text);
      selectedImages.forEach((img) => formData.append("images", img));

      await fetch(`${BACKEND_URL}/api/messages`, {
        method: "POST",
        body: formData,
      });

      setText("");
      setSelectedImages([]);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // ✅ Group messages by date
  const groupedByDate = messages.reduce((acc, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString();
    acc[date] = acc[date] || [];
    acc[date].push(msg);
    return acc;
  }, {});

  // ✅ Emoji picker
  const onEmojiClick = (emojiData) => setText((prev) => prev + emojiData.emoji);

  // ✅ Video call
  const startVideoCall = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/video/create-room`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
    } catch {
      alert("Failed to start video call");
    }
  };

  // ✅ Lightbox navigation
  useEffect(() => {
    if (!lightbox.open) return;

    const handleKey = (e) => {
      if (e.key === "Escape") setLightbox({ ...lightbox, open: false });
      if (e.key === "ArrowRight") {
        setLightbox((prev) => ({
          ...prev,
          index: (prev.index + 1) % prev.images.length,
        }));
      }
      if (e.key === "ArrowLeft") {
        setLightbox((prev) => ({
          ...prev,
          index: (prev.index - 1 + prev.images.length) % prev.images.length,
        }));
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightbox]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b2845] to-[#000f89] text-white">
      <Navbar />
      <div className="max-w-2xl mx-auto py-16 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {otherUser?.avatar && (
            <img
              src={
                otherUser.avatar.startsWith("http")
                  ? otherUser.avatar
                  : `${BACKEND_URL}/uploads/${otherUser.avatar}`
              }
              alt={otherUser.name}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <h2 className="text-2xl font-bold">
              Chat with {loadingUser ? "Loading..." : otherUser?.name || "Unknown User"}
            </h2>
            {otherUser && (
              <p className="text-sm text-gray-300">
                🎓 Teaches: {otherUser.teach?.join(", ") || "None"} <br />
                📖 Learns: {otherUser.learn?.join(", ") || "None"}
              </p>
            )}
          </div>
          <span
            className={
              onlineUsers.includes(otherId)
                ? "text-green-400 ml-auto"
                : "text-red-400 ml-auto"
            }
          >
            {onlineUsers.includes(otherId) ? "Online" : "Offline"}
          </span>
        </div>

        {/* Messages */}
        <div
          className="h-96 overflow-y-auto bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 mb-4"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {Object.entries(groupedByDate).map(([date, msgs], idx) => (
            <div key={idx}>
              <div className="text-center text-gray-400 text-sm my-2">📅 {date}</div>
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={`my-2 max-w-xs p-2 rounded-lg ${
                    m.fromSelf
                      ? "bg-green-600 text-white ml-auto text-right"
                      : "bg-gray-300 text-black mr-auto text-left"
                  }`}
                >
                  {m.text && <p>{m.text}</p>}
                  {m.images?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {m.images.map((img, idx2) => {
                        const fullUrl = `${BACKEND_URL}/uploads/chat/${img}`;
                        return (
                          <img
                            key={idx2}
                            src={fullUrl}
                            alt="chat-img"
                            className="w-24 h-24 object-cover rounded-md border cursor-pointer hover:opacity-80"
                            onClick={() =>
                              setLightbox({
                                open: true,
                                images: m.images.map(
                                  (im) => `${BACKEND_URL}/uploads/chat/${im}`
                                ),
                                index: idx2,
                              })
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Selected images preview */}
        {selectedImages.length > 0 && (
          <div className="flex gap-2 mb-2">
            {selectedImages.map((file, idx) => (
              <img
                key={idx}
                src={URL.createObjectURL(file)}
                alt="preview"
                className="w-16 h-16 object-cover rounded"
              />
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2.5 items-center mb-4">
          <button
            onClick={startVideoCall}
            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full"
            title="Start Video Call"
          >
            📹
          </button>

          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-xl bg-white/20 p-2 rounded-lg"
          >
            😀
          </button>

          {showEmojiPicker && (
            <div className="absolute z-10 bottom-24 left-8">
              <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
            </div>
          )}

          <input
            type="file"
            multiple
            onChange={handleImageChange}
            className="text-sm text-white"
          />

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-grow p-2 rounded-md text-black"
            placeholder="Type your message..."
          />
          <button
            onClick={sendMessage}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>

        <UserReviews ratedId={otherId} />
      </div>

      {/* ✅ Lightbox */}
      {lightbox.open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setLightbox({ ...lightbox, open: false })}
        >
          <img
            src={lightbox.images[lightbox.index]}
            alt="Full view"
            className="max-h-[90%] max-w-[90%] rounded-lg"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((prev) => ({
                ...prev,
                index: (prev.index - 1 + prev.images.length) % prev.images.length,
              }));
            }}
            className="absolute left-8 text-white text-3xl font-bold"
          >
            ⬅
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((prev) => ({
                ...prev,
                index: (prev.index + 1) % prev.images.length,
              }));
            }}
            className="absolute right-8 text-white text-3xl font-bold"
          >
            ➡
          </button>
        </div>
      )}
    </div>
  );
}

export default Chat;
