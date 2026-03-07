import React, { useState } from "react";
import { Sparkles, ArrowRight, Music, Piano, Mic2, Shuffle } from "lucide-react";
import { reharmonize, ReharmonizedProgressions } from "../lib/reharmonize";
import { motion, AnimatePresence } from "motion/react";
import { MiniChordList } from "./MiniChordList";

interface ReharmonizerProps {
  chords: string[];
  onApply: (progression: string) => void;
}

export function Reharmonizer({ chords, onApply }: ReharmonizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<ReharmonizedProgressions | null>(null);

  const handleReharmonize = () => {
    if (chords.length === 0) return;
    setResults(reharmonize(chords));
    setIsOpen(true);
  };

  if (chords.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mb-8">
      <button
        onClick={handleReharmonize}
        className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 w-full sm:w-auto justify-center"
      >
        <Sparkles size={18} />
        Reharmonizar Progressão
      </button>

      <AnimatePresence>
        {isOpen && results && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-900/80 backdrop-blur-md border border-purple-500/30 rounded-2xl p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="text-purple-400" size={20} />
                  Variações Geradas
                </h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-sm font-bold"
                >
                  Fechar
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {/* Neo Soul */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-teal-400 font-bold uppercase tracking-wider text-sm">
                      <Piano size={16} /> Neo Soul
                    </div>
                    <button
                      onClick={() => onApply(results.neoSoul.join(" "))}
                      className="flex items-center gap-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                      Usar Progressão <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="text-zinc-400 text-sm leading-relaxed border-l-2 border-teal-500/30 pl-3">
                    <strong className="text-zinc-200">Lógica aplicada:</strong> Adição de extensões ricas (9ªs e 11ªs) para criar uma sonoridade mais "aberta" e moderna. Acordes maiores viram maj9, e menores viram m11.
                  </div>
                  <div className="flex flex-col gap-4 mt-2">
                    {results.neoSoul.map((chord, idx) => (
                      <MiniChordList key={`${chord}-${idx}`} chordStr={chord} />
                    ))}
                  </div>
                </div>

                {/* Jazz */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-sm">
                      <Music size={16} /> Jazz
                    </div>
                    <button
                      onClick={() => onApply(results.jazz.join(" "))}
                      className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                      Usar Progressão <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="text-zinc-400 text-sm leading-relaxed border-l-2 border-amber-500/30 pl-3">
                    <strong className="text-zinc-200">Lógica aplicada:</strong> Substituição de acordes dominantes (V) por progressões completas de II-V para criar mais movimento harmônico antes da resolução. Uso de extensões alteradas (13, m9).
                  </div>
                  <div className="flex flex-col gap-4 mt-2">
                    {results.jazz.map((chord, idx) => (
                      <MiniChordList key={`${chord}-${idx}`} chordStr={chord} />
                    ))}
                  </div>
                </div>

                {/* Gospel */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider text-sm">
                      <Mic2 size={16} /> Gospel
                    </div>
                    <button
                      onClick={() => onApply(results.gospel.join(" "))}
                      className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                      Usar Progressão <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="text-zinc-400 text-sm leading-relaxed border-l-2 border-rose-500/30 pl-3">
                    <strong className="text-zinc-200">Lógica aplicada:</strong> Inserção de acordes diminutos de passagem (meio tom abaixo do acorde alvo) para criar forte tensão e resolução. Uso de dominantes secundários alterados (ex: 7#9) resolvendo em acordes menores.
                  </div>
                  <div className="flex flex-col gap-4 mt-2">
                    {results.gospel.map((chord, idx) => (
                      <MiniChordList key={`${chord}-${idx}`} chordStr={chord} />
                    ))}
                  </div>
                </div>

                {/* Modal */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider text-sm">
                      <Shuffle size={16} /> Modal
                    </div>
                    <button
                      onClick={() => onApply(results.modal.join(" "))}
                      className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                      Usar Progressão <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="text-zinc-400 text-sm leading-relaxed border-l-2 border-blue-500/30 pl-3">
                    <strong className="text-zinc-200">Lógica aplicada:</strong> Empréstimo Modal (Modal Interchange). Substitui resoluções comuns por acordes de outros modos, como a cadência Mario Bros (bVImaj7 - bVII7 - I) ou a subdominante menor (ivm6) para uma sonoridade épica ou melancólica.
                  </div>
                  <div className="flex flex-col gap-4 mt-2">
                    {results.modal.map((chord, idx) => (
                      <MiniChordList key={`${chord}-${idx}`} chordStr={chord} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
