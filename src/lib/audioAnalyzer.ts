import { Midi } from '@tonejs/midi';
import { detectKey, analyzeChord } from './harmonicAnalysis';

export interface AnalyzedNote {
  note: string;
  time: number;
  duration: number;
  midi: number;
}

export interface AnalyzedChord {
  name: string;
  time: number;
  duration: number;
  notes: string[];
}

export interface AnalysisResult {
  bpm: number;
  timeSignature: string;
  key: string;
  scale: string;
  melody: AnalyzedNote[];
  chords: AnalyzedChord[];
  progression: string[];
  duration: number;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[midi % 12];
  return `${note}${octave}`;
}

function freqToMidi(freq: number): number {
  return Math.round(69 + 12 * Math.log2(freq / 440));
}

export async function analyzeFile(file: File): Promise<AnalysisResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'mid' || extension === 'midi') {
    return analyzeMidi(file);
  } else if (extension === 'mp3' || extension === 'wav') {
    return analyzeAudio(file);
  }
  
  throw new Error('Formato não suportado. Use MP3, WAV ou MIDI.');
}

async function analyzeMidi(file: File): Promise<AnalysisResult> {
  const arrayBuffer = await file.arrayBuffer();
  const midi = new Midi(arrayBuffer);
  
  const bpm = midi.header.tempos.length > 0 ? Math.round(midi.header.tempos[0].bpm) : 120;
  const timeSignature = midi.header.timeSignatures.length > 0 
    ? `${midi.header.timeSignatures[0].timeSignature[0]}/${midi.header.timeSignatures[0].timeSignature[1]}` 
    : '4/4';
    
  let allNotes: AnalyzedNote[] = [];
  
  midi.tracks.forEach(track => {
    track.notes.forEach(note => {
      allNotes.push({
        note: note.name,
        time: note.time,
        duration: note.duration,
        midi: note.midi
      });
    });
  });
  
  allNotes.sort((a, b) => a.time - b.time);
  
  // Extract melody (highest notes usually)
  const melody = extractMelodyFromNotes(allNotes);
  
  // Group into chords per measure
  const measureDuration = (60 / bpm) * parseInt(timeSignature.split('/')[0]);
  const chords = inferChordsFromMelody(melody, measureDuration);
  
  const progression = chords.map(c => c.name);
  const keyInfo = detectKey(progression);
  const keyName = NOTE_NAMES[keyInfo.rootIdx] + (keyInfo.quality === 'major' ? ' Major' : ' Minor');
  
  return {
    bpm,
    timeSignature,
    key: keyName,
    scale: keyInfo.quality === 'major' ? 'Jônio (Maior)' : 'Eólio (Menor)',
    melody,
    chords,
    progression,
    duration: midi.duration
  };
}

async function analyzeAudio(file: File): Promise<AnalysisResult> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  
  // Basic BPM detection (energy peaks)
  const bpm = await detectBPM(audioBuffer);
  const timeSignature = '4/4'; // Hard to detect perfectly, assuming 4/4
  const measureDuration = (60 / bpm) * 4;
  
  // Pitch detection using FFT on chunks
  const melody = await extractMelodyFromAudio(audioBuffer, audioCtx);
  
  const chords = inferChordsFromMelody(melody, measureDuration);
  const progression = chords.map(c => c.name);
  
  const keyInfo = detectKey(progression.length > 0 ? progression : ['C']);
  const keyName = NOTE_NAMES[keyInfo.rootIdx] + (keyInfo.quality === 'major' ? ' Major' : ' Minor');
  
  return {
    bpm,
    timeSignature,
    key: keyName,
    scale: keyInfo.quality === 'major' ? 'Jônio (Maior)' : 'Eólio (Menor)',
    melody,
    chords,
    progression,
    duration: audioBuffer.duration
  };
}

function extractMelodyFromNotes(notes: AnalyzedNote[]): AnalyzedNote[] {
  // Simple heuristic: take the highest note at any given time window
  const windowSize = 0.1; // 100ms
  const melody: AnalyzedNote[] = [];
  
  if (notes.length === 0) return melody;
  
  let currentWindowStart = notes[0].time;
  let currentWindowNotes: AnalyzedNote[] = [];
  
  for (const note of notes) {
    if (note.time < currentWindowStart + windowSize) {
      currentWindowNotes.push(note);
    } else {
      if (currentWindowNotes.length > 0) {
        // Find highest pitch
        const highest = currentWindowNotes.reduce((prev, current) => (prev.midi > current.midi) ? prev : current);
        melody.push(highest);
      }
      currentWindowStart = note.time;
      currentWindowNotes = [note];
    }
  }
  
  if (currentWindowNotes.length > 0) {
    const highest = currentWindowNotes.reduce((prev, current) => (prev.midi > current.midi) ? prev : current);
    melody.push(highest);
  }
  
  return melody;
}

export function inferChordsFromMelody(melody: AnalyzedNote[], measureDuration: number): AnalyzedChord[] {
  const chords: AnalyzedChord[] = [];
  if (melody.length === 0) return chords;
  
  const totalDuration = melody[melody.length - 1].time + melody[melody.length - 1].duration;
  const numMeasures = Math.ceil(totalDuration / measureDuration);
  
  for (let m = 0; m < numMeasures; m++) {
    const measureStart = m * measureDuration;
    const measureEnd = measureStart + measureDuration;
    
    const notesInMeasure = melody.filter(n => n.time >= measureStart && n.time < measureEnd);
    
    if (notesInMeasure.length > 0) {
      // Count note occurrences (weighted by duration)
      const noteWeights: Record<string, number> = {};
      notesInMeasure.forEach(n => {
        const noteClass = n.note.replace(/[0-9]/g, '');
        noteWeights[noteClass] = (noteWeights[noteClass] || 0) + n.duration;
      });
      
      // Sort by weight
      const sortedNotes = Object.entries(noteWeights)
        .sort((a, b) => b[1] - a[1])
        .map(e => e[0]);
        
      const root = sortedNotes[0];
      let quality = 'major';
      
      // Try to guess quality based on other notes
      if (sortedNotes.length > 1) {
        const rootIdx = NOTE_NAMES.indexOf(root);
        const hasMinorThird = sortedNotes.some(n => NOTE_NAMES.indexOf(n) === (rootIdx + 3) % 12);
        if (hasMinorThird) quality = 'minor';
      }
      
      const chordName = quality === 'minor' ? `${root}m` : root;
      
      chords.push({
        name: chordName,
        time: measureStart,
        duration: measureDuration,
        notes: sortedNotes.slice(0, 4)
      });
    } else {
      // If no notes, repeat previous chord or use C
      const prevChord = chords.length > 0 ? chords[chords.length - 1].name : 'C';
      chords.push({
        name: prevChord,
        time: measureStart,
        duration: measureDuration,
        notes: []
      });
    }
  }
  
  return chords;
}

// Simple BPM detection based on energy peaks
async function detectBPM(buffer: AudioBuffer): Promise<number> {
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  
  // Very simplified beat detection: find peaks
  const peaks = [];
  const threshold = 0.5;
  const minPeakDistance = sampleRate / 4; // Max 240 BPM
  
  let lastPeak = 0;
  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) > threshold && i - lastPeak > minPeakDistance) {
      peaks.push(i);
      lastPeak = i;
    }
  }
  
  if (peaks.length < 2) return 120;
  
  const intervals = [];
  for (let i = 1; i < peaks.length; i++) {
    intervals.push((peaks[i] - peaks[i-1]) / sampleRate);
  }
  
  // Find median interval
  intervals.sort((a, b) => a - b);
  const medianInterval = intervals[Math.floor(intervals.length / 2)];
  
  let bpm = Math.round(60 / medianInterval);
  if (bpm < 60) bpm *= 2;
  if (bpm > 200) bpm /= 2;
  
  return bpm;
}

// Extract dominant frequencies using FFT
async function extractMelodyFromAudio(buffer: AudioBuffer, ctx: AudioContext): Promise<AnalyzedNote[]> {
  const offlineCtx = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  
  const analyser = offlineCtx.createAnalyser();
  analyser.fftSize = 4096;
  
  source.connect(analyser);
  analyser.connect(offlineCtx.destination);
  source.start(0);
  
  // We can't step through OfflineAudioContext easily in standard Web Audio API without Suspend/Resume
  // So we'll use a ScriptProcessor or just process the raw buffer manually for pitch detection
  // For a web app, doing full FFT over a long song in JS is slow.
  // We will use a simplified zero-crossing or autocorrelation on chunks of the raw buffer.
  
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const chunkSize = Math.floor(sampleRate * 0.25); // 250ms chunks
  const melody: AnalyzedNote[] = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    if (chunk.length < chunkSize) break;
    
    // Calculate RMS energy
    let rms = 0;
    for (let j = 0; j < chunk.length; j++) {
      rms += chunk[j] * chunk[j];
    }
    rms = Math.sqrt(rms / chunk.length);
    
    if (rms > 0.05) { // Only process if there's significant audio
      const freq = autoCorrelate(chunk, sampleRate);
      if (freq > 50 && freq < 2000) {
        const midi = freqToMidi(freq);
        melody.push({
          note: midiToNoteName(midi),
          time: i / sampleRate,
          duration: 0.25,
          midi: midi
        });
      }
    }
  }
  
  return melody;
}

// YIN-like autocorrelation for pitch detection
function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  let SIZE = buffer.length;
  let sumOfSquares = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    sumOfSquares += val * val;
  }
  
  const rootMeanSquare = Math.sqrt(sumOfSquares / SIZE);
  if (rootMeanSquare < 0.01) return -1;

  let r1 = 0, r2 = SIZE - 1, thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  }

  buffer = buffer.slice(r1, r2);
  SIZE = buffer.length;

  const c = new Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) {
      c[i] = c[i] + buffer[j] * buffer[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  
  let maxval = -1, maxpos = -1;
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  
  let T0 = maxpos;
  return sampleRate / T0;
}
