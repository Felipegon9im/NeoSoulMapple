import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Upload, Music, Play, Pause, Activity, Compass, FileAudio, Settings2, Youtube, Link, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { analyzeFile, AnalysisResult, inferChordsFromMelody } from '../lib/audioAnalyzer';
import { analyzeYouTubeUrl, extractYouTubeId } from '../lib/youtubeAnalyzer';
import { AdvancedHarmonicGPS } from './AdvancedHarmonicGPS';
import * as Tone from 'tone';
import YouTube from 'react-youtube';

export function AudioAnalyzerView() {
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const ytPlayerRef = useRef<any>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<1 | 2 | 4>(1);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [synthEnabled, setSynthEnabled] = useState(false);
  const [originalMuted, setOriginalMuted] = useState(false);
  const [isMidi, setIsMidi] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>();
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const partRef = useRef<Tone.Part | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Cleanup Tone.js
  useEffect(() => {
    return () => {
      if (partRef.current) {
        partRef.current.dispose();
      }
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      Tone.Transport.stop();
    };
  }, []);

  const setupSynth = (analysis: AnalysisResult) => {
    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
    }
    
    if (partRef.current) {
      partRef.current.dispose();
      partRef.current = null;
    }
    
    const events = analysis.melody.map(note => ({
      time: note.time,
      note: note.note,
      duration: note.duration
    }));
    
    partRef.current = new Tone.Part((time, value) => {
      synthRef.current?.triggerAttackRelease(value.note, value.duration, time);
    }, events).start(0);
  };

  // Update synth volume based on state
  useEffect(() => {
    if (synthRef.current) {
      const effectiveVolume = isMuted ? 0 : volume;
      const shouldPlaySynth = isMidi || synthEnabled;
      const db = (effectiveVolume === 0 || !shouldPlaySynth) ? -60 : 20 * Math.log10(effectiveVolume);
      synthRef.current.volume.value = db;
    }
  }, [synthEnabled, isMidi, isMuted, volume]);

  const handleYouTubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl) return;

    const id = extractYouTubeId(youtubeUrl);
    if (!id) {
      setError('URL do YouTube inválida.');
      return;
    }

    setYoutubeId(id);
    setFile(null);
    setIsMidi(false);
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setOriginalMuted(false);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    Tone.Transport.stop();
    if (partRef.current) {
      partRef.current.dispose();
      partRef.current = null;
    }

    try {
      const analysis = await analyzeYouTubeUrl(youtubeUrl);
      setResult(analysis);
      setupSynth(analysis);
    } catch (err: any) {
      setError(err.message || 'Erro ao analisar o vídeo do YouTube.');
      setYoutubeId(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const isMidiFile = selectedFile.name.endsWith('.mid') || selectedFile.name.endsWith('.midi');
    setIsMidi(isMidiFile);
    setFile(selectedFile);
    setYoutubeUrl('');
    setYoutubeId(null);
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setOriginalMuted(false);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    Tone.Transport.stop();
    if (partRef.current) {
      partRef.current.dispose();
      partRef.current = null;
    }

    try {
      const analysis = await analyzeFile(selectedFile);
      setResult(analysis);
      setupSynth(analysis);
      
      // Create object URL for playback
      if (!isMidiFile) {
        const url = URL.createObjectURL(selectedFile);
        if (!audioRef.current) {
          audioRef.current = new Audio(url);
          
          audioRef.current.addEventListener('play', async () => {
            setIsPlaying(true);
            await Tone.start();
            Tone.Transport.start();
            if (audioRef.current) Tone.Transport.seconds = audioRef.current.currentTime;
          });
          
          audioRef.current.addEventListener('pause', () => {
            setIsPlaying(false);
            Tone.Transport.pause();
          });
          
          audioRef.current.addEventListener('ended', () => {
            setIsPlaying(false);
            Tone.Transport.stop();
          });
          
          audioRef.current.addEventListener('seeked', () => {
            if (audioRef.current) Tone.Transport.seconds = audioRef.current.currentTime;
          });
        } else {
          audioRef.current.src = url;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao analisar o arquivo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Recalculate chords when resolution changes
  const displayResult = useMemo(() => {
    if (!result) return null;
    
    const measureDuration = (60 / result.bpm) * parseInt(result.timeSignature.split('/')[0]);
    const segmentDuration = measureDuration / resolution;
    
    const newChords = inferChordsFromMelody(result.melody, segmentDuration);
    const newProgression = newChords.map(c => c.name);
    
    return {
      ...result,
      chords: newChords,
      progression: newProgression
    };
  }, [result, resolution]);

  const togglePlay = async () => {
    if (!displayResult) return;
    
    await Tone.start();
    
    if (isPlaying) {
      if (youtubeId && ytPlayerRef.current) {
        ytPlayerRef.current.pauseVideo();
      } else if (audioRef.current && audioRef.current.src) {
        audioRef.current.pause();
      }
      Tone.Transport.pause();
    } else {
      if (youtubeId && ytPlayerRef.current) {
        ytPlayerRef.current.playVideo();
      } else if (audioRef.current && audioRef.current.src) {
        audioRef.current.play();
      }
      Tone.Transport.start();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!displayResult || !progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * displayResult.duration;
    
    setCurrentTime(newTime);
    
    if (youtubeId && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(newTime, true);
    } else if (audioRef.current && audioRef.current.src) {
      audioRef.current.currentTime = newTime;
    }
    Tone.Transport.seconds = newTime;
  };

  // Update original audio volume based on state
  useEffect(() => {
    const effectiveVolume = isMuted || originalMuted ? 0 : volume;
    if (youtubeId && ytPlayerRef.current) {
      if (effectiveVolume === 0) {
        ytPlayerRef.current.mute();
      } else {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(effectiveVolume * 100);
      }
    }
    if (audioRef.current) {
      audioRef.current.muted = effectiveVolume === 0;
      audioRef.current.volume = effectiveVolume;
    }
  }, [originalMuted, isMuted, volume, youtubeId]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    const updateTime = async () => {
      if (youtubeId && ytPlayerRef.current) {
        const time = await ytPlayerRef.current.getCurrentTime();
        setCurrentTime(time);
      } else if (audioRef.current && audioRef.current.src) {
        setCurrentTime(audioRef.current.currentTime);
      } else if (displayResult) {
        setCurrentTime(Tone.Transport.seconds);
        // Auto stop for MIDI
        if (Tone.Transport.seconds >= displayResult.duration) {
          Tone.Transport.stop();
          setIsPlaying(false);
          setCurrentTime(0);
        }
      }
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateTime);
      }
    };

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateTime);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, displayResult, youtubeId]);

  // Find current chord index
  const currentChordIndex = displayResult?.chords.findIndex(c => 
    currentTime >= c.time && currentTime < c.time + c.duration
  ) ?? -1;

  const gpsSequence = useMemo(() => {
    if (!displayResult) return [];
    return displayResult.chords.map(c => ({ name: c.name, beats: 4 }));
  }, [displayResult]);

  // Format melody into measures
  const formatMelody = () => {
    if (!displayResult) return null;
    
    const measures: string[] = [];
    let currentMeasure = '';
    let measureCount = 0;
    
    displayResult.melody.forEach((note, i) => {
      const isCurrent = currentTime >= note.time && currentTime < note.time + note.duration;
      const noteSpan = `<span class="${isCurrent ? 'text-purple-400 font-bold scale-110 inline-block transition-transform' : 'text-zinc-300'}">${note.note}</span>`;
      
      currentMeasure += noteSpan + ' ';
      
      // Rough measure splitting (every 4 notes for simplicity in display)
      if ((i + 1) % 4 === 0) {
        measures.push(currentMeasure.trim());
        currentMeasure = '';
        measureCount++;
      }
    });
    
    if (currentMeasure) measures.push(currentMeasure.trim());
    
    return (
      <div className="font-mono text-sm leading-relaxed">
        {measures.map((m, i) => (
          <React.Fragment key={i}>
            <span dangerouslySetInnerHTML={{ __html: m }} />
            {i % 2 === 1 ? <br /> : <span className="text-zinc-600 mx-2">|</span>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-32">
      {/* Header & Upload */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Activity className="text-purple-400" />
              Análise Musical com IA
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              Cole um link do YouTube ou faça upload de um arquivo para extrair melodia, acordes e tonalidade.
            </p>
          </div>
          
          <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold cursor-pointer transition-colors shrink-0">
            <Upload size={18} />
            <span>Upload de Arquivo</span>
            <input 
              type="file" 
              accept=".mp3,.wav,.mid,.midi" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>
        </div>

        <form onSubmit={handleYouTubeSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Youtube className="text-zinc-400" size={20} />
            </div>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Cole a URL do YouTube aqui..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!youtubeUrl || isAnalyzing}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            {isAnalyzing && youtubeUrl ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Link size={18} />
            )}
            <span>Analisar</span>
          </button>
        </form>

        {file && (
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-300 bg-black/20 p-3 rounded-lg border border-white/5">
            <FileAudio size={16} className="text-purple-400" />
            <span className="font-mono">{file.name}</span>
            {isAnalyzing && (
              <span className="ml-auto flex items-center gap-2 text-purple-400">
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                Analisando...
              </span>
            )}
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {displayResult && !isAnalyzing && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Tempo</span>
              <span className="text-2xl font-black text-white">{displayResult.bpm} <span className="text-sm text-zinc-400 font-normal">BPM</span></span>
            </div>
            <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Compasso</span>
              <span className="text-2xl font-black text-white">{displayResult.timeSignature}</span>
            </div>
            <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Tonalidade</span>
              <span className="text-2xl font-black text-purple-400">{displayResult.key}</span>
            </div>
            <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Escala</span>
              <span className="text-lg font-bold text-white">{displayResult.scale}</span>
            </div>
          </div>

          {/* Player Controls */}
          <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={togglePlay}
              className="w-12 h-12 flex items-center justify-center bg-purple-600 hover:bg-purple-500 text-white rounded-full transition-colors shrink-0"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </button>
            <div className="flex-1 w-full">
              <div 
                ref={progressBarRef}
                className="h-3 bg-black/40 rounded-full overflow-hidden cursor-pointer relative group"
                onClick={handleSeek}
              >
                <div 
                  className="h-full bg-purple-500 transition-all duration-100 ease-linear"
                  style={{ width: `${(currentTime / displayResult.duration) * 100}%` }}
                />
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex justify-between text-xs text-zinc-500 mt-1 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(displayResult.duration)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
              <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={isMuted ? 0 : volume} 
                onChange={handleVolumeChange}
                className="w-20 accent-purple-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
              <Settings2 size={14} className="text-zinc-400" />
              <span className="text-xs font-bold text-zinc-400 uppercase">Resolução:</span>
              <select 
                value={resolution} 
                onChange={(e) => setResolution(Number(e.target.value) as 1 | 2 | 4)}
                className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer"
              >
                <option value={1}>1/1 (1 por comp)</option>
                <option value={2}>1/2 (2 por comp)</option>
                <option value={4}>1/4 (4 por comp)</option>
              </select>
            </div>
          </div>

          {/* Hidden YouTube Player */}
          {youtubeId && (
            <div className="absolute opacity-0 pointer-events-none overflow-hidden" style={{ width: '1px', height: '1px' }}>
              <YouTube 
                videoId={youtubeId} 
                opts={{ width: '1', height: '1', playerVars: { autoplay: 0, controls: 0 } }}
                onReady={(e) => { ytPlayerRef.current = e.target; }}
                onEnd={() => {
                  setIsPlaying(false);
                  Tone.Transport.stop();
                }}
                onStateChange={async (e) => {
                  if (e.data === YouTube.PlayerState.PLAYING) {
                    setIsPlaying(true);
                    await Tone.start();
                    Tone.Transport.start();
                    // Sync time
                    const time = await ytPlayerRef.current.getCurrentTime();
                    Tone.Transport.seconds = time;
                  }
                  if (e.data === YouTube.PlayerState.PAUSED || e.data === YouTube.PlayerState.BUFFERING) {
                    setIsPlaying(false);
                    Tone.Transport.pause();
                  }
                  if (e.data === YouTube.PlayerState.ENDED) {
                    setIsPlaying(false);
                    Tone.Transport.stop();
                  }
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Melody Extraction */}
            <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Music className="text-purple-400" size={20} />
                  <h3 className="text-lg font-bold text-white">Melodia Extraída</h3>
                </div>
                
                {!isMidi && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOriginalMuted(!originalMuted)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                        !originalMuted 
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' 
                          : 'bg-black/40 border-white/10 text-zinc-400 hover:text-zinc-300'
                      }`}
                    >
                      <span className="text-base">{!originalMuted ? '🔊' : '🔇'}</span>
                      {originalMuted ? 'Original Mudo' : 'Ouvir Original'}
                    </button>
                    <button
                      onClick={async () => {
                        await Tone.start();
                        setSynthEnabled(!synthEnabled);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                        synthEnabled 
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' 
                          : 'bg-black/40 border-white/10 text-zinc-400 hover:text-zinc-300'
                      }`}
                    >
                      <span className="text-base">🎹</span>
                      {synthEnabled ? 'Sintetizador Ativo' : 'Ouvir Sintetizador'}
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-black/40 rounded-xl p-4 border border-white/5 h-64 overflow-y-auto custom-scrollbar">
                <div className="text-zinc-500 text-xs mb-4 font-mono">Clave de Sol</div>
                {formatMelody()}
              </div>
            </div>

            {/* Chord Progression */}
            {isZenMode && (
              <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                onClick={() => setIsZenMode(false)}
              />
            )}
            <div className={`bg-zinc-900/80 border border-white/10 rounded-2xl p-6 flex flex-col ${
              isZenMode 
                ? 'fixed inset-4 z-50 shadow-2xl shadow-black/50' 
                : ''
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Compass className="text-purple-400" size={20} />
                  <h3 className="text-lg font-bold text-white">Progressão Sugerida</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                    <Settings2 size={14} className="text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-400 uppercase hidden sm:inline">Resolução:</span>
                    <select 
                      value={resolution} 
                      onChange={(e) => setResolution(Number(e.target.value) as 1 | 2 | 4)}
                      className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer"
                    >
                      <option value={1}>1/1 (1 por comp)</option>
                      <option value={2}>1/2 (2 por comp)</option>
                      <option value={4}>1/4 (4 por comp)</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setIsZenMode(!isZenMode)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                    title={isZenMode ? "Sair do Modo Zen" : "Modo Zen (Tela Cheia)"}
                  >
                    {isZenMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                </div>
              </div>
              <div className={`bg-black/40 rounded-xl p-4 border border-white/5 overflow-y-auto custom-scrollbar flex-1 ${
                isZenMode ? 'h-auto' : 'h-64'
              }`}>
                <div className={`flex flex-wrap gap-2 ${isZenMode ? 'justify-center content-start' : ''}`}>
                  {displayResult.chords.map((chord, i) => {
                    const isCurrent = currentChordIndex === i;
                    return (
                      <div 
                        key={i}
                        className={`px-4 py-3 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center min-w-[80px]
                          ${isCurrent 
                            ? 'bg-purple-500/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-105' 
                            : 'bg-white/5 border-white/10'}
                          ${isZenMode ? 'min-w-[120px] min-h-[100px] m-2' : ''}`}
                      >
                        <span className={`font-black ${isZenMode ? 'text-4xl' : 'text-xl'} ${isCurrent ? 'text-purple-300' : 'text-white'}`}>
                          {chord.name}
                        </span>
                        <span className={`text-zinc-500 uppercase mt-1 ${isZenMode ? 'text-sm' : 'text-[10px]'}`}>
                          {resolution === 1 ? `Comp ${i+1}` : `Comp ${Math.floor(i/resolution)+1}.${(i%resolution)+1}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/10">
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-2">Formato Textual</span>
                  <div className="font-mono text-sm text-zinc-300 bg-black/40 p-3 rounded-lg">
                    | {displayResult.progression.join(' | ')} |
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Harmonic GPS */}
          <AdvancedHarmonicGPS 
            sequence={gpsSequence} 
            currentIndex={currentChordIndex} 
            resolution={resolution}
            onResolutionChange={setResolution}
          />
          
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
