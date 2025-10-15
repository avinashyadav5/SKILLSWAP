import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', teach: '', learn: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/user/register', {
        ...form,
        teach: form.teach.split(',').map(s => s.trim()),
        learn: form.learn.split(',').map(s => s.trim()),
      });

      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('token', res.data.token);

      navigate('/dashboard');
    } catch (err) {
      alert('❌ Registration failed');
    }
  };

  return (
    <div className="min-h-screen mt-10 bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      <Navbar />
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">Create Your Account</h1>
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 space-y-4">
          <input type="text" placeholder="Name" className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input type="email" placeholder="Email" className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input type="password" placeholder="Password" className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <input type="text" placeholder="Teach (comma-separated, e.g. Java, HTML)" className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            onChange={(e) => setForm({ ...form, teach: e.target.value })} required />
          <input type="text" placeholder="Learn (comma-separated, e.g. React, Python)" className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            onChange={(e) => setForm({ ...form, learn: e.target.value })} required />
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition">
            Register
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
