import React from "react";
import { parseChord, getVariations } from "../lib/chordLibrary";
import { ChordDiagram } from "./ChordDiagram";

interface MiniChordListProps {
  chordStr: string;
  key?: string | number;
}

export function MiniChordList({ chordStr }: MiniChordListProps) {
  const data = parseChord(chordStr);
  if (!data) return null;

  const variations = getVariations(data.rootIdx, data.type);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-white font-bold text-sm bg-black/40 px-3 py-1 rounded-lg border border-white/10 w-max">
        {data.original}
      </div>
      <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-4 w-max items-end pt-4">
          {variations.map((v, i) => (
            <ChordDiagram
              key={`${v.category}-${i}`}
              frets={v.frets}
              startFret={v.startFret}
              label={v.label}
              chordName={data.original}
            />
          ))}
          {variations.length === 0 && (
            <div className="text-zinc-500 text-xs italic py-2">
              Nenhum shape encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
