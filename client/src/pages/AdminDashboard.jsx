import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(4);
  const [sortKey, setSortKey] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }

    axios
      .get('https://skillswap-1-1iic.onrender.com/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUsers(res.data);
        setFiltered(res.data);
      })
      .catch((err) => {
        console.error('❌ Failed to fetch users:', err);
        alert('Unauthorized or session expired');
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = [...users];

    if (search) {
      result = result.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (role !== 'all') {
      result = result.filter((u) => (role === 'admin' ? u.isAdmin : !u.isAdmin));
    }

    result.sort((a, b) => {
      const aVal = a[sortKey]?.toLowerCase?.() || '';
      const bVal = b[sortKey]?.toLowerCase?.() || '';
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    setFiltered(result);
  }, [search, role, users, sortKey, sortOrder]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`https://skillswap-1-1iic.onrender.com/api/user/${id}`);
        setUsers(users.filter((u) => u.id !== id));
      } catch (err) {
        alert('Error deleting user');
      }
    }
  };

  const toggleAdmin = async (id) => {
    try {
      await axios.put(
        `https://skillswap-1-1iic.onrender.com/api/admin/toggle/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(
        users.map((u) => (u.id === id ? { ...u, isAdmin: !u.isAdmin } : u))
      );
    } catch (err) {
      alert('Error toggling admin');
    }
  };

  const totalPages = Math.ceil(filtered.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filtered.slice(indexOfFirstUser, indexOfLastUser);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto pt-24 px-4">
        <h1 className="text-3xl font-bold mb-6">👑 Admin Dashboard</h1>

        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-md w-full md:w-1/3 text-black"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-4 py-2 rounded-md text-black w-full md:w-1/4"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="user">Users</option>
          </select>
          <button
            onClick={() => handleSort('name')}
            className="bg-white text-black px-3 py-2 rounded shadow"
          >
            Sort by Name {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentUsers.map((u) => (
              <div
                key={u.id}
                className="bg-white/10 border border-white/20 rounded-lg p-6 flex items-center space-x-6"
              >
                <img
                  src={
                    u.avatar
                      ? `https://skillswap-1-1iic.onrender.com/uploads/${u.avatar}`
                      : 'https://via.placeholder.com/80'
                  }
                  alt={u.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white"
                />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{u.name}</h2>
                  <p>📧 {u.email}</p>
                  <p>✨ Teaches: <span className="text-yellow-300">{u.teach || 'N/A'}</span></p>
                  <p>🎯 Wants to learn: <span className="text-pink-400">{u.learn || 'N/A'}</span></p>
                  <p>🔐 Role: {u.isAdmin ? 'Admin' : 'User'}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => toggleAdmin(u.id)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded"
                    >
                      {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center gap-2">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1 ? 'bg-blue-500' : 'bg-white text-black'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
