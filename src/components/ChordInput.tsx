import React, { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";

interface ChordInputProps {
  value: string;
  onChange: (val: string) => void;
}

const chordExtensions = [
  { ext: "maj7", desc: "Sétima Maior" },
  { ext: "m7", desc: "Menor Sétima" },
  { ext: "m11", desc: "R&B Aveludado" },
  { ext: "maj7#11", desc: "Lídio Moderno" },
  { ext: "7#9", desc: "Hendrix Chord" },
  { ext: "m9", desc: "Neo Soul Vibe" },
];

export function ChordInput({ value, onChange }: ChordInputProps) {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [suggestions, setSuggestions] = useState<
    { chord: string; desc: string }[]
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (!val) {
      setShowAutocomplete(false);
      return;
    }

    const words = val.split(/\s+/);
    const cur = words[words.length - 1];
    const match = cur.match(/^([A-G][b#]?)/i);

    if (match) {
      const root = match[1].toUpperCase();
      const newSuggestions = chordExtensions.map((item) => ({
        chord: root + item.ext,
        desc: item.desc,
      }));
      setSuggestions(newSuggestions);
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  };

  const handleSelect = (chord: string) => {
    const words = value.split(/\s+/);
    words[words.length - 1] = chord;
    onChange(words.join(" ") + " ");
    setShowAutocomplete(false);
    inputRef.current?.focus();
  };

  return (
    <div
      className="w-full max-w-4xl mx-auto bg-zinc-900/80 backdrop-blur-xl p-6 rounded-2xl border border-purple-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative z-50"
      ref={containerRef}
    >
      <label
        htmlFor="chordInput"
        className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3"
      >
        Sua Progressão:
      </label>
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-purple-500" />
        </div>
        <input
          ref={inputRef}
          type="text"
          id="chordInput"
          value={value}
          onChange={handleInput}
          onFocus={() => {
            if (suggestions.length > 0) setShowAutocomplete(true);
          }}
          placeholder="Ex: Dmaj7 C11 Am11..."
          autoComplete="off"
          spellCheck="false"
          className="w-full bg-black/60 border-none border-b-2 border-b-purple-500 text-amber-400 text-xl sm:text-2xl py-4 pl-12 pr-4 rounded-t-xl outline-none font-montserrat font-bold placeholder:text-zinc-700 focus:bg-black/80 transition-colors"
        />

        {showAutocomplete && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-[#0f0f0f] border border-t-0 border-purple-500/50 rounded-b-xl shadow-[0_15px_40px_rgba(0,0,0,0.9)] max-h-[300px] overflow-y-auto z-[2100] custom-scrollbar">
            {suggestions.map((s, i) => (
              <div
                key={i}
                onClick={() => handleSelect(s.chord)}
                className="px-5 py-3 cursor-pointer border-b border-white/5 flex justify-between items-center hover:bg-purple-500/20 transition-colors"
              >
                <span className="text-amber-400 font-bold font-montserrat">
                  {s.chord}
                </span>
                <span className="text-xs text-teal-400 uppercase tracking-wider">
                  {s.desc}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
