import React from 'react';
import { useFavorites, SavedVoicing } from '../contexts/FavoritesContext';
import { ChordDiagram } from './ChordDiagram';
import { motion } from 'motion/react';

export function FavoritesView() {
  const { favorites } = useFavorites();

  if (favorites.length === 0) {
    return (
      <div className="text-center text-zinc-500 py-12 italic">
        Você ainda não salvou nenhum voicing.
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
  );
}
