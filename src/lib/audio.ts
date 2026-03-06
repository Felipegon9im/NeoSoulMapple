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
  const midiNote = 12 * (octave + 1) + noteIdx;
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

export function playTone(freq: number, time: number, duration: number, vol = 0.3, type: OscillatorType = 'triangle') {
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc.type = type;
  osc.frequency.value = freq;
  
  filter.type = 'lowpass';
  filter.frequency.value = type === 'sawtooth' ? 1500 : 3000;
  
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.02);
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

export function playChord(rootIdx: number, quality: string) {
  const ctx = initAudio();
  const now = ctx.currentTime;
  
  let intervals = [0, 4, 7, 11]; // major
  if (quality === 'minor') intervals = [0, 3, 7, 10];
  else if (quality === 'dominant') intervals = [0, 4, 7, 10];
  
  // Play a strum effect
  intervals.forEach((interval, i) => {
    const freq = getFreq((rootIdx + interval) % 12, 3 + Math.floor((rootIdx + interval)/12));
    playTone(freq, now + i * 0.04, 2.5, 0.2, 'sine');
    playTone(freq, now + i * 0.04, 2.5, 0.1, 'triangle');
  });
}

export function playProgression(chords: {rootIdx: number, quality: string}[], bpm: number, beatsPerMeasure: number = 4) {
  const ctx = initAudio();
  const now = ctx.currentTime;
  const beatLen = 60 / bpm;
  
  chords.forEach((chord, index) => {
    const timeOffset = index * beatsPerMeasure * beatLen;
    
    // Metronome beats per chord
    for (let i = 0; i < beatsPerMeasure; i++) {
      playMetronome(now + timeOffset + i * beatLen);
    }
    
    let intervals = [0, 4, 7, 11]; // major
    if (chord.quality === 'minor') intervals = [0, 3, 7, 10];
    else if (chord.quality === 'dominant') intervals = [0, 4, 7, 10];
    else if (chord.quality === 'half-diminished') intervals = [0, 3, 6, 10];
    
    // Comping
    const playComp = (time: number, dur: number) => {
      intervals.forEach((interval, i) => {
        const freq = getFreq((chord.rootIdx + interval) % 12, 3 + Math.floor((chord.rootIdx + interval)/12));
        playTone(freq, time + i * 0.02, dur, 0.1, 'sine');
        playTone(freq, time + i * 0.02, dur, 0.05, 'sawtooth');
      });
    };

    playComp(now + timeOffset, beatLen * 1.5); // Beat 1
    if (beatsPerMeasure >= 3) {
      playComp(now + timeOffset + 1.5 * beatLen, beatLen * 1.5); // Beat 2 "and"
    }
    if (beatsPerMeasure >= 5) {
      playComp(now + timeOffset + 3.5 * beatLen, beatLen * 1.5); // Beat 4 "and"
    }
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
      
      const playComp = (time: number, dur: number) => {
        intervals.forEach((interval, i) => {
          const freq = getFreq((chord.rootIdx + interval) % 12, 3 + Math.floor((chord.rootIdx + interval)/12));
          playTone(freq, time + i * 0.02, dur, 0.1, 'sine');
          playTone(freq, time + i * 0.02, dur, 0.05, 'sawtooth');
        });
      };

      playComp(now + chordTimeOffset, beatLen * 1.5);
      if (beatsPerMeasure >= 3) {
        playComp(now + chordTimeOffset + 1.5 * beatLen, beatLen * 1.5);
      }
      if (beatsPerMeasure >= 5) {
        playComp(now + chordTimeOffset + 3.5 * beatLen, beatLen * 1.5);
      }
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
  
  const playComp = (time: number, dur: number) => {
    intervals.forEach((interval, i) => {
      const freq = getFreq((chordRootIdx + interval) % 12, 3 + Math.floor((chordRootIdx + interval)/12));
      playTone(freq, time + i * 0.02, dur, 0.1, 'sine');
      playTone(freq, time + i * 0.02, dur, 0.05, 'sawtooth');
    });
  };
  playComp(now + timeOffset, beatLen * 1.5);
  if (beatsPerMeasure >= 3) {
    playComp(now + timeOffset + 1.5 * beatLen, beatLen * 1.5);
  }
  if (beatsPerMeasure >= 5) {
    playComp(now + timeOffset + 3.5 * beatLen, beatLen * 1.5);
  }

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
