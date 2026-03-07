import React, { useEffect, useRef } from 'react';
import p5 from 'p5';

interface HarmonicGPSProps {
  sequence: { name: string; beats: number }[];
  currentIndex: number;
}

export function HarmonicGPS({ sequence, currentIndex }: HarmonicGPSProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);
  const currentIndexRef = useRef(currentIndex);
  const sequenceRef = useRef(sequence);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    sequenceRef.current = sequence;
  }, [sequence]);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let nodes: { x: number, y: number, name: string, targetRadius: number, currentRadius: number }[] = [];
      let angleStep = 0;
      let radius = 120;

      const initNodes = () => {
        const seq = sequenceRef.current;
        nodes = [];
        angleStep = p.TWO_PI / seq.length;
        for (let i = 0; i < seq.length; i++) {
          let angle = i * angleStep - p.HALF_PI;
          nodes.push({
            x: p.width / 2 + p.cos(angle) * radius,
            y: p.height / 2 + p.sin(angle) * radius,
            name: seq[i].name,
            targetRadius: 35,
            currentRadius: 35
          });
        }
      };

      p.setup = () => {
        p.createCanvas(320, 320);
        p.textAlign(p.CENTER, p.CENTER);
        p.textFont('Inter, sans-serif');
        p.textStyle(p.BOLD);
        
        initNodes();
      };

      p.draw = () => {
        const seq = sequenceRef.current;
        if (nodes.length !== seq.length) {
          initNodes();
        }

        p.clear();
        
        // Draw constellation lines
        p.stroke(255, 15);
        p.strokeWeight(1);
        for(let i=0; i<nodes.length; i++) {
           for(let j=i+1; j<nodes.length; j++) {
              p.line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
           }
        }

        // Draw main sequence path
        p.stroke(255, 40);
        p.strokeWeight(2);
        p.noFill();
        p.beginShape();
        for (let i = 0; i < nodes.length; i++) {
          p.vertex(nodes[i].x, nodes[i].y);
        }
        p.endShape(p.CLOSE);

        const currIdx = currentIndexRef.current;

        // Draw nodes
        for (let i = 0; i < nodes.length; i++) {
          let node = nodes[i];
          let isActive = i === currIdx;
          
          node.targetRadius = isActive ? 50 : 35;
          node.currentRadius = p.lerp(node.currentRadius, node.targetRadius, 0.15);

          if (isActive) {
            // Glow
            p.noStroke();
            for(let r = node.currentRadius * 2.5; r > node.currentRadius; r -= 5) {
               let alpha = p.map(r, node.currentRadius, node.currentRadius * 2.5, 60, 0);
               p.fill(168, 85, 247, alpha);
               p.circle(node.x, node.y, r);
            }
            p.fill(168, 85, 247); // purple-500
            p.stroke(216, 180, 254); // purple-300
          } else {
            p.fill(39, 39, 42); // zinc-800
            p.stroke(255, 255, 255, 30);
          }
          
          p.strokeWeight(2);
          p.circle(node.x, node.y, node.currentRadius);

          p.noStroke();
          p.fill(isActive ? 255 : 161, 161, 170);
          p.textSize(isActive ? 14 : 11);
          p.text(node.name, node.x, node.y);
        }
      };
    };

    p5Instance.current = new p5(sketch, containerRef.current);

    return () => {
      p5Instance.current?.remove();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full my-8">
      <div className="text-xs text-white uppercase tracking-widest mb-6 flex items-center gap-2">
        <div className="w-1 h-3 bg-purple-500 rounded-full"></div>
        GPS Harmônico
      </div>
      <div ref={containerRef} className="relative flex justify-center items-center" />
    </div>
  );
}
