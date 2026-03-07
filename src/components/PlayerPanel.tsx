import React, { useState, useMemo, useEffect } from "react";
import { Play, Square, Settings2, Download, Save, Plus, X, Repeat } from "lucide-react";
import { parseChord, getIIVI, getSubV7, getBackdoor, getSecondaryDominant } from "../lib/chordLibrary";
import { initAudio } from "../lib/audio";
import { motion, AnimatePresence } from "motion/react";

interface PlayerPanelProps {
  chords: string[];
  setProgression: (p: string) => void;
  onStateChange?: (sequence: any[], currentIndex: number) => void;
}

export function PlayerPanel({ chords, setProgression, onStateChange }: PlayerPanelProps) {
  const [bpm, setBpm] = useState(85);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentChordIndex, setCurrentChordIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [showOptions, setShowOptions] = useState(false);

  const [prepType, setPrepType] = useState<"none" | "iivi" | "subv7" | "backdoor" | "secDom">("none");
  const [prepOption, setPrepOption] = useState<"A" | "B" | "C">("B");

  const sequence = useMemo(() => {
    const baseSeq = chords.map(chordStr => parseChord(chordStr)).filter(Boolean) as any[];
    if (baseSeq.length === 0) return [];

    if (prepType === "none") {
      return baseSeq.map(data => ({
        rootIdx: data.rootIdx,
        quality: data.quality,
        name: data.original,
        isPrep: false,
        beats: beatsPerMeasure,
        intervals: data.intervals
      }));
    }

    const slots = baseSeq.map(data => ({
      target: data,
      chords: [{ rootIdx: data.rootIdx, quality: data.quality, name: data.original, isPrep: false, beats: beatsPerMeasure, intervals: data.intervals }]
    }));

    for (let i = 0; i < baseSeq.length; i++) {
      const target = baseSeq[i];
      let prepChords = null;
      
      if (prepType === "iivi") prepChords = getIIVI(target.rootIdx, target.quality);
      else if (prepType === "subv7") prepChords = getSubV7(target.rootIdx, target.quality);
      else if (prepType === "backdoor") prepChords = getBackdoor(target.rootIdx, target.quality);
      else if (prepType === "secDom") prepChords = getSecondaryDominant(target.rootIdx, target.quality);

      if (!prepChords) continue;

      const preps = prepChords.slice(0, -1).map(c => ({
        rootIdx: c.rootIdx,
        quality: c.quality,
        name: c.name,
        isPrep: true,
        beats: 0,
        intervals: c.intervals
      }));

      if (prepOption === "A") {
        preps.forEach(p => p.beats = beatsPerMeasure);
        slots[i].chords.unshift(...preps);
      } else if (prepOption === "B") {
        const prevSlotIdx = i === 0 ? slots.length - 1 : i - 1;
        const prevSlot = slots[prevSlotIdx];
        const lastChord = prevSlot.chords[prevSlot.chords.length - 1];
        
        const steal = Math.min(2, lastChord.beats / 2);
        if (steal > 0) {
          lastChord.beats -= steal;
          preps.forEach(p => p.beats = steal / preps.length);
          prevSlot.chords.push(...preps);
        }
      } else if (prepOption === "C") {
        const targetChord = slots[i].chords[slots[i].chords.length - 1];
        const steal = Math.min(2, targetChord.beats / 2);
        if (steal > 0) {
          targetChord.beats -= steal;
          preps.forEach(p => p.beats = steal / preps.length);
          slots[i].chords.unshift(...preps);
        }
      }
    }

    return slots.flatMap(slot => slot.chords);
  }, [chords, prepType, prepOption, beatsPerMeasure]);

  useEffect(() => {
    if (onStateChange) {
      onStateChange(sequence, currentChordIndex);
    }
  }, [sequence, currentChordIndex, onStateChange]);

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
        if (isLooping) {
          // Restart playback
          setIsPlaying(false);
          setTimeout(() => setIsPlaying(true), 10);
        } else {
          setIsPlaying(false);
          setCurrentChordIndex(-1);
          setProgress(0);
        }
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
  }, [isPlaying, sequence, bpm, isLooping]);

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setCurrentChordIndex(-1);
      setProgress(0);
      return;
    }

    if (sequence.length > 0) {
      import("../lib/audio").then(({ playCustomProgression }) => {
        playCustomProgression(sequence, bpm);
      });
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    const text = sequence.map(c => c.name).join(" - ");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "progressao.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    const name = prompt("Nome da progressão:");
    if (name) {
      const saved = JSON.parse(localStorage.getItem("savedProgressions") || "[]");
      saved.push({ name, chords: sequence.map(c => c.name).join(" ") });
      localStorage.setItem("savedProgressions", JSON.stringify(saved));
      alert("Progressão salva!");
    }
  };

  if (chords.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 h-1 bg-purple-500/20 w-full">
        <div 
          className="h-full bg-purple-500 transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-3 max-w-5xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Controls */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
            <button
              onClick={handlePlay}
              className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                isPlaying ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-purple-500 text-white hover:bg-purple-600 hover:scale-105'
              }`}
            >
              {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
            
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                isLooping ? 'bg-teal-500/20 text-teal-400' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
              title="Loop"
            >
              <Repeat size={18} />
            </button>

            <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block"></div>

            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">BPM</span>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-12 bg-transparent text-white font-bold text-sm outline-none text-center"
                min="40"
                max="240"
              />
            </div>

            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Comp.</span>
              <select
                value={beatsPerMeasure}
                onChange={(e) => setBeatsPerMeasure(Number(e.target.value))}
                className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer"
              >
                <option value={3} className="bg-zinc-900">3/4</option>
                <option value={4} className="bg-zinc-900">4/4</option>
                <option value={5} className="bg-zinc-900">5/4</option>
                <option value={6} className="bg-zinc-900">6/4</option>
              </select>
            </div>
          </div>

          {/* Chords Display */}
          <div className="flex-1 overflow-x-auto custom-scrollbar flex items-center gap-2 px-2 py-1 w-full mask-edges">
            {sequence.map((chord, idx) => (
              <div 
                key={`${chord.name}-${idx}`}
                className={`
                  flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-1 whitespace-nowrap
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

          {/* Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                showOptions ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Settings2 size={16} />
              Passagens
            </button>
            <button
              onClick={handleSave}
              className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
              title="Salvar Progressão"
            >
              <Save size={16} />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
              title="Baixar TXT"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Options Panel */}
        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-white/10 flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Adicionar Passagens</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setPrepType("none")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${prepType === "none" ? 'bg-zinc-700 text-white' : 'bg-black/40 text-zinc-400 hover:bg-black/60'}`}
                    >
                      Nenhuma
                    </button>
                    <button
                      onClick={() => setPrepType("iivi")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${prepType === "iivi" ? 'bg-purple-500 text-white' : 'bg-black/40 text-zinc-400 hover:bg-black/60'}`}
                    >
                      II-V-I
                    </button>
                    <button
                      onClick={() => setPrepType("subv7")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${prepType === "subv7" ? 'bg-teal-500 text-white' : 'bg-black/40 text-zinc-400 hover:bg-black/60'}`}
                    >
                      SubV7
                    </button>
                    <button
                      onClick={() => setPrepType("backdoor")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${prepType === "backdoor" ? 'bg-amber-500 text-white' : 'bg-black/40 text-zinc-400 hover:bg-black/60'}`}
                    >
                      Backdoor (IVm-bVII)
                    </button>
                    <button
                      onClick={() => setPrepType("secDom")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${prepType === "secDom" ? 'bg-pink-500 text-white' : 'bg-black/40 text-zinc-400 hover:bg-black/60'}`}
                    >
                      Dom. Secundário (V7)
                    </button>
                  </div>
                </div>

                {prepType !== "none" && (
                  <div className="flex-1">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Divisão de Tempo</h4>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                        <input type="radio" name="prepOption" checked={prepOption === "A"} onChange={() => setPrepOption("A")} className="accent-purple-500" />
                        Expandir (Adiciona compassos inteiros)
                      </label>
                      <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                        <input type="radio" name="prepOption" checked={prepOption === "B"} onChange={() => setPrepOption("B")} className="accent-purple-500" />
                        Antecipar (Rouba tempo do acorde anterior)
                      </label>
                      <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                        <input type="radio" name="prepOption" checked={prepOption === "C"} onChange={() => setPrepOption("C")} className="accent-purple-500" />
                        Atrasar (Rouba tempo do próprio acorde alvo)
                      </label>
                    </div>
                  </div>
                )}
                
                <div className="flex-1 flex items-end justify-end">
                  <button
                    onClick={() => {
                      const newProgression = sequence.map(c => c.name).join(" ");
                      setProgression(newProgression);
                      setPrepType("none");
                    }}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    <Plus size={16} />
                    Aplicar à Progressão
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
