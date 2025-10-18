import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import Navbar from "../components/Navbar";
import EmojiPicker from "emoji-picker-react";
import UserReviews from "../components/UserReviews";
import toast from "react-hot-toast";
import { RTC_CONFIG } from "../utils/webrtc";

const BACKEND_URL = import.meta.env.VITE_API_URL || "https://skillswap-1-1iic.onrender.com";
const socket = io(BACKEND_URL, { transports: ["websocket", "polling"] });

function Chat() {
  const { userId } = useParams();
  const me = JSON.parse(localStorage.getItem("user"));
  const myId = parseInt(me?.id);
  const otherId = parseInt(userId);

  // --- State ---
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [inCall, setInCall] = useState(false);
  const [incomingCallOffer, setIncomingCallOffer] = useState(false);
  const [callFrom, setCallFrom] = useState(null);
  const [callLoading, setCallLoading] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // --- Refs ---
  const messagesEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pendingCandidates = useRef([]);

  // === Fetch other user info ===
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/user/${userId}`)
      .then((res) => res.json())
      .then(setOtherUser)
      .catch((err) => console.error("User fetch failed:", err));
  }, [userId]);

  // === Socket setup ===
  useEffect(() => {
    if (!myId) return;
    socket.emit("join_room", myId);

    // Receive chat message
    socket.on("receive_message", (msg) => {
      const sender = parseInt(msg.senderId);
      const receiver = parseInt(msg.receiverId);
      const fromSelf = sender === myId;
      if ([sender, receiver].includes(myId) && [sender, receiver].includes(otherId)) {
        setMessages((prev) => [...prev, { ...msg, fromSelf }]);
      }
    });

    // Online users
    socket.on("online_users", (list) => setOnlineUsers(list.map(Number)));

    // === Incoming call system ===
    socket.on("call_request", ({ from }) => {
      setCallFrom(from);
      setIncomingCallOffer(true);
    });

    socket.on("call_response", async ({ accepted, from }) => {
      if (!accepted) {
        toast("📞 Call was declined.", { icon: "🚫", style: { background: "#333", color: "#fff" } });
        setCallLoading(false);
        return;
      }
      await initWebRTCConnection(from, false);
    });

    socket.on("webrtc_offer", async ({ from, offer }) => {
      await initWebRTCConnection(from, true, offer);
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
      const iceCandidate = new RTCIceCandidate(candidate);
      if (peerRef.current.remoteDescription) await peerRef.current.addIceCandidate(iceCandidate);
      else pendingCandidates.current.push(iceCandidate);
    });

    socket.on("call_rejected", () => {
      toast("🚫 Call rejected", { style: { background: "#333", color: "#fff" } });
      setCallLoading(false);
    });

    socket.on("end_call", () => {
      endCall();
      toast("📴 The other user ended the call", { icon: "📵", style: { background: "#444", color: "#fff" } });
    });

    return () => {
      socket.off("receive_message");
      socket.off("online_users");
      socket.off("call_request");
      socket.off("call_response");
      socket.off("webrtc_offer");
      socket.off("webrtc_answer");
      socket.off("webrtc_ice_candidate");
      socket.off("call_rejected");
      socket.off("end_call");
    };
  }, [myId, otherId]);

  // === Load message history ===
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/messages/${myId}/${otherId}`)
      .then((res) => res.json())
      .then((data) =>
        setMessages(
          data.map((msg) => ({
            ...msg,
            fromSelf: parseInt(msg.senderId) === myId,
          }))
        )
      )
      .catch((err) => console.error("Message load failed:", err));
  }, [myId, otherId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // === WebRTC ===
  const initWebRTCConnection = async (from, isReceiver = false, remoteOffer = null) => {
    setInCall(true);
    setCallLoading(true);
    peerRef.current = new RTCPeerConnection(RTC_CONFIG);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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

    peerRef.current.oniceconnectionstatechange = () => {
      if (["disconnected", "failed"].includes(peerRef.current.iceConnectionState)) endCall();
    };

    if (isReceiver && remoteOffer) {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(remoteOffer));
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socket.emit("webrtc_answer", { to: from, answer });
      setCallLoading(false);
    } else if (!isReceiver) {
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socket.emit("webrtc_offer", { to: otherId, offer, from: myId });
      setCallLoading(false);
    }
  };

  // === Call controls ===
  const requestCall = () => {
    socket.emit("call_request", { to: otherId, from: myId });
    setCallLoading(true);
  };

  const acceptIncomingCall = () => {
    socket.emit("call_response", { to: callFrom, accepted: true, from: myId });
    setIncomingCallOffer(false);
    setCallFrom(null);
    setCallLoading(true);
  };

  const rejectIncomingCall = () => {
    socket.emit("call_response", { to: callFrom, accepted: false, from: myId });
    socket.emit("call_rejected", { to: callFrom, from: myId });
    setIncomingCallOffer(false);
    setCallFrom(null);
  };

  const endCall = () => {
    try {
      peerRef.current?.close();
    } catch {}
    peerRef.current = null;
    pendingCandidates.current = [];
    setInCall(false);
    setCallLoading(false);
    socket.emit("end_call", { to: otherId });

    localVideoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
    remoteVideoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
    toast("📞 Call ended", { icon: "❌", style: { background: "#333", color: "#fff" } });
  };

  // === Screen Sharing ===
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = peerRef.current.getSenders().find((s) => s.track.kind === "video");
      if (sender) sender.replaceTrack(screenTrack);

      screenTrack.onended = () => stopScreenShare();
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  const stopScreenShare = async () => {
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const cameraTrack = cameraStream.getVideoTracks()[0];
      const sender = peerRef.current.getSenders().find((s) => s.track.kind === "video");
      if (sender) sender.replaceTrack(cameraTrack);

      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      setIsScreenSharing(false);
    } catch (err) {
      console.error("Stop screen share error:", err);
    }
  };

  // === Send message ===
  const sendMessage = async () => {
    if (!text.trim()) return;
    const msg = { senderId: myId, receiverId: otherId, text };
    await fetch(`${BACKEND_URL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg),
    });
    setText("");
    setShowEmojiPicker(false);
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
      <div className="max-w-2xl mx-auto pt-24 px-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            Chat with {otherUser?.name || "User"}
          </h2>
          <span
            className={
              onlineUsers.includes(otherId) ? "text-green-400" : "text-red-400"
            }
          >
            {onlineUsers.includes(otherId) ? "Online" : "Offline"}
          </span>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto bg-white/10 p-4 rounded-lg mb-4 border border-white/20">
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

        {/* Input */}
        <div className="flex gap-2 items-center mb-4 relative">
          <button
            onClick={requestCall}
            disabled={callLoading || inCall}
            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full"
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
            <div className="absolute bottom-16 left-0">
              <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
            </div>
          )}

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-grow p-2 rounded text-black"
            placeholder="Type your message..."
          />
          <button
            onClick={sendMessage}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Send
          </button>
        </div>

        {/* Video Call */}
        {inCall && (
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-2">🎥 Live Video Call</h3>
            <div className="flex gap-4 flex-wrap justify-center">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-64 h-48 bg-black rounded" />
              <video ref={remoteVideoRef} autoPlay playsInline className="w-64 h-48 bg-black rounded" />
            </div>
            <div className="flex gap-2 mt-4">
              {!isScreenSharing ? (
                <button onClick={startScreenShare} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded">
                  🖥️ Share Screen
                </button>
              ) : (
                <button onClick={stopScreenShare} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
                  ✖ Stop Sharing
                </button>
              )}
              <button onClick={endCall} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
                End Call
              </button>
            </div>
          </div>
        )}

        <UserReviews ratedId={otherId} />
      </div>

      {/* Incoming Call Popup */}
      {incomingCallOffer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
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
    </div>
  );
}

export default Chat;
