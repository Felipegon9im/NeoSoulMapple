import React, { useState, useEffect } from 'react';
import { useFavorites, SavedVoicing } from '../contexts/FavoritesContext';
import { ChordDiagram } from './ChordDiagram';
import { motion } from 'motion/react';
import { Play, Trash2 } from 'lucide-react';

export function FavoritesView({ onLoadProgression }: { onLoadProgression?: (chords: string) => void }) {
  const { favorites } = useFavorites();
  const [savedProgressions, setSavedProgressions] = useState<{name: string, chords: string}[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedProgressions") || "[]");
    setSavedProgressions(saved);
  }, []);

  const handleDeleteProgression = (index: number) => {
    const newSaved = [...savedProgressions];
    newSaved.splice(index, 1);
    setSavedProgressions(newSaved);
    localStorage.setItem("savedProgressions", JSON.stringify(newSaved));
  };

  if (favorites.length === 0 && savedProgressions.length === 0) {
    return (
      <div className="text-center text-zinc-500 py-12 italic">
        Você ainda não salvou nenhum voicing ou progressão.
      </div>
    );
  }

  // Group by chordName
  const grouped = favorites.reduce<Record<string, SavedVoicing[]>>((acc, curr) => {
    if (!acc[curr.chordName]) acc[curr.chordName] = [];
    acc[curr.chordName].push(curr);
    return acc;
  }, {});

  return (
    <div className="w-full max-w-4xl flex flex-col gap-8">
      {savedProgressions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 border-l-4 border-l-teal-500 shadow-2xl"
        >
          <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
            <h2 className="font-montserrat text-2xl font-black text-teal-400 tracking-tight">
              Progressões Salvas
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            {savedProgressions.map((prog, i) => (
              <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-black/40 p-4 rounded-xl border border-white/5 gap-4">
                <div>
                  <h3 className="text-white font-bold mb-1">{prog.name}</h3>
                  <p className="text-teal-400/70 text-sm font-mono">{prog.chords}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (onLoadProgression) onLoadProgression(prog.chords);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Play size={14} />
                    Carregar
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(prog.chords);
                      alert("Progressão copiada para a área de transferência!");
                    }}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg text-xs font-bold transition-colors"
                  >
                    Copiar
                  </button>
                  <button 
                    onClick={() => handleDeleteProgression(i)}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {Object.keys(grouped).length > 0 && (
        <div className="flex flex-col gap-8">
          {(Object.entries(grouped) as [string, SavedVoicing[]][]).map(([chordName, voicings]) => (
            <motion.div 
              key={chordName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 border-l-4 border-l-pink-500 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                <h2 className="font-montserrat text-3xl font-black text-pink-400 tracking-tight">
                  {chordName}
                </h2>
              </div>
              <div className="w-full overflow-x-auto pb-6 custom-scrollbar">
                <div className="flex gap-6 w-max items-end pt-4">
                  {voicings.map((v) => (
                    <ChordDiagram 
                      key={v.id}
                      frets={v.frets}
                      startFret={v.startFret}
                      label={v.label}
                      chordName={v.chordName}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
