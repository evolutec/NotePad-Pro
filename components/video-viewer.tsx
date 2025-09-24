"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCw,
  Download,
  Settings,
  SkipBack,
  SkipForward
} from "lucide-react"
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

// Video.js plugins will be loaded dynamically to avoid SSR issues

export interface VideoViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  videoPath: string
  videoName: string
  videoType: string
}

export function VideoViewer({ open, onOpenChange, videoPath, videoName, videoType }: VideoViewerProps) {
  console.log('🎥 VideoViewer: === COMPONENT RENDERED ===')
  console.log('🎥 VideoViewer: Props received:', { open, videoPath, videoName, videoType })

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize Video.js player
  useEffect(() => {
    console.log('🎥 VideoViewer: useEffect triggered with:', {
      open,
      videoPath: videoPath ? videoPath.substring(0, 50) + '...' : 'null/empty',
      hasVideoRef: !!videoRef.current,
      hasPlayer: !!playerRef.current,
      videoRefType: typeof videoRef.current,
      playerRefType: typeof playerRef.current
    })

    console.log('🎥 VideoViewer: Detailed condition check:')
    console.log('🎥 VideoViewer: - open:', open)
    console.log('🎥 VideoViewer: - videoPath exists:', !!videoPath)
    console.log('🎥 VideoViewer: - videoRef.current exists:', !!videoRef.current)
    console.log('🎥 VideoViewer: - playerRef.current exists:', !!playerRef.current)
    console.log('🎥 VideoViewer: - Combined condition result:', open && videoPath && videoRef.current && !playerRef.current)

    if (open && videoPath && videoRef.current && !playerRef.current) {
      console.log('🎥 VideoViewer: Initializing Video.js player for:', videoPath)

      try {
        // Create video element with proper attributes
        const videoElement = videoRef.current
        console.log('🎥 VideoViewer: Video element found:', !!videoElement)

        // Configure Video.js options
        const options = {
          autoplay: false,
          controls: true,
          responsive: true,
          fluid: true,
          playbackRates: [0.5, 1, 1.25, 1.5, 2],
          html5: {
            vhs: {
              overrideNative: !videojs.browser.IS_SAFARI
            }
          }
        }

        console.log('🎥 VideoViewer: Video.js options configured')

        // Initialize Video.js player
        const player = videojs(videoElement, options, function onPlayerReady() {
          console.log('🎥 VideoViewer: Video.js player is ready!')

          // Set up event listeners
          this.on('loadedmetadata', () => {
            console.log('🎥 VideoViewer: Video metadata loaded, duration:', this.duration())
            setDuration(this.duration() || 0)
            setIsLoading(false)
          })

          this.on('timeupdate', () => {
            setCurrentTime(this.currentTime() || 0)
          })

          this.on('play', () => {
            console.log('🎥 VideoViewer: Video play event')
            setIsPlaying(true)
          })

          this.on('pause', () => {
            console.log('🎥 VideoViewer: Video pause event')
            setIsPlaying(false)
          })

          this.on('ended', () => {
            console.log('🎥 VideoViewer: Video ended event')
            setIsPlaying(false)
          })

          this.on('volumechange', () => {
            setVolume(this.volume() || 0)
            setIsMuted(this.muted() || false)
          })

          this.on('error', (e: any) => {
            console.error('🎥 VideoViewer: Video.js error:', e)
            setError('Erreur lors du chargement de la vidéo')
            setIsLoading(false)
          })

          this.on('fullscreenchange', () => {
            setIsFullscreen(this.isFullscreen() || false)
          })
        })

        console.log('🎥 VideoViewer: Video.js player created, storing reference')
        playerRef.current = player

        // Load video source
        console.log('🎥 VideoViewer: Checking Electron API availability...')
        if (window.electronAPI?.readFile) {
          console.log('🎥 VideoViewer: Electron API available, calling loadVideoSource')
          loadVideoSource(player)
        } else {
          console.error('🎥 VideoViewer: Electron API not available!')
          setError('API Electron non disponible pour charger la vidéo')
          setIsLoading(false)
        }

      } catch (err) {
        console.error('🎥 VideoViewer: Error initializing Video.js:', err)
        setError('Erreur lors de l\'initialisation du lecteur vidéo')
        setIsLoading(false)
      }
    } else {
      console.log('🎥 VideoViewer: useEffect conditions not met:', {
        open,
        hasVideoPath: !!videoPath,
        hasVideoRef: !!videoRef.current,
        hasPlayer: !!playerRef.current
      })

      // Fallback: Try to initialize anyway after a short delay
      if (open && videoPath && !playerRef.current) {
        console.log('🎥 VideoViewer: Attempting fallback initialization...')
        setTimeout(() => {
          console.log('🎥 VideoViewer: Fallback initialization - checking videoRef:', !!videoRef.current)
          if (videoRef.current && !playerRef.current) {
            console.log('🎥 VideoViewer: Fallback initialization - proceeding with initialization')
            // Re-run the initialization logic
            try {
              const videoElement = videoRef.current
              const options = {
                autoplay: false,
                controls: true,
                responsive: true,
                fluid: true,
                playbackRates: [0.5, 1, 1.25, 1.5, 2],
                html5: {
                  vhs: {
                    overrideNative: !videojs.browser.IS_SAFARI
                  }
                }
              }

              const player = videojs(videoElement, options, function onPlayerReady() {
                console.log('🎥 VideoViewer: Fallback - Video.js player is ready!')

                this.on('loadedmetadata', () => {
                  console.log('🎥 VideoViewer: Fallback - Video metadata loaded, duration:', this.duration())
                  setDuration(this.duration() || 0)
                  setIsLoading(false)
                })

                this.on('error', (e: any) => {
                  console.error('🎥 VideoViewer: Fallback - Video.js error:', e)
                  setError('Erreur lors du chargement de la vidéo')
                  setIsLoading(false)
                })
              })

              playerRef.current = player

              if (window.electronAPI?.readFile) {
                loadVideoSource(player)
              } else {
                setError('API Electron non disponible pour charger la vidéo')
                setIsLoading(false)
              }
            } catch (err) {
              console.error('🎥 VideoViewer: Fallback - Error initializing Video.js:', err)
              setError('Erreur lors de l\'initialisation du lecteur vidéo')
              setIsLoading(false)
            }
          }
        }, 100)
      }
    }

    return () => {
      if (playerRef.current) {
        console.log('🎥 VideoViewer: Cleaning up Video.js player')
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [open, videoPath])

  // Clean up file path to remove double extensions
  const cleanFilePath = (path: string): string => {
    // Remove double .mp4 extensions
    let cleaned = path.replace(/\.mp4\.mp4$/i, '.mp4')
    cleaned = cleaned.replace(/\.webm\.webm$/i, '.webm')
    cleaned = cleaned.replace(/\.avi\.avi$/i, '.avi')
    cleaned = cleaned.replace(/\.mov\.mov$/i, '.mov')
    cleaned = cleaned.replace(/\.mkv\.mkv$/i, '.mkv')
    return cleaned
  }

  // Load video source from Electron API
  const loadVideoSource = async (player: any) => {
    try {
      setError(null)
      setIsLoading(true)
      console.log('🎥 VideoViewer: === STARTING VIDEO LOAD ===')
      console.log('🎥 VideoViewer: Original video path:', videoPath)
      console.log('🎥 VideoViewer: Video type:', videoType)
      console.log('🎥 VideoViewer: Video name:', videoName)

      // Clean up the file path
      const cleanedPath = cleanFilePath(videoPath)
      console.log('🎥 VideoViewer: Cleaned video path:', cleanedPath)

      if (cleanedPath !== videoPath) {
        console.log('🎥 VideoViewer: Path was cleaned - using cleaned path for loading')
      }

      console.log('🎥 VideoViewer: Electron API available:', !!window.electronAPI?.readFile)

      if (window.electronAPI?.readFile) {
        console.log('🎥 VideoViewer: Using Electron readFile API...')
        console.log('🎥 VideoViewer: Using cleaned path for readFile:', cleanedPath)
        let result = await window.electronAPI.readFile(cleanedPath)
        console.log('🎥 VideoViewer: readFile result:', result)
        console.log('🎥 VideoViewer: Result success:', result.success)
        console.log('🎥 VideoViewer: Result data type:', typeof result.data)
        console.log('🎥 VideoViewer: Result data length:', result.data?.length)

        if (!result.success) {
          console.log('🎥 VideoViewer: readFile failed, trying original path as fallback...')
          const fallbackResult = await window.electronAPI.readFile(videoPath)
          console.log('🎥 VideoViewer: Fallback readFile result:', fallbackResult)
          if (fallbackResult.success) {
            console.log('🎥 VideoViewer: Fallback successful, using original path data')
            // Use fallback result instead of original result
            result = fallbackResult
          }
        }

        if (result.success && result.data) {
          console.log('🎥 VideoViewer: Data received successfully, processing...')

          if (typeof result.data === 'string') {
            // Check if it's base64 data from Electron API
            if (result.data.startsWith('data:') || result.data.startsWith('http')) {
              console.log('VideoViewer: Using data URL directly')
              player.src(result.data)
            } else {
              // Assume it's base64 data from Electron API
              console.log('VideoViewer: Converting base64 string to data URL')
              try {
                const mimeType = getVideoMimeType(videoType)
                const dataUrl = `data:${mimeType};base64,${result.data}`
                console.log('VideoViewer: Created data URL from base64:', dataUrl.substring(0, 50) + '...')
                player.src(dataUrl)
              } catch (conversionError) {
                console.error('VideoViewer: Error creating data URL from base64:', conversionError)
                setError("Erreur lors de la conversion de la vidéo")
              }
            }
          } else {
            // For binary data, create a blob
            console.log('VideoViewer: Creating blob from binary data')
            try {
              const mimeType = getVideoMimeType(videoType)
              console.log('VideoViewer: Creating blob with MIME type:', mimeType)

              // Ensure result.data is treated as binary data
              let binaryData: ArrayBuffer
              if (result.data && typeof result.data === 'object' && (result.data as any).constructor?.name === 'ArrayBuffer') {
                binaryData = result.data as ArrayBuffer
              } else if (result.data && typeof result.data === 'object' && 'buffer' in result.data) {
                // Handle Uint8Array-like objects
                const uint8Array = result.data as Uint8Array
                binaryData = uint8Array.buffer.slice(uint8Array.byteOffset, uint8Array.byteOffset + uint8Array.byteLength) as ArrayBuffer
              } else {
                // Convert other formats to ArrayBuffer
                binaryData = result.data as ArrayBuffer
              }

              console.log('VideoViewer: Binary data length:', binaryData.byteLength)
              console.log('VideoViewer: Binary data type:', binaryData.constructor.name)

              const blob = new Blob([binaryData], { type: mimeType })
              console.log('VideoViewer: Blob created, size:', blob.size, 'type:', blob.type)

              const blobUrl = URL.createObjectURL(blob)
              console.log('VideoViewer: Created blob URL:', blobUrl)

              // Set the source with proper error handling
              console.log('VideoViewer: Setting player source to blob URL')
              player.src({
                src: blobUrl,
                type: mimeType
              })

              console.log('VideoViewer: Player source set, loading should start now')
            } catch (blobError: any) {
              console.error('VideoViewer: Error creating blob:', blobError)
              setError("Erreur lors de la création du blob: " + (blobError?.message || 'Unknown error'))
            }
          }

          console.log('VideoViewer: Video source set successfully')
        } else {
          console.error('VideoViewer: readFile failed:', result.error)
          setError(result.error || "Erreur lors du chargement de la vidéo")
          setIsLoading(false)
        }
      } else {
        console.error('VideoViewer: Electron API not available - cannot load local videos')
        setError("API Electron non disponible. Lancez l'application avec 'npm run electron'")
        setIsLoading(false)
      }
    } catch (err) {
      console.error('VideoViewer: Error loading video source:', err)
      setError("Erreur lors du chargement de la vidéo")
      setIsLoading(false)
    }
  }

  const getVideoMimeType = (type: string): string => {
    const mimeTypes: { [key: string]: string } = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ogg': 'video/ogg',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'mkv': 'video/x-matroska',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      '3gp': 'video/3gpp'
    }
    return mimeTypes[type.toLowerCase()] || 'video/mp4'
  }

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause()
      } else {
        playerRef.current.play()
      }
    }
  }

  const handleStop = () => {
    if (playerRef.current) {
      playerRef.current.pause()
      playerRef.current.currentTime(0)
      setIsPlaying(false)
    }
  }

  const handleSeek = (value: number[]) => {
    if (playerRef.current) {
      playerRef.current.currentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    if (playerRef.current) {
      const newVolume = value[0]
      playerRef.current.volume(newVolume)
      setVolume(newVolume)
      if (newVolume > 0 && isMuted) {
        playerRef.current.muted(false)
      }
    }
  }

  const handleMuteToggle = () => {
    if (playerRef.current) {
      const newMuted = !isMuted
      playerRef.current.muted(newMuted)
      setIsMuted(newMuted)
    }
  }

  const handleFullscreenToggle = () => {
    if (playerRef.current) {
      if (isFullscreen) {
        playerRef.current.exitFullscreen()
      } else {
        playerRef.current.requestFullscreen()
      }
    }
  }

  const handlePlaybackRateChange = (rate: number) => {
    if (playerRef.current) {
      playerRef.current.playbackRate(rate)
      setPlaybackRate(rate)
    }
  }

  const handleSkipBackward = () => {
    if (playerRef.current) {
      const newTime = Math.max(0, currentTime - 10)
      playerRef.current.currentTime(newTime)
    }
  }

  const handleSkipForward = () => {
    if (playerRef.current) {
      const newTime = Math.min(duration, currentTime + 10)
      playerRef.current.currentTime(newTime)
    }
  }

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!open) {
    console.log('🎥 VideoViewer: Component not open, returning null')
    return null
  }

  console.log('🎥 VideoViewer: Rendering video viewer dialog')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black">
        <DialogHeader className="p-4 pb-2 bg-black/80 text-white">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-white">
              <span className="text-lg">🎥</span>
              {videoName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipBackward}
                className="text-white hover:bg-white/20"
                title="Reculer de 10s"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPause}
                className="text-white hover:bg-white/20"
                title={isPlaying ? "Pause" : "Lecture"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStop}
                className="text-white hover:bg-white/20"
                title="Arrêter"
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipForward}
                className="text-white hover:bg-white/20"
                title="Avancer de 10s"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMuteToggle}
                className="text-white hover:bg-white/20"
                title={isMuted ? "Activer le son" : "Couper le son"}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullscreenToggle}
                className="text-white hover:bg-white/20"
                title={isFullscreen ? "Quitter plein écran" : "Plein écran"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 p-4 pt-0 bg-black">
          <div className="flex items-center justify-center h-full bg-black rounded-lg overflow-hidden">
            {error ? (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <div className="text-4xl mb-4">⚠️</div>
                  <p className="text-lg font-semibold">Erreur de chargement</p>
                  <p className="text-sm text-gray-300 mt-2">
                    {error || "Impossible de charger la vidéo"}
                  </p>
                </div>
              </div>
            ) : (
              <div
                ref={containerRef}
                className="w-full h-full flex items-center justify-center"
                style={{ minHeight: '400px' }}
              >
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <div className="text-center text-white">
                      <div className="text-4xl mb-4 animate-spin">⏳</div>
                      <p className="text-lg">Chargement de la vidéo...</p>
                    </div>
                  </div>
                )}
                <video
                  ref={videoRef}
                  className="video-js vjs-default-skin vjs-big-play-centered"
                  style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                  onError={() => {
                    console.error('Video element error')
                    setError("Impossible de charger la vidéo")
                    setIsLoading(false)
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Custom Controls */}
        <div className="p-4 bg-black/80 text-white border-t border-gray-700">
          {/* Progress Bar */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-300 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPause}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStop}
                className="text-white hover:bg-white/20"
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMuteToggle}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <div className="flex items-center gap-2 min-w-[100px]">
                <VolumeX className="h-3 w-3 text-gray-400" />
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="flex-1"
                />
                <Volume2 className="h-3 w-3 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">
                {playbackRate}x
              </span>
              <select
                value={playbackRate}
                onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                className="bg-black border border-gray-600 text-white text-sm rounded px-2 py-1"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>
          </div>

          {/* Video Info */}
          <div className="flex items-center justify-between text-sm text-gray-300 mt-2">
            <span>Type: {videoType.toUpperCase()}</span>
            <span>Durée: {formatTime(duration)}</span>
            <span>Résolution: {isFullscreen ? 'Plein écran' : 'Fenêtré'}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default VideoViewer
