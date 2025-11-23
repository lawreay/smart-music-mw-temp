
import React, { useState, useEffect } from 'react';
import { User, Message } from '../types';
import { backend } from '../services/backend';

interface UserProfileProps {
  user: User;
  onUpdateUser: (u: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    username: user.username,
    bio: user.bio || '',
    avatar: user.avatar || ''
  });
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Load messages
    const msgs = backend.getMessages(user.id);
    setMessages(msgs);
  }, [user.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const updated = await backend.updateProfile(user.id, formData);
        onUpdateUser(updated);
        alert("Profile updated successfully!");
    } catch (err) {
        alert("Failed to update profile.");
    }
  };

  return (
    <div className="p-6 md:p-10 text-white pb-32 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
            {/* Settings */}
            <div className="bg-[#1e293b] p-6 rounded-2xl shadow-xl h-fit">
                <div className="flex items-center gap-4 mb-6">
                    <img src={formData.avatar || user.avatar} className="w-20 h-20 rounded-full border-4 border-blue-500 object-cover" alt="Profile" />
                    <div>
                        <h2 className="text-xl font-bold">{user.username}</h2>
                        <p className="text-sm text-gray-400">{user.email}</p>
                        <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded mt-1 inline-block uppercase tracking-wider">{user.role}</span>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Display Name</label>
                        <input className="w-full bg-[#0f1522] border border-gray-700 rounded p-3 text-white" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Bio</label>
                        <textarea className="w-full bg-[#0f1522] border border-gray-700 rounded p-3 text-white h-20" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Avatar URL</label>
                        <input className="w-full bg-[#0f1522] border border-gray-700 rounded p-3 text-white" value={formData.avatar} onChange={e => setFormData({...formData, avatar: e.target.value})} placeholder="https://..." />
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold shadow-lg">Save Changes</button>
                </form>
            </div>

            {/* Inbox */}
            <div className="bg-[#1e293b] p-6 rounded-2xl shadow-xl h-fit">
                <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2"><i className="fas fa-inbox mr-2"></i> Messages from Admin</h3>
                
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {messages.length === 0 ? (
                        <p className="text-gray-500 italic text-center py-4">No messages.</p>
                    ) : (
                        messages.map(m => (
                            <div key={m.id} className="bg-[#0f1522] p-4 rounded-lg border-l-4 border-blue-500">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-blue-400">Administrator</span>
                                    <span className="text-[10px] text-gray-500">{new Date(m.timestamp).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-300">{m.content}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default UserProfile;
