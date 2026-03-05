import React, { useState } from "react";
import { ChordInput } from "./components/ChordInput";
import { ChordCard } from "./components/ChordCard";
import { FavoritesView } from "./components/FavoritesView";
import { motion } from "motion/react";
import { Search, Heart } from "lucide-react";

export default function App() {
  const [progression, setProgression] = useState("Dmaj7 C11 Em11 Ebmaj7#11");
  const [view, setView] = useState<"search" | "favorites">("search");

  const chords = progression.split(/[\s,]+/).filter((c) => c.length > 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-purple-500/30">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-5xl flex flex-col items-center">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 w-full max-w-2xl"
        >
          <h1 className="font-montserrat text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            Neo Soul <span className="text-purple-400">Mapper</span> Pro
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base font-medium tracking-wide">
            A maior biblioteca de voicings para guitarra moderna.
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full mb-12 flex flex-col items-center"
        >
          <div className="flex bg-zinc-900/80 p-1 rounded-full border border-white/10 mb-8">
            <button 
              onClick={() => setView('search')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-colors ${view === 'search' ? 'bg-purple-500 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Search size={16} /> Buscar
            </button>
            <button 
              onClick={() => setView('favorites')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-colors ${view === 'favorites' ? 'bg-pink-500 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Heart size={16} /> Salvos
            </button>
          </div>

          {view === 'search' && (
            <ChordInput value={progression} onChange={setProgression} />
          )}
        </motion.div>

        {view === 'search' ? (
          <div className="w-full max-w-4xl flex flex-col gap-8">
            {chords.map((chord, index) => (
              <ChordCard key={`${chord}-${index}`} chordStr={chord} />
            ))}
            {chords.length === 0 && (
              <div className="text-center text-zinc-500 py-12 italic">
                Digite uma progressão de acordes acima para começar.
              </div>
            )}
          </div>
        ) : (
          <FavoritesView />
        )}
      </div>
    </div>
  );
}
