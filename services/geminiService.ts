import { GoogleGenAI } from "@google/genai";
import { Song } from "../types";

// Initialize Gemini client
// Note: This relies on process.env.API_KEY being present in the build environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMusicInsight = async (song: Song): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      You are a music expert. I am listening to "${song.title}" by "${song.artist}".
      Please give me a very short, fun fact or "vibe check" description of this song in less than 30 words.
      If you don't know the specific song, describe the typical style of the artist.
      Be cool and casual.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Just vibe to the music!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Enjoy the music! (AI unavailable)";
  }
};

export const suggestPlaylistName = async (songs: Song[]): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";
    const songList = songs.slice(0, 10).map(s => `${s.title} by ${s.artist}`).join(", ");
    const prompt = `
      Based on these songs: ${songList}.
      Suggest a creative, short playlist name (max 4 words). Do not use quotes.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text?.trim() || "My Awesome Mix";
  } catch (error) {
    return "My Playlist";
  }
};
