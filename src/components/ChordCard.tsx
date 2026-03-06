import React, { useState } from "react";
import {
  parseChord,
  getVariations,
  getMajorScaleIndices,
  voicingLabels,
  getChordRelations,
  getScaleSuggestions,
  getChordTones,
  getIIVI,
} from "../lib/chordLibrary";
import { playChord, playLick, playProgression } from "../lib/audio";
import { ChordDiagram } from "./ChordDiagram";
import { Fretboard } from "./Fretboard";
import { motion } from "motion/react";
import { Play, Volume2 } from "lucide-react";

interface ChordCardProps {
  chordStr: string;
  key?: string | number;
}

export function ChordCard({ chordStr }: ChordCardProps) {
  const data = parseChord(chordStr);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [bpm, setBpm] = useState<number>(85);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState<number>(4);

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
  const iiVIProgression = getIIVI(data.rootIdx, data.quality);

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
          <button
            onClick={() => playChord(data.rootIdx, data.quality)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-teal-400 transition-colors"
            title="Ouvir Acorde"
          >
            <Volume2 size={20} />
          </button>
          <span className="bg-white/10 text-zinc-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {data.type}
          </span>
        </div>
        
        <div className="flex flex-col sm:items-end gap-2 text-sm bg-black/40 p-3 rounded-xl border border-white/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold">Compasso:</span>
              <select 
                value={beatsPerMeasure}
                onChange={(e) => setBeatsPerMeasure(Number(e.target.value))}
                className="bg-zinc-800 text-zinc-300 text-xs font-bold rounded px-2 py-1 border border-white/10 outline-none focus:border-teal-500"
              >
                <option value={3}>3/4</option>
                <option value={4}>4/4</option>
                <option value={5}>5/4</option>
                <option value={6}>6/4</option>
                <option value={7}>7/4</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold">Tempo: {bpm} BPM</span>
              <input 
                type="range" 
                min="60" 
                max="160" 
                value={bpm} 
                onChange={(e) => setBpm(Number(e.target.value))} 
                className="w-24 accent-teal-400" 
              />
            </div>
          </div>
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

      {iiVIProgression && (
        <div className="mb-6 bg-black/30 border border-white/5 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div className="text-xs text-white uppercase tracking-widest flex items-center gap-2">
              <div className="w-1 h-3 bg-teal-400 rounded-full"></div>
              Progressão II-V-I (Preparação)
            </div>
            <button
              onClick={() => playProgression(iiVIProgression, bpm, beatsPerMeasure)}
              className="flex items-center gap-2 text-teal-400 hover:text-teal-300 bg-teal-400/10 hover:bg-teal-400/20 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <Play size={14} />
              <span>Ouvir Progressão</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {iiVIProgression.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="px-4 py-2 bg-white/10 border border-white/5 rounded-lg font-bold text-amber-400">
                  {c.name}
                </div>
                {i < iiVIProgression.length - 1 && (
                  <div className="text-zinc-600 font-bold">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
                  chordIndices={chordTones}
                />
              </div>
              {scale.lick && (
                <div className="mt-4 bg-black/40 rounded-lg p-3 border border-white/5">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-2 bg-pink-500 rounded-full"></div>
                      Lick Sugerido
                    </div>
                    <button
                      onClick={() => playLick(scale.rootIdx, scale.name, data.rootIdx, data.quality, bpm, iiVIProgression || undefined, beatsPerMeasure)}
                      className="flex items-center gap-1 text-teal-400 hover:text-teal-300 bg-teal-400/10 hover:bg-teal-400/20 px-2 py-1 rounded transition-colors"
                    >
                      <Play size={12} />
                      <span>Ouvir</span>
                    </button>
                  </div>
                  <pre className="text-zinc-300 font-mono text-[10px] sm:text-xs overflow-x-auto custom-scrollbar pb-2">
                    {scale.lick}
                  </pre>
                </div>
              )}
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
