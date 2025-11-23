import { User, Playlist } from '../types';

const STORAGE_KEY = 'smart_music_db_v1';

interface DBSchema {
  users: (User & { password: string })[];
  playlists: Playlist[];
  likes: { userId: string; songId: number }[];
}

const getDB = (): DBSchema => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initial: DBSchema = { users: [], playlists: [], likes: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored);
};

const saveDB = (db: DBSchema) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

export const backend = {
  // --- AUTH ---
  signup: async (username: string, email: string, password: string): Promise<User> => {
    // Simulate delay
    await new Promise(r => setTimeout(r, 500));
    const db = getDB();
    if (db.users.find(u => u.email === email)) {
      throw new Error("User already exists");
    }
    const newUser = { id: Date.now().toString(), username, email, password };
    db.users.push(newUser);
    saveDB(db);
    const { password: _, ...safeUser } = newUser;
    return safeUser;
  },

  login: async (email: string, password: string): Promise<User> => {
    await new Promise(r => setTimeout(r, 500));
    const db = getDB();
    const user = db.users.find(u => u.email === email && u.password === password);
    if (!user) throw new Error("Invalid credentials");
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  // --- PLAYLISTS ---
  createPlaylist: async (userId: string, name: string): Promise<Playlist> => {
    const db = getDB();
    const newPlaylist: Playlist = {
      id: Date.now().toString() + Math.random().toString().slice(2, 5),
      userId,
      name,
      songs: [],
      createdAt: Date.now()
    };
    db.playlists.push(newPlaylist);
    saveDB(db);
    return newPlaylist;
  },

  getUserPlaylists: (userId: string): Playlist[] => {
    const db = getDB();
    return db.playlists.filter(p => p.userId === userId);
  },

  addToPlaylist: async (playlistId: string, songId: number) => {
    const db = getDB();
    const playlist = db.playlists.find(p => p.id === playlistId);
    if (playlist && !playlist.songs.includes(songId)) {
      playlist.songs.push(songId);
      saveDB(db);
    }
  },

  removeFromPlaylist: async (playlistId: string, songId: number) => {
    const db = getDB();
    const playlist = db.playlists.find(p => p.id === playlistId);
    if (playlist) {
      playlist.songs = playlist.songs.filter(id => id !== songId);
      saveDB(db);
    }
  },

  deletePlaylist: async (playlistId: string) => {
    const db = getDB();
    db.playlists = db.playlists.filter(p => p.id !== playlistId);
    saveDB(db);
  },

  // --- LIKES ---
  toggleLike: async (userId: string, songId: number): Promise<boolean> => {
    const db = getDB();
    const existingIndex = db.likes.findIndex(l => l.userId === userId && l.songId === songId);
    let isLiked = false;
    if (existingIndex > -1) {
      db.likes.splice(existingIndex, 1);
      isLiked = false;
    } else {
      db.likes.push({ userId, songId });
      isLiked = true;
    }
    saveDB(db);
    return isLiked;
  },

  getLikedSongIds: (userId: string): number[] => {
    const db = getDB();
    return db.likes.filter(l => l.userId === userId).map(l => l.songId);
  }
};