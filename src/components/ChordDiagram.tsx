import React from "react";
import { FretValue } from "../lib/chordLibrary";
import { Heart } from "lucide-react";
import { useFavorites } from "../contexts/FavoritesContext";

interface ChordDiagramProps {
  frets: FretValue[];
  startFret: number;
  label: string;
  chordName?: string;
  key?: string | number;
}

export function ChordDiagram({ frets, startFret, label, chordName }: ChordDiagramProps) {
  const displayStart = frets.includes(0) ? 1 : startFret;
  const isNut = displayStart === 1;

  const { toggleFavorite, isFavorite } = useFavorites();
  const id = `${chordName}-${label}-${frets.join("-")}`;
  const favorite = isFavorite(id);

  const handleToggle = () => {
    if (chordName) {
      toggleFavorite({ id, chordName, frets, startFret, label });
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/10 relative group hover:bg-white/10 transition-colors">
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-400 text-black px-2 py-0.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap shadow-[0_0_10px_rgba(45,212,191,0.5)] z-10">
        {label}
      </span>
      {chordName && (
        <button 
          onClick={handleToggle}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-zinc-400 hover:text-pink-500 transition-colors z-10"
          title={favorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
        >
          <Heart size={14} className={favorite ? "fill-pink-500 text-pink-500" : ""} />
        </button>
      )}
      <div className="bg-zinc-950 border border-white/10 rounded-lg p-3 pt-4 shadow-inner mt-2">
        <svg
          width="90"
          height="120"
          viewBox="0 0 100 130"
          xmlns="http://www.w3.org/2000/svg"
        >
          {!isNut && (
            <text
              x="1"
              y="24"
              fill="#fff"
              fontSize="14"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {displayStart}
            </text>
          )}

          {/* Nut or top fret line */}
          <line
            x1="16"
            y1="20"
            x2="96"
            y2="20"
            stroke={isNut ? "#fff" : "#555"}
            strokeWidth={isNut ? "4" : "1"}
          />

          {/* Strings */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const x = 16 + i * 16;
            const fret = frets[i];
            const marker = fret === "x" ? "X" : fret === 0 ? "O" : "";
            return (
              <g key={`string-${i}`}>
                <line
                  x1={x}
                  y1="20"
                  x2={x}
                  y2="120"
                  stroke="#444"
                  strokeWidth="1"
                />
                {marker && (
                  <text
                    x={x}
                    y="12"
                    fill={marker === "X" ? "#ef4444" : "#a1a1aa"}
                    fontSize="11"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {marker}
                  </text>
                )}
              </g>
            );
          })}

          {/* Frets */}
          {[1, 2, 3, 4].map((i) => {
            const y = 20 + i * 25;
            return (
              <line
                key={`fret-${i}`}
                x1="16"
                y1={y}
                x2="96"
                y2={y}
                stroke="#333"
                strokeWidth="1"
              />
            );
          })}

          {/* Dots */}
          {frets.map((f, i) => {
            if (f !== "x" && f > 0) {
              const x = 16 + i * 16;
              const y = 20 + (f - displayStart) * 25 + 12.5;
              return (
                <circle
                  key={`dot-${i}`}
                  cx={x}
                  cy={y}
                  r="6"
                  fill="#a855f7"
                  className="drop-shadow-[0_0_4px_rgba(168,85,247,0.8)]"
                />
              );
            }
            return null;
          })}
        </svg>
      </div>
    </div>
  );
}
