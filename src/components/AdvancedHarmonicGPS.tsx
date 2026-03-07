import React, { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import { analyzeChord, detectKey, HarmonicFunction, ChordAnalysis } from '../lib/harmonicAnalysis';
import { Play, Info, ArrowRight, Music, Compass } from 'lucide-react';

interface AdvancedHarmonicGPSProps {
  sequence: { name: string; beats: number }[];
  currentIndex: number;
}

const noteNames = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

function getNoteName(idx: number) {
  return noteNames[(idx % 12 + 12) % 12];
}

export function AdvancedHarmonicGPS({ sequence, currentIndex }: AdvancedHarmonicGPSProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);
  
  const [selectedChord, setSelectedChord] = useState<ChordAnalysis | null>(null);
  const [keyInfo, setKeyInfo] = useState<{ rootIdx: number, quality: 'major' | 'minor' }>({ rootIdx: 0, quality: 'major' });
  const [viewMode, setViewMode] = useState<'circle' | 'web'>('circle');

  const currentIndexRef = useRef(currentIndex);
  const sequenceRef = useRef(sequence);
  const selectedChordRef = useRef<string | null>(null);
  const viewModeRef = useRef(viewMode);

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    if (currentIndex >= 0 && sequence[currentIndex]) {
      const chordName = sequence[currentIndex].name;
      const analysis = analyzeChord(chordName, keyInfo.rootIdx, keyInfo.quality);
      setSelectedChord(analysis);
      selectedChordRef.current = chordName;
    }
  }, [currentIndex, sequence, keyInfo]);

  useEffect(() => {
    sequenceRef.current = sequence;
    const chords = sequence.map(s => s.name);
    if (chords.length > 0) {
      const detected = detectKey(chords);
      setKeyInfo(detected);
    }
  }, [sequence]);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let nodes: any[] = [];
      const centerX = 300;
      const centerY = 300;

      const generateNodes = () => {
        nodes = [];
        const rootIdx = keyInfo.rootIdx;
        
        // Center Node (Key)
        nodes.push({
          id: 'center',
          name: `${getNoteName(rootIdx)} ${keyInfo.quality === 'major' ? 'Maior' : 'Menor'}`,
          x: centerX,
          y: centerY,
          radius: 60,
          ring: 0,
          color: p.color(168, 85, 247), // Purple
          isChord: false
        });

        // Ring 1: Diatonic
        const diatonicIntervals = [0, 2, 4, 5, 7, 9, 11];
        const diatonicQualities = ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'];
        
        for (let i = 0; i < 7; i++) {
          const angle = (i * p.TWO_PI) / 7 - p.HALF_PI;
          const r = 120;
          const chordName = `${getNoteName(rootIdx + diatonicIntervals[i])}${diatonicQualities[i]}`;
          
          let col = p.color(161, 161, 170); // Default zinc
          if (i === 0 || i === 2 || i === 5) col = p.color(34, 197, 94); // Tonic - Green
          else if (i === 1 || i === 3) col = p.color(59, 130, 246); // Subdominant - Blue
          else if (i === 4 || i === 6) col = p.color(239, 68, 68); // Dominant - Red

          nodes.push({
            id: chordName,
            name: chordName,
            x: centerX + p.cos(angle) * r,
            y: centerY + p.sin(angle) * r,
            radius: 40,
            ring: 1,
            color: col,
            isChord: true
          });
        }

        // Ring 2: Substitutions & Secondary Dominants
        const subIntervals = [1, 2, 3, 4, 6, 8, 9, 10];
        const subQualities = ['maj7', '7', 'maj7', '7', '7', 'maj7', '7', '7'];
        
        for (let i = 0; i < subIntervals.length; i++) {
          const angle = (i * p.TWO_PI) / subIntervals.length - p.HALF_PI + 0.2;
          const r = 220;
          const chordName = `${getNoteName(rootIdx + subIntervals[i])}${subQualities[i]}`;
          
          nodes.push({
            id: chordName,
            name: chordName,
            x: centerX + p.cos(angle) * r,
            y: centerY + p.sin(angle) * r,
            radius: 35,
            ring: 2,
            color: p.color(245, 158, 11), // Amber for subs
            isChord: true
          });
        }

        // Add any sequence chords not in the map to the outer ring
        const seqChords = sequenceRef.current.map(s => s.name);
        const existingNames = nodes.map(n => n.name);
        let extraAngle = 0;
        seqChords.forEach(c => {
          if (!existingNames.includes(c)) {
            nodes.push({
              id: c,
              name: c,
              x: centerX + p.cos(extraAngle) * 280,
              y: centerY + p.sin(extraAngle) * 280,
              radius: 35,
              ring: 3,
              color: p.color(236, 72, 153), // Pink for custom
              isChord: true
            });
            extraAngle += 0.5;
            existingNames.push(c);
          }
        });
      };

      p.setup = () => {
        p.createCanvas(600, 600);
        p.textAlign(p.CENTER, p.CENTER);
        p.textFont('Inter, sans-serif');
        generateNodes();
      };

      p.draw = () => {
        p.clear();
        
        const isWebMode = viewModeRef.current === 'web';

        if (!isWebMode) {
          // Draw rings
          p.noFill();
          p.stroke(255, 10);
          p.strokeWeight(1);
          p.circle(centerX, centerY, 240); // Ring 1
          p.circle(centerX, centerY, 440); // Ring 2
          p.circle(centerX, centerY, 560); // Ring 3
        } else {
          // Draw web connections (all nodes to all nodes with low opacity)
          p.stroke(255, 5);
          p.strokeWeight(1);
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              // Only connect if they are somewhat related (e.g. same ring or adjacent rings)
              if (Math.abs(nodes[i].ring - nodes[j].ring) <= 1) {
                p.line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
              }
            }
          }
        }

        const seq = sequenceRef.current;
        const currIdx = currentIndexRef.current;
        const selected = selectedChordRef.current;

        // Draw progression path
        if (seq.length > 1) {
          p.stroke(255, 40);
          p.strokeWeight(2);
          p.noFill();
          p.beginShape();
          for (let i = 0; i < seq.length; i++) {
            const node = nodes.find(n => n.name === seq[i].name);
            if (node) p.vertex(node.x, node.y);
          }
          p.endShape();

          // Draw active connection
          if (currIdx >= 0 && currIdx < seq.length - 1) {
            const n1 = nodes.find(n => n.name === seq[currIdx].name);
            const n2 = nodes.find(n => n.name === seq[currIdx + 1].name);
            if (n1 && n2) {
              p.stroke(168, 85, 247, 150); // Purple glow line
              p.strokeWeight(4);
              p.line(n1.x, n1.y, n2.x, n2.y);
              
              // Animated particle along the line
              const t = (p.millis() % 1000) / 1000;
              const px = p.lerp(n1.x, n2.x, t);
              const py = p.lerp(n1.y, n2.y, t);
              p.noStroke();
              p.fill(255);
              p.circle(px, py, 6);
            }
          }
        }

        // Draw nodes
        for (let i = 0; i < nodes.length; i++) {
          let node = nodes[i];
          let isPlaying = currIdx >= 0 && seq[currIdx] && seq[currIdx].name === node.name;
          let isSelected = selected === node.name;
          
          let currentRadius = node.radius;
          if (isPlaying) currentRadius *= 1.3;
          else if (isSelected) currentRadius *= 1.1;

          if (isPlaying) {
            // Glow
            p.noStroke();
            for(let r = currentRadius * 2.5; r > currentRadius; r -= 5) {
               let alpha = p.map(r, currentRadius, currentRadius * 2.5, 60, 0);
               p.fill(p.red(node.color), p.green(node.color), p.blue(node.color), alpha);
               p.circle(node.x, node.y, r);
            }
          }

          p.fill(39, 39, 42); // zinc-800
          if (isPlaying || isSelected) {
            p.stroke(node.color);
            p.strokeWeight(3);
          } else {
            p.stroke(node.color);
            p.strokeWeight(1);
          }
          
          p.circle(node.x, node.y, currentRadius);

          p.noStroke();
          p.fill(isPlaying || isSelected ? 255 : 200);
          p.textSize(isPlaying ? 14 : 12);
          p.textStyle(isPlaying || isSelected ? p.BOLD : p.NORMAL);
          p.text(node.name, node.x, node.y);
        }
      };

      p.mousePressed = () => {
        for (let i = 0; i < nodes.length; i++) {
          let node = nodes[i];
          if (!node.isChord) continue;
          let d = p.dist(p.mouseX, p.mouseY, node.x, node.y);
          if (d < node.radius) {
            const analysis = analyzeChord(node.name, keyInfo.rootIdx, keyInfo.quality);
            setSelectedChord(analysis);
            selectedChordRef.current = node.name;
            break;
          }
        }
      };
    };

    p5Instance.current = new p5(sketch, containerRef.current);

    return () => {
      p5Instance.current?.remove();
    };
  }, [keyInfo]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full my-8 bg-black/20 rounded-2xl p-6 border border-white/5">
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-6">
          <div className="text-xs text-white uppercase tracking-widest flex items-center gap-2">
            <Compass size={16} className="text-purple-500" />
            GPS Harmônico
          </div>
          <div className="flex bg-zinc-900/80 p-1 rounded-full border border-white/10">
            <button 
              onClick={() => setViewMode('circle')}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-colors ${viewMode === 'circle' ? 'bg-purple-500 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Círculo
            </button>
            <button 
              onClick={() => setViewMode('web')}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-colors ${viewMode === 'web' ? 'bg-purple-500 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Teia
            </button>
          </div>
        </div>
        <div ref={containerRef} className="relative flex justify-center items-center w-full overflow-hidden rounded-xl" style={{ minHeight: '600px' }} />
        
        <div className="flex gap-4 mt-4 text-[10px] uppercase font-bold tracking-wider text-zinc-500">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Tônica</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Subdominante</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Dominante</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Substituições</div>
        </div>
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Info size={16} className="text-purple-400" />
            Análise Harmônica
          </h3>
          
          {selectedChord ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-end justify-between border-b border-white/5 pb-4">
                <div>
                  <div className="text-3xl font-black text-white">{selectedChord.chordName}</div>
                  <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-1">
                    Grau: <span className="text-purple-400">{selectedChord.romanNumeral}</span>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                  ${selectedChord.harmonicFunction === 'Tonic' ? 'bg-green-500/20 text-green-400' : 
                    selectedChord.harmonicFunction === 'Subdominant' ? 'bg-blue-500/20 text-blue-400' : 
                    selectedChord.harmonicFunction === 'Dominant' ? 'bg-red-500/20 text-red-400' : 
                    'bg-zinc-800 text-zinc-400'}`}
                >
                  {selectedChord.harmonicFunction === 'Tonic' ? 'Tônica' : 
                   selectedChord.harmonicFunction === 'Subdominant' ? 'Subdominante' : 
                   selectedChord.harmonicFunction === 'Dominant' ? 'Dominante' : 'Desconhecida'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Escalas para Improviso</div>
                <div className="flex flex-wrap gap-2">
                  {selectedChord.scales.map((scale, i) => (
                    <span key={i} className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded text-xs font-medium">
                      {scale}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Caminhos Possíveis</div>
                <div className="flex flex-col gap-2">
                  {selectedChord.nextSuggestions.map((next, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-800/50 px-3 py-2 rounded-lg border border-white/5">
                      <ArrowRight size={14} className="text-zinc-500" />
                      <span className="font-bold">{next}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-zinc-500 text-sm italic text-center py-8">
              Clique em um acorde no mapa para ver sua análise detalhada.
            </div>
          )}
        </div>

        <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-5 flex-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Music size={16} className="text-teal-400" />
            Tonalidade Atual
          </h3>
          <div className="text-2xl font-black text-white text-center py-4">
            {getNoteName(keyInfo.rootIdx)} {keyInfo.quality === 'major' ? 'Maior' : 'Menor'}
          </div>
          <div className="text-xs text-zinc-400 text-center leading-relaxed">
            O mapa está organizado em torno desta tonalidade. O anel interno mostra os acordes diatônicos, e os anéis externos mostram substituições e empréstimos modais.
          </div>
        </div>
      </div>
    </div>
  );
}
