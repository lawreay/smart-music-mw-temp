
import React, { useState, useEffect, useRef } from 'react';
import { Song, PlayMode, PlayerState, User, Playlist, ViewState } from './types';
import { fetchItunesArt, getAudioUrl } from './services/musicData';
import { suggestPlaylistName } from './services/geminiService';
import { backend } from './services/backend';
import Sidebar from './components/Sidebar';
import PlayerBar from './components/PlayerBar';
import AuthModal from './components/AuthModal';
import PlaylistModal from './components/PlaylistModal';
import AddToPlaylistModal from './components/AddToPlaylistModal';
import AdminDashboard from './components/AdminDashboard';
import UserProfile from './components/UserProfile';
import SocialLikesModal from './components/SocialLikesModal';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

const App: React.FC = () => {
  // Data
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [displayedSongs, setDisplayedSongs] = useState<Song[]>([]);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  // User & Persistence
  const [user, setUser] = useState<User | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [likedSongIds, setLikedSongIds] = useState<number[]>([]);
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [playMode, setPlayMode] = useState<PlayMode>(PlayMode.NORMAL);
  const [viewState, setViewState] = useState<ViewState>({ type: 'library' });
  const [headerInfo, setHeaderInfo] = useState({ title: "All Tracks", desc: "Library" });
  
  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<{ isOpen: boolean, songId: number | null }>({ isOpen: false, songId: null });
  const [showSocialLikes, setShowSocialLikes] = useState<Song | null>(null);

  // Player State
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const isMobile = useIsMobile();
  const currentSong = queue[currentIndex] || null;

  // --- INITIALIZATION ---
  const refreshSongs = () => {
    const dbSongs = backend.getAllSongs();
    setAllSongs(dbSongs);
    // Refresh display if currently in library
    if (viewState.type === 'library') {
        setDisplayedSongs(dbSongs);
        // Also update queue if it was the full list
        // Simple strategy: if queue was all songs, update it.
        // For robustness, we might leave queue alone to not interrupt playback too much, 
        // but updating it ensures deleted songs don't play next.
    }
  };

  useEffect(() => {
    const dbSongs = backend.getAllSongs();
    setAllSongs(dbSongs);
    setDisplayedSongs(dbSongs);
    setQueue(dbSongs);

    // Initial Art Load for songs missing art (demo only)
    dbSongs.slice(0, 5).forEach(async (song) => {
      if (song.art.includes('picsum') || song.art.includes('placeholder')) {
        const art = await fetchItunesArt(song.artist, song.title);
        if (art) {
           // We don't save this to DB to avoid overwriting admin edits, just visual for session
           // or we could save it. For now, let's keep it in memory state.
           setAllSongs(prev => prev.map(s => s.id === song.id ? { ...s, art } : s));
        }
      }
    });
  }, []);

  // --- VIEW LOGIC ---
  useEffect(() => {
    // Determine what songs to show based on ViewState and Search
    let filtered = allSongs;

    if (viewState.type === 'admin') {
        setHeaderInfo({ title: "Admin Dashboard", desc: "System Management" });
        return;
    }
    if (viewState.type === 'profile') {
        setHeaderInfo({ title: "Profile", desc: "Account & Messages" });
        return;
    }

    // 1. Filter by View
    if (viewState.type === 'liked') {
      filtered = allSongs.filter(s => likedSongIds.includes(s.id));
      setHeaderInfo({ title: "Liked Songs", desc: `${filtered.length} songs you love` });
    } else if (viewState.type === 'playlist' && viewState.playlistId) {
      const playlist = userPlaylists.find(p => p.id === viewState.playlistId);
      if (playlist) {
        filtered = allSongs.filter(s => playlist.songs.includes(s.id));
        setHeaderInfo({ title: playlist.name, desc: `Custom Playlist • ${filtered.length} songs` });
      } else {
        setViewState({ type: 'library' });
      }
    } else {
      // Library
      setHeaderInfo({ title: "All Tracks", desc: "Your personal library" });
    }

    // 2. Filter by Search
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
          s.title.toLowerCase().includes(lower) || 
          s.artist.toLowerCase().includes(lower)
      );
    }

    setDisplayedSongs(filtered);
  }, [viewState, searchQuery, allSongs, likedSongIds, userPlaylists]);


  // --- PLAYER HANDLERS ---
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setPlayerState(prev => ({
        ...prev,
        currentTime: audioRef.current?.currentTime || 0,
        duration: audioRef.current?.duration || 0
      }));
    }
  };

  const handleEnded = () => {
    if (playMode === PlayMode.LOOP_ONE) {
      audioRef.current?.play();
    } else {
      playNext();
    }
  };

  const loadAndPlay = async (index: number, newQueue?: Song[]) => {
    const targetQueue = newQueue || queue;
    if (index < 0 || index >= targetQueue.length) return;

    setCurrentIndex(index);
    if(newQueue) setQueue(newQueue);

    const song = targetQueue[index];
    if (audioRef.current) {
      audioRef.current.src = getAudioUrl(song.file);
      audioRef.current.load();
      try {
        await audioRef.current.play();
        setPlayerState(prev => ({ ...prev, isPlaying: true }));
      } catch (err) {
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
      }
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (playerState.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const playNext = () => {
    let nextIndex = currentIndex + 1;
    if (playMode === PlayMode.SHUFFLE) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      if (playMode === PlayMode.LOOP) nextIndex = 0;
      else return; 
    }
    loadAndPlay(nextIndex);
  };

  const playPrev = () => {
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = queue.length - 1;
    loadAndPlay(prevIndex);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPlayerState(prev => ({ ...prev, currentTime: time }));
    }
  };

  // --- USER ACTIONS ---
  const handleLogin = (u: User) => {
    setUser(u);
    // Load User Data
    setLikedSongIds(backend.getLikedSongIds(u.id));
    setUserPlaylists(backend.getUserPlaylists(u.id));
    if (u.role === 'admin') {
        setViewState({ type: 'admin' });
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLikedSongIds([]);
    setUserPlaylists([]);
    setViewState({ type: 'library' });
  };

  const handleToggleLike = async (songId?: number) => {
    const targetId = songId !== undefined ? songId : currentSong?.id;
    if (targetId === undefined || !user) {
      if (!user) setShowAuthModal(true);
      return;
    }
    const isLiked = await backend.toggleLike(user.id, targetId);
    if (isLiked) {
      setLikedSongIds(prev => [...prev, targetId]);
    } else {
      setLikedSongIds(prev => prev.filter(id => id !== targetId));
    }
  };

  const handleCreatePlaylist = async (name: string) => {
    if (!user) return;
    const newPlaylist = await backend.createPlaylist(user.id, name);
    setUserPlaylists(prev => [...prev, newPlaylist]);
    if (showAddToPlaylist.isOpen && showAddToPlaylist.songId !== null) {
       await backend.addToPlaylist(newPlaylist.id, showAddToPlaylist.songId);
       setShowAddToPlaylist({ isOpen: false, songId: null });
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!user || showAddToPlaylist.songId === null) return;
    await backend.addToPlaylist(playlistId, showAddToPlaylist.songId);
    
    setUserPlaylists(prev => prev.map(p => {
        if (p.id === playlistId && showAddToPlaylist.songId !== null) {
            return { ...p, songs: [...p.songs, showAddToPlaylist.songId] };
        }
        return p;
    }));
    setShowAddToPlaylist({ isOpen: false, songId: null });
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    refreshSongs(); // In case they uploaded something
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0e17] text-white font-sans">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        user={user}
        onLoginClick={() => setShowAuthModal(true)}
        onLogoutClick={handleLogout}
        playlists={userPlaylists}
        currentView={viewState}
        onChangeView={(v) => { setViewState(v); setSidebarOpen(false); }}
        onCreatePlaylist={() => setShowCreatePlaylist(true)}
      />
      
      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-gradient-radial from-[#1e293b] to-[#0a0e17]">
        
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[#0a0e17]/80 backdrop-blur-md">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-400">
                <i className="fas fa-bars text-xl"></i>
             </button>
             {viewState.type !== 'admin' && viewState.type !== 'profile' && (
                 <div className="relative group w-full md:w-80">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors"></i>
                    <input 
                        type="text" 
                        placeholder="Search songs, artists..." 
                        className="w-full bg-[#1e293b] border border-[#334155] rounded-full py-2 pl-10 pr-4 text-sm text-gray-300 focus:outline-none focus:border-blue-500 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
             )}
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto pb-32">
            
            {/* Conditional Views */}
            {viewState.type === 'admin' && user?.role === 'admin' ? (
                <AdminDashboard 
                    currentUser={user} 
                    songs={allSongs} 
                    onSongUpdate={refreshSongs} 
                />
            ) : viewState.type === 'profile' && user ? (
                <UserProfile user={user} onUpdateUser={handleUpdateUser} />
            ) : (
                <>
                {/* Hero Banner */}
                <div className="px-6 md:px-10 mt-4 mb-8">
                    <div className={`w-full h-48 md:h-56 rounded-2xl relative shadow-2xl flex items-end p-6 md:p-10 overflow-hidden group transition-colors duration-500
                        ${viewState.type === 'liked' ? 'bg-gradient-to-r from-pink-900 to-purple-900' : 'bg-gradient-to-r from-indigo-900 to-blue-900'}
                    `}>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="relative z-10 animate-fade-in-up">
                            <span className="text-xs font-bold tracking-widest uppercase text-white/70 mb-2 block">{headerInfo.desc}</span>
                            <h1 className="text-3xl md:text-5xl font-extrabold mb-2 text-white drop-shadow-lg">{headerInfo.title}</h1>
                            <p className="text-white/60 text-sm font-medium">
                               {user ? `Welcome back, ${user.username}` : 'Discover the best music'} 
                            </p>
                        </div>
                        <div className="absolute right-0 bottom-0 p-10 opacity-20 transform translate-x-10 translate-y-10 group-hover:scale-110 transition-transform duration-700">
                            <i className={`fas ${viewState.type === 'liked' ? 'fa-heart' : 'fa-music'} text-9xl`}></i>
                        </div>
                    </div>
                </div>

                {/* Song Grid */}
                <div className="px-6 md:px-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {displayedSongs.map((song) => {
                        const isCurrent = currentSong?.id === song.id;
                        const isLiked = likedSongIds.includes(song.id);
                        return (
                            <div 
                                key={song.id} 
                                className={`
                                    group bg-[#182032] p-4 rounded-xl relative transition-all duration-300 hover:-translate-y-2 hover:bg-[#232d42] hover:shadow-xl
                                    ${isCurrent ? 'ring-2 ring-blue-500 bg-[#1e293b]' : ''}
                                `}
                            >
                                {/* Card Actions */}
                                <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleToggleLike(song.id); }}
                                        className="w-8 h-8 rounded-full bg-black/50 hover:bg-pink-600 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                                        title="Like"
                                    >
                                        <i className={`${isLiked ? 'fas text-pink-500 hover:text-white' : 'far'} fa-heart text-sm`}></i>
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); if(!user) setShowAuthModal(true); else setShowAddToPlaylist({ isOpen: true, songId: song.id }); }}
                                        className="w-8 h-8 rounded-full bg-black/50 hover:bg-blue-600 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                                        title="Add to Playlist"
                                    >
                                        <i className="fas fa-plus text-sm"></i>
                                    </button>
                                </div>

                                <div 
                                    onClick={() => loadAndPlay(displayedSongs.indexOf(song), displayedSongs)}
                                    className="cursor-pointer"
                                >
                                    <div className="relative aspect-square rounded-lg overflow-hidden mb-4 shadow-lg">
                                        <img src={song.art} alt={song.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg transform active:scale-95">
                                                <i className={`fas ${isCurrent && playerState.isPlaying ? 'fa-chart-bar animate-pulse' : 'fa-play pl-1'}`}></i>
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-bold text-white truncate mb-1">{song.title}</h3>
                                    <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                                    {song.uploadedBy && (
                                        <p className="text-[10px] text-blue-400/70 truncate mt-1">Community Upload</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {displayedSongs.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                        <i className="fas fa-search text-3xl mb-3 opacity-50"></i>
                        <p>No songs found.</p>
                    </div>
                )}
                </>
            )}
        </div>

        {/* Hidden Audio Element */}
        <audio 
            ref={audioRef} 
            preload="none"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
        />
      </main>

      {/* Persistent Player */}
      <PlayerBar 
        currentSong={currentSong}
        onNext={playNext}
        onPrev={playPrev}
        onPlayPause={togglePlayPause}
        playMode={playMode}
        toggleMode={() => setPlayMode(m => m === PlayMode.NORMAL ? PlayMode.SHUFFLE : m === PlayMode.SHUFFLE ? PlayMode.LOOP : PlayMode.NORMAL)}
        playerState={playerState}
        onSeek={handleSeek}
        onVolumeChange={(v) => { if(audioRef.current) audioRef.current.volume = v; setPlayerState(p => ({...p, volume: v})); }}
        isLiked={currentSong ? likedSongIds.includes(currentSong.id) : false}
        onToggleLike={() => handleToggleLike(currentSong?.id)}
        user={user}
        onShowLikes={() => currentSong && setShowSocialLikes(currentSong)}
      />

      {/* Modals */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onSuccess={handleLogin} 
        />
      )}

      {showCreatePlaylist && (
        <PlaylistModal 
          onClose={() => setShowCreatePlaylist(false)}
          onCreate={handleCreatePlaylist}
        />
      )}

      {showAddToPlaylist.isOpen && (
        <AddToPlaylistModal
            playlists={userPlaylists}
            onClose={() => setShowAddToPlaylist({ isOpen: false, songId: null })}
            onSelect={handleAddToPlaylist}
            onCreateNew={() => {
                setShowCreatePlaylist(true);
            }}
        />
      )}

      {showSocialLikes && (
        <SocialLikesModal 
            song={showSocialLikes}
            currentUser={user}
            onClose={() => setShowSocialLikes(null)}
            onMessageUser={(target) => {
                // Navigate to profile/messages and select this user
                // Simple trick: update view state to profile and set user?
                // For now, simpler to just alert or open profile. 
                // A full navigation system would require a Context or Redux.
                // We'll auto-switch view to Profile to handle this in future, 
                // for now just alert to go to messages.
                alert(`Go to Profile > Messages to chat with ${target.username}`);
            }}
        />
      )}
    </div>
  );
};

export default App;
