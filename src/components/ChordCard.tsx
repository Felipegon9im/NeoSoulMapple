import React, { useState } from "react";
import {
  parseChord,
  getVariations,
  getMajorScaleIndices,
  voicingLabels,
  getChordRelations,
  getScaleSuggestions,
  getChordTones,
} from "../lib/chordLibrary";
import { ChordDiagram } from "./ChordDiagram";
import { Fretboard } from "./Fretboard";
import { motion } from "motion/react";

interface ChordCardProps {
  chordStr: string;
  key?: string | number;
}

export function ChordCard({ chordStr }: ChordCardProps) {
  const data = parseChord(chordStr);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  if (!data) return null;

  const variations = getVariations(data.rootIdx, data.type);
  const categories = Array.from(new Set(variations.map((v) => v.category)));

  const visibleVars =
    activeFilter === "ALL"
      ? variations
      : variations.filter((v) => v.category === activeFilter);

  const scaleIndices = getMajorScaleIndices(data.rootIdx);
  const relations = getChordRelations(data.rootIdx, data.quality);
  const scaleSuggestions = getScaleSuggestions(data.rootIdx, data.quality);
  const chordTones = getChordTones(data.rootIdx, data.quality);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 border-l-4 border-l-purple-500 shadow-2xl"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-4 mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="font-montserrat text-3xl font-black text-amber-400 tracking-tight">
            {data.original}
          </h2>
          <span className="bg-white/10 text-zinc-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {data.type}
          </span>
        </div>
        
        <div className="flex flex-col sm:items-end gap-1 text-sm bg-black/40 p-3 rounded-xl border border-white/5">
          {relations.relative !== "-" && (
            <div className="text-zinc-400 flex items-center gap-2">
              <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold">Relativo:</span>
              <span className="font-bold text-teal-400">{relations.relative}</span>
            </div>
          )}
          <div className="text-zinc-400 flex items-center gap-2">
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold">II-V-I:</span>
            <span className="font-bold text-pink-400">{relations.ii_V_I}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="text-xs text-white uppercase tracking-widest mb-3 flex items-center gap-2">
          <div className="w-1 h-3 bg-amber-400 rounded-full"></div>
          Categorias Disponíveis
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all duration-200 border ${
              activeFilter === "ALL"
                ? "bg-purple-500 text-white border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all duration-200 border ${
                activeFilter === cat
                  ? "bg-purple-500 text-white border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                  : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-200"
              }`}
            >
              {voicingLabels[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-6 custom-scrollbar">
        <div className="flex gap-6 w-max items-end pt-4">
          {visibleVars.map((v, i) => (
            <ChordDiagram
              key={`${v.category}-${i}`}
              frets={v.frets}
              startFret={v.startFret}
              label={v.label}
              chordName={data.original}
            />
          ))}
          {visibleVars.length === 0 && (
            <div className="text-zinc-500 text-sm italic py-4">
              Nenhum voicing encontrado para este filtro.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <div className="text-xs text-white uppercase tracking-widest flex items-center gap-2">
            <div className="w-1 h-3 bg-teal-400 rounded-full"></div>
            Escalas para Improvisar
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-wider font-bold text-zinc-400 bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></div>
              <span>Tônica da Escala</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]"></div>
              <span>Notas do Acorde (Guia)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]"></div>
              <span>Extensões / Passagem</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">
          {scaleSuggestions.map((scale, i) => (
            <div key={i} className="bg-black/30 border border-white/5 rounded-xl p-4 hover:bg-black/50 transition-colors">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <div>
                  <h4 className="font-bold text-teal-400 mb-1">{scale.name}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {scale.usage}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {scale.notes.map((note, j) => (
                    <span key={j} className="bg-white/10 text-zinc-300 text-[10px] px-2 py-0.5 rounded font-mono">
                      {note}
                    </span>
                  ))}
                </div>
              </div>
              <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
                <Fretboard
                  scaleIndices={scale.scaleIndices}
                  targetRootIndex={scale.rootIdx}
                  chordIndices={chordTones}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-white uppercase tracking-widest mb-4 flex items-center gap-2">
          <div className="w-1 h-3 bg-amber-400 rounded-full"></div>
          Escala de Apoio (Braço)
        </div>
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
          <Fretboard
            scaleIndices={scaleIndices}
            targetRootIndex={data.rootIdx}
            chordIndices={chordTones}
          />
        </div>
      </div>
    </motion.div>
  );
}
