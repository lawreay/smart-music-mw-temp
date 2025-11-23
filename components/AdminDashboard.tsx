
import React, { useState, useEffect } from 'react';
import { User, Song } from '../types';
import { backend } from '../services/backend';

interface AdminDashboardProps {
  currentUser: User;
  songs: Song[];
  onSongUpdate: () => void; // Trigger app refresh
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, songs, onSongUpdate }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'music'>('users');
  const [users, setUsers] = useState<User[]>([]);
  
  // Edit States
  const [editingSong, setEditingSong] = useState<Partial<Song> | null>(null);
  const [msgInput, setMsgInput] = useState<{ userId: string, text: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(backend.getAllUsers());
  };

  const handleBlockUser = async (uid: string) => {
    if (uid === currentUser.id) return alert("You cannot block yourself.");
    await backend.toggleUserBlock(uid);
    loadUsers();
  };

  const handleRoleChange = async (uid: string, newRole: string) => {
    if (uid === currentUser.id) return alert("You cannot demote yourself here.");
    await backend.updateUserRole(uid, newRole as any);
    loadUsers();
  };

  const handleChangePassword = async (uid: string) => {
    const newPass = prompt("Enter new password for this user:");
    if (newPass) {
      await backend.adminResetPassword(uid, newPass);
      alert("Password updated.");
    }
  };

  const handleSendMessage = async () => {
    if (msgInput) {
      await backend.sendMessage('admin', msgInput.userId, msgInput.text);
      setMsgInput(null);
      alert("Message sent!");
    }
  };

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSong && editingSong.title) {
        // Validation defaults
        const songToSave: Song = {
            id: editingSong.id || -1, // -1 signals new
            title: editingSong.title,
            artist: editingSong.artist || 'Unknown',
            file: editingSong.file || '',
            art: editingSong.art || 'https://picsum.photos/400/400'
        };
        await backend.saveSong(songToSave, currentUser.id);
        setEditingSong(null);
        onSongUpdate();
    }
  };

  const handleDeleteSong = async (id: number) => {
    if (confirm("Are you sure you want to delete this song?")) {
        await backend.deleteSong(id);
        onSongUpdate();
    }
  };

  return (
    <div className="p-6 md:p-10 text-white min-h-full pb-32">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <i className="fas fa-shield-alt text-red-500"></i> Admin Dashboard
      </h1>

      <div className="flex gap-4 mb-8 border-b border-gray-700 pb-1">
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'users' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-400 hover:text-white'}`}
        >
          Manage Users
        </button>
        <button 
           onClick={() => setActiveTab('music')}
           className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'music' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-400 hover:text-white'}`}
        >
          Manage Music
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="overflow-x-auto bg-[#1e293b] rounded-xl shadow-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0f1522] text-gray-400 uppercase font-bold">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-white/5">
                  <td className="p-4 flex items-center gap-3">
                    <img src={u.avatar} className="w-8 h-8 rounded-full" alt="av" />
                    <div>
                        <div className="font-bold">{u.username}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    {u.id === currentUser.id ? (
                        <span className="text-red-400 font-bold uppercase text-xs">Admin (You)</span>
                    ) : (
                        <select 
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="bg-[#0f1522] border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="user">User</option>
                            <option value="premium">Premium</option>
                            <option value="admin">Admin</option>
                        </select>
                    )}
                  </td>
                  <td className="p-4">
                    {u.isBlocked ? (
                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">Blocked</span>
                    ) : (
                        <span className="bg-green-900 text-green-200 text-xs px-2 py-1 rounded">Active</span>
                    )}
                  </td>
                  <td className="p-4 flex gap-2">
                    {u.id !== currentUser.id && (
                        <>
                            <button 
                                onClick={() => handleBlockUser(u.id)}
                                className={`p-2 rounded hover:bg-white/10 ${u.isBlocked ? 'text-green-400' : 'text-red-400'}`} 
                                title={u.isBlocked ? "Unblock" : "Block"}
                            >
                                <i className={`fas ${u.isBlocked ? 'fa-unlock' : 'fa-ban'}`}></i>
                            </button>
                            <button 
                                onClick={() => handleChangePassword(u.id)}
                                className="p-2 text-yellow-400 rounded hover:bg-white/10" 
                                title="Reset Password"
                            >
                                <i className="fas fa-key"></i>
                            </button>
                            <button 
                                onClick={() => setMsgInput({ userId: u.id, text: '' })}
                                className="p-2 text-blue-400 rounded hover:bg-white/10" 
                                title="Message User"
                            >
                                <i className="fas fa-envelope"></i>
                            </button>
                        </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'music' && (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Library Songs ({songs.length})</h3>
                <button 
                    onClick={() => setEditingSong({})} 
                    className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-bold shadow-lg"
                >
                    <i className="fas fa-plus mr-2"></i> Add Song
                </button>
            </div>
            
            <div className="grid gap-4">
                {songs.map(song => (
                    <div key={song.id} className="bg-[#1e293b] p-3 rounded-lg flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <img src={song.art} className="w-12 h-12 rounded object-cover" alt="" />
                            <div>
                                <div className="font-bold">{song.title}</div>
                                <div className="text-xs text-gray-400">{song.artist}</div>
                                {song.uploadedBy && song.uploadedBy !== currentUser.id && (
                                    <div className="text-[10px] text-blue-400">Uploaded by user</div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingSong(song)} className="p-2 text-blue-400 hover:bg-white/10 rounded"><i className="fas fa-edit"></i></button>
                            <button onClick={() => handleDeleteSong(song.id)} className="p-2 text-red-400 hover:bg-white/10 rounded"><i className="fas fa-trash"></i></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Message Modal */}
      {msgInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#1e293b] p-6 rounded-xl w-full max-w-md border border-gray-600">
                <h3 className="text-lg font-bold mb-4">Send Message</h3>
                <textarea 
                    className="w-full bg-[#0f1522] border border-gray-700 rounded p-3 text-white mb-4 h-32"
                    value={msgInput.text}
                    onChange={(e) => setMsgInput({...msgInput, text: e.target.value})}
                    placeholder="Type your message..."
                ></textarea>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setMsgInput(null)} className="text-gray-400">Cancel</button>
                    <button onClick={handleSendMessage} className="bg-blue-600 px-4 py-2 rounded text-white">Send</button>
                </div>
            </div>
        </div>
      )}

      {/* Song Edit Modal */}
      {editingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#1e293b] p-6 rounded-xl w-full max-w-lg border border-gray-600 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">{editingSong.id ? 'Edit Song' : 'Add New Song'}</h3>
                <form onSubmit={handleSaveSong} className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Title</label>
                        <input className="w-full bg-[#0f1522] border border-gray-700 rounded p-2 text-white" value={editingSong.title || ''} onChange={e => setEditingSong({...editingSong, title: e.target.value})} required />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Artist</label>
                        <input className="w-full bg-[#0f1522] border border-gray-700 rounded p-2 text-white" value={editingSong.artist || ''} onChange={e => setEditingSong({...editingSong, artist: e.target.value})} required />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Audio URL (mp3/m4a)</label>
                        <input className="w-full bg-[#0f1522] border border-gray-700 rounded p-2 text-white" value={editingSong.file || ''} onChange={e => setEditingSong({...editingSong, file: e.target.value})} placeholder="https://..." />
                        <p className="text-[10px] text-gray-500 mt-1">Paste a direct link to an audio file.</p>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Artwork URL</label>
                        <input className="w-full bg-[#0f1522] border border-gray-700 rounded p-2 text-white" value={editingSong.art || ''} onChange={e => setEditingSong({...editingSong, art: e.target.value})} placeholder="https://..." />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setEditingSong(null)} className="text-gray-400">Cancel</button>
                        <button type="submit" className="bg-green-600 px-6 py-2 rounded text-white font-bold">Save</button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
