import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import EmojiPicker from "emoji-picker-react";
import UserReviews from "../components/UserReviews";
import { RTC_CONFIG } from "../utils/webrtc";
import socket from "../utils/socket";

const BACKEND_URL =
  import.meta.env.VITE_API_URL || "https://skillswap-1-1iic.onrender.com";

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
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });

  // --- Video Call State ---
  const [inCall, setInCall] = useState(false);
  const [incomingCallOffer, setIncomingCallOffer] = useState(false);
  const [callFrom, setCallFrom] = useState(null);
  const [callLoading, setCallLoading] = useState(false);

  // --- Rating State ---
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [review, setReview] = useState("");
  const [ratingSuccess, setRatingSuccess] = useState(false);

  const messagesEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);

  // === Fetch user ===
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoadingUser(true);
        const res = await fetch(`${BACKEND_URL}/api/user/${userId}`);
        const data = await res.json();
        setOtherUser(data);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [userId]);

  // === Socket setup ===
  useEffect(() => {
    if (!myId) return;
    socket.emit("join_room", myId);

    const onReceiveMessage = (msg) => {
      const sender = parseInt(msg.senderId);
      const receiver = parseInt(msg.receiverId);
      const fromSelf = sender === myId;
      const relevant =
        (sender === myId && receiver === otherId) ||
        (sender === otherId && receiver === myId);
      if (!relevant) return;
      setMessages((p) => [...p, { ...msg, fromSelf, images: msg.images || [] }]);
    };

    socket.on("receive_message", onReceiveMessage);
    socket.on("online_users", (list) => setOnlineUsers(list.map(Number)));

    socket.on("call_request", ({ from }) => {
      setCallFrom(from);
      setIncomingCallOffer(true);
    });

    socket.on("call_response", async ({ accepted, from }) => {
      if (!accepted) {
        alert("📞 Call was declined.");
        setCallLoading(false);
        return;
      }
      await initWebRTCConnection(from, false);
    });

    socket.on("webrtc_offer", async ({ from, offer }) => {
      await initWebRTCConnection(from, true, offer);
    });

    socket.on("webrtc_answer", async ({ answer }) => {
      if (peerRef.current)
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
    });

    socket.on("webrtc_ice_candidate", async ({ candidate }) => {
      if (!peerRef.current) return;
      const ice = new RTCIceCandidate(candidate);
      await peerRef.current.addIceCandidate(ice);
    });

    socket.on("call_rejected", () => {
      alert("📞 Call rejected by the other user.");
      setCallLoading(false);
    });

    socket.on("end_call", endCall);

    return () => socket.off();
  }, [myId, otherId]);

  // === WebRTC ===
  const initWebRTCConnection = async (from, isReceiver = false, offer = null) => {
    setInCall(true);
    setCallLoading(true);
    peerRef.current = new RTCPeerConnection(RTC_CONFIG);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach((t) => peerRef.current.addTrack(t, stream));
    peerRef.current.ontrack = (e) => (remoteVideoRef.current.srcObject = e.streams[0]);
    peerRef.current.onicecandidate = (e) => {
      if (e.candidate)
        socket.emit("webrtc_ice_candidate", {
          to: isReceiver ? from : otherId,
          candidate: e.candidate,
        });
    };
    if (isReceiver && offer) {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const ans = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(ans);
      socket.emit("webrtc_answer", { to: from, answer: ans });
    } else {
      const off = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(off);
      socket.emit("webrtc_offer", { to: otherId, offer: off, from: myId });
    }
    setCallLoading(false);
  };

  const endCall = () => {
    peerRef.current?.close();
    peerRef.current = null;
    setInCall(false);
    setCallLoading(false);
    socket.emit("end_call", { to: otherId });
  };

  const requestCall = () => {
    socket.emit("call_request", { to: otherId, from: myId });
    setCallLoading(true);
  };

  const acceptIncomingCall = async () => {
    socket.emit("call_response", { to: callFrom, accepted: true, from: myId });
    setIncomingCallOffer(false);
    setCallFrom(null);
  };

  const rejectIncomingCall = () => {
    socket.emit("call_response", { to: callFrom, accepted: false, from: myId });
    socket.emit("call_rejected", { to: callFrom, from: myId });
    setIncomingCallOffer(false);
    setCallFrom(null);
  };

  // === Fetch messages ===
  useEffect(() => {
    const fetchMsgs = async () => {
      const res = await fetch(`${BACKEND_URL}/api/messages/${myId}/${otherId}`);
      const data = await res.json();
      const formatted = data.map((m) => ({
        ...m,
        fromSelf: parseInt(m.senderId) === myId,
        images: m.images || [],
      }));
      setMessages(formatted);
    };
    fetchMsgs();
  }, [myId, otherId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // === Image selection ===
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages((prev) => [...prev, ...files]);
  };

  const removeSelectedImage = (index) =>
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));

  const sendMessage = async () => {
    if (!text.trim() && selectedImages.length === 0) return;
    const form = new FormData();
    form.append("senderId", myId);
    form.append("receiverId", otherId);
    form.append("text", text);
    selectedImages.forEach((img) => form.append("images", img));
    await fetch(`${BACKEND_URL}/api/messages`, { method: "POST", body: form });
    setText("");
    setSelectedImages([]);
  };

  const onEmojiClick = (e) => setText((p) => p + e.emoji);

  const groupedByDate = messages.reduce((a, m) => {
    const d = new Date(m.createdAt).toLocaleDateString();
    (a[d] ||= []).push(m);
    return a;
  }, {});

  // === Rating Submit ===
  const submitRating = async () => {
    if (stars === 0) return alert("Please select a star rating");
    const res = await fetch(`${BACKEND_URL}/api/rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        raterId: myId,
        ratedId: otherId,
        stars,
        review,
      }),
    });
    if (res.ok) {
      setRatingSuccess(true);
      setShowRatingForm(false);
      setStars(0);
      setReview("");
      setTimeout(() => setRatingSuccess(false), 3000);
    }
  };

  // === Lightbox Controls ===
  const closeLightbox = useCallback(() => setLightbox({ open: false, images: [], index: 0 }), []);
  const showPrev = useCallback(
    (e) => {
      e.stopPropagation();
      setLightbox((prev) => ({
        ...prev,
        index: (prev.index - 1 + prev.images.length) % prev.images.length,
      }));
    },
    []
  );
  const showNext = useCallback(
    (e) => {
      e.stopPropagation();
      setLightbox((prev) => ({
        ...prev,
        index: (prev.index + 1) % prev.images.length,
      }));
    },
    []
  );

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && closeLightbox();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [closeLightbox]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b2845] to-[#000f89] text-white">
      <Navbar />
      <div className="w-full max-w-2xl mx-auto sm:px-4 px-2 py-16">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {otherUser?.avatar && (
            <img
              src={
                otherUser.avatar.startsWith("http")
                  ? otherUser.avatar
                  : `${BACKEND_URL}/uploads/${otherUser.avatar}`
              }
              alt=""
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
            className={`ml-auto ${onlineUsers.includes(otherId) ? "text-green-400" : "text-red-400"}`}
          >
            {onlineUsers.includes(otherId) ? "Online" : "Offline"}
          </span>
        </div>

        {/* CHAT BOX */}
        <div className="h-96 sm:h-[28rem] overflow-y-auto bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/20 mb-4">
          {Object.entries(groupedByDate).map(([date, msgs]) => (
            <div key={date}>
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
                            className="w-20 h-20 object-cover rounded-md border cursor-pointer hover:opacity-80"
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

        {/* ✅ Selected Image Previews */}
        {selectedImages.length > 0 && (
          <div className="flex gap-3 mb-3 flex-wrap">
            {selectedImages.map((file, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  onClick={() =>
                    setLightbox({
                      open: true,
                      images: selectedImages.map((f) => URL.createObjectURL(f)),
                      index: idx,
                    })
                  }
                  className="w-16 h-16 object-cover rounded-lg border border-white/30 cursor-pointer hover:scale-105 transition"
                />
                <button
                  onClick={() => removeSelectedImage(idx)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-700"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}

        {/* INPUT BAR */}
        <div className="flex flex-wrap gap-2 items-center w-full mb-4 bg-white/10 p-2 rounded-lg relative">
          <button
            onClick={requestCall}
            disabled={callLoading || inCall}
            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full"
            title="Start Video Call"
          >
            📹
          </button>

          <label
            htmlFor="imageUpload"
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full"
            title="Upload Image"
          >
            🖼️
          </label>
          <input id="imageUpload" type="file" multiple onChange={handleImageChange} className="hidden" />

          <button
            onClick={() => setShowEmojiPicker((p) => !p)}
            className="text-xl bg-white/20 p-2 rounded-lg"
          >
            😀
          </button>

          {showEmojiPicker && (
            <div className="absolute z-10 bottom-20 left-4 sm:left-8">
              <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
            </div>
          )}

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

        {/* 🎥 Video Call UI */}
        {inCall && (
          <div className="flex flex-col items-center mt-4">
            <h3 className="text-lg font-semibold mb-2">🎥 Live Video Call</h3>
            <div className="flex gap-4 flex-wrap justify-center">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-64 h-48 bg-black rounded" />
              <video ref={remoteVideoRef} autoPlay playsInline className="w-64 h-48 bg-black rounded" />
            </div>
            <button onClick={endCall} className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
              End Call
            </button>
          </div>
        )}

        {/* ⭐ Rating + Review Section */}
        <div className="bg-[#0e1a4f]/60 backdrop-blur-md border border-white/20 rounded-xl p-5 mt-8 shadow-lg">
          {!showRatingForm && (
            <button
              onClick={() => setShowRatingForm(true)}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-5 py-2.5 rounded-lg shadow-md transition-all duration-200"
            >
              <span>⭐</span> Rate this user
            </button>
          )}

          {showRatingForm && (
            <div className="mt-3 space-y-4">
              <div>
                <label className="block text-white text-sm mb-2">Select Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <span
                      key={num}
                      onClick={() => setStars(num)}
                      onMouseEnter={() => setHoveredStar(num)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className={`text-3xl cursor-pointer transition-all duration-200 ${
                        (hoveredStar || stars) >= num ? "text-yellow-400" : "text-gray-400"
                      } hover:scale-110`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white text-sm mb-1">Write a short review (optional)</label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Type your feedback..."
                  rows="3"
                  className="w-full bg-white/10 text-white border border-white/30 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-300"
                />
              </div>

              <button
                onClick={submitRating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-all"
              >
                Submit Rating
              </button>
            </div>
          )}

          {ratingSuccess && (
            <p className="text-green-400 font-semibold mt-3">✅ Rating submitted successfully!</p>
          )}
        </div>

        {/* ⭐ User Reviews */}
        <UserReviews ratedId={otherId} />
      </div>

      {/* 📞 Incoming Call Popup */}
      {incomingCallOffer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 text-center shadow-lg max-w-sm">
            <h3 className="text-lg font-semibold text-black mb-2">
              📞 Incoming call from {otherUser?.name || callFrom}
            </h3>
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={acceptIncomingCall}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                Accept
              </button>
              <button
                onClick={rejectIncomingCall}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 Lightbox Zoom View */}
      {lightbox.open && lightbox.images.length > 0 && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={closeLightbox}
        >
          <img
            src={lightbox.images[lightbox.index]}
            alt="zoom"
            className="max-w-full max-h-full rounded-lg border border-white"
          />
          {lightbox.images.length > 1 && (
            <>
              <button
                onClick={showPrev}
                className="absolute left-5 text-white text-3xl font-bold px-3 py-2 bg-black/50 rounded-full hover:bg-black/70"
              >
                ←
              </button>
              <button
                onClick={showNext}
                className="absolute right-5 text-white text-3xl font-bold px-3 py-2 bg-black/50 rounded-full hover:bg-black/70"
              >
                →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Chat;
