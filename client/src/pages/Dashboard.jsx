import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

import Matches from "../components/Matches";
import SubjectSearch from "../components/SubjectSearch";
import LearningPath from "../components/LearningPath";
import LearningResources from "../components/LearningResources";
import Chatbot from "../components/Chatbot";
import StudyBuddy from "../components/StudyBuddy";   // ✅ Import AI Study Buddy

function Dashboard() {
  const [user, setUser] = useState(null);
  const [avgRating, setAvgRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      setError("User is not logged in");
      setLoading(false);
      return;
    }

    const parsedUser = JSON.parse(storedUser);

    // ✅ Fetch full user profile (including teach + learn arrays)
    async function fetchUserProfile() {
      try {
        const res = await fetch(`http://localhost:5000/api/user/${parsedUser.id}`);
        if (!res.ok) throw new Error("Failed to fetch user profile");
        const fullUser = await res.json();
        setUser(fullUser);

        // Fetch rating separately
        const ratingRes = await fetch(`http://localhost:5000/api/rating/average/${parsedUser.id}`);
        if (!ratingRes.ok) throw new Error("Failed to fetch average rating");
        const ratingData = await ratingRes.json();
        setAvgRating(ratingData.avgStars || 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, []);

  const renderStars = () => {
    if (avgRating == null || isNaN(Number(avgRating))) return null;
    const ratingNum = Number(avgRating);
    const full = Math.floor(ratingNum);
    const half = ratingNum - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;

    return (
      <span className="text-yellow-400 text-lg ml-2">
        {"★".repeat(full)}
        {half ? "½" : ""}
        {"☆".repeat(empty)}
        <span className="ml-1 text-sm text-gray-300">
          ({ratingNum.toFixed(1)})
        </span>
      </span>
    );
  };

  if (loading) return <p className="text-white">Loading dashboard...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="relative min-h-screen mt-14 text-white p-6 overflow-hidden bg-[#0d1117]">
      <Particles
        className="absolute inset-0 z-0 pointer-events-none"
        init={loadSlim}
        options={{
          background: { color: { value: "#0d1117" } },
          particles: {
            number: { value: 80 },
            color: { value: "#00bfff" },
            links: { enable: true, color: "#9ecbff", distance: 120, opacity: 0.3 },
            move: { enable: true, speed: 1 },
            shape: { type: "circle" },
            opacity: { value: 0.5 },
            size: { value: 2 },
          },
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto">
        <motion.h1
          className="text-3xl font-bold mb-6 flex items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Welcome, {user?.name || "User"} 👋
          {renderStars()}
        </motion.h1>

        <motion.h2
          className="text-xl font-semibold mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Your Matches
        </motion.h2>

        <Matches userId={user.id} token={localStorage.getItem("token")} />

        <div className="mt-10">
          <label className="block mb-2 text-white font-medium">
            Enter a subject to get personalized recommendations:
          </label>

          <SubjectSearch onSelectSubject={setSelectedSubject} />

          {selectedSubject && (
            <div className="mt-6 space-y-6">
              <LearningPath subject={selectedSubject} />
              <LearningResources subject={selectedSubject} />
            </div>
          )}

          <Chatbot />

          {/* ✅ AI Study Buddy Added — now passing full user object */}
          <div className="mt-8">
            <StudyBuddy user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
