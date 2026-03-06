import React, { useState } from "react";
import { Sparkles, ArrowRight, Music, Piano, Mic2 } from "lucide-react";
import { reharmonize, ReharmonizedProgressions } from "../lib/reharmonize";
import { motion, AnimatePresence } from "motion/react";

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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Neo Soul */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-teal-400 font-bold uppercase tracking-wider text-xs">
                    <Piano size={14} /> Neo Soul
                  </div>
                  <div className="text-zinc-300 font-medium leading-relaxed">
                    {results.neoSoul.join(" - ")}
                  </div>
                  <button
                    onClick={() => onApply(results.neoSoul.join(" "))}
                    className="mt-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    Usar <ArrowRight size={14} />
                  </button>
                </div>

                {/* Jazz */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-xs">
                    <Music size={14} /> Jazz
                  </div>
                  <div className="text-zinc-300 font-medium leading-relaxed">
                    {results.jazz.join(" - ")}
                  </div>
                  <button
                    onClick={() => onApply(results.jazz.join(" "))}
                    className="mt-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    Usar <ArrowRight size={14} />
                  </button>
                </div>

                {/* Gospel */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider text-xs">
                    <Mic2 size={14} /> Gospel
                  </div>
                  <div className="text-zinc-300 font-medium leading-relaxed">
                    {results.gospel.join(" - ")}
                  </div>
                  <button
                    onClick={() => onApply(results.gospel.join(" "))}
                    className="mt-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    Usar <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
