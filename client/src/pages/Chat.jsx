import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import Navbar from "../components/Navbar";
import EmojiPicker from "emoji-picker-react";
import UserReviews from "../components/UserReviews";
import { RTC_CONFIG } from "../utils/webrtc";

const BACKEND_URL = "https://skillswap-1-1iic.onrender.com";
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
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [inCall, setInCall] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });

  // ⭐ Rating state
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState("");
  const [ratingSuccess, setRatingSuccess] = useState(false);

  const messagesEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const pendingCandidates = useRef([]);

  // ✅ Fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoadingUser(true);
        const res = await fetch(`${BACKEND_URL}/api/user/${userId}`);
        const data = await res.json();
        setOtherUser(data);
      } catch {
        setOtherUser(null);
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
      setMessages((prev) => [...prev, { ...msg, fromSelf }]);
    });

    socket.on("online_users", (list) => setOnlineUsers(list.map(Number)));

    socket.on("webrtc_offer", async ({ from, offer }) => {
      if (!peerRef.current) await initWebRTCConnection(from, true, offer);
    });

    socket.on("webrtc_answer", async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        while (pendingCandidates.current.length) {
          const c = pendingCandidates.current.shift();
          await peerRef.current.addIceCandidate(c);
        }
      }
    });

    socket.on("webrtc_ice_candidate", async ({ candidate }) => {
      if (!peerRef.current) return;
      try {
        const iceCandidate = new RTCIceCandidate(candidate);
        if (peerRef.current.remoteDescription) {
          await peerRef.current.addIceCandidate(iceCandidate);
        } else {
          pendingCandidates.current.push(iceCandidate);
        }
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
    peerRef.current.ontrack = (event) => (remoteVideoRef.current.srcObject = event.streams[0]);
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

  // ✅ Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      const res = await fetch(`${BACKEND_URL}/api/messages/${myId}/${otherId}`);
      const data = await res.json();
      const formatted = data.map((msg) => ({
        ...msg,
        fromSelf: parseInt(msg.senderId) === myId,
      }));
      setMessages(formatted);
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
      setShowEmojiPicker(false);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const groupedByDate = messages.reduce((acc, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString();
    acc[date] = acc[date] || [];
    acc[date].push(msg);
    return acc;
  }, {});

  const onEmojiClick = (emojiData) => setText((prev) => prev + emojiData.emoji);

  const endCall = () => {
    peerRef.current?.close();
    peerRef.current = null;
    setInCall(false);
  };

  // ⭐ Submit Review
  const submitRating = async () => {
    if (stars === 0) return alert("Please select stars");
    try {
      const body = { raterId: myId, ratedId: otherId, stars, review };
      const res = await fetch(`${BACKEND_URL}/api/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setRatingSuccess(true);
        setShowRatingForm(false);
        setStars(0);
        setReview("");
        setTimeout(() => setRatingSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Review submission failed:", err);
      alert("Failed to submit review");
    }
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
        <div className="h-96 sm:h-[28rem] overflow-y-auto bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 mb-4">
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

                  {/* 🖼️ Image display */}
                  {m.images && m.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {m.images.map((img, idx2) => {
                        const fullUrl = `${BACKEND_URL}/uploads/chat/${img}`;
                        return (
                          <img
                            key={idx2}
                            src={fullUrl}
                            alt="chat-img"
                            className="w-24 h-24 object-cover rounded-md border border-gray-400 cursor-pointer hover:opacity-90"
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

        {/* Image Previews before sending */}
        {selectedImages.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {selectedImages.map((file, idx) => (
              <div key={idx} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="w-16 h-16 object-cover rounded-md border border-gray-400"
                />
                <button
                  onClick={() =>
                    setSelectedImages((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Section */}
        <div className="flex items-center gap-2 w-full bg-white/10 p-2 rounded-lg mb-4 relative">
          <button
            onClick={() => initWebRTCConnection(otherId)}
            title="Start Video Call"
            className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg text-xl"
          >
            📹
          </button>

          <label
            htmlFor="imageUpload"
            title="Send Image"
            className="bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-lg text-xl cursor-pointer"
          >
            📷
          </label>
          <input
            id="imageUpload"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="bg-blue-800 hover:bg-blue-700 text-white p-3 rounded-lg text-xl"
          >
            😀
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-20 left-28 z-10">
              <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
            </div>
          )}

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
            className="flex-grow p-3 rounded-md text-black text-base outline-none"
          />

          <button
            onClick={sendMessage}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold"
          >
            Send
          </button>
        </div>

        {/* Video Call */}
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

        {/* ⭐ Rating Section */}
        {!showRatingForm && (
          <button
            onClick={() => setShowRatingForm(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded mb-4 mt-4"
          >
            ⭐ Rate this user
          </button>
        )}

        {showRatingForm && (
          <div className="bg-white/10 p-4 rounded-lg mb-4">
            <label className="block text-white mb-1">Stars (1–5)</label>
            <select
              value={stars}
              onChange={(e) => setStars(parseInt(e.target.value))}
              className="text-black p-2 rounded mb-2"
            >
              <option value={0}>Select...</option>
              {[1, 2, 3, 4, 5].map((s) => (
                <option key={s} value={s}>
                  {s} ⭐
                </option>
              ))}
            </select>

            <label className="block text-white mb-1">Review (optional)</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full p-2 rounded text-black mb-2"
            />

            <button
              onClick={submitRating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Submit Rating
            </button>
          </div>
        )}

        {ratingSuccess && (
          <p className="text-green-400 font-semibold mb-2">
            ✅ Rating submitted successfully!
          </p>
        )}

        {/* Show Reviews */}
        <UserReviews ratedId={otherId} />
      </div>
    </div>
  );
}

export default Chat;
