let audioCtx: AudioContext | null = null;

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function getFreq(noteIdx: number, octave: number) {
  if (isNaN(noteIdx) || isNaN(octave)) return 440;
  const midiNote = 12 * (octave + 1) + noteIdx;
  const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
  return isFinite(freq) && freq > 0 ? freq : 440;
}

export function playTone(freq: number, time: number, duration: number, vol = 0.3, type: OscillatorType = 'triangle') {
  if (!isFinite(freq) || !isFinite(time) || !isFinite(duration) || !isFinite(vol) || freq <= 0) return;

  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc.type = type;
  osc.frequency.value = freq;
  
  // Pluck-like filter envelope
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(type === 'sawtooth' ? 4000 : 2000, time);
  filter.frequency.exponentialRampToValueAtTime(400, time + 0.5);
  
  // Pluck-like amplitude envelope (fast attack, exponential decay)
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(time);
  osc.stop(time + duration);
}

export function playMetronome(time: number) {
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(800, time);
  osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);
  
  gain.gain.setValueAtTime(0.1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(time);
  osc.stop(time + 0.05);
}

export function playChord(rootIdx: number, quality: string, customIntervals?: number[]) {
  const ctx = initAudio();
  const now = ctx.currentTime;
  
  let intervals = customIntervals || [0, 4, 7, 11]; // major
  if (!customIntervals) {
    if (quality === 'minor') intervals = [0, 3, 7, 10];
    else if (quality === 'dominant') intervals = [0, 4, 7, 10];
    else if (quality === 'half-diminished') intervals = [0, 3, 6, 10];
  }
  
  if (!intervals || intervals.length === 0) {
    intervals = [0, 4, 7];
  }
  
  // Play an arpeggio (dedilhado)
  const arpDelay = 0.15; // 150ms between notes
  intervals.forEach((interval, i) => {
    const freq = getFreq((rootIdx + interval) % 12, 3 + Math.floor((rootIdx + interval)/12));
    playTone(freq, now + i * arpDelay, 3.0, 0.2, 'sine');
    playTone(freq, now + i * arpDelay, 3.0, 0.1, 'triangle');
  });
}

export function playProgression(chords: {rootIdx: number, quality: string}[], bpm: number, beatsPerMeasure: number = 4) {
  const customChords = chords.map(c => ({ ...c, beats: beatsPerMeasure }));
  playCustomProgression(customChords, bpm);
}

export function playCustomProgression(chords: {rootIdx: number, quality: string, beats: number, intervals?: number[]}[], bpm: number) {
  const ctx = initAudio();
  const now = ctx.currentTime;
  const beatLen = 60 / bpm;
  
  let timeOffset = 0;
  
  chords.forEach((chord) => {
    // Metronome beats per chord
    for (let i = 0; i < chord.beats; i++) {
      playMetronome(now + timeOffset + i * beatLen);
    }
    
    let intervals = chord.intervals || [0, 4, 7, 11]; // major
    if (!chord.intervals) {
      if (chord.quality === 'minor') intervals = [0, 3, 7, 10];
      else if (chord.quality === 'dominant') intervals = [0, 4, 7, 10];
      else if (chord.quality === 'half-diminished') intervals = [0, 3, 6, 10];
    }
    
    // Ensure intervals array is valid and not empty
    if (!intervals || intervals.length === 0) {
      intervals = [0, 4, 7];
    }
    
    // Arpeggio (dedilhado) pattern
    const playArp = (time: number) => {
      const bassFreq = getFreq(chord.rootIdx, 2);
      // Bass rings for the duration of the chord + a little tail
      playTone(bassFreq, time, chord.beats * beatLen + 0.5, 0.25, 'sine');
      playTone(bassFreq, time, chord.beats * beatLen + 0.5, 0.1, 'triangle');

      if (chord.beats <= 1) {
        // Quick roll (strum) for 1 beat
        intervals.forEach((interval, i) => {
          const freq = getFreq((chord.rootIdx + interval) % 12, 3 + Math.floor((chord.rootIdx + interval)/12));
          playTone(freq, time + i * 0.03, beatLen + 0.5, 0.15, 'sine');
          playTone(freq, time + i * 0.03, beatLen + 0.5, 0.08, 'triangle');
        });
      } else {
        // Arpeggio for 2 or more beats
        const arpDelay = beatLen / 2; // Eighth notes
        const totalNotes = chord.beats * 2;
        
        // Pattern: root, 3rd, 5th, 7th, 5th, 3rd, root, 3rd...
        const pattern = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3]; 
        
        for (let i = 0; i < totalNotes; i++) {
          const interval = intervals[pattern[i % pattern.length]];
          const freq = getFreq((chord.rootIdx + interval) % 12, 3 + Math.floor((chord.rootIdx + interval)/12));
          
          // Let each note ring for a bit
          playTone(freq, time + i * arpDelay, beatLen * 1.5, 0.15, 'sine');
          playTone(freq, time + i * arpDelay, beatLen * 1.5, 0.08, 'triangle');
        }
      }
    };

    playArp(now + timeOffset);
    
    timeOffset += chord.beats * beatLen;
  });
}

export function playLick(scaleRootIdx: number, scaleName: string, chordRootIdx: number, chordQuality: string, bpm: number = 85, iiVIProgression?: {rootIdx: number, quality: string}[], beatsPerMeasure: number = 4) {
  const ctx = initAudio();
  const now = ctx.currentTime;
  const beatLen = 60 / bpm;
  
  let timeOffset = 0;

  // Play II-V if it exists
  if (iiVIProgression && iiVIProgression.length === 3) {
    const prepChords = [iiVIProgression[0], iiVIProgression[1]];
    
    prepChords.forEach((chord, index) => {
      const chordTimeOffset = index * beatsPerMeasure * beatLen;
      
      for (let i = 0; i < beatsPerMeasure; i++) {
        playMetronome(now + chordTimeOffset + i * beatLen);
      }
      
      let intervals = [0, 4, 7, 11]; // major
      if (chord.quality === 'minor') intervals = [0, 3, 7, 10];
      else if (chord.quality === 'dominant') intervals = [0, 4, 7, 10];
      else if (chord.quality === 'half-diminished') intervals = [0, 3, 6, 10];
      
      if (!intervals || intervals.length === 0) {
        intervals = [0, 4, 7];
      }
      
      const playArp = (time: number) => {
        const bassFreq = getFreq(chord.rootIdx, 2);
        playTone(bassFreq, time, beatsPerMeasure * beatLen + 0.5, 0.25, 'sine');
        playTone(bassFreq, time, beatsPerMeasure * beatLen + 0.5, 0.1, 'triangle');

        const arpDelay = beatLen / 2;
        const totalNotes = beatsPerMeasure * 2;
        const pattern = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3];
        
        for (let i = 0; i < totalNotes; i++) {
          const interval = intervals[pattern[i % pattern.length]];
          const freq = getFreq((chord.rootIdx + interval) % 12, 3 + Math.floor((chord.rootIdx + interval)/12));
          playTone(freq, time + i * arpDelay, beatLen * 1.5, 0.15, 'sine');
          playTone(freq, time + i * arpDelay, beatLen * 1.5, 0.08, 'triangle');
        }
      };

      playArp(now + chordTimeOffset);
    });
    
    timeOffset = 2 * beatsPerMeasure * beatLen; // 2 measures of preparation
  }

  // Metronome beats for the target chord
  for (let i = 0; i < beatsPerMeasure; i++) {
    playMetronome(now + timeOffset + i * beatLen);
  }
  
  // Play backing chord on beat 1
  let intervals = [0, 4, 7, 11];
  if (chordQuality === 'minor') intervals = [0, 3, 7, 10];
  else if (chordQuality === 'dominant') intervals = [0, 4, 7, 10];
  else if (chordQuality === 'half-diminished') intervals = [0, 3, 6, 10];
  
  if (!intervals || intervals.length === 0) {
    intervals = [0, 4, 7];
  }
  
  const playArp = (time: number) => {
    const bassFreq = getFreq(chordRootIdx, 2);
    playTone(bassFreq, time, beatsPerMeasure * beatLen + 0.5, 0.25, 'sine');
    playTone(bassFreq, time, beatsPerMeasure * beatLen + 0.5, 0.1, 'triangle');

    const arpDelay = beatLen / 2;
    const totalNotes = beatsPerMeasure * 2;
    const pattern = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3];
    
    for (let i = 0; i < totalNotes; i++) {
      const interval = intervals[pattern[i % pattern.length]];
      const freq = getFreq((chordRootIdx + interval) % 12, 3 + Math.floor((chordRootIdx + interval)/12));
      playTone(freq, time + i * arpDelay, beatLen * 1.5, 0.15, 'sine');
      playTone(freq, time + i * arpDelay, beatLen * 1.5, 0.08, 'triangle');
    }
  };
  playArp(now + timeOffset);

  // Play lick notes
  let pattern: { offset: number, time: number, dur: number }[] = [];
  
  if (scaleName.includes('Menor Pentatônica')) {
    pattern = [
      { offset: 0, time: 0.5, dur: 0.5 },
      { offset: 3, time: 1.0, dur: 0.25 },
      { offset: 7, time: 1.25, dur: 0.25 },
      { offset: 5, time: 1.5, dur: 0.5 },
      { offset: 0, time: 2.0, dur: 1.0 },
    ];
  } else if (scaleName.includes('Maior Pentatônica')) {
    pattern = [
      { offset: 0, time: 0.5, dur: 0.5 },
      { offset: 2, time: 1.0, dur: 0.25 },
      { offset: 4, time: 1.25, dur: 0.25 },
      { offset: 7, time: 1.5, dur: 0.5 },
      { offset: 0, time: 2.0, dur: 1.0 },
    ];
  } else if (scaleName.includes('Dórico')) {
     pattern = [
      { offset: 0, time: 0.5, dur: 0.5 },
      { offset: 3, time: 1.0, dur: 0.25 },
      { offset: 5, time: 1.25, dur: 0.25 },
      { offset: 9, time: 1.5, dur: 0.5 }, // 6M
      { offset: 7, time: 2.0, dur: 1.0 },
    ];
  } else if (scaleName.includes('Mixolídio')) {
     pattern = [
      { offset: 0, time: 0.5, dur: 0.5 },
      { offset: 4, time: 1.0, dur: 0.25 },
      { offset: 5, time: 1.25, dur: 0.25 },
      { offset: 10, time: 1.5, dur: 0.5 }, // 7m
      { offset: 7, time: 2.0, dur: 1.0 },
    ];
  } else {
    // Ionian / generic
    pattern = [
      { offset: 0, time: 0.5, dur: 0.5 },
      { offset: 2, time: 1.0, dur: 0.25 },
      { offset: 4, time: 1.25, dur: 0.25 },
      { offset: 7, time: 1.5, dur: 0.5 },
      { offset: 0, time: 2.0, dur: 1.0 },
    ];
  }

  pattern.forEach(p => {
    const freq = getFreq((scaleRootIdx + p.offset) % 12, 4 + Math.floor((scaleRootIdx + p.offset)/12));
    playTone(freq, now + timeOffset + p.time * beatLen, p.dur * beatLen, 0.15, 'sawtooth');
    playTone(freq, now + timeOffset + p.time * beatLen, p.dur * beatLen, 0.15, 'triangle');
  });
}
