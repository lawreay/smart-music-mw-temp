export interface Song {
  id: number;
  file: string;
  title: string;
  artist: string;
  art: string;
  album?: string;
}

export enum PlayMode {
  NORMAL = 'NORMAL',
  SHUFFLE = 'SHUFFLE',
  LOOP = 'LOOP',
  LOOP_ONE = 'LOOP_ONE'
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  songs: number[]; // Array of song IDs
  createdAt: number;
}

export type ViewState = 
  | { type: 'library' }
  | { type: 'liked' }
  | { type: 'playlist'; playlistId: string };
