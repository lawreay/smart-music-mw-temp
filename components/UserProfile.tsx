
import React, { useState, useEffect } from 'react';
import { User, Message, Song } from '../types';
import { backend } from '../services/backend';

interface UserProfileProps {
  user: User;
  onUpdateUser: (u: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'inbox' | 'studio'>('settings');
  
  // Settings State
  const [formData, setFormData] = useState({
    username: user.username,
    bio: user.bio || '',
    avatar: user.avatar || ''
  });

  // Messaging State
  const [conversations, setConversations] = useState<User[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Studio State (Premium)
  const [mySongs, setMySongs] = useState<Song[]>([]);
  const [editingSong, setEditingSong] = useState<Partial<Song> | null>(null);

  useEffect(() => {
    if (activeTab === 'inbox') loadInbox();
    if (activeTab === 'studio') loadMySongs();
  }, [activeTab]);

  useEffect(() => {
    if (activeChatUser) {
        const history = backend.getChatHistory(user.id, activeChatUser.id);
        setChatHistory(history);
    }
  }, [activeChatUser]);

  const loadInbox = () => {
    setConversations(backend.getUserConversations(user.id));
    setAllUsers(backend.getAllUsers().filter(u => u.id !== user.id));
  };

  const loadMySongs = () => {
    setMySongs(backend.getSongsUploadedByUser(user.id));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const updated = await backend.updateProfile(user.id, formData);
        onUpdateUser(updated);
        alert("Profile updated successfully!");
    } catch (err) {
        alert("Failed to update profile.");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatUser || !newMessage.trim()) return;
    
    await backend.sendMessage(user.id, activeChatUser.id, newMessage);
    setNewMessage('');
    // Refresh history
    setChatHistory(backend.getChatHistory(user.id, activeChatUser.id));
    // Refresh list if new convo
    if (!conversations.find(c => c.id === activeChatUser.id)) {
        setConversations(prev => [activeChatUser, ...prev]);
    }
  };

  const startChat = (targetUser: User) => {
    setActiveChatUser(targetUser);
    setShowUserSelect(false);
  };

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSong && editingSong.title) {
        const songToSave: Song = {
            id: editingSong.id || -1,
            title: editingSong.title,
            artist: editingSong.artist || user.username,
            file: editingSong.file || '',
            art: editingSong.art || 'https://picsum.photos/400/400'
        };
        await backend.saveSong(songToSave, user.id);
        setEditingSong(null);
        loadMySongs();
        alert("Song uploaded to library!");
    }
  };

  const handleDeleteSong = async (id: number) => {
    if (confirm("Delete this song?")) {
        await backend.deleteSong(id);
        loadMySongs();
    }
  };

  return (
    <div className="p-6 md:p-10 text-white pb-32 max-w-5xl mx-auto min-h-full">
        <div className="flex items-center gap-4 mb-8">
            <img src={user.avatar} className="w-16 h-16 rounded-full border-2 border-blue-500" alt="Av" />
            <div>
                <h1 className="text-3xl font-bold">{user.username}</h1>
                <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded uppercase tracking-wider font-bold ${user.role === 'admin' ? 'bg-red-900 text-red-200' : user.role === 'premium' ? 'bg-purple-900 text-purple-200' : 'bg-gray-700 text-gray-300'}`}>
                        {user.role} Member
                    </span>
                </div>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
            <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                Settings
            </button>
            <button onClick={() => setActiveTab('inbox')} className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'inbox' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                Messages
            </button>
            {(user.role === 'premium' || user.role === 'admin') && (
                <button onClick={() => setActiveTab('studio')} className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'studio' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}>
                    Creator Studio
                </button>
            )}
        </div>

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
            <div className="bg-[#1e293b] p-6 rounded-2xl shadow-xl max-w-2xl animate-fade-in">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
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
                    <button className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-bold shadow-lg transition-transform active:scale-95">Save Changes</button>
                </form>
            </div>
        )}

        {/* --- INBOX TAB --- */}
        {activeTab === 'inbox' && (
            <div className="bg-[#1e293b] rounded-2xl shadow-xl h-[600px] flex overflow-hidden animate-fade-in">
                {/* Contact List */}
                <div className="w-1/3 border-r border-gray-700 flex flex-col">
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold">Chats</h3>
                        <button onClick={() => setShowUserSelect(true)} className="text-blue-400 hover:text-blue-300"><i className="fas fa-edit"></i></button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {conversations.map(c => (
                            <div 
                                key={c.id} 
                                onClick={() => setActiveChatUser(c)}
                                className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors ${activeChatUser?.id === c.id ? 'bg-blue-900/20 border-l-4 border-blue-500' : ''}`}
                            >
                                <img src={c.avatar} className="w-10 h-10 rounded-full" alt="" />
                                <div className="overflow-hidden">
                                    <p className="font-bold text-sm truncate">{c.username}</p>
                                    <p className="text-xs text-gray-500 truncate">{c.email}</p>
                                </div>
                            </div>
                        ))}
                        {conversations.length === 0 && <p className="p-4 text-gray-500 text-sm text-center">No active chats.</p>}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-[#0f1522]">
                    {activeChatUser ? (
                        <>
                            <div className="p-4 border-b border-gray-700 bg-[#1e293b]">
                                <h3 className="font-bold">{activeChatUser.username}</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col-reverse">
                                {/* Flex reverse to stick to bottom, need to reverse array too */}
                                {[...chatHistory].reverse().map(msg => {
                                    const isMe = msg.fromId === user.id;
                                    return (
                                        <div key={msg.id} className={`max-w-[80%] p-3 rounded-lg text-sm ${isMe ? 'bg-blue-600 self-end text-white' : 'bg-gray-700 self-start text-gray-200'}`}>
                                            {msg.content}
                                        </div>
                                    )
                                })}
                            </div>
                            <form onSubmit={handleSendMessage} className="p-4 bg-[#1e293b] border-t border-gray-700 flex gap-2">
                                <input 
                                    className="flex-1 bg-[#0f1522] border border-gray-600 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500" 
                                    placeholder="Type a message..." 
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                />
                                <button className="bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-500"><i className="fas fa-paper-plane"></i></button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <i className="fas fa-comments text-4xl mb-3"></i>
                            <p>Select a conversation</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- STUDIO TAB --- */}
        {activeTab === 'studio' && (
            <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">My Uploads</h2>
                    <button onClick={() => setEditingSong({})} className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg font-bold shadow-lg">
                        <i className="fas fa-cloud-upload-alt mr-2"></i> Upload New
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mySongs.map(song => (
                        <div key={song.id} className="bg-[#1e293b] p-4 rounded-xl flex items-center gap-4 group">
                            <img src={song.art} className="w-16 h-16 rounded-lg object-cover" alt="" />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold truncate">{song.title}</h3>
                                <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                            </div>
                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingSong(song)} className="text-blue-400 hover:text-white"><i className="fas fa-edit"></i></button>
                                <button onClick={() => handleDeleteSong(song.id)} className="text-red-400 hover:text-white"><i className="fas fa-trash"></i></button>
                            </div>
                        </div>
                    ))}
                    {mySongs.length === 0 && <p className="col-span-full text-center text-gray-500 py-10">You haven't uploaded any music yet.</p>}
                </div>
            </div>
        )}

        {/* --- MODALS --- */}
        {showUserSelect && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="bg-[#1e293b] w-full max-w-sm rounded-xl border border-gray-600 shadow-2xl overflow-hidden">
                    <div className="p-4 border-b border-gray-700 flex justify-between">
                        <h3 className="font-bold">New Message</h3>
                        <button onClick={() => setShowUserSelect(false)}><i className="fas fa-times"></i></button>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2">
                        {allUsers.map(u => (
                            <div key={u.id} onClick={() => startChat(u)} className="p-3 hover:bg-white/5 rounded cursor-pointer flex items-center gap-3">
                                <img src={u.avatar} className="w-8 h-8 rounded-full" alt="" />
                                <span className="text-sm font-medium">{u.username}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {editingSong && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="bg-[#1e293b] p-6 rounded-xl w-full max-w-lg border border-gray-600 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-bold mb-4">{editingSong.id ? 'Edit Song' : 'Upload Song'}</h3>
                    <form onSubmit={handleSaveSong} className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Title</label>
                            <input className="w-full bg-[#0f1522] border border-gray-700 rounded p-2 text-white" value={editingSong.title || ''} onChange={e => setEditingSong({...editingSong, title: e.target.value})} required />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Artist Name (Optional)</label>
                            <input className="w-full bg-[#0f1522] border border-gray-700 rounded p-2 text-white" value={editingSong.artist || ''} onChange={e => setEditingSong({...editingSong, artist: e.target.value})} placeholder={user.username} />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Audio URL (Direct Link)</label>
                            <input className="w-full bg-[#0f1522] border border-gray-700 rounded p-2 text-white" value={editingSong.file || ''} onChange={e => setEditingSong({...editingSong, file: e.target.value})} placeholder="https://example.com/song.mp3" required />
                            <p className="text-[10px] text-gray-500 mt-1">Supported: mp3, m4a, wav. Must be a direct public link (Dropbox, GitHub, etc).</p>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Cover Art URL</label>
                            <input className="w-full bg-[#0f1522] border border-gray-700 rounded p-2 text-white" value={editingSong.art || ''} onChange={e => setEditingSong({...editingSong, art: e.target.value})} placeholder="https://..." />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setEditingSong(null)} className="text-gray-400">Cancel</button>
                            <button type="submit" className="bg-purple-600 px-6 py-2 rounded text-white font-bold">Upload</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default UserProfile;
