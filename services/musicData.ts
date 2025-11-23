
import { Song } from '../types';

export const rawFiles = [
    "[CLEAN]_Juice_WRLD_-_I_Want_It(0).m4a",
    "[CLEAN]_Juice_WRLD_-_Reminds_Me_Of_You_feat._The_Kid_LAROI_(0).m4a",
    "[Instrumental]_Juice_WRLD_-_Black_and_White(128k).m4a",
    "_2_Eric_Donaldson_-_A_Tear_Fell_-_Reggae_Music(128k).m4a",
    "5ive_-_Me_And_My_Brother(128k).m4a",
    "24KGoldn_-_Valentino_Lyrics_(128k).m4a",
    "A_Boogie_Wit_Da_Hoodie_-_Demons_and_Angels_feat._Juice_WRLD_[Official_Audi.m4a",
    "Abigail_Chams,_Harmonize_-_Me_too__Official_Music_Video_(128k).m4a",
    "Akon_-_Lonely__Official_Music_Video_(128k).m4a",
    "benny_blanco,_Juice_WRLD_-_Roses__Clean_-_Lyrics__ft._Brendon_Urie(0).m4a",
    "Can_t_Die__Clean_Version_-_Juice_WRLD___[Download_Link](0).m4a",
    "Cherry_Oh_Baby_-_Eric_Donaldson(128k).m4a",
    "CKAY_-_DTF___OFFICIAL_AUDIO(128k).m4a",
    "Davido_-_FOR_THE_ROAD__Official_Audio_(128k).m4a",
    "Dax_-_Dear_Alcohol__Official_Music_Video_(128k).m4a",
    "Dax_-_Dear_Mom__Official_Music_Video_(128k).m4a",
    "Dax_-_God_s_Eyes__Official_Music_Video_(128k).m4a",
    "Gyakie_-_Forever__Official_Music_Video_(128k).m4a",
    "Halsey_-_Without_Me(128k).m4a",
    "Juice_WRLD_-_Lean_Wit_Me__Official_Music_Video_(0).m4a",
    "Juice_WRLD_-_Legends__Official_Audio_(0).m4a",
    "Juice_WRLD_-_Rich_And_Blind___Official_Audio_(0).m4a",
    "Juice_WRLD_-_All_Girls_Are_The_Same__Official_Visualizer_(0).m4a",
    "Juice_WRLD_-_Armed__Dangerous__Official_Music_Video_(0).m4a",
    "Malinga_-_Chete_ft._Zeze_Kingston__Official_Music_Video_(128k).m4a",
    "Nasty_C_-_See_Me_Now__Remix__feat._MAETA(128k).m4a",
    "POP_SMOKE_-_WHAT_YOU_KNOW_BOUT_LOVE__Official_Video_(128k).m4a"
];

// Placeholder image for initial load
const DEFAULT_ART = "https://picsum.photos/400/400";

// Helper to clean filenames for initial seeding
export const processInitialSongs = (): Song[] => {
  return rawFiles.map((file, index) => {
    let clean = file.replace(/\(128k\)/g, '').replace(/\(0\)/g, '').replace(/\[.*?\]/g, '');
    clean = clean.replace(/\.m4a$/, '').replace(/_/g, ' ').trim();
    
    let parts = clean.split(/ - |__|- /);
    let artist = "Smart Music Artist";
    let title = clean;
    
    if (parts.length >= 2) {
        artist = parts[0].trim();
        title = parts[1].trim();
        if(parts.length > 2) title += " " + parts[2]; 
    }

    title = title.replace(/Official Video|Music Video|Audio|Lyrics|Visualizer/gi, '').trim();
    
    return {
        id: index,
        file: file, 
        title: title || `Track ${index + 1}`,
        artist: artist,
        art: DEFAULT_ART
    };
  });
};

export const getAudioUrl = (filename: string): string => {
    // If it's a full URL (added by admin), return it
    if (filename.startsWith('http')) return filename;
    // Otherwise return demo track
    return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
};

export const fetchItunesArt = async (artist: string, title: string): Promise<string | null> => {
    if(artist.includes("Physics") || title.includes("Physics")) return null;
    const query = `${artist} ${title}`;
    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=1`);
        const data = await res.json();
        if (data.results.length > 0) {
            return data.results[0].artworkUrl100.replace('100x100', '400x400');
        }
    } catch(e) {
        console.warn("Failed to fetch art", e);
    }
    return null;
}
