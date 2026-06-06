import { useEffect, useState } from 'react';
import Navbar from './../components/Navbar';

function Profile() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const token = localStorage.getItem('token');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    social: user?.social || '',
    password: '',
  });

  const [teachSubjects, setTeachSubjects] = useState([]);
  const [learnSubjects, setLearnSubjects] = useState([]);
  const [newTeachSubject, setNewTeachSubject] = useState('');
  const [newLearnSubject, setNewLearnSubject] = useState('');

  const [isAddingTeach, setIsAddingTeach] = useState(false);
  const [isAddingLearn, setIsAddingLearn] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const normalizeAvatarUrl = (avatar, name = "P") => {
    if (!avatar) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    }
    if (avatar.startsWith("http")) return avatar;
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
  }, [user?.id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file)); 
  };

  const handleUpload = async () => {
    if (!avatarFile) return;
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    const res = await fetch(`${BACKEND_URL}/api/user/avatar/${user.id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();

    if (data.avatar) {
      const updatedUser = { ...user, avatar: data.avatar };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setAvatarPreview(normalizeAvatarUrl(data.avatar, updatedUser.name));
      setAvatarFile(null);
    }
  };

  const handleRemoveAvatar = async () => {
    const res = await fetch(`${BACKEND_URL}/api/user/avatar/${user.id}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      const updatedUser = { ...user, avatar: '' };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setAvatarPreview(normalizeAvatarUrl('', updatedUser.name));
    }
  };

  const handleUpdateProfile = async () => {
    const res = await fetch(`${BACKEND_URL}/api/user/${user.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(form),
    });
    const updated = await res.json();
    if(res.ok) {
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
        setForm(prev => ({ ...prev, password: '' }));
        alert('✅ Profile saved successfully!');
    } else {
        alert('❌ Error: ' + updated.error);
    }
  };

  const handleAddTeach = async () => {
    const subjectName = newTeachSubject.trim();
    if (!subjectName || teachSubjects.includes(subjectName)) return;
    
    setIsAddingTeach(true);
    try {
        await fetch(`${BACKEND_URL}/api/user/${user.id}/teach`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subjectName }),
        });
        const updatedSubjects = await fetch(`${BACKEND_URL}/api/user/${user.id}/subjects`).then(res => res.json());
        setTeachSubjects(updatedSubjects.teachSubjects || []);
        setNewTeachSubject('');
    } catch (err) {
        console.error("Failed to add subject");
    } finally {
        setIsAddingTeach(false);
    }
  };

  const handleRemoveTeach = async (subjectName) => {
    await fetch(`${BACKEND_URL}/api/user/${user.id}/teach/${encodeURIComponent(subjectName)}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    setTeachSubjects(teachSubjects.filter(s => s !== subjectName));
  };

  const handleAddLearn = async () => {
    const subjectName = newLearnSubject.trim();
    if (!subjectName || learnSubjects.includes(subjectName)) return;

    setIsAddingLearn(true);
    try {
        await fetch(`${BACKEND_URL}/api/user/${user.id}/learn`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subjectName }),
        });
        const updatedSubjects = await fetch(`${BACKEND_URL}/api/user/${user.id}/subjects`).then(res => res.json());
        setLearnSubjects(updatedSubjects.learnSubjects || []);
        setNewLearnSubject('');
    } catch (err) {
        console.error("Failed to add subject");
    } finally {
        setIsAddingLearn(false);
    }
  };

  const handleRemoveLearn = async (subjectName) => {
    await fetch(`${BACKEND_URL}/api/user/${user.id}/learn/${encodeURIComponent(subjectName)}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    setLearnSubjects(learnSubjects.filter(s => s !== subjectName));
  };

  return (
    <div className="min-h-screen bg-[#111827] text-white pt-24 pb-12 px-4 flex justify-center">
      <Navbar />
      
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Basic Info */}
        <div className="col-span-1 bg-[#1f2937] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col h-fit">
          <h2 className="text-2xl font-bold text-center mb-6">Profile Details</h2>
          
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-36 h-36 rounded-full object-cover border-4 border-indigo-500 shadow-lg group-hover:opacity-70 transition duration-300"
              />
              <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition duration-300 bg-black/50 rounded-full">
                <span className="text-sm font-semibold">Change Avatar</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
            
            <div className="flex gap-2 mt-4">
              {avatarFile && (
                <button onClick={handleUpload} className="bg-green-600 hover:bg-green-700 px-4 py-1.5 rounded-lg text-sm transition">
                  Upload
                </button>
              )}
              {user?.avatar && !avatarFile && (
                <button onClick={handleRemoveAvatar} className="bg-red-600/80 hover:bg-red-700 px-4 py-1.5 rounded-lg text-sm transition">
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#111827] border border-white/10 rounded-lg p-2.5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[#111827] border border-white/10 rounded-lg p-2.5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full bg-[#111827] border border-white/10 rounded-lg p-2.5 text-white h-24 resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Change Password</label>
              <input
                type="password"
                placeholder="Leave blank to keep current"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-[#111827] border border-white/10 rounded-lg p-2.5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Social Link</label>
              <input
                type="text"
                value={form.social}
                onChange={(e) => setForm({ ...form, social: e.target.value })}
                className="w-full bg-[#111827] border border-white/10 rounded-lg p-2.5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
              />
            </div>
            <button 
              onClick={handleUpdateProfile} 
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-500/30"
            >
              Save Profile
            </button>
          </div>
        </div>

        {/* Right Column: Subjects */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
          
          {/* Teach Subjects Card */}
          <div className="bg-[#1f2937] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 text-xl">🎓</div>
              <div>
                <h2 className="text-xl font-bold text-white">Teaching Arsenal</h2>
                <p className="text-gray-400 text-sm">Skills you are offering to teach others.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6 min-h-[50px] p-4 bg-[#111827] rounded-xl border border-white/5">
              {teachSubjects.length === 0 ? (
                <span className="text-gray-500 italic flex items-center">No teaching skills added yet.</span>
              ) : (
                teachSubjects.map((subject) => (
                  <span key={subject} className="bg-blue-600/20 border border-blue-500/30 text-blue-300 px-4 py-1.5 rounded-full flex items-center gap-2 group transition hover:bg-blue-600/30">
                    {subject}
                    <button onClick={() => handleRemoveTeach(subject)} className="text-blue-300 hover:text-white transition opacity-0 group-hover:opacity-100">✕</button>
                  </span>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. React, Python, UI Design"
                value={newTeachSubject}
                onChange={(e) => setNewTeachSubject(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTeach()}
                className="flex-1 bg-[#111827] border border-white/10 rounded-lg p-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                disabled={isAddingTeach}
              />
              <button 
                onClick={handleAddTeach} 
                disabled={isAddingTeach}
                className="bg-blue-600 hover:bg-blue-700 px-6 font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
              >
                {isAddingTeach ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Add'}
              </button>
            </div>
          </div>

          {/* Learn Subjects Card */}
          <div className="bg-[#1f2937] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-pink-500/20 rounded-xl text-pink-400 text-xl">💡</div>
              <div>
                <h2 className="text-xl font-bold text-white">Learning Goals</h2>
                <p className="text-gray-400 text-sm">Skills you want to acquire from others.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6 min-h-[50px] p-4 bg-[#111827] rounded-xl border border-white/5">
              {learnSubjects.length === 0 ? (
                <span className="text-gray-500 italic flex items-center">No learning goals added yet.</span>
              ) : (
                learnSubjects.map((subject) => (
                  <span key={subject} className="bg-pink-600/20 border border-pink-500/30 text-pink-300 px-4 py-1.5 rounded-full flex items-center gap-2 group transition hover:bg-pink-600/30">
                    {subject}
                    <button onClick={() => handleRemoveLearn(subject)} className="text-pink-300 hover:text-white transition opacity-0 group-hover:opacity-100">✕</button>
                  </span>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Machine Learning, DevOps"
                value={newLearnSubject}
                onChange={(e) => setNewLearnSubject(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLearn()}
                className="flex-1 bg-[#111827] border border-white/10 rounded-lg p-2.5 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition"
                disabled={isAddingLearn}
              />
              <button 
                onClick={handleAddLearn} 
                disabled={isAddingLearn}
                className="bg-pink-600 hover:bg-pink-700 px-6 font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
              >
                {isAddingLearn ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Add'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Profile;
