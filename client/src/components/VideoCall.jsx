import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import io from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;
const socket = io(API_URL);

function VideoCall() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const me = JSON.parse(localStorage.getItem("user"));
  const myId = parseInt(me?.id);
  const otherId = parseInt(userId);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isCallEnded, setIsCallEnded] = useState(false);

  useEffect(() => {
    socket.emit("join_room", myId);

    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        localVideoRef.current.srcObject = stream;

        const peer = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        peerRef.current = peer;
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));

        peer.ontrack = (e) => {
          remoteVideoRef.current.srcObject = e.streams[0];
        };

        peer.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("ice_candidate", { to: otherId, from: myId, candidate: e.candidate });
          }
        };

        socket.on("offer", async (d) => {
          if (parseInt(d.to) !== myId) return;
          await peer.setRemoteDescription(new RTCSessionDescription(d.offer));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit("answer", { to: d.from, from: myId, answer });
        });

        socket.on("answer", async (d) => {
          if (parseInt(d.to) !== myId) return;
          await peer.setRemoteDescription(new RTCSessionDescription(d.answer));
        });

        socket.on("ice_candidate", async (d) => {
          if (parseInt(d.to) !== myId) return;
          await peer.addIceCandidate(new RTCIceCandidate(d.candidate));
        });

        socket.on("call_ended", () => endCall());

        if (myId < otherId) {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit("offer", { to: otherId, from: myId, offer });
        }
      } catch (err) {
        console.error("Media error:", err);
      }
    };

    setup();

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice_candidate");
      socket.off("call_ended");
      endCall();
    };
  }, [myId, otherId]);

  const toggleMute = () => {
    const a = localStreamRef.current?.getAudioTracks();
    if (a?.length) {
      a[0].enabled = !a[0].enabled;
      setIsMuted(!a[0].enabled);
    }
  };

  const toggleCamera = () => {
    const v = localStreamRef.current?.getVideoTracks();
    if (v?.length) {
      v[0].enabled = !v[0].enabled;
      setIsCameraOff(!v[0].enabled);
    }
  };

  const endCall = () => {
    if (peerRef.current) peerRef.current.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    socket.emit("end_call", { to: otherId, from: myId });
    setIsCallEnded(true);
    setTimeout(() => navigate(`/chat/${otherId}`), 1000);
  };

  if (isCallEnded)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-screen bg-[#0b1442] text-white text-2xl font-bold"
      >
        🚫 Call Ended
      </motion.div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#0b1442] text-white flex flex-col items-center justify-center"
    >
      <motion.h1
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-2xl font-bold mb-6 flex items-center gap-2"
      >
        🎥 Video Call
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex gap-6 mb-6"
      >
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-80 h-60 rounded-lg border-2 border-white bg-black"
        ></video>

        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-80 h-60 rounded-lg border-2 border-white bg-black"
        ></video>
      </motion.div>

      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={toggleMute}
          className={`px-6 py-2 rounded-lg font-semibold ${
            isMuted ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isMuted ? "🔇 Unmute" : "🎙️ Mute Mic"}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={toggleCamera}
          className={`px-6 py-2 rounded-lg font-semibold ${
            isCameraOff ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isCameraOff ? "📷 Turn On Cam" : "📸 Turn Off Cam"}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={endCall}
          className="px-6 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700"
        >
          ❌ End Call
        </motion.button>
      </div>
    </motion.div>
  );
}

export default VideoCall;
