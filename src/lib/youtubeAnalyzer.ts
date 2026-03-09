import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AnalyzedNote, AnalyzedChord } from "./audioAnalyzer";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteToMidi(noteName: string): number {
  const match = noteName.match(/^([A-G]#?)([0-9])$/i);
  if (!match) return 60;
  const name = match[1].toUpperCase();
  const octave = parseInt(match[2], 10);
  const noteIdx = NOTE_NAMES.indexOf(name);
  if (noteIdx === -1) return 60;
  return (octave + 1) * 12 + noteIdx;
}

export function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export async function analyzeYouTubeUrl(url: string): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze the music in this YouTube video: ${url}. 
    Provide the BPM, time signature, key, and a detailed chord progression and main melody notes for the first 60 seconds of the song.
    Ensure the melody notes are in scientific pitch notation (e.g., C4, D#4).
    The response must be in JSON format.`,
    config: {
      tools: [{ urlContext: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bpm: { type: Type.NUMBER },
          timeSignature: { type: Type.STRING },
          key: { type: Type.STRING },
          scale: { type: Type.STRING },
          duration: { type: Type.NUMBER, description: "Total duration analyzed in seconds" },
          chords: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                time: { type: Type.NUMBER, description: "Start time in seconds" },
                duration: { type: Type.NUMBER, description: "Duration in seconds" }
              },
              required: ["name", "time", "duration"]
            }
          },
          melody: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                note: { type: Type.STRING, description: "Note name with octave, e.g., C4" },
                time: { type: Type.NUMBER, description: "Start time in seconds" },
                duration: { type: Type.NUMBER, description: "Duration in seconds" }
              },
              required: ["note", "time", "duration"]
            }
          }
        },
        required: ["bpm", "timeSignature", "key", "scale", "duration", "chords", "melody"]
      }
    }
  });
  
  if (!response.text) {
    throw new Error("Não foi possível analisar o vídeo.");
  }

  const data = JSON.parse(response.text);
  
  const melody: AnalyzedNote[] = (data.melody || []).map((m: any) => ({
    note: m.note,
    time: m.time,
    duration: m.duration,
    midi: noteToMidi(m.note)
  }));
  
  const chords: AnalyzedChord[] = (data.chords || []).map((c: any) => ({
    name: c.name,
    time: c.time,
    duration: c.duration,
    notes: []
  }));
  
  const progression = chords.map(c => c.name);
  
  return {
    bpm: data.bpm || 120,
    timeSignature: data.timeSignature || "4/4",
    key: data.key || "C Major",
    scale: data.scale || "Major",
    melody,
    chords,
    progression,
    duration: data.duration || 60
  };
}
