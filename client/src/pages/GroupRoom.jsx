import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function GroupRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  const roomUrl = new URLSearchParams(location.search).get("url");

  if (!roomUrl) {
    return (
      <div className="min-h-screen bg-[#111827] text-white pt-24 px-4 pb-12 flex flex-col items-center justify-center">
        <Navbar />
        <h1 className="text-3xl font-bold mb-4">Invalid Room</h1>
        <p className="text-gray-400 mb-6">No room URL provided.</p>
        <button onClick={() => navigate("/dashboard")} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] text-white pt-24 px-4 pb-12 flex flex-col h-screen">
      <Navbar />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-blue-400">📹 Group Video Room</h1>
        <button onClick={() => navigate("/dashboard")} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
          Leave Room
        </button>
      </div>
      <div className="flex-1 rounded-xl overflow-hidden border border-white/20 bg-black">
        <iframe
          src={roomUrl}
          allow="camera; microphone; fullscreen; display-capture"
          className="w-full h-full border-none"
          title="Group Video Call"
        ></iframe>
      </div>
    </div>
  );
}
