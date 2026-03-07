import React, { useEffect, useState } from 'react';
import { analyzeChord, detectKey } from '../lib/harmonicAnalysis';
import { Compass } from 'lucide-react';

interface AdvancedHarmonicGPSProps {
  sequence: { name: string; beats: number }[];
  currentIndex: number;
}

const noteNames = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

function getNoteName(idx: number) {
  return noteNames[(idx % 12 + 12) % 12];
}

export function AdvancedHarmonicGPS({ sequence, currentIndex }: AdvancedHarmonicGPSProps) {
  const [keyInfo, setKeyInfo] = useState<{ rootIdx: number, quality: 'major' | 'minor' }>({ rootIdx: 0, quality: 'major' });

  useEffect(() => {
    const chords = sequence.map(s => s.name);
    if (chords.length > 0) {
      const detected = detectKey(chords);
      setKeyInfo(detected);
    }
  }, [sequence]);

  if (sequence.length === 0) return null;

  return (
    <div className="w-full bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Compass className="text-purple-400" size={20} />
        <h3 className="text-lg font-bold text-white">Análise Harmônica</h3>
        <span className="ml-auto text-xs font-bold px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md">
          Tom: {getNoteName(keyInfo.rootIdx)} {keyInfo.quality === 'major' ? 'Maior' : 'Menor'}
        </span>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar pb-4">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="p-3 border-b border-white/10 text-xs font-bold text-zinc-500 uppercase tracking-wider">Acorde</th>
              <th className="p-3 border-b border-white/10 text-xs font-bold text-zinc-500 uppercase tracking-wider">Grau</th>
              <th className="p-3 border-b border-white/10 text-xs font-bold text-zinc-500 uppercase tracking-wider">Função</th>
              <th className="p-3 border-b border-white/10 text-xs font-bold text-zinc-500 uppercase tracking-wider">Escala Sugerida</th>
            </tr>
          </thead>
          <tbody>
            {sequence.map((chord, idx) => {
              const analysis = analyzeChord(chord.name, keyInfo.rootIdx, keyInfo.quality);
              const isActive = currentIndex === idx;
              
              let functionColor = "text-zinc-400";
              if (analysis.harmonicFunction === 'Tonic') functionColor = "text-green-400";
              else if (analysis.harmonicFunction === 'Subdominant') functionColor = "text-blue-400";
              else if (analysis.harmonicFunction === 'Dominant') functionColor = "text-red-400";

              return (
                <tr 
                  key={`${chord.name}-${idx}`}
                  className={`transition-all duration-300 ${isActive ? 'bg-purple-500/20 shadow-[inset_0_0_20px_rgba(168,85,247,0.3)]' : 'hover:bg-white/5'}`}
                >
                  <td className="p-3 border-b border-white/5">
                    <span className={`font-bold text-lg ${isActive ? 'text-purple-300' : 'text-zinc-200'}`}>
                      {chord.name}
                    </span>
                  </td>
                  <td className="p-3 border-b border-white/5">
                    <span className={`font-mono font-bold ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                      {analysis.romanNumeral}
                    </span>
                  </td>
                  <td className="p-3 border-b border-white/5">
                    <span className={`text-sm font-bold ${functionColor}`}>
                      {analysis.harmonicFunction === 'Tonic' ? 'Tônica' : 
                       analysis.harmonicFunction === 'Subdominant' ? 'Subdominante' : 
                       analysis.harmonicFunction === 'Dominant' ? 'Dominante' : 'Empréstimo/Outro'}
                    </span>
                  </td>
                  <td className="p-3 border-b border-white/5">
                    <div className="flex flex-wrap gap-1">
                      {analysis.scales.map((scale, sIdx) => (
                        <span key={sIdx} className={`text-xs px-2 py-1 rounded-md ${isActive ? 'bg-purple-500/40 text-purple-100' : 'bg-black/40 text-zinc-400'}`}>
                          {scale}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
