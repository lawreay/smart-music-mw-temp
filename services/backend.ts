
import { User, Playlist, Song, Message } from '../types';
import { processInitialSongs } from './musicData';

const STORAGE_KEY = 'smart_music_db_v3'; // Bumped version for schema changes

interface DBSchema {
  users: (User & { password: string })[];
  playlists: Playlist[];
  likes: { userId: string; songId: number }[];
  songs: Song[];
  messages: Message[];
}

// Seed the DB if empty
const getDB = (): DBSchema => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initialSongs = processInitialSongs();
    
    const adminUser = {
      id: 'admin_001',
      username: 'Lawrence (Admin)',
      email: 'lawreay1@gmail.com',
      password: 'lastBorn33.',
      role: 'admin' as const,
      avatar: 'https://github.com/lawreay.png', // Assuming github avatar
      bio: 'Lead Developer & Admin of Smart Music'
    };

    const initial: DBSchema = { 
      users: [adminUser], 
      playlists: [], 
      likes: [],
      songs: initialSongs,
      messages: []
    };
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
    await new Promise(r => setTimeout(r, 500));
    const db = getDB();
    if (db.users.find(u => u.email === email)) {
      throw new Error("User already exists");
    }
    const newUser = { 
      id: Date.now().toString(), 
      username, 
      email, 
      password, 
      role: 'user' as const,
      avatar: `https://ui-avatars.com/api/?name=${username}&background=random`,
      bio: 'Music lover'
    };
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
    if (user.isBlocked) throw new Error("This account has been blocked by the administrator.");

    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  updateProfile: async (userId: string, updates: Partial<User>) => {
    const db = getDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
      db.users[userIndex] = { ...db.users[userIndex], ...updates };
      saveDB(db);
      const { password: _, ...safeUser } = db.users[userIndex];
      return safeUser;
    }
    throw new Error("User not found");
  },

  getUserById: (userId: string): User | undefined => {
    const db = getDB();
    const user = db.users.find(u => u.id === userId);
    if(user) {
        const { password: _, ...safeUser } = user;
        return safeUser;
    }
    return undefined;
  },

  getAllUsers: () => {
    const db = getDB();
    return db.users.map(({ password, ...u }) => u);
  },

  // --- ADMIN / ROLES ---
  updateUserRole: async (targetUserId: string, newRole: 'user' | 'premium' | 'admin') => {
    const db = getDB();
    const user = db.users.find(u => u.id === targetUserId);
    if (user) {
      user.role = newRole;
      saveDB(db);
    }
  },

  toggleUserBlock: async (targetUserId: string) => {
    const db = getDB();
    const user = db.users.find(u => u.id === targetUserId);
    if (user && user.role !== 'admin') {
      user.isBlocked = !user.isBlocked;
      saveDB(db);
    }
    return backend.getAllUsers();
  },

  adminResetPassword: async (targetUserId: string, newPass: string) => {
    const db = getDB();
    const user = db.users.find(u => u.id === targetUserId);
    if (user) {
      user.password = newPass;
      saveDB(db);
    }
  },

  // --- SONGS (Dynamic Library) ---
  getAllSongs: (): Song[] => {
    const db = getDB();
    return db.songs;
  },

  // Add/Edit Songs (Admin or Premium)
  saveSong: async (song: Song, uploadedBy?: string) => {
    const db = getDB();
    const idx = db.songs.findIndex(s => s.id === song.id);
    
    if (idx > -1) {
      // Edit existing
      db.songs[idx] = { ...song, uploadedBy: db.songs[idx].uploadedBy || uploadedBy };
    } else {
      // New Song
      const newId = Math.max(...db.songs.map(s => s.id), 0) + 1;
      db.songs.push({ ...song, id: newId, uploadedBy });
    }
    saveDB(db);
    return db.songs;
  },

  deleteSong: async (songId: number) => {
    const db = getDB();
    db.songs = db.songs.filter(s => s.id !== songId);
    db.likes = db.likes.filter(l => l.songId !== songId);
    db.playlists.forEach(p => {
      p.songs = p.songs.filter(id => id !== songId);
    });
    saveDB(db);
    return db.songs;
  },

  getSongsUploadedByUser: (userId: string) => {
    const db = getDB();
    return db.songs.filter(s => s.uploadedBy === userId);
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
  },

  getSongLikers: (songId: number): User[] => {
    const db = getDB();
    const userIds = db.likes.filter(l => l.songId === songId).map(l => l.userId);
    // Return safe user objects
    return db.users
        .filter(u => userIds.includes(u.id))
        .map(({ password, ...u }) => u);
  },

  // --- MESSAGING ---
  sendMessage: async (fromId: string, toId: string, content: string) => {
    const db = getDB();
    const msg: Message = {
      id: Date.now().toString() + Math.random().toString(),
      fromId,
      toId,
      content,
      read: false,
      timestamp: Date.now()
    };
    db.messages.push(msg);
    saveDB(db);
  },

  // Get conversation interactions for a user
  getUserConversations: (userId: string) => {
    const db = getDB();
    const relatedMsgs = db.messages.filter(m => m.fromId === userId || m.toId === userId);
    
    // Find unique interlocutors
    const contactIds = new Set<string>();
    relatedMsgs.forEach(m => {
        contactIds.add(m.fromId === userId ? m.toId : m.fromId);
    });

    // Map to user objects
    const contacts = Array.from(contactIds).map(id => {
        const u = db.users.find(user => user.id === id);
        return u ? { ...u, password: '' } : null; // safe user
    }).filter(u => u !== null) as User[];

    return contacts;
  },

  getChatHistory: (userId: string, otherUserId: string) => {
    const db = getDB();
    return db.messages
        .filter(m => (m.fromId === userId && m.toId === otherUserId) || (m.fromId === otherUserId && m.toId === userId))
        .sort((a, b) => a.timestamp - b.timestamp);
  }
};
