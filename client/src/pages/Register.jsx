import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', teach: '', learn: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Use environment variable
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const SUGGESTIONS = ['React', 'Python', 'Machine Learning', 'UI Design', 'Node.js', 'Data Science'];

  const appendSubject = (field, subject) => {
    setForm(prev => {
      const current = prev[field].trim();
      const separator = current && !current.endsWith(',') ? ', ' : '';
      return { ...prev, [field]: current + separator + subject };
    });
  };

  // ✅ Email validation function
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔹 Basic input checks
    if (!form.name.trim()) return alert('⚠️ Please enter your name.');
    if (!isValidEmail(form.email)) return alert('❌ Please enter a valid email address.');
    if (form.password.length < 6)
      return alert('🔒 Password must be at least 6 characters long.');

    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/user/register`, {
        ...form,
        teach: form.teach.split(',').map((s) => s.trim()).filter(Boolean),
        learn: form.learn.split(',').map((s) => s.trim()).filter(Boolean),
      });

      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('token', res.data.token);

      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      alert(err.response?.data?.error || '❌ Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] text-white flex flex-col justify-between relative overflow-hidden">
      <Navbar />

      {/* Decorative Glowing Blobs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex-grow flex flex-col items-center justify-center py-20 px-4 z-10">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-400">
              Create Account
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Join the community of reciprocal learning
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Email Address</label>
              <input
                type="email"
                placeholder="you@gmail.com"
                value={form.email}
                className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${form.email && !isValidEmail(form.email) ? "border-red-500/50 focus:ring-red-500" : "border-white/10"
                  }`}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              {form.email && !isValidEmail(form.email) && (
                <p className="text-red-400 text-xs mt-1">⚠️ Invalid email format</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Password</label>
              <input
                type="password"
                placeholder="Min. 6 characters"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Skills I Can Teach</label>
              <input
                type="text"
                placeholder="e.g. Python, Java, Graphic Design"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={form.teach}
                onChange={(e) => setForm({ ...form, teach: e.target.value })}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTIONS.map((s) => (
                  <span
                    key={s}
                    onClick={() => appendSubject("teach", s)}
                    className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded-lg cursor-pointer hover:bg-indigo-500/20 transition-all"
                  >
                    +{s}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Skills I Want To Learn</label>
              <input
                type="text"
                placeholder="e.g. React, UI Design, Guitar"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={form.learn}
                onChange={(e) => setForm({ ...form, learn: e.target.value })}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTIONS.map((s) => (
                  <span
                    key={s}
                    onClick={() => appendSubject("learn", s)}
                    className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-1 rounded-lg cursor-pointer hover:bg-purple-500/20 transition-all"
                  >
                    +{s}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold tracking-wide py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <span
                onClick={() => navigate("/login")}
                className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer transition-colors"
              >
                Log in
              </span>
            </p>
          </div>
        </div>
      </div>
      <div className="py-4 text-center text-xs text-gray-500 border-t border-white/5">
        &copy; {new Date().getFullYear()} SkillSwap. All rights reserved.
      </div>
    </div>
  );
}

export default Register;
