import { parseChord, notesFlat } from "./chordLibrary";

export interface ReharmonizedProgressions {
  neoSoul: string[];
  jazz: string[];
  gospel: string[];
}

function getNoteName(rootIdx: number): string {
  return notesFlat[rootIdx];
}

function getDistance(root1: number, root2: number): number {
  return (root2 - root1 + 12) % 12;
}

export function reharmonize(chords: string[]): ReharmonizedProgressions {
  const parsedChords = chords.map(c => parseChord(c)).filter(Boolean) as NonNullable<ReturnType<typeof parseChord>>[];
  
  if (parsedChords.length === 0) {
    return { neoSoul: [], jazz: [], gospel: [] };
  }

  const neoSoul: string[] = [];
  const jazz: string[] = [];
  const gospel: string[] = [];

  for (let i = 0; i < parsedChords.length; i++) {
    const current = parsedChords[i];
    const next = i < parsedChords.length - 1 ? parsedChords[i + 1] : null;
    
    const rootName = getNoteName(current.rootIdx);
    
    // 1. Extensions
    let extNeo = rootName;
    let extJazz = rootName;
    let extGospel = rootName;

    if (current.quality === 'major') {
      extNeo += 'maj9';
      extJazz += 'maj9';
      extGospel += 'maj9';
    } else if (current.quality === 'minor') {
      extNeo += 'm11';
      extJazz += 'm9';
      extGospel += 'm9';
    } else if (current.quality === 'dominant') {
      extNeo += '9';
      extJazz += '13';
      extGospel += '13';
    } else if (current.quality === 'half-diminished') {
      extNeo += 'm7b5';
      extJazz += 'm7b5';
      extGospel += 'm7b5';
    } else {
      extNeo = current.original;
      extJazz = current.original;
      extGospel = current.original;
    }

    // Push the extended chord as the base for this position
    // BUT we might replace it entirely in some styles (like Jazz replacing V with II-V)
    
    let addedNeo = false;
    let addedJazz = false;
    let addedGospel = false;

    if (next) {
      const dist = getDistance(current.rootIdx, next.rootIdx);
      const nextRootName = getNoteName(next.rootIdx);
      
      // Target II-V roots
      const iiRoot = (next.rootIdx + 2) % 12;
      const vRoot = (next.rootIdx + 7) % 12;
      const iiName = getNoteName(iiRoot);
      const vName = getNoteName(vRoot);

      // --- JAZZ ---
      // If current is V of next (e.g. G -> C), replace G with Dm7 G7
      if (dist === 5) { // Perfect fourth up / fifth down
        if (next.quality === 'major') {
          jazz.push(`${iiName}m7`, `${vName}7`);
        } else {
          jazz.push(`${iiName}m7b5`, `${vName}7b9`);
        }
        addedJazz = true;
      } 
      // If moving to a minor chord (e.g. C -> Am), insert secondary II-V
      else if (next.quality === 'minor' && dist !== 5) {
        jazz.push(extJazz);
        jazz.push(`${iiName}m7b5`, `${vName}7b9`);
        addedJazz = true;
      }
      // Tritone substitution for dominants resolving down a fifth
      else if (current.quality === 'dominant' && dist === 5) {
        const tritoneRoot = (current.rootIdx + 6) % 12;
        jazz.push(`${getNoteName(tritoneRoot)}7#11`);
        addedJazz = true;
      }

      // --- NEO SOUL ---
      // Slash chords for stepwise or third motion
      if (dist === 2) { // Whole step up (C -> Dm)
        neoSoul.push(extNeo);
        const passingRoot = (current.rootIdx + 1) % 12;
        neoSoul.push(`${getNoteName(passingRoot)}dim7`); // Passing diminished
        addedNeo = true;
      } else if (dist === 9) { // Minor third down (C -> Am)
        neoSoul.push(extNeo);
        const slashBass = (current.rootIdx + 11) % 12; // B
        const slashChord = (current.rootIdx + 7) % 12; // G
        neoSoul.push(`${getNoteName(slashChord)}/${getNoteName(slashBass)}`); // G/B
        addedNeo = true;
      }

      // --- GOSPEL ---
      // Secondary dominants and passing diminished
      if (dist === 2) { // Whole step up (C -> Dm)
        gospel.push(extGospel);
        const dimRoot = (current.rootIdx + 1) % 12;
        gospel.push(`${getNoteName(dimRoot)}dim7`);
        addedGospel = true;
      } else if (dist === 5) { // V -> I
        gospel.push(`${iiName}m9`, `${vName}13`);
        addedGospel = true;
      } else if (dist === 9) { // C -> Am
        gospel.push(extGospel);
        gospel.push(`${vName}7#9`); // E7#9 -> Am
        addedGospel = true;
      }
    }

    if (!addedNeo) neoSoul.push(extNeo);
    if (!addedJazz) jazz.push(extJazz);
    if (!addedGospel) gospel.push(extGospel);
  }

  return { neoSoul, jazz, gospel };
}
