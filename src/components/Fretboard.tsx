import React from "react";
import { guitarTuning, getNoteName } from "../lib/chordLibrary";

interface FretboardProps {
  scaleIndices: number[];
  targetRootIndex: number;
  chordIndices?: number[];
}

export function Fretboard({ scaleIndices, targetRootIndex, chordIndices = [] }: FretboardProps) {
  return (
    <div className="flex flex-col bg-[#1e1510] border-2 border-black rounded-lg w-max min-w-full shadow-2xl overflow-hidden">
      {guitarTuning.map((stringBaseNoteIndex, s) => (
        <div key={`string-${s}`} className="flex h-6 relative">
          {/* String line */}
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-b from-zinc-300 to-zinc-500 z-0 -translate-y-1/2 shadow-sm" />

          {Array.from({ length: 16 }).map((_, f) => {
            const isNut = f === 0;
            const noteIdx = (stringBaseNoteIndex + f) % 12;
            const inScale = scaleIndices.includes(noteIdx);
            const isRoot = noteIdx === targetRootIndex;
            const isChordTone = chordIndices.includes(noteIdx);

            return (
              <div
                key={`fret-${s}-${f}`}
                className={`relative flex justify-center items-center border-r border-[#777] ${isNut ? "w-[30px] border-r-[5px] border-r-[#d4c4a8] bg-black" : "w-[50px]"}`}
              >
                {inScale && (
                  <div
                    className={`
                      w-[18px] h-[18px] rounded-full flex justify-center items-center z-10 text-[10px] font-bold text-black shadow-md
                      ${isRoot 
                        ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" 
                        : isChordTone 
                          ? "bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]" 
                          : "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]"}
                    `}
                  >
                    {getNoteName(noteIdx)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
