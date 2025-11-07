import React, { useEffect, useState, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, Settings } from "lucide-react";

interface AudioViewerProps {
  src: string;
  themeColor?: string;
  className?: string;
}

export const AudioViewer: React.FC<AudioViewerProps> = ({ src, themeColor = "#ec4899", className }) => {
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const blobUrlRef = useRef<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number>(0);
  
  // Equalizer bands (10 bands)
  const [eqBands, setEqBands] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadAudio = async () => {
      try {
        setIsLoading(true);
        setError("");

        console.log('AudioViewer: Loading audio file:', src);

        if (typeof window !== 'undefined' && (window as any).electronAPI?.readFile) {
          const result = await (window as any).electronAPI.readFile(src);
          
          console.log('AudioViewer: File read result:', {
            success: result.success,
            dataType: typeof result.data,
            dataLength: result.data?.length || result.data?.byteLength || 0
          });

          if (!result.success) {
            throw new Error(result.error || 'Échec de la lecture du fichier');
          }

          if (!result.data || result.data.length === 0 || result.data.byteLength === 0) {
            throw new Error('Le fichier audio est vide ou n\'a pas pu être lu');
          }

          // Détecter le type MIME
          const ext = src.split('.').pop()?.toLowerCase();
          const mimeTypes: Record<string, string> = {
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'wave': 'audio/wav',
            'ogg': 'audio/ogg',
            'oga': 'audio/ogg',
            'opus': 'audio/opus',
            'flac': 'audio/flac',
            'aac': 'audio/aac',
            'm4a': 'audio/mp4',
            'm4b': 'audio/mp4',
            'm4p': 'audio/mp4',
            'wma': 'audio/x-ms-wma',
            'webm': 'audio/webm',
            'aiff': 'audio/aiff',
            'aif': 'audio/aiff',
            'ape': 'audio/ape',
            'mka': 'audio/x-matroska',
            'wv': 'audio/wavpack',
            'tta': 'audio/tta',
            'tak': 'audio/tak',
            'mp2': 'audio/mpeg',
            'mp1': 'audio/mpeg',
            'mpa': 'audio/mpeg',
            'ac3': 'audio/ac3',
            'dts': 'audio/vnd.dts',
            'amr': 'audio/amr',
            '3gp': 'audio/3gpp',
            'ra': 'audio/vnd.rn-realaudio',
            'ram': 'audio/vnd.rn-realaudio',
          };
          const mimeType = mimeTypes[ext || ''] || 'audio/mpeg';

          // Créer un blob à partir des données
          const blob = new Blob([result.data], { type: mimeType });
          console.log('AudioViewer: Blob created, size:', blob.size, 'type:', blob.type);

          if (blob.size === 0) {
            throw new Error('Le blob créé est vide');
          }

          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;

          if (mounted) {
            setAudioUrl(url);
            setIsLoading(false);
          }
        } else {
          throw new Error('API Electron non disponible');
        }
      } catch (err: any) {
        console.error('AudioViewer: Error loading audio:', err);
        if (mounted) {
          setError(err.message || 'Erreur lors du chargement de l\'audio');
          setIsLoading(false);
        }
      }
    };

    loadAudio();

    return () => {
      mounted = false;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [src]);

  // Setup Web Audio API for visualization and equalizer
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    const audio = audioRef.current;
    
    // Audio event listeners
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    // Setup Web Audio API
    try {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
        
        // Create analyser for visualization
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.smoothingTimeConstant = 0.8;

        // Create source from audio element
        sourceRef.current = audioContextRef.current.createMediaElementSource(audio);

        // Create equalizer filters (10-band)
        const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
        eqFiltersRef.current = frequencies.map((freq) => {
          const filter = audioContextRef.current!.createBiquadFilter();
          filter.type = 'peaking';
          filter.frequency.value = freq;
          filter.Q.value = 1;
          filter.gain.value = 0;
          return filter;
        });

        // Connect audio graph: source -> eq filters -> analyser -> destination
        let previousNode: AudioNode = sourceRef.current;
        eqFiltersRef.current.forEach((filter) => {
          previousNode.connect(filter);
          previousNode = filter;
        });
        previousNode.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      }
    } catch (err) {
      console.error('Web Audio API setup failed:', err);
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  // Visualizer animation
  useEffect(() => {
    if (!showVisualizer || !analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw bars
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        // Gradient color
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, themeColor);
        gradient.addColorStop(1, '#60a5fa');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showVisualizer, audioUrl, themeColor]);

  // Playback controls
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setVolume(vol);
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const handleEqChange = (bandIndex: number, value: number) => {
    const newBands = [...eqBands];
    newBands[bandIndex] = value;
    setEqBands(newBands);

    if (eqFiltersRef.current[bandIndex]) {
      eqFiltersRef.current[bandIndex].gain.value = value;
    }
  };

  const resetEqualizer = () => {
    const resetBands = new Array(10).fill(0);
    setEqBands(resetBands);
    eqFiltersRef.current.forEach(filter => {
      filter.gain.value = 0;
    });
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`audio-viewer-container ${className || ""}`} style={{ background: "#18181b", borderRadius: 8, padding: 16, minHeight: 400 }}>
      {/* Header */}
      <div style={{ background: themeColor, color: "#fff", padding: "12px 16px", borderRadius: 6, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 18 }}>🎵 Lecteur audio avancé</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={() => setShowVisualizer(!showVisualizer)}
            style={{ background: showVisualizer ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}
          >
            Visualisation
          </button>
          <button 
            onClick={() => setShowEqualizer(!showEqualizer)}
            style={{ background: showEqualizer ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}
          >
            <Settings size={14} style={{ display: 'inline', marginRight: 4 }} />
            Égaliseur
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && !error && (
        <div style={{ color: '#a3a3a3', padding: 16, textAlign: 'center' }}>
          ⏳ Chargement de l'audio...
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ color: '#ef4444', padding: 16, background: '#7f1d1d', borderRadius: 6, marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Audio element (hidden) */}
      {audioUrl && !error && (
        <audio 
          ref={audioRef}
          src={audioUrl}
          style={{ display: 'none' }}
          crossOrigin="anonymous"
        />
      )}

      {/* Main player interface */}
      {audioUrl && !error && !isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Visualizer */}
          {showVisualizer && (
            <canvas 
              ref={canvasRef}
              width={800}
              height={150}
              style={{ 
                width: '100%', 
                height: 150, 
                background: '#18181b', 
                borderRadius: 6,
                border: '1px solid #333'
              }}
            />
          )}

          {/* File info */}
          <div style={{ textAlign: 'center', color: '#a3a3a3', fontSize: 14 }}>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>
              {src.split('\\').pop()?.split('/').pop() || 'Audio'}
            </div>
            <div style={{ fontSize: 12 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              style={{ 
                flex: 1, 
                height: 6, 
                borderRadius: 3, 
                cursor: 'pointer',
                background: `linear-gradient(to right, ${themeColor} 0%, ${themeColor} ${(currentTime / duration) * 100}%, #333 ${(currentTime / duration) * 100}%, #333 100%)`
              }}
            />
          </div>

          {/* Main controls */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
            <button 
              onClick={() => skip(-10)}
              style={{ background: '#333', border: 'none', color: '#fff', cursor: 'pointer', padding: 12, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Reculer de 10s"
            >
              <SkipBack size={20} />
            </button>
            
            <button 
              onClick={togglePlayPause}
              style={{ 
                background: themeColor, 
                border: 'none', 
                color: '#fff', 
                cursor: 'pointer',
                padding: 20,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              {isPlaying ? <Pause size={28} /> : <Play size={28} />}
            </button>

            <button 
              onClick={() => skip(10)}
              style={{ background: '#333', border: 'none', color: '#fff', cursor: 'pointer', padding: 12, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Avancer de 10s"
            >
              <SkipForward size={20} />
            </button>
          </div>

          {/* Secondary controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }}>
            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <button 
                onClick={toggleMute}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 8 }}
              >
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                style={{ width: 100, height: 4, borderRadius: 2, cursor: 'pointer' }}
              />
              <span style={{ color: '#a3a3a3', fontSize: 12, minWidth: 30 }}>
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>

            {/* Playback speed */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => changePlaybackRate(rate)}
                  style={{
                    background: playbackRate === rate ? themeColor : '#333',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 11
                  }}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Equalizer */}
          {showEqualizer && (
            <div style={{ background: '#1a1a1a', borderRadius: 6, padding: 16, border: '1px solid #333' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>Égaliseur 10 bandes</span>
                <button
                  onClick={resetEqualizer}
                  style={{ background: '#333', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 12px', borderRadius: 4, fontSize: 12 }}
                >
                  Réinitialiser
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                {['32', '64', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'].map((freq, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: themeColor, fontSize: 10, fontWeight: 600, minHeight: 20 }}>
                      {eqBands[index] > 0 ? '+' : ''}{eqBands[index].toFixed(1)}
                    </span>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={eqBands[index]}
                      onChange={(e) => handleEqChange(index, parseFloat(e.target.value))}
                      style={{ 
                        width: 100,
                        height: 6,
                        cursor: 'pointer',
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center'
                      } as React.CSSProperties}
                    />
                    <span style={{ color: '#a3a3a3', fontSize: 10, marginTop: 30 }}>{freq}Hz</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};