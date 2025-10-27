// client/src/components/Profile.js
import { useEffect, useState } from 'react';

function Profile() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    social: user?.social || '',
  });

  const [teachSubjects, setTeachSubjects] = useState([]);
  const [learnSubjects, setLearnSubjects] = useState([]);
  const [newTeachSubject, setNewTeachSubject] = useState('');
  const [newLearnSubject, setNewLearnSubject] = useState('');

  // ✅ Backend URL from .env
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ✅ Normalize avatar URL
  const normalizeAvatarUrl = (avatar, name = "P") => {
    if (!avatar) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    }
    if (avatar.startsWith("http")) {
      return avatar;
    }
    if (avatar.startsWith("/uploads") || avatar.includes("uploads/")) {
      return `${BACKEND_URL}/${avatar.replace(/^\//, '')}`;
    }
    return `${BACKEND_URL}/uploads/${avatar}`;
  };

  useEffect(() => {
    if (user) {
      setAvatarPreview(normalizeAvatarUrl(user.avatar, user.name));

      fetch(`${BACKEND_URL}/api/user/${user.id}/subjects`)
        .then(res => res.json())
        .then(data => {
          setTeachSubjects(data.teachSubjects || []);
          setLearnSubjects(data.learnSubjects || []);
        });
    }
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file)); // instant local preview
  };

  const handleUpload = async () => {
    if (!avatarFile) return alert("Please select a file first.");
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    const res = await fetch(`${BACKEND_URL}/api/user/avatar/${user.id}`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();

    if (data.avatar) {
      const updatedUser = { ...user, avatar: data.avatar };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setAvatarPreview(normalizeAvatarUrl(data.avatar));
      alert('✅ Avatar uploaded!');
    } else {
      alert('❌ Avatar upload failed');
    }
  };

  const handleRemoveAvatar = async () => {
    const res = await fetch(`${BACKEND_URL}/api/user/avatar/${user.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const updatedUser = { ...user, avatar: '' };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setAvatarPreview(normalizeAvatarUrl('', updatedUser.name));
      alert('🗑️ Avatar removed!');
    } else {
      alert('❌ Failed to remove avatar');
    }
  };

  const handleUpdateProfile = async () => {
    const res = await fetch(`${BACKEND_URL}/api/user/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const updated = await res.json();
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    alert('✅ Profile updated!');
  };

  // ---- SUBJECT CRUD ----
  const handleAddTeach = async () => {
    const subjectName = newTeachSubject.trim();
    if (!subjectName) return alert('Please enter a subject name.');
    await fetch(`${BACKEND_URL}/api/user/${user.id}/teach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectName }),
    });
    const updatedSubjects = await fetch(`${BACKEND_URL}/api/user/${user.id}/subjects`).then(res => res.json());
    setTeachSubjects(updatedSubjects.teachSubjects || []);
    setNewTeachSubject('');
  };

  const handleRemoveTeach = async (subjectName) => {
    await fetch(`${BACKEND_URL}/api/user/${user.id}/teach/${encodeURIComponent(subjectName)}`, {
      method: 'DELETE'
    });
    setTeachSubjects(teachSubjects.filter(s => s !== subjectName));
  };

  const handleAddLearn = async () => {
    const subjectName = newLearnSubject.trim();
    if (!subjectName) return alert('Please enter a subject name.');
    await fetch(`${BACKEND_URL}/api/user/${user.id}/learn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectName }),
    });
    const updatedSubjects = await fetch(`${BACKEND_URL}/api/user/${user.id}/subjects`).then(res => res.json());
    setLearnSubjects(updatedSubjects.learnSubjects || []);
    setNewLearnSubject('');
  };

  const handleRemoveLearn = async (subjectName) => {
    await fetch(`${BACKEND_URL}/api/user/${user.id}/learn/${encodeURIComponent(subjectName)}`, {
      method: 'DELETE'
    });
    setLearnSubjects(learnSubjects.filter(s => s !== subjectName));
  };

  // ---- DEBUG ----
  console.log("🧩 Avatar preview value:", avatarPreview);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b2845] to-[#000f89] text-white p-6 pt-24 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

      {/* ---- Avatar Preview Section ---- */}
      <div className="mt-2 flex flex-col items-center">
        {avatarPreview ? (
          <img
            src={avatarPreview}
            alt="User Avatar"
            className="w-32 h-32 rounded-full object-cover border-4 border-white"
          />
        ) : (
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}`}
            alt="Default Avatar"
            className="w-32 h-32 rounded-full object-cover border-4 border-white"
          />
        )}

        {user?.avatar && (
          <button
            onClick={handleRemoveAvatar}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded"
          >
            Remove Avatar
          </button>
        )}
      </div>

      <input type="file" accept="image/*" onChange={handleFileChange} className="mt-4" />
      <button onClick={handleUpload} className="mt-2 bg-green-600 hover:bg-green-700 px-4 py-1 rounded">
        Upload Avatar
      </button>

      {/* ---- Profile Form ---- */}
      <div className="mt-6 w-full max-w-md space-y-4">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full p-2 rounded text-black"
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full p-2 rounded text-black"
        />
        <textarea
          placeholder="Bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          className="w-full p-2 rounded text-black"
        />
        <input
          type="text"
          placeholder="Social Link"
          value={form.social}
          onChange={(e) => setForm({ ...form, social: e.target.value })}
          className="w-full p-2 rounded text-black"
        />
      </div>

      {/* ---- Teach Subjects ---- */}
      <div className="mt-6 w-full max-w-md">
        <h2 className="font-semibold mb-2">Subjects you can teach:</h2>
        <div className="flex flex-wrap gap-2 mb-2">
          {teachSubjects.length === 0 ? (
            <span className="text-gray-300">You have not added any teaching subjects yet.</span>
          ) : (
            teachSubjects.map((subject) => (
              <span key={subject} className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2">
                {subject}
                <button
                  onClick={() => handleRemoveTeach(subject)}
                  className="ml-2 text-red-600 font-bold focus:outline-none"
                  title="Remove"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <input
          type="text"
          placeholder="Add teaching subject"
          value={newTeachSubject}
          onChange={(e) => setNewTeachSubject(e.target.value)}
          className="w-full p-2 rounded text-black mb-2"
        />
        <button onClick={handleAddTeach} className="bg-green-500 px-4 py-1 rounded text-white mb-6">
          Add Subject
        </button>
      </div>

      {/* ---- Learn Subjects ---- */}
      <div className="mt-6 w-full max-w-md">
        <h2 className="font-semibold mb-2">Subjects you want to learn:</h2>
        <div className="flex flex-wrap gap-2 mb-2">
          {learnSubjects.length === 0 ? (
            <span className="text-gray-300">You have not added any learning subjects yet.</span>
          ) : (
            learnSubjects.map((subject) => (
              <span key={subject} className="bg-pink-200 text-pink-800 px-3 py-1 rounded-full flex items-center gap-2">
                {subject}
                <button
                  onClick={() => handleRemoveLearn(subject)}
                  className="ml-2 text-red-600 font-bold focus:outline-none"
                  title="Remove"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <input
          type="text"
          placeholder="Add learning subject"
          value={newLearnSubject}
          onChange={(e) => setNewLearnSubject(e.target.value)}
          className="w-full p-2 rounded text-black mb-2"
        />
        <button onClick={handleAddLearn} className="bg-green-500 px-4 py-1 rounded text-white">
          Add Subject
        </button>
      </div>

      <button onClick={handleUpdateProfile} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
        Save Changes
      </button>
    </div>
  );
}

export default Profile;
