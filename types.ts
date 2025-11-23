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