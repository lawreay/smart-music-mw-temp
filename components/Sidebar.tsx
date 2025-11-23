import React from 'react';
import { User, Playlist, ViewState } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  user: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  playlists: Playlist[];
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onCreatePlaylist: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  toggleSidebar, 
  user, 
  onLoginClick, 
  onLogoutClick,
  playlists,
  currentView,
  onChangeView,
  onCreatePlaylist
}) => {
  
  const isLibraryActive = currentView.type === 'library';
  const isLikedActive = currentView.type === 'liked';

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#0f1522] border-r border-[#1e293b] 
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex flex-col p-5
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i className="fas fa-music text-white text-lg"></i>
        </div>
        <h2 className="text-lg font-bold tracking-wide text-white">SMART MUSIC</h2>
        <button onClick={toggleSidebar} className="md:hidden ml-auto text-gray-400">
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* User Section */}
      <div className="mb-6 pb-6 border-b border-gray-800">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                {user.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                <p className="text-[10px] text-green-400">Premium Plan</p>
              </div>
            </div>
            <button onClick={onLogoutClick} className="text-gray-500 hover:text-white transition-colors" title="Logout">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        ) : (
          <button 
            onClick={onLoginClick}
            className="w-full py-2 bg-[#1e293b] hover:bg-[#2d3b55] text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <i className="fas fa-user-circle"></i> Sign In / Sign Up
          </button>
        )}
      </div>

      <nav className="space-y-2">
        <div 
          onClick={() => onChangeView({ type: 'library' })}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${isLibraryActive ? 'bg-[#1e293b] text-white border-l-4 border-blue-500' : 'text-gray-400 hover:text-white hover:bg-[#1e293b]'}`}
        >
          <i className="fas fa-compact-disc w-5 text-center"></i>
          <span className="text-sm font-medium">Library</span>
        </div>
        
        <div 
          onClick={() => user ? onChangeView({ type: 'liked' }) : onLoginClick()}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${isLikedActive ? 'bg-[#1e293b] text-white border-l-4 border-pink-500' : 'text-gray-400 hover:text-white hover:bg-[#1e293b]'}`}
        >
          <i className={`fas fa-heart w-5 text-center ${isLikedActive ? 'text-pink-500' : ''}`}></i>
          <span className="text-sm font-medium">Liked Songs</span>
        </div>
      </nav>

      <div className="mt-8 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase">My Playlists</h3>
          <button 
            onClick={() => user ? onCreatePlaylist() : onLoginClick()}
            className="text-gray-400 hover:text-white transition-colors"
            title="Create Playlist"
          >
            <i className="fas fa-plus-circle"></i>
          </button>
        </div>
        
        <nav className="space-y-1">
          {user ? (
            playlists.length > 0 ? (
              playlists.map(playlist => {
                const isActive = currentView.type === 'playlist' && currentView.playlistId === playlist.id;
                return (
                  <div 
                    key={playlist.id}
                    onClick={() => onChangeView({ type: 'playlist', playlistId: playlist.id })}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all group ${isActive ? 'bg-[#1e293b] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1e293b]'}`}
                  >
                    <i className={`fas fa-list-ul w-5 text-center text-xs group-hover:text-blue-400 ${isActive ? 'text-blue-500' : ''}`}></i>
                    <span className="text-sm truncate">{playlist.name}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-600 px-3 italic">No playlists yet.</p>
            )
          ) : (
            <p className="text-xs text-gray-600 px-3 italic">Login to see playlists.</p>
          )}
        </nav>
      </div>

      {!user && (
        <div className="mt-4 p-4 bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-xl border border-white/5">
          <p className="text-xs text-blue-200 font-semibold mb-1">Go Premium</p>
          <p className="text-[10px] text-gray-400 mb-3">Save unlimited songs and create custom playlists.</p>
          <button onClick={onLoginClick} className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow-lg transition-colors">
            Upgrade
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
