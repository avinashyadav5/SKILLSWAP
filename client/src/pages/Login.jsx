import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/user/login', form);
      const data = res.data;

      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);

      // ✅ Redirect based on admin status
      if (data.user.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen mt-10 bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      <Navbar />
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Login</h1>
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
