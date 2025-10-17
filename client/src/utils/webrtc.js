// utils/webrtc.js

// ✅ WebRTC Configuration
// Includes free Google STUN servers + optional TURN server placeholder
export const RTC_CONFIG = {
  iceServers: [
    // Public Google STUN servers
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },

    // Optional TURN (for real deployments / NAT traversal)
    // Uncomment and configure when you add a TURN server:
    // {
    //   urls: "turn:turn.yourdomain.com:3478",
    //   username: "your-username",
    //   credential: "your-password"
    // }
  ],
};

// ✅ Notes:
// - STUN servers help peers discover their public IP addresses.
// - TURN servers are needed when users are behind strict NAT/firewalls.
// - You can add your own TURN server credentials for production stability.
