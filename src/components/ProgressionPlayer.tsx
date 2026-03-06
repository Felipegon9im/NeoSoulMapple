import React, { useState, useMemo, useEffect } from "react";
import { Play, Settings2, Square } from "lucide-react";
import { parseChord, getIIVI } from "../lib/chordLibrary";
import { playProgression, initAudio } from "../lib/audio";

interface ProgressionPlayerProps {
  chords: string[];
}

export function ProgressionPlayer({ chords }: ProgressionPlayerProps) {
  const [bpm, setBpm] = useState(85);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [includeIIVI, setIncludeIIVI] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChordIndex, setCurrentChordIndex] = useState(-1);
  const [progress, setProgress] = useState(0);

  const sequence = useMemo(() => {
    const seq: { rootIdx: number; quality: string; name: string; isPrep?: boolean }[] = [];

    chords.forEach((chordStr) => {
      const data = parseChord(chordStr);
      if (!data) return;

      if (includeIIVI) {
        const iiVI = getIIVI(data.rootIdx, data.quality);
        if (iiVI) {
          seq.push({ rootIdx: iiVI[0].rootIdx, quality: iiVI[0].quality, name: iiVI[0].name, isPrep: true });
          seq.push({ rootIdx: iiVI[1].rootIdx, quality: iiVI[1].quality, name: iiVI[1].name, isPrep: true });
        }
      }
      
      seq.push({
        rootIdx: data.rootIdx,
        quality: data.quality,
        name: data.original,
        isPrep: false
      });
    });

    return seq;
  }, [chords, includeIIVI]);

  useEffect(() => {
    if (!isPlaying) return;

    const ctx = initAudio();
    const startTime = ctx.currentTime;
    const beatLen = 60 / bpm;
    const chordDuration = beatsPerMeasure * beatLen;
    const totalDuration = sequence.length * chordDuration;

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
      setCurrentChordIndex(Math.floor(elapsed / chordDuration));
      
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, sequence, bpm, beatsPerMeasure]);

  const handlePlay = () => {
    if (isPlaying) return;

    if (sequence.length > 0) {
      playProgression(sequence, bpm, beatsPerMeasure);
      setIsPlaying(true);
    }
  };

  if (chords.length === 0) return null;

  return (
    <div className="w-full max-w-4xl bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-8 flex flex-col gap-4">
      {/* Timeline UI */}
      {sequence.length > 0 && (
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
                  px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200
                  ${currentChordIndex === idx 
                    ? 'bg-purple-500 text-white scale-110 shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                    : chord.isPrep 
                      ? 'bg-zinc-800/50 text-zinc-400 border border-white/5' 
                      : 'bg-zinc-800 text-zinc-200 border border-white/10'
                  }
                `}
              >
                {chord.name}
              </div>
            ))}
          </div>
        </div>
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
          
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer select-none whitespace-nowrap bg-black/30 px-4 py-3 rounded-xl border border-white/5">
            <input
              type="checkbox"
              checked={includeIIVI}
              onChange={(e) => setIncludeIIVI(e.target.checked)}
              disabled={isPlaying}
              className="w-4 h-4 accent-purple-500 rounded bg-zinc-800 border-zinc-700 disabled:opacity-50"
            />
            Incluir II-V
          </label>
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
