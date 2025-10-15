import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import UserReviews from '../components/UserReviews';
import { FaStar, FaUsers, FaComments, FaBolt } from 'react-icons/fa';
import * as THREE from 'three';
import CountUp from 'react-countup';

function Home() {
  const token = localStorage.getItem('token');
  const me = JSON.parse(localStorage.getItem('user'));
  const userId = me?.id; // Current logged in user id or replace with any user id to show reviews for that user

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ users: 0, matches: 0, messages: 0, rating: 4.5 });
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  // Load VANTA.NET
  useEffect(() => {
    let effect;
    const loadVanta = async () => {
      const NET = (await import('vanta/src/vanta.net')).default;
      if (!vantaEffect.current && vantaRef.current) {
        effect = NET({
          el: vantaRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          backgroundColor: 0x0f172a,
          color: 0x00ffcc,
          points: 12.0,
          maxDistance: 25.0,
          spacing: 18.0,
        });
        vantaEffect.current = effect;
      }
    };

    loadVanta();

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  // Load Reviews for Testimonials Carousel
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/rating/with-users');
        const data = await res.json();
        if (Array.isArray(data)) setReviews(data);
      } catch (err) {
        console.error('Fetch reviews failed:', err);
      }
    };
    fetchReviews();
  }, []);

  // Load Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div
      ref={vantaRef}
      className="min-h-screen text-white flex flex-col items-center px-3 pt-28 relative overflow-hidden"
    >
      {/* Hero */}
      <motion.h1
        className="text-5xl md:text-6xl font-extrabold drop-shadow-xl z-10"
        initial={{ opacity: 0, y: -40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        Welcome to SkillSwap
      </motion.h1>

      <motion.p
        className="mt-4 text-xl text-purple-100 z-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        Exchange your skills. Learn something new.
      </motion.p>

      {!token && (
        <motion.div
          className="mt-6 flex gap-4 z-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <Link
            to="/login"
            className="bg-white text-indigo-700 font-semibold px-5 py-2 rounded-xl hover:bg-gray-200 transition-all"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl transition-all"
          >
            Register
          </Link>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 w-full max-w-4xl text-center z-10">
        <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md">
          <FaUsers className="text-3xl mx-auto" />
          <p className="mt-2 font-semibold">
            <CountUp end={stats.users} duration={2} />+ Users
          </p>
        </div>
        <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md">
          <FaBolt className="text-3xl mx-auto" />
          <p className="mt-2 font-semibold">
            <CountUp end={stats.matches} duration={2} />+ Matches
          </p>
        </div>
        <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md">
          <FaComments className="text-3xl mx-auto" />
          <p className="mt-2 font-semibold">
            <CountUp end={stats.messages} duration={2} />+ Messages
          </p>
        </div>
        <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md">
          <FaStar className="text-3xl mx-auto text-yellow-400" />
          <p className="mt-2 font-semibold">
            <CountUp end={stats.rating} decimals={1} duration={2} /> ★ Avg Rating
          </p>
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div className="max-w-4xl mt-20 z-10">
        <h2 className="text-2xl font-bold text-center mb-6">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-4 text-center">
          {['Register', 'Match', 'Chat', 'Review'].map((step, idx) => (
            <motion.div
              key={step}
              className="bg-white/10 p-4 rounded-xl hover:scale-105 transition-all backdrop-blur-md"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.2 }}
              viewport={{ once: true }}
            >
              <div className="text-2xl font-bold">Step {idx + 1}</div>
              <div>{step}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Features */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 mt-20 w-full max-w-5xl z-10">
        {[
          {
            icon: '💬',
            title: 'Real-Time Chat',
            desc: 'Connect instantly with matched users and share your knowledge.',
          },
          {
            icon: '🔍',
            title: 'Skill-Based Matching',
            desc: 'Get matched based on what you can teach and what you want to learn.',
          },
          {
            icon: '✨',
            title: 'Clean User Interface',
            desc: 'Focus on learning and teaching with a distraction-free UI.',
          },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.2 }}
            viewport={{ once: true }}
          >
            <h2 className="text-xl font-semibold mb-2">
              {item.icon} {item.title}
            </h2>
            <p className="text-white/90">{item.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Testimonials */}
      <motion.div className="max-w-5xl mt-20 w-full z-10">
        <h2 className="text-2xl font-bold text-center mb-6">Testimonials</h2>
        <Carousel
          arrows
          autoPlay
          autoPlaySpeed={3000}
          infinite
          responsive={{
            desktop: { breakpoint: { max: 3000, min: 1024 }, items: 3 },
            tablet: { breakpoint: { max: 1024, min: 464 }, items: 1 },
            mobile: { breakpoint: { max: 464, min: 0 }, items: 1 },
          }}
        >
          {reviews.map((r, i) => (
            <div key={i} className="p-4 bg-white/10 m-2 rounded-xl backdrop-blur-md">
              <h4 className="font-semibold">
                {r.rater.name} ➝ {r.rated.name}
              </h4>
              <p className="italic">&quot;{r.review}&quot;</p>
            </div>
          ))}
        </Carousel>
      </motion.div>

      {/* User Reviews for current logged in user */}
      <motion.div
        className="min-h-screen w-full p-8 z-10"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-5xl mx-auto">
          {userId ? <UserReviews ratedId={userId} /> : <p className="text-white">Please log in to see your reviews.</p>}
        </div>
      </motion.div>
    </div>
  );
}

export default Home;
