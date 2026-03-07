import React, { useState, useMemo, useEffect } from "react";
import { Play, Settings2, Square } from "lucide-react";
import { parseChord, getIIVI } from "../lib/chordLibrary";
import { playProgression, initAudio } from "../lib/audio";
import { AdvancedHarmonicGPS } from "./AdvancedHarmonicGPS";

interface ProgressionPlayerProps {
  chords: string[];
}

export function ProgressionPlayer({ chords }: ProgressionPlayerProps) {
  const [bpm, setBpm] = useState(85);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [includeIIVI, setIncludeIIVI] = useState(false);
  const [iiViOption, setIiViOption] = useState<"A" | "B" | "C">("B");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChordIndex, setCurrentChordIndex] = useState(-1);
  const [progress, setProgress] = useState(0);

  const sequence = useMemo(() => {
    const baseSeq = chords.map(chordStr => parseChord(chordStr)).filter(Boolean) as any[];
    if (baseSeq.length === 0) return [];

    if (!includeIIVI) {
      return baseSeq.map(data => ({
        rootIdx: data.rootIdx,
        quality: data.quality,
        name: data.original,
        isPrep: false,
        beats: beatsPerMeasure,
        intervals: data.intervals
      }));
    }

    // Create slots for each measure
    const slots = baseSeq.map(data => ({
      target: data,
      chords: [{ rootIdx: data.rootIdx, quality: data.quality, name: data.original, isPrep: false, beats: beatsPerMeasure, intervals: data.intervals }]
    }));

    for (let i = 0; i < baseSeq.length; i++) {
      const target = baseSeq[i];
      const iiVI = getIIVI(target.rootIdx, target.quality);
      if (!iiVI) continue;

      const ii = { rootIdx: iiVI[0].rootIdx, quality: iiVI[0].quality, name: iiVI[0].name, isPrep: true, beats: 0, intervals: iiVI[0].intervals };
      const v = { rootIdx: iiVI[1].rootIdx, quality: iiVI[1].quality, name: iiVI[1].name, isPrep: true, beats: 0, intervals: iiVI[1].intervals };

      if (iiViOption === "A") {
        // Expandir: Adiciona compassos inteiros antes do alvo
        ii.beats = beatsPerMeasure;
        v.beats = beatsPerMeasure;
        slots[i].chords.unshift(ii, v);
      } else if (iiViOption === "B") {
        // Antecipar: Rouba tempo do acorde anterior
        const prevSlotIdx = i === 0 ? slots.length - 1 : i - 1;
        const prevSlot = slots[prevSlotIdx];
        const lastChord = prevSlot.chords[prevSlot.chords.length - 1];
        
        // Rouba no máximo 2 tempos, ou metade da duração do acorde
        const steal = Math.min(2, lastChord.beats / 2);
        if (steal > 0) {
          lastChord.beats -= steal;
          ii.beats = steal / 2;
          v.beats = steal / 2;
          prevSlot.chords.push(ii, v);
        }
      } else if (iiViOption === "C") {
        // Atrasar: Rouba tempo do próprio acorde alvo
        const targetChord = slots[i].chords[slots[i].chords.length - 1];
        const steal = Math.min(2, targetChord.beats / 2);
        if (steal > 0) {
          targetChord.beats -= steal;
          ii.beats = steal / 2;
          v.beats = steal / 2;
          slots[i].chords.unshift(ii, v);
        }
      }
    }

    return slots.flatMap(slot => slot.chords);
  }, [chords, includeIIVI, iiViOption, beatsPerMeasure]);

  useEffect(() => {
    if (!isPlaying) return;

    const ctx = initAudio();
    const startTime = ctx.currentTime;
    const beatLen = 60 / bpm;
    
    const totalBeats = sequence.reduce((sum, chord) => sum + chord.beats, 0);
    const totalDuration = totalBeats * beatLen;

    let animationFrameId: number;

    const updateProgress = () => {
      const elapsed = ctx.currentTime - startTime;
      
      if (elapsed >= totalDuration) {
        setIsPlaying(false);
        setCurrentChordIndex(-1);
        setProgress(0);
        return;
      }

      setProgress((elapsed / totalDuration) * 100);
      
      let accumulatedTime = 0;
      let currentIndex = 0;
      for (let i = 0; i < sequence.length; i++) {
        const chordTime = sequence[i].beats * beatLen;
        if (elapsed >= accumulatedTime && elapsed < accumulatedTime + chordTime) {
          currentIndex = i;
          break;
        }
        accumulatedTime += chordTime;
      }
      setCurrentChordIndex(currentIndex);
      
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, sequence, bpm]);

  const handlePlay = () => {
    if (isPlaying) return;

    if (sequence.length > 0) {
      import("../lib/audio").then(({ playCustomProgression }) => {
        playCustomProgression(sequence, bpm);
      });
      setIsPlaying(true);
    }
  };

  if (chords.length === 0) return null;

  return (
    <div className="w-full max-w-4xl bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-8 flex flex-col gap-4">
      {/* Timeline UI */}
      {sequence.length > 0 && (
        <>
          <AdvancedHarmonicGPS sequence={sequence} currentIndex={currentChordIndex} />
          <div className="w-full bg-black/40 rounded-xl p-4 border border-white/5 relative overflow-hidden">
            {/* Progress Bar Background */}
            <div 
              className="absolute top-0 left-0 h-full bg-purple-500/10 transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
            
            <div className="relative z-10 flex flex-wrap gap-2 items-center justify-center">
            {sequence.map((chord, idx) => (
              <div 
                key={`${chord.name}-${idx}`}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-1
                  ${currentChordIndex === idx 
                    ? 'bg-purple-500 text-white scale-110 shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                    : chord.isPrep 
                      ? 'bg-zinc-800/50 text-zinc-400 border border-white/5' 
                      : 'bg-zinc-800 text-zinc-200 border border-white/10'
                  }
                `}
              >
                <span>{chord.name}</span>
                <span className={`text-[10px] ${currentChordIndex === idx ? 'text-white/70' : 'text-zinc-500'}`}>
                  ({chord.beats}t)
                </span>
              </div>
            ))}
          </div>
        </div>
        </>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors w-full sm:w-auto justify-center
              ${isPlaying 
                ? 'bg-purple-500/50 text-white/50 cursor-not-allowed' 
                : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
          >
            {isPlaying ? (
              <>
                <Square size={18} fill="currentColor" />
                Tocando...
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" />
                Ouvir Tudo
              </>
            )}
          </button>
          
          <div className="flex items-center gap-2 bg-black/30 px-4 py-3 rounded-xl border border-white/5">
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={includeIIVI}
                onChange={(e) => setIncludeIIVI(e.target.checked)}
                disabled={isPlaying}
                className="w-4 h-4 accent-purple-500 rounded bg-zinc-800 border-zinc-700 disabled:opacity-50"
              />
              Incluir II-V
            </label>
            
            {includeIIVI && (
              <div className="flex items-center gap-2 border-l border-white/10 pl-3 ml-1">
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Divisão:</span>
                <select 
                  value={iiViOption}
                  onChange={(e) => setIiViOption(e.target.value as "A" | "B" | "C")}
                  disabled={isPlaying}
                  className="bg-zinc-800 text-zinc-300 text-xs font-bold rounded px-2 py-1 border border-white/10 outline-none focus:border-purple-500 disabled:opacity-50"
                >
                  <option value="A">Expandir (Adiciona compassos)</option>
                  <option value="B">Antecipar (Rouba do acorde anterior)</option>
                  <option value="C">Atrasar (Rouba do próprio acorde)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-black/30 px-4 py-3 rounded-xl border border-white/5 w-full sm:w-auto flex-wrap justify-center">
          <div className="flex items-center gap-2 border-r border-white/10 pr-3 mr-1">
            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Compasso:</span>
            <select 
              value={beatsPerMeasure}
              onChange={(e) => setBeatsPerMeasure(Number(e.target.value))}
              disabled={isPlaying}
              className="bg-zinc-800 text-zinc-300 text-xs font-bold rounded px-2 py-1 border border-white/10 outline-none focus:border-purple-500 disabled:opacity-50"
            >
              <option value={3}>3/4</option>
              <option value={4}>4/4</option>
              <option value={5}>5/4</option>
              <option value={6}>6/4</option>
              <option value={7}>7/4</option>
            </select>
          </div>
          <Settings2 size={16} className="text-zinc-500" />
          <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider w-16">
            {bpm} BPM
          </span>
          <input
            type="range"
            min="60"
            max="160"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            disabled={isPlaying}
            className="w-24 sm:w-32 accent-purple-500 disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}
