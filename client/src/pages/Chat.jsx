import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import Navbar from "../components/Navbar";
import EmojiPicker from "emoji-picker-react";
import UserReviews from "../components/UserReviews";
import { RTC_CONFIG } from "../utils/webrtc";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const socket = io(BACKEND_URL, { transports: ["websocket", "polling"] });

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
  const [inCall, setInCall] = useState(false);

  const messagesEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);

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

  // ✅ Socket setup
  useEffect(() => {
    socket.emit("join_room", myId);

    socket.on("receive_message", (msg) => {
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
    });

    socket.on("online_users", (list) => setOnlineUsers(list.map(Number)));

    socket.on("webrtc_offer", async ({ from, offer }) => {
      if (!peerRef.current) await initWebRTCConnection(from, true, offer);
    });

    socket.on("webrtc_answer", async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("webrtc_ice_candidate", async ({ candidate }) => {
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("online_users");
      socket.off("webrtc_offer");
      socket.off("webrtc_answer");
      socket.off("webrtc_ice_candidate");
    };
  }, [myId, otherId]);

  // ✅ WebRTC setup
  const initWebRTCConnection = async (from, isReceiver = false, remoteOffer = null) => {
    setInCall(true);
    peerRef.current = new RTCPeerConnection(RTC_CONFIG);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach((track) => peerRef.current.addTrack(track, stream));

    peerRef.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc_ice_candidate", {
          to: isReceiver ? from : otherId,
          candidate: event.candidate,
        });
      }
    };

    if (isReceiver && remoteOffer) {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(remoteOffer));
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socket.emit("webrtc_answer", { to: from, answer });
    } else {
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socket.emit("webrtc_offer", { to: otherId, offer, from: myId });
    }
  };

  // ✅ Fetch chat history
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

      await fetch(`${BACKEND_URL}/api/messages`, { method: "POST", body: formData });
      setText("");
      setSelectedImages([]);
      setShowEmojiPicker(false); // ✅ close picker only when message sent
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // ✅ Emoji picker click (does NOT close after selection)
  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const groupedByDate = messages.reduce((acc, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString();
    acc[date] = acc[date] || [];
    acc[date].push(msg);
    return acc;
  }, {});

  const endCall = () => {
    peerRef.current?.close();
    peerRef.current = null;
    setInCall(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b2845] to-[#000f89] text-white">
      <Navbar />
      <div className="w-full max-w-2xl mx-auto sm:px-4 px-2 py-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
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
            <h2 className="text-xl sm:text-2xl font-bold">
              Chat with {loadingUser ? "Loading..." : otherUser?.name || "Unknown"}
            </h2>
            {otherUser && (
              <p className="text-sm text-gray-300">
                🎓 Teaches: {otherUser.teach?.join(", ") || "None"} <br />
                📖 Learns: {otherUser.learn?.join(", ") || "None"}
              </p>
            )}
          </div>
          <span
            className={`ml-auto ${
              onlineUsers.includes(otherId) ? "text-green-400" : "text-red-400"
            }`}
          >
            {onlineUsers.includes(otherId) ? "Online" : "Offline"}
          </span>
        </div>

        {/* Messages */}
        <div
          className="h-96 sm:h-[28rem] overflow-y-auto bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/20 mb-4"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {Object.entries(groupedByDate).map(([date, msgs], idx) => (
            <div key={idx}>
              <div className="text-center text-gray-400 text-sm my-2">📅 {date}</div>
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={`my-2 max-w-[80%] sm:max-w-xs p-2 rounded-lg ${
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
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-md border cursor-pointer hover:opacity-80"
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
          <div className="flex gap-2 mb-2 flex-wrap">
            {selectedImages.map((file, idx) => (
              <img
                key={idx}
                src={URL.createObjectURL(file)}
                alt="preview"
                className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded"
              />
            ))}
          </div>
        )}

        {/* Input Section */}
        <div className="flex flex-wrap gap-2 items-center w-full mb-4 bg-white/10 p-2 rounded-lg relative">
          <button
            onClick={() => initWebRTCConnection(otherId)}
            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full"
            title="Start Video Call"
          >
            📹
          </button>

          {/* 😀 Emoji Toggle */}
          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="text-xl bg-white/20 p-2 rounded-lg"
          >
            😀
          </button>

          {showEmojiPicker && (
            <div className="absolute z-10 bottom-20 left-4 sm:left-8 scale-90 sm:scale-100">
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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
                setShowEmojiPicker(false); // ✅ close picker after sending
              }
            }}
            className="flex-grow p-2 rounded-md text-black min-w-[150px]"
            placeholder="Type your message..."
          />

          <button
            onClick={() => {
              sendMessage();
              setShowEmojiPicker(false); // ✅ close picker after sending
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>

        {/* ✅ Video Call */}
        {inCall && (
          <div className="flex flex-col items-center mt-4">
            <h3 className="text-lg font-semibold mb-2">🎥 Live Video Call</h3>
            <div className="flex gap-4 flex-wrap justify-center">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-64 h-48 bg-black rounded" />
              <video ref={remoteVideoRef} autoPlay playsInline className="w-64 h-48 bg-black rounded" />
            </div>
            <button
              onClick={endCall}
              className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              End Call
            </button>
          </div>
        )}

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
