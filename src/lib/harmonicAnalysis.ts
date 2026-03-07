export type HarmonicFunction = 'Tonic' | 'Subdominant' | 'Dominant' | 'Unknown';

export interface ChordAnalysis {
  chordName: string;
  rootIdx: number;
  quality: string;
  romanNumeral: string;
  harmonicFunction: HarmonicFunction;
  scales: string[];
  nextSuggestions: string[];
}

const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function getNoteIndex(note: string): number {
  const match = note.match(/^([A-G])([b#]?)/i);
  if (!match) return 0;
  let base = ["C", "D", "E", "F", "G", "A", "B"].indexOf(match[1].toUpperCase());
  const baseIndices = [0, 2, 4, 5, 7, 9, 11];
  let idx = baseIndices[base];
  if (match[2] === '#') idx++;
  if (match[2] === 'b') idx--;
  return (idx + 12) % 12;
}

export function analyzeChord(chordName: string, keyRootIdx: number, keyQuality: 'major' | 'minor'): ChordAnalysis {
  // Basic parsing
  const match = chordName.match(/^([A-G][b#]?)(.*)$/i);
  const rootStr = match ? match[1] : 'C';
  const ext = match ? match[2].toLowerCase() : '';
  const rootIdx = getNoteIndex(rootStr);
  
  let quality = 'major';
  if (ext.includes('m7b5') || ext.includes('ø') || ext.includes('hdim')) quality = 'half-diminished';
  else if (ext.startsWith('m') && !ext.startsWith('maj') || ext.includes('min') || ext.includes('-')) quality = 'minor';
  else if (ext.includes('dim') || ext.includes('o')) quality = 'diminished';
  else if (ext.match(/^[79]/) || ext.includes('11') || ext.includes('13') || ext.includes('alt')) quality = 'dominant';

  // Determine interval from key
  const interval = (rootIdx - keyRootIdx + 12) % 12;
  
  let romanNumeral = '?';
  let harmonicFunction: HarmonicFunction = 'Unknown';
  let scales: string[] = [];
  let nextSuggestions: string[] = [];

  if (keyQuality === 'major') {
    switch (interval) {
      case 0: // I
        romanNumeral = quality === 'major' ? 'Imaj7' : (quality === 'dominant' ? 'I7' : 'Im7');
        harmonicFunction = quality === 'dominant' ? 'Dominant' : 'Tonic';
        scales = quality === 'major' ? ['Jônio (Maior)', 'Lídio'] : ['Mixolídio', 'Blues'];
        nextSuggestions = ['IVmaj7', 'IIm7', 'VIm7'];
        break;
      case 2: // II
        romanNumeral = quality === 'minor' ? 'IIm7' : (quality === 'dominant' ? 'II7' : 'II');
        harmonicFunction = quality === 'dominant' ? 'Dominant' : 'Subdominant';
        scales = quality === 'minor' ? ['Dórico'] : ['Mixolídio', 'Lídio b7'];
        nextSuggestions = ['V7', 'bII7'];
        break;
      case 4: // III
        romanNumeral = quality === 'minor' ? 'IIIm7' : (quality === 'dominant' ? 'III7' : 'III');
        harmonicFunction = quality === 'dominant' ? 'Dominant' : 'Tonic';
        scales = quality === 'minor' ? ['Frígio'] : ['Mixolídio b9 b13', 'Alterada'];
        nextSuggestions = ['VIm7', 'IVmaj7'];
        break;
      case 5: // IV
        romanNumeral = quality === 'major' ? 'IVmaj7' : (quality === 'minor' ? 'IVm7' : 'IV');
        harmonicFunction = quality === 'minor' ? 'Subdominant' : 'Subdominant';
        scales = quality === 'major' ? ['Lídio'] : ['Dórico', 'Menor Melódica'];
        nextSuggestions = ['V7', 'Imaj7', 'IIIm7'];
        break;
      case 7: // V
        romanNumeral = quality === 'dominant' ? 'V7' : (quality === 'minor' ? 'Vm7' : 'V');
        harmonicFunction = 'Dominant';
        scales = quality === 'dominant' ? ['Mixolídio', 'Alterada', 'Diminuta (Dom)'] : ['Dórico'];
        nextSuggestions = ['Imaj7', 'VIm7'];
        break;
      case 9: // VI
        romanNumeral = quality === 'minor' ? 'VIm7' : (quality === 'dominant' ? 'VI7' : 'VI');
        harmonicFunction = quality === 'dominant' ? 'Dominant' : 'Tonic';
        scales = quality === 'minor' ? ['Eólio', 'Dórico'] : ['Mixolídio b9 b13', 'Alterada'];
        nextSuggestions = ['IIm7', 'IVmaj7'];
        break;
      case 11: // VII
        romanNumeral = quality === 'half-diminished' ? 'VIIm7b5' : (quality === 'diminished' ? 'VIIdim7' : 'VII');
        harmonicFunction = 'Dominant';
        scales = quality === 'half-diminished' ? ['Lócrio'] : ['Diminuta'];
        nextSuggestions = ['III7', 'Imaj7'];
        break;
      case 1: // bII
        romanNumeral = quality === 'dominant' ? 'bII7' : 'bII';
        harmonicFunction = 'Dominant';
        scales = ['Lídio b7', 'Alterada'];
        nextSuggestions = ['Imaj7'];
        break;
      case 3: // bIII
        romanNumeral = 'bIII';
        harmonicFunction = 'Tonic';
        scales = ['Lídio'];
        nextSuggestions = ['IVmaj7', 'IIm7'];
        break;
      case 6: // bV / #IV
        romanNumeral = quality === 'half-diminished' ? '#IVm7b5' : 'bV7';
        harmonicFunction = 'Dominant';
        scales = ['Lídio b7', 'Lócrio'];
        nextSuggestions = ['IVmaj7', 'Imaj7'];
        break;
      case 8: // bVI
        romanNumeral = 'bVImaj7';
        harmonicFunction = 'Subdominant';
        scales = ['Lídio'];
        nextSuggestions = ['bVII7', 'V7'];
        break;
      case 10: // bVII
        romanNumeral = quality === 'dominant' ? 'bVII7' : 'bVIImaj7';
        harmonicFunction = 'Subdominant';
        scales = ['Lídio b7', 'Mixolídio'];
        nextSuggestions = ['Imaj7'];
        break;
    }
  }

  // Fallback for missing scales
  if (scales.length === 0) {
    if (quality === 'major') scales = ['Jônio', 'Lídio'];
    else if (quality === 'minor') scales = ['Dórico', 'Eólio'];
    else if (quality === 'dominant') scales = ['Mixolídio', 'Alterada'];
    else if (quality === 'half-diminished') scales = ['Lócrio'];
    else if (quality === 'diminished') scales = ['Diminuta'];
  }

  return {
    chordName,
    rootIdx,
    quality,
    romanNumeral,
    harmonicFunction,
    scales,
    nextSuggestions
  };
}

export function detectKey(chords: string[]): { rootIdx: number, quality: 'major' | 'minor' } {
  if (chords.length === 0) return { rootIdx: 0, quality: 'major' };
  
  // Simple heuristic: look at the last chord
  const lastChord = chords[chords.length - 1];
  const match = lastChord.match(/^([A-G][b#]?)(.*)$/i);
  if (!match) return { rootIdx: 0, quality: 'major' };
  
  const rootIdx = getNoteIndex(match[1]);
  const ext = match[2].toLowerCase();
  
  let quality: 'major' | 'minor' = 'major';
  if (ext.startsWith('m') && !ext.startsWith('maj') || ext.includes('min') || ext.includes('-')) {
    quality = 'minor';
  }
  
  return { rootIdx, quality };
}
