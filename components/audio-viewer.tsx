"use client"

import * as React from "react"
import { useEffect, useState, useRef } from "react"
import { OnlyOfficeLikeToolbar } from "./ui/onlyoffice-like-toolbar"
import { OnlyOfficeFileMenu } from "./ui/onlyoffice-file-menu"
import { AudioHomeToolbar } from "./audio-home-toolbar"
import { AudioEqualizerToolbar } from "./audio-equalizer-toolbar"
import { AudioViewToolbar } from "./audio-view-toolbar"
import { Slider } from "@/components/ui/slider"

interface AudioViewerProps {
  src: string
  audioName?: string
  audioType?: string
  themeColor?: string
  className?: string
  onRename?: () => void
}

export const AudioViewer: React.FC<AudioViewerProps> = ({ 
  src, 
  audioName = "Audio", 
  audioType = "audio",
  themeColor = "#ec4899", 
  className,
  onRename
}) => {
  console.log('🎵 AudioViewer: Component rendered with src:', src, 'audioName:', audioName);
  
  // Reset all state when src changes
  React.useEffect(() => {
    console.log('🎵 AudioViewer: src changed, resetting all state');
    setActiveTab("Accueil")
    setAudioUrl("")
    setError("")
    setIsLoading(true)
    setVisualizerStyle('bars')
    setViewTheme("auto")
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setVolume(0.7)
    setIsMuted(false)
    setPlaybackRate(1)
    setShowEqualizer(true)
    setShowVisualizer(true)
    setEqBands([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    
    // Reset refs
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = ""
    }
    
    // Reset Web Audio API
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(err => console.error('Error closing AudioContext:', err))
      audioContextRef.current = null
    }
    analyserRef.current = null
    sourceRef.current = null
    eqFiltersRef.current = []
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = 0
    }
  }, [src])
  
  // UI State
  const [activeTab, setActiveTab] = useState("Accueil")
  const [audioUrl, setAudioUrl] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [visualizerStyle, setVisualizerStyle] = useState<'bars' | 'waveform'>('bars')
  const [viewTheme, setViewTheme] = useState("auto")
  
  // Audio State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showEqualizer, setShowEqualizer] = useState(true)
  const [showVisualizer, setShowVisualizer] = useState(true)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const blobUrlRef = useRef<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationRef = useRef<number>(0)
  
  // Equalizer bands (10 bands)
  const [eqBands, setEqBands] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  const eqFiltersRef = useRef<BiquadFilterNode[]>([])

  // Detect if we're in a popped-out window
  const isPoppedOut = typeof window !== 'undefined' && window.opener !== null

  // Load audio file
  useEffect(() => {
    let mounted = true
    console.log('🎵 AudioViewer: Loading audio file with src:', src);

    const loadAudio = async () => {
      try {
        setIsLoading(true)
        setError("")

        if (typeof window !== 'undefined' && (window as any).electronAPI?.readFile) {
          const result = await (window as any).electronAPI.readFile(src)
          
          if (!result.success) {
            throw new Error(result.error || 'Échec de la lecture du fichier')
          }

          if (!result.data || result.data.length === 0 || result.data.byteLength === 0) {
            throw new Error('Le fichier audio est vide ou n\'a pas pu être lu')
          }

          // Detect MIME type
          const ext = src.split('.').pop()?.toLowerCase()
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
            'webm': 'audio/webm',
            'aiff': 'audio/aiff',
          }
          const mimeType = mimeTypes[ext || ''] || 'audio/mpeg'

          const blob = new Blob([result.data], { type: mimeType })

          if (blob.size === 0) {
            throw new Error('Le blob créé est vide')
          }

          const url = URL.createObjectURL(blob)
          blobUrlRef.current = url

          if (mounted) {
            console.log('🎵 AudioViewer: Setting audioUrl to:', url);
            setAudioUrl(url)
            setIsLoading(false)
            console.log('🎵 AudioViewer: Audio loading completed successfully');
          }
        } else {
          throw new Error('API Electron non disponible')
        }
      } catch (err: any) {
        if (mounted) {
          console.error('🎵 AudioViewer: Error loading audio:', err.message);
          setError(err.message || 'Erreur lors du chargement de l\'audio')
          setIsLoading(false)
        }
      }
    }

    loadAudio()

    return () => {
      mounted = false
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }
    }
  }, [src])

  // Setup Web Audio API
  useEffect(() => {
    if (!audioRef.current || !audioUrl) {
      console.log('🎵 AudioViewer: Skipping Web Audio setup - audioRef or audioUrl not ready');
      return
    }

    console.log('🎵 AudioViewer: Setting up Web Audio API for audioUrl:', audioUrl);
    const audio = audioRef.current
    
    const handleLoadedMetadata = () => {
      console.log('🎵 AudioViewer: Audio loaded metadata, duration:', audio.duration);
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      console.log('🎵 AudioViewer: Audio playback ended');
      setIsPlaying(false)
    }

    const handleCanPlay = () => {
      console.log('🎵 AudioViewer: Audio can play');
    }

    const handleError = (e: any) => {
      console.error('🎵 AudioViewer: Audio element error:', e);
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)

    try {
      if (!audioContextRef.current) {
        console.log('🎵 AudioViewer: Creating AudioContext');
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        audioContextRef.current = new AudioContext()
        
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 2048
        analyserRef.current.smoothingTimeConstant = 0.8

        sourceRef.current = audioContextRef.current.createMediaElementSource(audio)

        // Create 10-band equalizer
        const frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000]
        eqFiltersRef.current = frequencies.map((freq) => {
          const filter = audioContextRef.current!.createBiquadFilter()
          filter.type = 'peaking'
          filter.frequency.value = freq
          filter.Q.value = 1
          filter.gain.value = 0
          return filter
        })

        // Connect: source -> eq filters -> analyser -> destination
        let previousNode: AudioNode = sourceRef.current
        eqFiltersRef.current.forEach((filter) => {
          previousNode.connect(filter)
          previousNode = filter
        })
        previousNode.connect(analyserRef.current)
        analyserRef.current.connect(audioContextRef.current.destination)

        console.log('🎵 AudioViewer: Web Audio API setup completed successfully');
      }
    } catch (err) {
      console.error('🎵 AudioViewer: Web Audio API setup failed:', err)
    }

    return () => {
      console.log('🎵 AudioViewer: Cleaning up audio event listeners');
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
    }
  }, [audioUrl])

  // Visualizer animation
  useEffect(() => {
    if (!showVisualizer || !analyserRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      ctx.fillStyle = 'rgb(15, 15, 18)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      if (visualizerStyle === 'bars') {
        const barWidth = (canvas.width / bufferLength) * 2.5
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height

          const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height)
          gradient.addColorStop(0, '#ec4899')
          gradient.addColorStop(0.5, '#f472b6')
          gradient.addColorStop(1, '#fbcfe8')

          ctx.fillStyle = gradient
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

          x += barWidth + 1
        }
      } else {
        // Waveform
        ctx.lineWidth = 2
        ctx.strokeStyle = '#ec4899'
        ctx.beginPath()

        const sliceWidth = canvas.width / bufferLength
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 255
          const y = (v * canvas.height) / 2 + canvas.height / 4

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }

          x += sliceWidth
        }

        ctx.stroke()
      }
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [showVisualizer, audioUrl, visualizerStyle])

  // Control handlers
  const togglePlayPause = () => {
    console.log('🎵 AudioViewer: togglePlayPause called, current isPlaying:', isPlaying);
    if (!audioRef.current) {
      console.error('🎵 AudioViewer: No audio element reference');
      return
    }
    
    if (audioContextRef.current?.state === 'suspended') {
      console.log('🎵 AudioViewer: Resuming suspended AudioContext');
      audioContextRef.current.resume()
    }

    if (isPlaying) {
      console.log('🎵 AudioViewer: Pausing audio');
      audioRef.current.pause()
    } else {
      console.log('🎵 AudioViewer: Playing audio');
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleStop = () => {
    console.log('🎵 AudioViewer: handleStop called');
    if (!audioRef.current) {
      console.error('🎵 AudioViewer: No audio element reference for stop');
      return
    }
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setIsPlaying(false)
  }

  const handleSkipBackward = () => {
    console.log('🎵 AudioViewer: handleSkipBackward called');
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
    }
  }

  const handleSkipForward = () => {
    console.log('🎵 AudioViewer: handleSkipForward called');
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10)
    }
  }

  const handleMuteToggle = () => {
    console.log('🎵 AudioViewer: handleMuteToggle called, current isMuted:', isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    console.log('🎵 AudioViewer: handleVolumeChange called with value:', value);
    const vol = value[0]
    if (audioRef.current) {
      audioRef.current.volume = vol
      setVolume(vol)
      setIsMuted(vol === 0)
    }
  }

  const handleSeek = (value: number[]) => {
    console.log('🎵 AudioViewer: handleSeek called with value:', value);
    const time = value[0]
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleEqChange = (bandIndex: number, value: number) => {
    const newBands = [...eqBands]
    newBands[bandIndex] = value
    setEqBands(newBands)

    if (eqFiltersRef.current[bandIndex]) {
      eqFiltersRef.current[bandIndex].gain.value = value
    }
  }

  const handleEqReset = () => {
    const resetBands = new Array(10).fill(0)
    setEqBands(resetBands)
    eqFiltersRef.current.forEach(filter => {
      filter.gain.value = 0
    })
  }

  const handleDetach = () => {
    console.log('handleDetach called');
    console.log('window.electronAPI:', (window as any).electronAPI);
    console.log('openAudioWindow function:', (window as any).electronAPI?.openAudioWindow);
    
    if (typeof window !== 'undefined' && (window as any).electronAPI?.openAudioWindow) {
      console.log('Calling electronAPI.openAudioWindow with:', src);
      (window as any).electronAPI.openAudioWindow(src)
    } else {
      console.log('Electron API not available, showing alert');
      alert('Fonctionnalité de détachement non disponible en mode navigateur. Utilisez l\'application Electron.');
    }
  }

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0f0f12]">
      {/* Toolbar */}
      <OnlyOfficeLikeToolbar
        key={`toolbar-${src}`}
        tabs={[
          { label: "Fichier" },
          { label: "Accueil" },
          { label: "Égaliseur" },
          { label: "Affichage" },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* File Menu */}
      {activeTab === "Fichier" && (
        <OnlyOfficeFileMenu
          key={`file-menu-${src}`}
          onClose={() => setActiveTab("Accueil")}
          type="audio"
          isPoppedOut={isPoppedOut}
          onExport={(format) => {
            console.log('Exporting audio as:', format)
          }}
          onRename={onRename}
        />
      )}

      {/* Conditional Toolbars */}
      {activeTab === "Accueil" && (
        <AudioHomeToolbar
          key={`home-toolbar-${src}`}
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volume}
          onPlayPause={togglePlayPause}
          onStop={handleStop}
          onSkipBackward={handleSkipBackward}
          onSkipForward={handleSkipForward}
          onMuteToggle={handleMuteToggle}
          onDetach={handleDetach}
        />
      )}

      {activeTab === "Égaliseur" && (
        <AudioEqualizerToolbar
          key={`equalizer-toolbar-${src}`}
          equalizerGains={eqBands}
          onEqualizerChange={handleEqChange}
          onEqualizerReset={handleEqReset}
          showEqualizer={showEqualizer}
          onToggleEqualizer={() => setShowEqualizer(!showEqualizer)}
        />
      )}

      {activeTab === "Affichage" && (
        <AudioViewToolbar
          key={`view-toolbar-${src}`}
          showVisualizer={showVisualizer}
          onToggleVisualizer={() => setShowVisualizer(!showVisualizer)}
          visualizerStyle={visualizerStyle}
          onVisualizerStyleChange={setVisualizerStyle}
          theme={viewTheme}
          onThemeChange={setViewTheme}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6 overflow-auto">
        {/* Loading */}
        {isLoading && !error && (
          <div className="text-pink-400 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p>Chargement de l'audio...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-300 p-4 rounded-lg max-w-md">
            ⚠️ {error}
          </div>
        )}

        {/* Audio Player */}
        {audioUrl && !error && !isLoading && (
          <>
            {/* Hidden audio element */}
            <audio 
              ref={audioRef}
              src={audioUrl}
              className="hidden"
              crossOrigin="anonymous"
              onLoadedData={() => console.log('🎵 AudioViewer: Audio loaded data')}
              onCanPlayThrough={() => console.log('🎵 AudioViewer: Audio can play through')}
              onPlay={() => console.log('🎵 AudioViewer: Audio started playing')}
              onPause={() => console.log('🎵 AudioViewer: Audio paused')}
            />

            {/* Visualizer */}
            {showVisualizer && (
              <canvas 
                ref={canvasRef}
                width={1200}
                height={200}
                className="w-full max-w-4xl h-[200px] rounded-lg border border-pink-500/20 shadow-lg"
              />
            )}

            {/* Track Info */}
            <div className="text-center space-y-2 max-w-2xl">
              <h2 className="text-2xl font-bold text-white">
                {audioName || src.split('\\').pop()?.split('/').pop() || 'Audio'}
              </h2>
              <div className="text-pink-400 text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-2xl space-y-2">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
              />
            </div>

            {/* Volume & Speed Controls */}
            <div className="w-full max-w-2xl flex items-center justify-between gap-8">
              {/* Volume */}
              <div className="flex items-center gap-3 flex-1">
                <span className="text-pink-400 text-sm font-medium min-w-[60px]">Volume</span>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="flex-1 max-w-[200px]"
                />
                <span className="text-pink-300 text-sm font-mono min-w-[45px]">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>

              {/* Playback Speed */}
              <div className="flex items-center gap-2">
                <span className="text-pink-400 text-sm font-medium">Vitesse</span>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.playbackRate = rate
                        setPlaybackRate(rate)
                      }
                    }}
                    className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                      playbackRate === rate
                        ? 'bg-pink-500 text-white shadow-lg'
                        : 'bg-pink-900/30 text-pink-300 hover:bg-pink-800/50'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
