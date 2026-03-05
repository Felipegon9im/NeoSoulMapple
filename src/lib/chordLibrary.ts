export const notesFlat = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];
export const displayNotes = [
  "C",
  "C#",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "Bb",
  "B",
];
export const guitarTuning = [4, 11, 7, 2, 9, 4]; // E A D G B E

export const voicingLabels: Record<string, string> = {
  open_chord: "Open Chord",
  barre_chord: "Pestana",
  triad: "Tríade",
  triad_inversion: "Inversão",
  shell_voicing: "Shell",
  drop2: "Drop 2",
  drop3: "Drop 3",
  drop2_4: "Drop 2&4",
  spread_voicing: "Spread",
  closed_voicing: "Closed",
  quartal: "Quartal",
  cluster: "Cluster",
  neo_soul_voicing: "Neo Soul",
  jazz_voicing: "Jazz",
  guide_tone: "Guide Tones",
  rootless_voicing: "Rootless",
  upper_structure: "Upper Struct.",
  power_chord: "Power",
  octave_chord: "Oitava",
};

export type FretValue = number | "x";

export interface VoicingTemplate {
  type: string;
  R: number;
  S: FretValue[];
}

export const library: Record<string, VoicingTemplate[]> = {
  maj7: [
    { type: "open_chord", R: 5, S: ["x", 0, 2, 1, 2, 0] },
    { type: "barre_chord", R: 6, S: [0, 2, 2, 1, 0, 0] },
    { type: "triad", R: 5, S: ["x", 0, 2, 2, 2, "x"] },
    { type: "triad_inversion", R: 4, S: ["x", "x", 0, 2, 3, 2] },
    { type: "shell_voicing", R: 6, S: [0, "x", 1, 1, "x", "x"] },
    { type: "drop2", R: 5, S: ["x", 0, 2, 1, 2, "x"] },
    { type: "drop3", R: 6, S: [0, "x", 1, 1, 0, "x"] },
    { type: "drop2_4", R: 6, S: [0, 2, "x", 1, 2, "x"] },
    { type: "spread_voicing", R: 6, S: [0, 7, 6, 8, "x", "x"] },
    { type: "closed_voicing", R: 4, S: ["x", "x", 0, 0, 0, 2] },
    { type: "quartal", R: 5, S: ["x", 0, 0, 0, "x", "x"] },
    { type: "cluster", R: 4, S: ["x", "x", 0, 1, 2, 3] },
    { type: "neo_soul_voicing", R: 5, S: ["x", 0, 2, 1, 0, "x"] },
    { type: "jazz_voicing", R: 5, S: ["x", 0, 4, 3, 4, "x"] },
    { type: "guide_tone", R: 5, S: ["x", "x", 1, 1, "x", "x"] },
    { type: "rootless_voicing", R: 4, S: ["x", "x", 0, 2, 2, 2] },
    { type: "upper_structure", R: 5, S: ["x", 0, 4, 1, 2, "x"] },
    { type: "power_chord", R: 6, S: [0, 2, "x", "x", "x", "x"] },
    { type: "octave_chord", R: 6, S: [0, "x", 2, "x", "x", "x"] },
  ],
  m11: [
    { type: "neo_soul_voicing", R: 5, S: ["x", 0, 0, 0, 1, "x"] },
    { type: "quartal", R: 6, S: [0, "x", 0, 0, 0, "x"] },
    { type: "shell_voicing", R: 5, S: ["x", 0, -2, 0, "x", "x"] },
    { type: "open_chord", R: 6, S: [0, "x", 0, 0, 0, 0] },
    { type: "drop2", R: 5, S: ["x", 0, -2, 0, 0, "x"] },
  ],
  "11": [
    { type: "neo_soul_voicing", R: 5, S: ["x", 0, 0, 0, 0, "x"] },
    { type: "jazz_voicing", R: 6, S: [0, "x", 0, -1, -2, "x"] },
    { type: "quartal", R: 5, S: ["x", 0, 0, 0, "x", "x"] },
  ],
};

export function getNoteIndex(noteStr: string) {
  let clean = noteStr.charAt(0).toUpperCase() + noteStr.slice(1);
  let idx = notesFlat.indexOf(clean);
  return idx !== -1 ? idx : 0;
}

export function parseChord(chordRaw: string) {
  const match = chordRaw.match(/^([A-G][b#]?)(.*)$/i);
  if (!match) return null;
  const ext = match[2].toLowerCase();
  
  let type = "maj7";
  let quality: "major" | "minor" | "dominant" = "major";

  if (ext.startsWith("m") && !ext.startsWith("maj") || ext.includes("min") || ext.includes("-")) {
    type = "m11";
    quality = "minor";
  } else if ((ext.includes("11") && !ext.includes("maj")) || ext.includes("sus") || ext.match(/^[79]/)) {
    type = "11";
    quality = "dominant";
  } else {
    type = "maj7";
    quality = "major";
  }

  return { original: chordRaw, rootIdx: getNoteIndex(match[1]), type, quality };
}

export function getChordRelations(rootIdx: number, quality: "major" | "minor" | "dominant") {
  const getNote = (idx: number) => displayNotes[(idx + 120) % 12];
  
  let relative = "";
  let ii_V_I = "";

  if (quality === "major") {
    relative = `${getNote(rootIdx - 3)}m7`;
    ii_V_I = `${getNote(rootIdx + 2)}m7 - ${getNote(rootIdx + 7)}7 - ${getNote(rootIdx)}maj7`;
  } else if (quality === "minor") {
    relative = `${getNote(rootIdx + 3)}maj7`;
    ii_V_I = `${getNote(rootIdx + 2)}m7b5 - ${getNote(rootIdx + 7)}7b9 - ${getNote(rootIdx)}m7`;
  } else if (quality === "dominant") {
    relative = "-";
    ii_V_I = `${getNote(rootIdx - 5)}m7 - ${getNote(rootIdx)}7 - ${getNote(rootIdx - 7)}maj7`;
  }

  return { relative, ii_V_I };
}

export interface Variation {
  category: string;
  label: string;
  frets: FretValue[];
  startFret: number;
}

export function getVariations(rootIdx: number, type: string): Variation[] {
  const templates = library[type] || library["maj7"];
  let items: Variation[] = [];
  templates.forEach((t) => {
    const tuningNote = guitarTuning[6 - t.R];
    let baseFret = (rootIdx - tuningNote + 12) % 12;
    if (baseFret === 0 && t.type !== "open_chord") baseFret = 12;

    const octaves = [baseFret, baseFret + 12, baseFret - 12];
    octaves.forEach((f) => {
      let shape = t.S.map((offset) =>
        offset === "x" ? "x" : f + (offset as number),
      );
      let valid = shape.filter((v) => v !== "x") as number[];
      if (valid.length > 0) {
        let min = Math.min(...valid);
        let max = Math.max(...valid);
        if (min >= 0 && max <= 22 && max - min <= 5) {
          items.push({
            category: t.type,
            label: voicingLabels[t.type] || t.type,
            frets: shape,
            startFret: min,
          });
        }
      }
    });
  });
  return items.sort((a, b) => a.startFret - b.startFret);
}

export const scaleFormulas = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  major_pentatonic: [0, 2, 4, 7, 9],
  minor_pentatonic: [0, 3, 5, 7, 10],
};

export interface ScaleSuggestion {
  name: string;
  notes: string[];
  usage: string;
  scaleIndices: number[];
  rootIdx: number;
}

export function getScaleSuggestions(rootIdx: number, quality: "major" | "minor" | "dominant"): ScaleSuggestion[] {
  const getNote = (idx: number) => displayNotes[(idx + 120) % 12];
  const getNotes = (root: number, formula: number[]) => formula.map(i => getNote(root + i));
  const getIndices = (root: number, formula: number[]) => formula.map(i => (root + i + 120) % 12);

  const suggestions: ScaleSuggestion[] = [];

  if (quality === "major") {
    suggestions.push({
      name: `${getNote(rootIdx)} Jônio`,
      notes: getNotes(rootIdx, scaleFormulas.ionian),
      usage: "Base harmônica, repouso e melodia principal.",
      scaleIndices: getIndices(rootIdx, scaleFormulas.ionian),
      rootIdx: (rootIdx + 120) % 12
    });
    suggestions.push({
      name: `${getNote(rootIdx - 3)} Menor Pentatônica`,
      notes: getNotes(rootIdx - 3, scaleFormulas.minor_pentatonic),
      usage: "Relativo menor (VI grau). Sonoridade segura e familiar.",
      scaleIndices: getIndices(rootIdx - 3, scaleFormulas.minor_pentatonic),
      rootIdx: (rootIdx - 3 + 120) % 12
    });
    suggestions.push({
      name: `${getNote(rootIdx + 4)} Menor Pentatônica`,
      notes: getNotes(rootIdx + 4, scaleFormulas.minor_pentatonic),
      usage: "Pentatônica da 3ª. Destaca a 7M e 9ª (sonoridade jazz/neo soul).",
      scaleIndices: getIndices(rootIdx + 4, scaleFormulas.minor_pentatonic),
      rootIdx: (rootIdx + 4 + 120) % 12
    });
    suggestions.push({
      name: `${getNote(rootIdx + 7)} Maior Pentatônica`,
      notes: getNotes(rootIdx + 7, scaleFormulas.major_pentatonic),
      usage: "Pentatônica da 5ª. Som brilhante e aberto.",
      scaleIndices: getIndices(rootIdx + 7, scaleFormulas.major_pentatonic),
      rootIdx: (rootIdx + 7 + 120) % 12
    });
    suggestions.push({
      name: `${getNote(rootIdx + 2)} Menor Pentatônica`,
      notes: getNotes(rootIdx + 2, scaleFormulas.minor_pentatonic),
      usage: "Pentatônica do II grau. Adiciona a 6ª e 9ª ao acorde.",
      scaleIndices: getIndices(rootIdx + 2, scaleFormulas.minor_pentatonic),
      rootIdx: (rootIdx + 2 + 120) % 12
    });
    suggestions.push({
      name: `${getNote(rootIdx + 1)} Menor Pentatônica`,
      notes: getNotes(rootIdx + 1, scaleFormulas.minor_pentatonic),
      usage: "Tensão (Approach). Use para criar instabilidade antes de resolver.",
      scaleIndices: getIndices(rootIdx + 1, scaleFormulas.minor_pentatonic),
      rootIdx: (rootIdx + 1 + 120) % 12
    });
  } else if (quality === "minor") {
    suggestions.push({
      name: `${getNote(rootIdx)} Dórico`,
      notes: getNotes(rootIdx, scaleFormulas.dorian),
      usage: "Base harmônica. Som característico do Neo Soul e R&B.",
      scaleIndices: getIndices(rootIdx, scaleFormulas.dorian),
      rootIdx: (rootIdx + 120) % 12
    });
    suggestions.push({
      name: `${getNote(rootIdx)} Menor Pentatônica`,
      notes: getNotes(rootIdx, scaleFormulas.minor_pentatonic),
      usage: "Sonoridade bluesy e direta.",
      scaleIndices: getIndices(rootIdx, scaleFormulas.minor_pentatonic),
      rootIdx: (rootIdx + 120) % 12
    });
    suggestions.push({
      name: `${getNote(rootIdx + 7)} Menor Pentatônica`,
      notes: getNotes(rootIdx + 7, scaleFormulas.minor_pentatonic),
      usage: "Pentatônica da 5ª. Destaca a 9ª e 11ª do acorde menor.",
      scaleIndices: getIndices(rootIdx + 7, scaleFormulas.minor_pentatonic),
      rootIdx: (rootIdx + 7 + 120) % 12
    });
    suggestions.push({
      name: `${getNote(rootIdx + 2)} Menor Pentatônica`,
      notes: getNotes(rootIdx + 2, scaleFormulas.minor_pentatonic),
      usage: "Pentatônica do II grau. Adiciona a 6ª maior (som Dórico).",
      scaleIndices: getIndices(rootIdx + 2, scaleFormulas.minor_pentatonic),
      rootIdx: (rootIdx + 2 + 120) % 12
    });
    suggestions.push({
      name: `${getNote(rootIdx + 1)} Menor Pentatônica`,
      notes: getNotes(rootIdx + 1, scaleFormulas.minor_pentatonic),
      usage: "Tensão (Approach). Outside playing para criar surpresa.",
      scaleIndices: getIndices(rootIdx + 1, scaleFormulas.minor_pentatonic),
      rootIdx: (rootIdx + 1 + 120) % 12
    });
  } else if (quality === "dominant") {
    suggestions.push({
      name: `${getNote(rootIdx)} Mixolídio`,
      notes: getNotes(rootIdx, scaleFormulas.mixolydian),
      usage: "Base harmônica. Som dominante padrão.",
      scaleIndices: getIndices(rootIdx, scaleFormulas.mixolydian),
      rootIdx: (rootIdx + 120) % 12
    });
    suggestions.push({
      name: `${getNote(rootIdx)} Menor Pentatônica`,
      notes: getNotes(rootIdx, scaleFormulas.minor_pentatonic),
      usage: "Sonoridade Blues/Rock. Choque da 3ª menor com a 3ª maior.",
      scaleIndices: getIndices(rootIdx, scaleFormulas.minor_pentatonic),
      rootIdx: (rootIdx + 120) % 12
    });
    suggestions.push({
      name: `${getNote(rootIdx + 3)} Menor Pentatônica`,
      notes: getNotes(rootIdx + 3, scaleFormulas.minor_pentatonic),
      usage: "Pentatônica da 3ª menor. Som alterado (b9, #9).",
      scaleIndices: getIndices(rootIdx + 3, scaleFormulas.minor_pentatonic),
      rootIdx: (rootIdx + 3 + 120) % 12
    });
    suggestions.push({
      name: `${getNote(rootIdx + 7)} Menor Pentatônica`,
      notes: getNotes(rootIdx + 7, scaleFormulas.minor_pentatonic),
      usage: "Pentatônica da 5ª. Som suspenso (11ª).",
      scaleIndices: getIndices(rootIdx + 7, scaleFormulas.minor_pentatonic),
      rootIdx: (rootIdx + 7 + 120) % 12
    });
    suggestions.push({
      name: `${getNote(rootIdx + 1)} Menor Pentatônica`,
      notes: getNotes(rootIdx + 1, scaleFormulas.minor_pentatonic),
      usage: "Tensão (Altered scale sound). Resolve meio tom abaixo.",
      scaleIndices: getIndices(rootIdx + 1, scaleFormulas.minor_pentatonic),
      rootIdx: (rootIdx + 1 + 120) % 12
    });
  }

  return suggestions;
}

export function getChordTones(rootIdx: number, quality: "major" | "minor" | "dominant") {
  let intervals: number[] = [];
  if (quality === "major") intervals = [0, 4, 7, 11];
  else if (quality === "minor") intervals = [0, 3, 7, 10];
  else if (quality === "dominant") intervals = [0, 4, 7, 10];
  
  return intervals.map(i => (rootIdx + i) % 12);
}

export function getMajorScaleIndices(rootIndex: number) {
  return [0, 2, 4, 5, 7, 9, 11].map((i) => (rootIndex + i) % 12);
}

export function getNoteName(index: number) {
  return displayNotes[(index + 12) % 12];
}
