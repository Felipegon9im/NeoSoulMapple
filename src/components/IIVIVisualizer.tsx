import React, { useState } from "react";
import { Play } from "lucide-react";
import { playCustomProgression } from "../lib/audio";

interface IIVIVisualizerProps {
  progression: { rootIdx: number; quality: string; name: string; intervals?: number[] }[];
  bpm: number;
  beatsPerMeasure: number;
}

type OptionType = "A" | "B" | "C";

export function IIVIVisualizer({ progression, bpm, beatsPerMeasure }: IIVIVisualizerProps) {
  const [activeOption, setActiveOption] = useState<OptionType>("B");

  if (!progression || progression.length !== 3) return null;

  const [ii, v, i] = progression;

  const handlePlay = () => {
    let chordsToPlay: { rootIdx: number; quality: string; beats: number; intervals?: number[] }[] = [];

    if (activeOption === "A") {
      chordsToPlay = [
        { ...ii, beats: beatsPerMeasure, intervals: ii.intervals },
        { ...v, beats: beatsPerMeasure, intervals: v.intervals },
        { ...i, beats: beatsPerMeasure, intervals: i.intervals },
      ];
    } else if (activeOption === "B") {
      const halfBeats = Math.floor(beatsPerMeasure / 2);
      const remainingBeats = beatsPerMeasure - halfBeats;
      chordsToPlay = [
        { ...ii, beats: halfBeats, intervals: ii.intervals },
        { ...v, beats: remainingBeats, intervals: v.intervals },
        { ...i, beats: beatsPerMeasure, intervals: i.intervals },
      ];
    } else if (activeOption === "C") {
      const iiBeats = 1;
      const vBeats = 1;
      const iBeats = Math.max(1, beatsPerMeasure - iiBeats - vBeats);
      chordsToPlay = [
        { ...ii, beats: iiBeats, intervals: ii.intervals },
        { ...v, beats: vBeats, intervals: v.intervals },
        { ...i, beats: iBeats, intervals: i.intervals },
      ];
    }

    playCustomProgression(chordsToPlay, bpm);
  };

  return (
    <div className="mb-6 bg-black/30 border border-white/5 rounded-xl p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="text-xs text-white uppercase tracking-widest flex items-center gap-2">
          <div className="w-1 h-3 bg-teal-400 rounded-full"></div>
          Adicionar 2-5-1 (Preparação)
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveOption("A")}
            className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-colors ${
              activeOption === "A" ? "bg-teal-500 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"
            }`}
          >
            Opção A
          </button>
          <button
            onClick={() => setActiveOption("B")}
            className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-colors ${
              activeOption === "B" ? "bg-teal-500 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"
            }`}
          >
            Opção B
          </button>
          <button
            onClick={() => setActiveOption("C")}
            className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-colors ${
              activeOption === "C" ? "bg-teal-500 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"
            }`}
          >
            Opção C
          </button>
        </div>
      </div>

      <div className="mb-4 text-xs text-zinc-400 leading-relaxed">
        {activeOption === "A" && "Cada acorde ocupa um compasso inteiro. Ideal para baladas ou quando há muito espaço."}
        {activeOption === "B" && "II e V dividem o mesmo compasso (2 tempos cada). Muito comum no Jazz e Gospel."}
        {activeOption === "C" && "Passagem rápida. II e V ocupam 1 tempo cada, resolvendo no I."}
      </div>

      <div className="flex flex-col gap-2">
        {activeOption === "A" && (
          <div className="flex gap-2">
            <MeasureBox chord={ii.name} beats={beatsPerMeasure} totalBeats={beatsPerMeasure} measureNumber={1} />
            <MeasureBox chord={v.name} beats={beatsPerMeasure} totalBeats={beatsPerMeasure} measureNumber={2} />
            <MeasureBox chord={i.name} beats={beatsPerMeasure} totalBeats={beatsPerMeasure} isTarget measureNumber={3} />
          </div>
        )}
        {activeOption === "B" && (
          <div className="flex gap-2">
            <div className="flex-1 flex gap-1 bg-white/5 border border-white/10 rounded-lg p-2 relative overflow-hidden">
              <div className="absolute top-1 left-2 text-[8px] text-zinc-500 font-bold uppercase">Compasso 1</div>
              <div className="flex-1 flex items-center justify-center bg-black/40 rounded mt-3 py-2 text-amber-400 font-bold text-sm">
                {ii.name} <span className="text-[10px] text-zinc-500 ml-2">({Math.floor(beatsPerMeasure/2)}t)</span>
              </div>
              <div className="flex-1 flex items-center justify-center bg-black/40 rounded mt-3 py-2 text-amber-400 font-bold text-sm">
                {v.name} <span className="text-[10px] text-zinc-500 ml-2">({Math.ceil(beatsPerMeasure/2)}t)</span>
              </div>
            </div>
            <MeasureBox chord={i.name} beats={beatsPerMeasure} totalBeats={beatsPerMeasure} isTarget measureNumber={2} />
          </div>
        )}
        {activeOption === "C" && (
          <div className="flex gap-2">
            <div className="flex-1 flex gap-1 bg-white/5 border border-white/10 rounded-lg p-2 relative overflow-hidden">
              <div className="absolute top-1 left-2 text-[8px] text-zinc-500 font-bold uppercase">Compasso 1</div>
              <div className="flex-[1] flex items-center justify-center bg-black/40 rounded mt-3 py-2 text-amber-400 font-bold text-sm">
                {ii.name} <span className="text-[10px] text-zinc-500 ml-1">(1t)</span>
              </div>
              <div className="flex-[1] flex items-center justify-center bg-black/40 rounded mt-3 py-2 text-amber-400 font-bold text-sm">
                {v.name} <span className="text-[10px] text-zinc-500 ml-1">(1t)</span>
              </div>
              <div className="flex-[2] flex items-center justify-center bg-teal-500/20 border border-teal-500/30 rounded mt-3 py-2 text-teal-400 font-bold text-sm">
                {i.name} <span className="text-[10px] text-teal-500/70 ml-1">({beatsPerMeasure - 2}t)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handlePlay}
          className="flex items-center gap-2 text-teal-400 hover:text-teal-300 bg-teal-400/10 hover:bg-teal-400/20 px-4 py-2 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider"
        >
          <Play size={14} />
          <span>Ouvir Exemplo</span>
        </button>
      </div>
    </div>
  );
}

function MeasureBox({ chord, beats, totalBeats, isTarget = false, measureNumber }: { chord: string, beats: number, totalBeats: number, isTarget?: boolean, measureNumber: number }) {
  return (
    <div className={`flex-1 flex flex-col bg-white/5 border ${isTarget ? 'border-teal-500/30 bg-teal-500/5' : 'border-white/10'} rounded-lg p-2 relative overflow-hidden`}>
      <div className="absolute top-1 left-2 text-[8px] text-zinc-500 font-bold uppercase">Compasso {measureNumber}</div>
      <div className={`flex-1 flex items-center justify-center rounded mt-3 py-2 font-bold text-sm ${isTarget ? 'bg-teal-500/20 text-teal-400' : 'bg-black/40 text-amber-400'}`}>
        {chord} <span className={`text-[10px] ml-2 ${isTarget ? 'text-teal-500/70' : 'text-zinc-500'}`}>({beats}t)</span>
      </div>
    </div>
  );
}
