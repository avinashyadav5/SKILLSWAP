import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Use environment variable or fallback
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${BACKEND_URL}/api/user/login`, form);
      const data = res.data;

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      // ✅ Redirect based on admin status
      if (data.user.isAdmin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert(err.response?.data?.error || "❌ Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mt-10 bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      <Navbar />

      <div className="flex flex-col items-center justify-center py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Login</h1>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 space-y-4"
        >
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md transition ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
