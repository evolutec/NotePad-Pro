"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Download,
  Share2,
  Scissors,
  Copy
} from "lucide-react"

interface VideoHomeToolbarProps {
  isPlaying: boolean
  isMuted: boolean
  volume: number
  onPlayPause: () => void
  onStop: () => void
  onSkipBackward: () => void
  onSkipForward: () => void
  onMuteToggle: () => void
  onFullscreenToggle: () => void
  onDownload?: () => void
  onShare?: () => void
  onExtract?: () => void
}

export function VideoHomeToolbar({
  isPlaying,
  isMuted,
  volume,
  onPlayPause,
  onStop,
  onSkipBackward,
  onSkipForward,
  onMuteToggle,
  onFullscreenToggle,
  onDownload,
  onShare,
  onExtract
}: VideoHomeToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 border-b bg-background">
      {/* Contrôles de lecture */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-2">Lecture</span>
        <Button variant="ghost" size="sm" onClick={onPlayPause} title={isPlaying ? "Pause" : "Lecture"}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span className="ml-2 text-xs">{isPlaying ? "Pause" : "Lecture"}</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={onStop} title="Arrêter">
          <Square className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onSkipBackward} title="Reculer de 10s">
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onSkipForward} title="Avancer de 10s">
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Audio */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-2">Audio</span>
        <Button variant="ghost" size="sm" onClick={onMuteToggle} title={isMuted ? "Activer le son" : "Couper le son"}>
          {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          <span className="ml-2 text-xs">{isMuted ? "Muet" : "Son"}</span>
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Affichage */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-2">Affichage</span>
        <Button variant="ghost" size="sm" onClick={onFullscreenToggle} title="Plein écran">
          <Maximize className="h-4 w-4" />
          <span className="ml-2 text-xs">Plein écran</span>
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-2">Actions</span>
        {onDownload && (
          <Button variant="ghost" size="sm" onClick={onDownload} title="Télécharger">
            <Download className="h-4 w-4" />
            <span className="ml-2 text-xs">Télécharger</span>
          </Button>
        )}
        {onShare && (
          <Button variant="ghost" size="sm" onClick={onShare} title="Partager">
            <Share2 className="h-4 w-4" />
            <span className="ml-2 text-xs">Partager</span>
          </Button>
        )}
        {onExtract && (
          <Button variant="ghost" size="sm" onClick={onExtract} title="Extraire une image">
            <Scissors className="h-4 w-4" />
            <span className="ml-2 text-xs">Extraire</span>
          </Button>
        )}
      </div>
    </div>
  )
}
