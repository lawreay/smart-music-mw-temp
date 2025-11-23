import React, { useRef, useEffect, useState } from 'react';
import { Song, PlayMode, PlayerState } from '../types';
import { getMusicInsight } from '../services/geminiService';

interface PlayerBarProps {
  currentSong: Song | null;
  onNext: () => void;
  onPrev: () => void;
  onPlayPause: () => void;
  playMode: PlayMode;
  toggleMode: () => void;
  playerState: PlayerState;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
}

const formatTime = (time: number) => {
  if (isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const PlayerBar: React.FC<PlayerBarProps> = ({
  currentSong,
  onNext,
  onPrev,
  onPlayPause,
  playMode,
  toggleMode,
  playerState,
  onSeek,
  onVolumeChange
}) => {
  const [aiInsight, setAiInsight] = useState<string>("");
  const [showInsight, setShowInsight] = useState(false);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const fetchInsight = async () => {
    if (!currentSong) return;
    setLoadingInsight(true);
    setShowInsight(true);
    const text = await getMusicInsight(currentSong);
    setAiInsight(text);
    setLoadingInsight(false);
  };

  // Close insight when song changes
  useEffect(() => {
    setShowInsight(false);
    setAiInsight("");
  }, [currentSong?.id]);

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[90px] bg-[#0f131d]/95 backdrop-blur-md border-t border-[#1e293b] flex items-center justify-between px-4 md:px-8 z-50">
      
      {/* Track Info */}
      <div className="flex items-center w-1/4 min-w-[140px]">
        <div className="relative group">
            <img 
            src={currentSong.art} 
            alt="Art" 
            className="w-14 h-14 rounded-md object-cover mr-4 bg-gray-800 shadow-md"
            />
             <button 
                onClick={fetchInsight}
                className="absolute -top-2 -right-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-[10px] shadow-lg transform transition-transform hover:scale-110"
                title="Ask AI about this song"
            >
                <i className="fas fa-sparkles"></i>
            </button>
        </div>
        
        <div className="overflow-hidden">
          <h4 className="text-sm font-semibold text-white truncate hover:text-blue-400 transition-colors cursor-pointer">
            {currentSong.title}
          </h4>
          <p className="text-xs text-gray-400 truncate hover:underline cursor-pointer">
            {currentSong.artist}
          </p>
        </div>

        {/* AI Popover */}
        {showInsight && (
            <div className="absolute bottom-24 left-8 w-64 bg-gray-900 border border-purple-500/30 p-4 rounded-xl shadow-2xl animate-fade-in z-50">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider"><i className="fas fa-robot mr-1"></i> AI Insight</span>
                    <button onClick={() => setShowInsight(false)} className="text-gray-500 hover:text-white"><i className="fas fa-times"></i></button>
                </div>
                {loadingInsight ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <i className="fas fa-circle-notch fa-spin"></i> Thinking...
                    </div>
                ) : (
                    <p className="text-xs text-gray-300 leading-relaxed italic">"{aiInsight}"</p>
                )}
                <div className="absolute -bottom-2 left-10 w-4 h-4 bg-gray-900 border-b border-r border-purple-500/30 transform rotate-45"></div>
            </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center w-2/4 max-w-xl">
        <div className="flex items-center gap-6 mb-1">
          <button 
            onClick={toggleMode}
            className={`text-lg transition-colors ${playMode !== PlayMode.NORMAL ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
            title="Shuffle/Loop"
          >
            <i className={`fas ${playMode === PlayMode.SHUFFLE ? 'fa-random' : playMode === PlayMode.LOOP ? 'fa-redo' : 'fa-random'}`}></i>
          </button>
          
          <button onClick={onPrev} className="text-gray-300 hover:text-white transition-colors text-xl">
            <i className="fas fa-step-backward"></i>
          </button>
          
          <button 
            onClick={onPlayPause}
            className="w-10 h-10 rounded-full bg-white hover:bg-gray-200 text-black flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-white/10"
          >
            <i className={`fas ${playerState.isPlaying ? 'fa-pause' : 'fa-play ml-1'}`}></i>
          </button>
          
          <button onClick={onNext} className="text-gray-300 hover:text-white transition-colors text-xl">
            <i className="fas fa-step-forward"></i>
          </button>
          
          <button className="text-gray-400 hover:text-white transition-colors text-lg">
             <i className="fas fa-redo text-xs opacity-50"></i> {/* Placeholder for loop toggle logic specifically */}
          </button>
        </div>

        {/* Progress */}
        <div className="w-full flex items-center gap-3 text-[10px] md:text-xs text-gray-400 font-medium font-mono">
          <span className="w-8 text-right">{formatTime(playerState.currentTime)}</span>
          <div className="relative flex-grow h-1 bg-gray-700 rounded-full group cursor-pointer">
             <div 
                className="absolute h-full bg-blue-500 rounded-full" 
                style={{ width: `${(playerState.currentTime / (playerState.duration || 1)) * 100}%` }}
             ></div>
             <input 
                type="range" 
                min="0" 
                max={playerState.duration || 100} 
                value={playerState.currentTime}
                onChange={(e) => onSeek(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
             />
             <div 
                className="absolute h-3 w-3 bg-white rounded-full shadow top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
                style={{ left: `${(playerState.currentTime / (playerState.duration || 1)) * 100}%` }}
             ></div>
          </div>
          <span className="w-8">{formatTime(playerState.duration)}</span>
        </div>
      </div>

      {/* Volume / Extras */}
      <div className="w-1/4 flex items-center justify-end gap-3 md:gap-4">
        <a href={currentSong.file} download className="text-gray-400 hover:text-white hidden md:block" title="Download">
            <i className="fas fa-download"></i>
        </a>
        <div className="flex items-center gap-2 group w-24 md:w-32">
            <i className={`fas ${playerState.volume === 0 ? 'fa-volume-mute text-red-400' : 'fa-volume-up text-gray-400'}`}></i>
            <div className="relative flex-grow h-1 bg-gray-700 rounded-full">
                <div 
                    className="absolute h-full bg-gray-400 group-hover:bg-blue-500 rounded-full transition-colors" 
                    style={{ width: `${playerState.volume * 100}%` }}
                ></div>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={playerState.volume} 
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerBar;