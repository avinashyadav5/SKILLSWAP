// utils/webrtc.js

export const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },

    // Optional TURN (for production calls behind firewalls)
    // {
    //   urls: "turn:turn.yourdomain.com:3478",
    //   username: "user",
    //   credential: "pass"
    // }
  ],
};
