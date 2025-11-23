import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#0f1522] border-r border-[#1e293b] 
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex flex-col p-5
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i className="fas fa-music text-white text-lg"></i>
        </div>
        <h2 className="text-lg font-bold tracking-wide text-white">SMART MUSIC</h2>
        <button onClick={toggleSidebar} className="md:hidden ml-auto text-gray-400">
          <i className="fas fa-times"></i>
        </button>
      </div>

      <nav className="space-y-2">
        <div className="flex items-center gap-3 text-white bg-[#1e293b] px-3 py-2.5 rounded-lg cursor-pointer border-l-4 border-blue-500 transition-all">
          <i className="fas fa-compact-disc w-5 text-center"></i>
          <span className="text-sm font-medium">Library</span>
        </div>
        <div className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-[#1e293b] px-3 py-2.5 rounded-lg cursor-pointer transition-all">
          <i className="fas fa-heart w-5 text-center"></i>
          <span className="text-sm font-medium">Liked Songs</span>
        </div>
        <div className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-[#1e293b] px-3 py-2.5 rounded-lg cursor-pointer transition-all">
          <i className="fas fa-microphone-alt w-5 text-center"></i>
          <span className="text-sm font-medium">Artists</span>
        </div>
      </nav>

      <div className="mt-8 mb-4">
        <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-4">Playlists</h3>
        <nav className="space-y-2">
          <div className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-[#1e293b] px-3 py-2 rounded-lg cursor-pointer transition-all">
            <i className="fas fa-list-ul w-5 text-center"></i>
            <span className="text-sm">Juice WRLD Mix</span>
          </div>
          <div className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-[#1e293b] px-3 py-2 rounded-lg cursor-pointer transition-all">
            <i className="fas fa-bolt w-5 text-center"></i>
            <span className="text-sm">Workout Hype</span>
          </div>
          <div className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-[#1e293b] px-3 py-2 rounded-lg cursor-pointer transition-all">
            <i className="fas fa-coffee w-5 text-center"></i>
            <span className="text-sm">Chill Vibes</span>
          </div>
        </nav>
      </div>

      <div className="mt-auto p-4 bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-xl border border-white/5">
        <p className="text-xs text-blue-200 font-semibold mb-1">Go Premium</p>
        <p className="text-[10px] text-gray-400 mb-3">Unlock high quality audio and lyrics.</p>
        <button className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow-lg transition-colors">
          Upgrade
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;