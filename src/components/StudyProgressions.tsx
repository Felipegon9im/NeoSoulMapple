import React, { useState } from 'react';
import { BookOpen, Circle, Music, ArrowRight, X, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SUGGESTIONS = [
  {
    title: "Campos Harmônicos",
    icon: <BookOpen size={16} />,
    items: [
      { name: "Campo Harmônico Maior (Dó)", description: "I ii iii IV V vi vii°", chords: "Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7b5" },
      { name: "Campo Harmônico Menor Natural (Lá)", description: "i ii° III iv v VI VII", chords: "Am7 Bm7b5 Cmaj7 Dm7 Em7 Fmaj7 G7" },
      { name: "Campo Harmônico Menor Harmônico (Lá)", description: "i ii° III+ iv V VI vii°", chords: "Am(maj7) Bm7b5 Cmaj7#5 Dm7 E7 Fmaj7 G#dim7" },
      { name: "Campo Harmônico Menor Melódico (Lá)", description: "i ii mIII IV V vi° vii°", chords: "Am(maj7) Bm7 Cmaj7#5 D7 E7 F#m7b5 G#m7b5" },
    ]
  },
  {
    title: "Ciclos de Estudo",
    icon: <Circle size={16} />,
    items: [
      { name: "Ciclo de Quartas (Dominantes)", description: "Estudo de dominantes resolvendo em quartas", chords: "C7 F7 Bb7 Eb7 Ab7 Db7 Gb7 B7 E7 A7 D7 G7" },
      { name: "Ciclo de Quartas (II-V-I)", description: "II-V-I descendo em tons inteiros", chords: "Dm7 G7 Cmaj7 Cm7 F7 Bbmaj7 Bbm7 Eb7 Abmaj7" },
      { name: "Ciclo de Quintas (Maior)", description: "Movimento em quintas justas", chords: "Cmaj7 Gmaj7 Dmaj7 Amaj7 Emaj7 Bmaj7" },
      { name: "Ciclo de Terças Menores", description: "Movimento em terças menores (Diminuto)", chords: "Cmaj7 Ebmaj7 Gbmaj7 Amaj7" },
    ]
  },
  {
    title: "Progressões Clássicas",
    icon: <Music size={16} />,
    items: [
      { name: "Turnaround Jazz (I-VI-II-V)", description: "A progressão mais comum do Jazz", chords: "Cmaj7 A7 Dm7 G7" },
      { name: "Rhythm Changes (A section)", description: "Baseada em 'I Got Rhythm'", chords: "Cmaj7 Am7 Dm7 G7 Em7 A7 Dm7 G7" },
      { name: "Coltrane Changes (Giant Steps)", description: "Modulação em terças maiores", chords: "Bmaj7 D7 Gmaj7 Bb7 Ebmaj7" },
      { name: "Pop Clássico (I-V-vi-IV)", description: "A progressão de 4 acordes mais famosa", chords: "C G Am F" },
      { name: "Neo Soul Clássico", description: "Progressão menor com extensões", chords: "Am11 Dm9 Gm11 C9" },
    ]
  },
  {
    title: "Empréstimos Modais",
    icon: <Shuffle size={16} />,
    items: [
      { name: "Subdominante Menor (IVm)", description: "O famoso acorde 'triste' (I - IV - iv - I). Traz uma sensação de nostalgia e melancolia.", chords: "Cmaj7 Fmaj7 Fm6 Cmaj7" },
      { name: "Cadência Mario Bros (bVI - bVII - I)", description: "Empréstimo do modo Eólio. Sonoridade épica, triunfante e heroica.", chords: "Cmaj7 Abmaj7 Bbmaj7 Cmaj7" },
      { name: "Acorde bIImaj7 (Napolitano)", description: "Substituição de subdominante. Cria uma tensão flutuante e jazzística antes de resolver.", chords: "Cmaj7 Dbmaj7 Cmaj7" },
      { name: "Acorde bIIImaj7", description: "Empréstimo do modo Dórico/Eólio. Traz uma cor de blues/rock para o campo maior.", chords: "Cmaj7 Ebmaj7 Dm7 G7" },
      { name: "Backdoor Progression (iv7 - bVII7 - I)", description: "Empréstimo do modo Mixolídio. Resolução suave e surpreendente, muito comum no Jazz e R&B.", chords: "Fm7 Bb7 Cmaj7" },
      { name: "Dominante Menor (v menor)", description: "Empréstimo do modo Mixolídio/Eólio. Tira a força do V7, criando uma cadência mais suave e pop.", chords: "Cmaj7 Gm7 Fmaj7" },
      { name: "Empréstimo Lídio (II maior)", description: "O acorde II maior (sem ser dominante secundário). Traz uma sensação brilhante e sonhadora.", chords: "Cmaj7 Dmaj7 Cmaj7" },
    ]
  }
];

interface StudyProgressionsProps {
  onSelect: (chords: string) => void;
}

export function StudyProgressions({ onSelect }: StudyProgressionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full flex flex-col items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-zinc-400 hover:text-teal-400 transition-colors text-sm font-bold uppercase tracking-wider bg-black/20 hover:bg-black/40 px-4 py-2 rounded-full border border-white/5 hover:border-teal-500/30"
      >
        <BookOpen size={16} />
        Sugestões de Estudo
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden w-full"
          >
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-teal-500/20 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl shadow-teal-500/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="text-teal-400" size={20} />
                  Progressões para Estudo
                </h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {SUGGESTIONS.map((category, idx) => (
                  <div key={idx} className="flex flex-col gap-4">
                    <h4 className="flex items-center gap-2 text-zinc-300 font-bold uppercase tracking-wider text-xs border-b border-white/10 pb-2">
                      <span className="text-teal-400">{category.icon}</span>
                      {category.title}
                    </h4>
                    <div className="flex flex-col gap-3">
                      {category.items.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            onSelect(item.chords);
                            setIsOpen(false);
                          }}
                          className="flex flex-col items-start gap-1 p-3 rounded-xl bg-black/40 border border-white/5 hover:bg-teal-500/10 hover:border-teal-500/30 transition-all text-left group"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-white font-bold text-sm group-hover:text-teal-400 transition-colors">{item.name}</span>
                            <ArrowRight size={14} className="text-zinc-600 group-hover:text-teal-400 transition-colors" />
                          </div>
                          <span className="text-zinc-500 text-xs">{item.description}</span>
                          <span className="text-teal-400/70 text-xs font-mono mt-2 bg-black/50 px-2 py-1 rounded w-full">{item.chords}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
