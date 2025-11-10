"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { OnlyOfficeLikeToolbar } from "./ui/onlyoffice-like-toolbar"
import { OnlyOfficeFileMenu } from "./ui/onlyoffice-file-menu"
import { VideoHomeToolbar } from "./video-home-toolbar"
import { VideoPlaybackToolbar } from "./video-playback-toolbar"
import { VideoViewToolbar } from "./video-view-toolbar"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  SkipBack,
  SkipForward
} from "lucide-react"

// Using native HTML5 video element for better WebM/MP4 compatibility in Electron

export interface VideoViewerProps {
  videoPath: string
  videoName: string
  videoType: string
  onRename?: () => void
}

export function VideoViewer({ videoPath, videoName, videoType, onRename }: VideoViewerProps) {
  const [activeTab, setActiveTab] = useState("Accueil")
  console.log('🎥 VideoViewer: === COMPONENT RENDERED ===')
  console.log('🎥 VideoViewer: Props received:', { videoPath, videoName, videoType })

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [showStats, setShowStats] = useState(false)
  const [viewTheme, setViewTheme] = useState("auto")

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  // Load video from Electron API
  useEffect(() => {
    let mounted = true

    const loadVideo = async () => {
      try {
        setIsLoading(true)
        setError(null)
        console.log('🎥 VideoViewer: Loading video from:', videoPath)

        if (typeof window !== 'undefined' && (window as any).electronAPI?.readFile) {
          const result = await (window as any).electronAPI.readFile(videoPath)
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to read video file')
          }

          if (!result.data || result.data.length === 0 || result.data.byteLength === 0) {
            throw new Error('Video file is empty or could not be read')
          }

          // Convert data to Blob
          let binaryData: ArrayBuffer
          
          if (result.data && typeof result.data === 'object' && 'type' in result.data && (result.data as any).type === 'Buffer' && 'data' in result.data) {
            // Node.js Buffer serialized as JSON
            console.log('🎥 VideoViewer: Converting Node.js Buffer to ArrayBuffer')
            const bufferData = result.data as { type: 'Buffer', data: number[] }
            const uint8Array = new Uint8Array(bufferData.data)
            binaryData = uint8Array.buffer
          } else if (typeof result.data === 'string') {
            // Base64 string
            console.log('🎥 VideoViewer: Converting base64 string to ArrayBuffer')
            const binaryString = atob(result.data)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            binaryData = bytes.buffer
          } else if (result.data && typeof result.data === 'object' && 'buffer' in result.data) {
            // Uint8Array-like
            console.log('🎥 VideoViewer: Converting Uint8Array to ArrayBuffer')
            const uint8Array = result.data as Uint8Array
            binaryData = uint8Array.buffer.slice(uint8Array.byteOffset, uint8Array.byteOffset + uint8Array.byteLength) as ArrayBuffer
          } else {
            binaryData = result.data as ArrayBuffer
          }

          console.log('🎥 VideoViewer: Binary data size:', binaryData.byteLength, 'bytes')

          // Get MIME type
          const mimeType = getVideoMimeType(videoType)
          console.log('🎥 VideoViewer: MIME type:', mimeType)

          // Create blob
          const blob = new Blob([binaryData], { type: mimeType })
          console.log('🎥 VideoViewer: Blob created, size:', blob.size)

          if (blob.size === 0) {
            throw new Error('Created blob is empty')
          }

          // Create blob URL
          const url = URL.createObjectURL(blob)
          blobUrlRef.current = url
          console.log('🎥 VideoViewer: Blob URL created:', url)

          if (mounted) {
            setVideoUrl(url)
            setIsLoading(false)
          }
        } else {
          throw new Error('Electron API not available')
        }
      } catch (err: any) {
        console.error('🎥 VideoViewer: Error loading video:', err)
        if (mounted) {
          setError(err.message || 'Error loading video')
          setIsLoading(false)
        }
      }
    }

    loadVideo()

    return () => {
      mounted = false
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }
    }
  }, [videoPath, videoType])

  // Setup video element event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return

    const handleLoadedMetadata = () => {
      console.log('🎥 VideoViewer: Video metadata loaded, duration:', video.duration)
      setDuration(video.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handlePlay = () => {
      console.log('🎥 VideoViewer: Video playing')
      setIsPlaying(true)
    }

    const handlePause = () => {
      console.log('🎥 VideoViewer: Video paused')
      setIsPlaying(false)
    }

    const handleEnded = () => {
      console.log('🎥 VideoViewer: Video ended')
      setIsPlaying(false)
    }

    const handleVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted)
    }

    const handleError = (e: Event) => {
      console.error('🎥 VideoViewer: Video element error:', e)
      const videoError = video.error
      if (videoError) {
        console.error('🎥 VideoViewer: Error code:', videoError.code, 'message:', videoError.message)
        setError(`Video error: ${videoError.message || 'Unknown error'}`)
      }
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('volumechange', handleVolumeChange)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('volumechange', handleVolumeChange)
      video.removeEventListener('error', handleError)
    }
  }, [videoUrl])

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
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const handleStop = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0]
    }
  }

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0]
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
    }
  }

  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
      setPlaybackRate(rate)
    }
  }

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration)
    }
  }

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0)
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  console.log('🎥 VideoViewer: Rendering video viewer')

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* OnlyOffice-like Toolbar */}
      <OnlyOfficeLikeToolbar
        key={`toolbar-${videoPath}`}
        tabs={[
          { label: "Fichier" },
          { label: "Accueil" },
          { label: "Lecture" },
          { label: "Affichage" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* File Menu */}
      {activeTab === "Fichier" && (
        <OnlyOfficeFileMenu
          key={`file-menu-${videoPath}`}
          onClose={() => setActiveTab("Accueil")}
          type="video"
          onExport={(format) => {
            console.log('Exporting video as:', format)
          }}
          onRename={onRename}
        />
      )}

      {/* Conditional Toolbars */}
      <div className="bg-zinc-900">
        {activeTab === "Accueil" && (
          <VideoHomeToolbar
            key={`home-toolbar-${videoPath}`}
            isPlaying={isPlaying}
            isMuted={isMuted}
            volume={volume}
            onPlayPause={handlePlayPause}
            onStop={handleStop}
            onSkipBackward={skipBackward}
            onSkipForward={skipForward}
            onMuteToggle={toggleMute}
            onFullscreenToggle={toggleFullscreen}
            onDownload={() => {}}
            onShare={() => {}}
          />
        )}
        {activeTab === "Lecture" && (
          <VideoPlaybackToolbar
            key={`playback-toolbar-${videoPath}`}
            playbackRate={playbackRate}
            onPlaybackRateChange={handlePlaybackRateChange}
            onLoopToggle={() => {
              if (videoRef.current) {
                videoRef.current.loop = !videoRef.current.loop
              }
            }}
            isLooping={videoRef.current?.loop || false}
          />
        )}
        {activeTab === "Affichage" && (
          <VideoViewToolbar
            key={`view-toolbar-${videoPath}`}
            isFullscreen={isFullscreen}
            onFullscreenToggle={toggleFullscreen}
            showStats={showStats}
            onStatsToggle={() => setShowStats(!showStats)}
          />
        )}
      </div>

      {/* Video Container */}
      <div ref={containerRef} className="flex-1 flex flex-col bg-black relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Chargement de la vidéo...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center max-w-md p-6">
              <p className="text-red-500 font-bold mb-2 text-xl">⚠️ Erreur de chargement</p>
              <p className="text-white mb-4">{error}</p>
              {videoType.toLowerCase() === 'webm' && (
                <div className="bg-yellow-500/20 border border-yellow-500 rounded p-4 mt-4">
                  <p className="text-yellow-200 text-sm">
                    ℹ️ <strong>Note:</strong> Les fichiers WebM peuvent avoir des problèmes de compatibilité.
                    Pour de meilleurs résultats, utilisez des fichiers MP4 ou AVI.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Native HTML5 Video Element */}
        <video
          ref={videoRef}
          className="flex-1 w-full h-full object-contain"
          src={videoUrl || undefined}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Custom Controls */}
        {showControls && !isLoading && !error && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
            {/* Timeline */}
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="mb-4"
            />

            <div className="flex items-center justify-between">
              {/* Left controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleStop}
                  className="text-white hover:bg-white/20"
                >
                  <Square className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={skipBackward}
                  className="text-white hover:bg-white/20"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={skipForward}
                  className="text-white hover:bg-white/20"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                  <Slider
                    value={[volume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="w-24"
                  />
                </div>

                <span className="text-white text-sm ml-4">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-2">
                <span className="text-white text-sm">
                  {playbackRate}x
                </span>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
