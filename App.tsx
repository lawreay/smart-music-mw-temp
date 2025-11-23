import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Song, PlayMode, PlayerState } from './types';
import { processSongs, fetchItunesArt, getAudioUrl } from './services/musicData';
import { suggestPlaylistName } from './services/geminiService';
import Sidebar from './components/Sidebar';
import PlayerBar from './components/PlayerBar';

// Custom hook to detect mobile
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
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [playlistTitle, setPlaylistTitle] = useState("All Tracks");
  const [playMode, setPlayMode] = useState<PlayMode>(PlayMode.NORMAL);
  
  // Player state
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const isMobile = useIsMobile();

  // Initialization
  useEffect(() => {
    const loadedSongs = processSongs();
    setSongs(loadedSongs);
    setFilteredSongs(loadedSongs);
    setQueue(loadedSongs);

    // AI suggestion for playlist name (just for fun/demo)
    suggestPlaylistName(loadedSongs).then(name => setPlaylistTitle(name));

    // Lazy load art
    loadedSongs.forEach(async (song) => {
      const art = await fetchItunesArt(song.artist, song.title);
      if (art) {
        setSongs(prev => prev.map(s => s.id === song.id ? { ...s, art } : s));
        setFilteredSongs(prev => prev.map(s => s.id === song.id ? { ...s, art } : s));
      }
    });
  }, []);

  // Update filtered songs on search
  useEffect(() => {
    const lower = searchQuery.toLowerCase();
    const filtered = songs.filter(s => 
        s.title.toLowerCase().includes(lower) || 
        s.artist.toLowerCase().includes(lower)
    );
    setFilteredSongs(filtered);
  }, [searchQuery, songs]);

  // Handle Audio Events
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

  // Playback Controls
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
        console.error("Autoplay prevented", err);
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
      else return; // Stop at end
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

  const handleVolume = (vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setPlayerState(prev => ({ ...prev, volume: vol }));
    }
  };

  const toggleMode = () => {
      // Simple toggle: Normal -> Shuffle -> Loop -> Normal
      if(playMode === PlayMode.NORMAL) setPlayMode(PlayMode.SHUFFLE);
      else if(playMode === PlayMode.SHUFFLE) setPlayMode(PlayMode.LOOP);
      else setPlayMode(PlayMode.NORMAL);
  };

  const currentSong = queue[currentIndex] || null;

  return (
    <div className="flex h-screen w-full bg-[#0a0e17] text-white">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && isMobile && (
        <div 
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-gradient-radial from-[#1e293b] to-[#0a0e17]">
        
        {/* Top Bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[#0a0e17]/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-400">
                <i className="fas fa-bars text-xl"></i>
             </button>
             <div className="relative group">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors"></i>
                <input 
                    type="text" 
                    placeholder="Search songs, artists..." 
                    className="bg-[#1e293b] border border-[#334155] rounded-full py-2 pl-10 pr-4 text-sm text-gray-300 focus:outline-none focus:border-blue-500 w-48 md:w-80 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-pink-500 flex items-center justify-center text-xs font-bold border-2 border-white/20">
                US
            </div>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto pb-32">
            
            {/* Hero Section */}
            <div className="px-6 md:px-10 mt-4 mb-8">
                <div className="w-full h-48 md:h-60 rounded-2xl bg-gradient-to-r from-indigo-900 to-pink-900 relative shadow-2xl flex items-end p-6 md:p-10 overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10 animate-fade-in-up">
                        <span className="text-xs font-bold tracking-widest uppercase text-white/70 mb-2 block">Premium Playlist</span>
                        <h1 className="text-3xl md:text-5xl font-extrabold mb-2 text-white drop-shadow-lg">{playlistTitle}</h1>
                        <p className="text-white/60 text-sm font-medium">
                            {filteredSongs.length} Songs • Updated Just Now • <span className="text-pink-400"><i className="fas fa-star"></i> AI Curated</span>
                        </p>
                    </div>
                    <div className="absolute right-0 bottom-0 p-10 opacity-20 transform translate-x-10 translate-y-10 group-hover:scale-110 transition-transform duration-700">
                        <i className="fas fa-music text-9xl"></i>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="px-6 md:px-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredSongs.map((song) => {
                    const isCurrent = currentSong?.id === song.id;
                    return (
                        <div 
                            key={song.id} 
                            onClick={() => loadAndPlay(queue.findIndex(s => s.id === song.id), filteredSongs)} // If filtering, play from filtered list
                            className={`
                                group bg-[#182032] p-4 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:bg-[#232d42] hover:shadow-xl
                                ${isCurrent ? 'ring-2 ring-blue-500 bg-[#1e293b]' : ''}
                            `}
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
                        </div>
                    );
                })}
            </div>
            
            {filteredSongs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                    <i className="fas fa-search text-3xl mb-3"></i>
                    <p>No songs found for "{searchQuery}"</p>
                </div>
            )}
        </div>

        <audio 
            ref={audioRef} 
            preload="none"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
        />
      </main>

      {/* Player Bar */}
      <PlayerBar 
        currentSong={currentSong}
        onNext={playNext}
        onPrev={playPrev}
        onPlayPause={togglePlayPause}
        playMode={playMode}
        toggleMode={toggleMode}
        playerState={playerState}
        onSeek={handleSeek}
        onVolumeChange={handleVolume}
      />
    </div>
  );
};

export default App;