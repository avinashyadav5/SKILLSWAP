import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import Navbar from "../components/Navbar";
import EmojiPicker from "emoji-picker-react";
import UserReviews from "../components/UserReviews";
import { RTC_CONFIG } from "../utils/webrtc";

// ✅ Automatically pick backend URL
const BACKEND_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "https://skillswap-1-1iic.onrender.com";

const socket = io(BACKEND_URL, { transports: ["websocket", "polling"] });

function Chat() {
  const { userId } = useParams();
  const me = JSON.parse(localStorage.getItem("user"));
  const myId = parseInt(me?.id);
  const otherId = parseInt(userId);

  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [otherUserName, setOtherUserName] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);

  // ⭐ Rating state
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState("");
  const [ratingSuccess, setRatingSuccess] = useState(false);

  // 🎥 WebRTC states
  const [inCall, setInCall] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const pendingCandidates = useRef([]);

  // ✅ Fetch user info
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/user/${userId}`)
      .then((res) => res.json())
      .then((data) => setOtherUserName(data.name))
      .catch(() => setOtherUserName("Unknown User"));
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

      if (isRelevant) {
        setMessages((prev) => [...prev, { ...msg, fromSelf }]);
      }
    };

    const handleOnline = (list) => setOnlineUsers(list.map(Number));

    socket.on("receive_message", handleReceive);
    socket.on("online_users", handleOnline);

    // ✅ WebRTC signaling
    socket.on("webrtc_offer", async ({ from, offer }) => {
      if (!peerRef.current) await initWebRTCConnection(from, true, offer);
    });

    socket.on("webrtc_answer", async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );

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
      socket.off("receive_message", handleReceive);
      socket.off("online_users", handleOnline);
      socket.off("webrtc_offer");
      socket.off("webrtc_answer");
      socket.off("webrtc_ice_candidate");
    };
  }, [myId, otherId]);

  // ✅ Load message history
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/messages/${myId}/${otherId}`)
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((msg) => ({
          ...msg,
          fromSelf: parseInt(msg.senderId) === myId,
        }));
        setMessages(formatted);
      });
  }, [myId, otherId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ WebRTC init
  const initWebRTCConnection = async (from, isReceiver = false, remoteOffer = null) => {
    setInCall(true);
    peerRef.current = new RTCPeerConnection(RTC_CONFIG);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach((t) => peerRef.current.addTrack(t, stream));

    peerRef.current.ontrack = (e) => {
      remoteVideoRef.current.srcObject = e.streams[0];
    };

    peerRef.current.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("webrtc_ice_candidate", {
          to: isReceiver ? from : otherId,
          candidate: e.candidate,
        });
      }
    };

    if (isReceiver && remoteOffer) {
      await peerRef.current.setRemoteDescription(
        new RTCSessionDescription(remoteOffer)
      );
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socket.emit("webrtc_answer", { to: from, answer });
    } else {
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socket.emit("webrtc_offer", { to: otherId, offer, from: myId });
    }
  };

  const endCall = () => {
    peerRef.current?.close();
    peerRef.current = null;
    setInCall(false);
  };

  // ✅ Send message
  const sendMessage = async () => {
    if (!text.trim()) return;

    const msg = {
      senderId: myId,
      receiverId: otherId,
      text,
    };

    const res = await fetch(`${BACKEND_URL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg),
    });

    const savedMsg = await res.json();
    socket.emit("send_message", savedMsg);
    setText("");
  };

  // ✅ Submit Rating (works both localhost + render)
  const submitRating = async () => {
    if (stars === 0) return alert("Please select stars");

    const body = {
      raterId: myId,
      ratedId: otherId,
      stars,
      review,
    };

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
    } else {
      console.error("Review submission failed:", await res.text());
      alert("Review submission failed.");
    }
  };

  const groupedByDate = messages.reduce((acc, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString();
    acc[date] = acc[date] || [];
    acc[date].push(msg);
    return acc;
  }, {});

  const onEmojiClick = (emojiData) => setText((prev) => prev + emojiData.emoji);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b2845] to-[#000f89] text-white">
      <Navbar />
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Chat with {otherUserName}</h2>
          <span
            className={
              onlineUsers.includes(otherId) ? "text-green-400" : "text-red-400"
            }
          >
            {onlineUsers.includes(otherId) ? "Online" : "Offline"}
          </span>
        </div>

        {/* MESSAGES */}
        <div className="h-96 overflow-y-auto bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 mb-4">
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
                  {m.text}
                </div>
              ))}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className="flex gap-2.5 items-center mb-4">
          <button
            onClick={() => initWebRTCConnection(otherId)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded mt-4"
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

        {/* ⭐ Rate Button */}
        {!showRatingForm && (
          <button
            onClick={() => setShowRatingForm(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded mb-4"
          >
            ⭐ Rate this user
          </button>
        )}

        {/* Rating Form */}
        {showRatingForm && (
          <div className="bg-white/10 p-4 rounded-lg mb-4">
            <div className="mb-2">
              <label className="block text-white mb-1">Stars (1–5)</label>
              <select
                value={stars}
                onChange={(e) => setStars(parseInt(e.target.value))}
                className="text-black p-2 rounded"
              >
                <option value={0}>Select...</option>
                {[1, 2, 3, 4, 5].map((s) => (
                  <option key={s} value={s}>
                    {s} ⭐
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="block text-white mb-1">Review (optional)</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="w-full p-2 rounded text-black"
              />
            </div>
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

        {/* 🎥 Active Call */}
        {inCall && (
          <div className="flex flex-col items-center mt-4">
            <h3 className="text-lg font-semibold mb-2">🎥 Live Video Call</h3>
            <div className="flex gap-4 flex-wrap justify-center">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-64 h-48 bg-black rounded"
              />
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-64 h-48 bg-black rounded"
              />
            </div>
            <button
              onClick={endCall}
              className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              End Call
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
