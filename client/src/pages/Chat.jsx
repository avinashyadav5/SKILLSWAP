import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import EmojiPicker from "emoji-picker-react";
import UserReviews from "../components/UserReviews";
import { RTC_CONFIG } from "../utils/webrtc";
import socket from "../utils/socket"; // ✅ Shared global socket instance

const BACKEND_URL =
  import.meta.env.VITE_API_URL || "https://skillswap-1-1iic.onrender.com";

function Chat() {
  const { userId } = useParams();
  const me = JSON.parse(localStorage.getItem("user"));
  const myId = parseInt(me?.id);
  const otherId = parseInt(userId);

  // Chat state
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });

  // Call / WebRTC state
  const [inCall, setInCall] = useState(false);
  const [incomingCallOffer, setIncomingCallOffer] = useState(false);
  const [callFrom, setCallFrom] = useState(null);
  const [callLoading, setCallLoading] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const pendingCandidates = useRef([]);

  // === Fetch User ===
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

  // === Socket Setup ===
  useEffect(() => {
    if (!myId) return;
    socket.emit("join_room", myId);

    // Receive messages
    const onReceiveMessage = (msg) => {
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
    socket.on("receive_message", onReceiveMessage);

    // Online users
    socket.on("online_users", (list) => setOnlineUsers(list.map(Number)));

    // --- CALL EVENTS ---
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
      try {
        await initWebRTCConnection(from, false);
      } catch (err) {
        console.error("Error starting call after acceptance:", err);
        setCallLoading(false);
      }
    });

    socket.on("webrtc_offer", async ({ from, offer }) => {
      if (!peerRef.current) {
        try {
          await initWebRTCConnection(from, true, offer);
        } catch (err) {
          console.error("Error handling incoming offer:", err);
        }
      } else {
        try {
          await peerRef.current.setRemoteDescription(
            new RTCSessionDescription(offer)
          );
        } catch (err) {
          console.error("Error setting remote description for offer:", err);
        }
      }
    });

    socket.on("webrtc_answer", async ({ answer }) => {
      if (peerRef.current) {
        try {
          await peerRef.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          while (pendingCandidates.current.length) {
            const c = pendingCandidates.current.shift();
            await peerRef.current.addIceCandidate(c);
          }
        } catch (err) {
          console.error("Error setting remote description for answer:", err);
        }
      }
    });

    socket.on("webrtc_ice_candidate", async ({ candidate }) => {
      if (!peerRef.current) return;
      try {
        const iceCandidate = new RTCIceCandidate(candidate);
        if (
          peerRef.current.remoteDescription &&
          peerRef.current.remoteDescription.type
        ) {
          await peerRef.current.addIceCandidate(iceCandidate);
        } else {
          pendingCandidates.current.push(iceCandidate);
          console.log("Queued ICE candidate until remoteDescription is set.");
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    socket.on("call_rejected", () => {
      alert("📞 Call rejected by the other user.");
      setCallLoading(false);
    });

    // ✅ Handle when other user ends call
    socket.on("end_call", () => {
      console.log("📴 Remote user ended the call");
      endCall();
    });

    return () => {
      socket.off("receive_message", onReceiveMessage);
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

  // === Initialize WebRTC Connection ===
  const initWebRTCConnection = async (
    from,
    isReceiver = false,
    remoteOffer = null
  ) => {
    setInCall(true);
    setCallLoading(true);

    // ✅ Stop any existing local streams
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }

    peerRef.current = new RTCPeerConnection(RTC_CONFIG);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideoRef.current.srcObject = stream;
    stream
      .getTracks()
      .forEach((track) => peerRef.current.addTrack(track, stream));

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

    peerRef.current.oniceconnectionstatechange = () => {
      if (
        peerRef.current?.iceConnectionState === "disconnected" ||
        peerRef.current?.iceConnectionState === "failed"
      ) {
        endCall();
      }
    };

    if (isReceiver && remoteOffer) {
      await peerRef.current.setRemoteDescription(
        new RTCSessionDescription(remoteOffer)
      );
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

  const endCall = () => {
    try {
      peerRef.current?.close();
    } catch (e) {}
    peerRef.current = null;
    pendingCandidates.current = [];
    setInCall(false);
    setCallLoading(false);
    socket.emit("end_call", { to: otherId });

    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      remoteVideoRef.current.srcObject = null;
    }
  };

  const requestCall = () => {
    socket.emit("call_request", { to: otherId, from: myId });
    setCallLoading(true);
  };

  const acceptIncomingCall = async () => {
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

  // === Fetch messages ===
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/messages/${myId}/${otherId}`
        );
        const data = await res.json();
        const formatted = data.map((msg) => ({
          ...msg,
          fromSelf: parseInt(msg.senderId) === myId,
          images: msg.images || [],
        }));
        setMessages(formatted);
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    };
    fetchMessages();
  }, [myId, otherId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      setShowEmojiPicker(false);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const onEmojiClick = (emojiData) =>
    setText((prev) => prev + emojiData.emoji);

  const groupedByDate = messages.reduce((acc, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString();
    acc[date] = acc[date] || [];
    acc[date].push(msg);
    return acc;
  }, {});

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
              onlineUsers.includes(otherId)
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {onlineUsers.includes(otherId) ? "Online" : "Offline"}
          </span>
        </div>

        {/* CHAT BOX */}
        <div
          className="h-96 sm:h-[28rem] overflow-y-auto bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/20 mb-4"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {Object.entries(groupedByDate).map(([date, msgs], idx) => (
            <div key={idx}>
              <div className="text-center text-gray-400 text-sm my-2">
                📅 {date}
              </div>
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

        {/* CALL + INPUT BAR */}
        <div className="flex flex-wrap gap-2 items-center w-full mb-4 bg-white/10 p-2 rounded-lg relative">
          <button
            onClick={requestCall}
            disabled={callLoading || inCall}
            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full"
            title="Start Video Call"
          >
            📹
          </button>

          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="text-xl bg-white/20 p-2 rounded-lg"
          >
            😀
          </button>

          {showEmojiPicker && (
            <div className="absolute z-10 bottom-20 left-4 sm:left-8">
              <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
            </div>
          )}

          <input type="file" multiple onChange={handleImageChange} />

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
                setShowEmojiPicker(false);
              }
            }}
            className="flex-grow p-2 rounded-md text-black"
            placeholder="Type your message..."
          />

          <button
            onClick={() => {
              sendMessage();
              setShowEmojiPicker(false);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>

        {/* VIDEO CALL */}
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

        <UserReviews ratedId={otherId} />
      </div>

      {/* INCOMING CALL POPUP */}
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
    </div>
  );
}

export default Chat;
