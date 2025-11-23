
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
  const isAdminActive = currentView.type === 'admin';
  const isProfileActive = currentView.type === 'profile';

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
          <div className="flex flex-col gap-3">
            <div 
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-[#1e293b] transition-colors ${isProfileActive ? 'bg-[#1e293b]' : ''}`}
              onClick={() => onChangeView({ type: 'profile' })}
            >
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border border-gray-600 object-cover"
              />
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                <p className="text-[10px] text-green-400 capitalize">{user.role === 'admin' ? 'Administrator' : 'Premium Member'}</p>
              </div>
            </div>
            
            <button onClick={onLogoutClick} className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-2 px-2">
              <i className="fas fa-sign-out-alt"></i> Logout
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

      <nav className="space-y-2 flex-grow">
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

        {user?.role === 'admin' && (
           <div 
           onClick={() => onChangeView({ type: 'admin' })}
           className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${isAdminActive ? 'bg-red-900/30 text-red-400 border-l-4 border-red-500' : 'text-red-400 hover:text-red-300 hover:bg-[#1e293b]'}`}
         >
           <i className="fas fa-shield-alt w-5 text-center"></i>
           <span className="text-sm font-medium">Admin Dashboard</span>
         </div>
        )}

        {/* Playlist Section */}
        <div className="mt-6">
            <div className="flex items-center justify-between mb-2 px-3">
            <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase">Playlists</h3>
            <button 
                onClick={() => user ? onCreatePlaylist() : onLoginClick()}
                className="text-gray-400 hover:text-white transition-colors"
                title="Create Playlist"
            >
                <i className="fas fa-plus-circle"></i>
            </button>
            </div>
            
            <div className="space-y-1 max-h-40 overflow-y-auto">
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
            </div>
        </div>
      </nav>

      <div className="mt-auto pt-6 border-t border-gray-800">
        <a 
            href="https://lawreay.github.io/portfolio/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center gap-3 p-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl hover:from-blue-900 hover:to-gray-900 transition-all shadow-lg"
        >
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                L
            </div>
            <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider group-hover:text-blue-300">Developed By</p>
                <p className="text-xs font-bold text-white group-hover:text-white">Lawrence</p>
            </div>
            <i className="fas fa-external-link-alt text-gray-500 text-xs ml-auto group-hover:text-white"></i>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
