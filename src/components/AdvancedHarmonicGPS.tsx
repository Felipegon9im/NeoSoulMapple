import React, { useEffect, useState } from 'react';
import { analyzeChord, detectKey } from '../lib/harmonicAnalysis';
import { Compass, Maximize2, Minimize2, Settings2 } from 'lucide-react';

interface AdvancedHarmonicGPSProps {
  sequence: { name: string; beats: number }[];
  currentIndex: number;
  resolution?: 1 | 2 | 4;
  onResolutionChange?: (res: 1 | 2 | 4) => void;
}

const noteNames = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

function getNoteName(idx: number) {
  return noteNames[(idx % 12 + 12) % 12];
}

export function AdvancedHarmonicGPS({ sequence, currentIndex, resolution, onResolutionChange }: AdvancedHarmonicGPSProps) {
  const [keyInfo, setKeyInfo] = useState<{ rootIdx: number, quality: 'major' | 'minor' }>({ rootIdx: 0, quality: 'major' });
  const [isZenMode, setIsZenMode] = useState(false);

  useEffect(() => {
    const chords = sequence.map(s => s.name);
    if (chords.length > 0) {
      const detected = detectKey(chords);
      setKeyInfo(prev => {
        if (prev.rootIdx === detected.rootIdx && prev.quality === detected.quality) return prev;
        return detected;
      });
    }
  }, [sequence]);

  if (sequence.length === 0) return null;

  return (
    <>
      {isZenMode && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          onClick={() => setIsZenMode(false)}
        />
      )}
      <div className={`w-full bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col ${
        isZenMode 
          ? 'fixed inset-4 z-50 shadow-2xl shadow-black/50 overflow-hidden' 
          : 'overflow-hidden'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Compass className="text-purple-400" size={20} />
            <h3 className="text-lg font-bold text-white">Análise Harmônica</h3>
            <span className="ml-4 text-xs font-bold px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md">
              Tom: {getNoteName(keyInfo.rootIdx)} {keyInfo.quality === 'major' ? 'Maior' : 'Menor'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {resolution && onResolutionChange && (
              <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                <Settings2 size={14} className="text-zinc-400" />
                <span className="text-xs font-bold text-zinc-400 uppercase hidden sm:inline">Resolução:</span>
                <select 
                  value={resolution} 
                  onChange={(e) => onResolutionChange(Number(e.target.value) as 1 | 2 | 4)}
                  className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer"
                >
                  <option value={1}>1/1 (1 por comp)</option>
                  <option value={2}>1/2 (2 por comp)</option>
                  <option value={4}>1/4 (4 por comp)</option>
                </select>
              </div>
            )}
            <button
              onClick={() => setIsZenMode(!isZenMode)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
              title={isZenMode ? "Sair do Modo Zen" : "Modo Zen (Tela Cheia)"}
            >
              {isZenMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>
        
        <div className={`overflow-x-auto custom-scrollbar pb-4 flex-1 ${isZenMode ? 'overflow-y-auto' : ''}`}>
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className={isZenMode ? 'sticky top-0 bg-zinc-900/95 backdrop-blur-sm z-10' : ''}>
              <tr>
                <th className={`p-3 border-b border-white/10 font-bold text-zinc-500 uppercase tracking-wider ${isZenMode ? 'text-sm' : 'text-xs'}`}>Acorde</th>
                <th className={`p-3 border-b border-white/10 font-bold text-zinc-500 uppercase tracking-wider ${isZenMode ? 'text-sm' : 'text-xs'}`}>Grau</th>
                <th className={`p-3 border-b border-white/10 font-bold text-zinc-500 uppercase tracking-wider ${isZenMode ? 'text-sm' : 'text-xs'}`}>Função</th>
                <th className={`p-3 border-b border-white/10 font-bold text-zinc-500 uppercase tracking-wider ${isZenMode ? 'text-sm' : 'text-xs'}`}>Escala Sugerida</th>
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
                      <span className={`font-bold ${isZenMode ? 'text-3xl' : 'text-lg'} ${isActive ? 'text-purple-300' : 'text-zinc-200'}`}>
                        {chord.name}
                      </span>
                    </td>
                    <td className="p-3 border-b border-white/5">
                      <span className={`font-mono font-bold ${isZenMode ? 'text-2xl' : 'text-base'} ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                        {analysis.romanNumeral}
                      </span>
                    </td>
                    <td className="p-3 border-b border-white/5">
                      <span className={`font-bold ${isZenMode ? 'text-xl' : 'text-sm'} ${functionColor}`}>
                        {analysis.harmonicFunction === 'Tonic' ? 'Tônica' : 
                         analysis.harmonicFunction === 'Subdominant' ? 'Subdominante' : 
                         analysis.harmonicFunction === 'Dominant' ? 'Dominante' : 'Empréstimo/Outro'}
                      </span>
                    </td>
                    <td className="p-3 border-b border-white/5">
                      <div className="flex flex-wrap gap-2">
                        {analysis.scales.map((scale, sIdx) => (
                          <span key={sIdx} className={`${isZenMode ? 'text-base px-3 py-1.5' : 'text-xs px-2 py-1'} rounded-md ${isActive ? 'bg-purple-500/40 text-purple-100' : 'bg-black/40 text-zinc-400'}`}>
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
    </>
  );
}
