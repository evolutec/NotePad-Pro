"use client"

import * as React from "react"
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
  ExternalLink
} from "lucide-react"

export interface AudioHomeToolbarProps {
  isPlaying: boolean
  isMuted: boolean
  volume: number
  onPlayPause: () => void
  onStop: () => void
  onSkipBackward: () => void
  onSkipForward: () => void
  onMuteToggle: () => void
  onDetach: () => void
}

export function AudioHomeToolbar({
  isPlaying,
  isMuted,
  volume,
  onPlayPause,
  onStop,
  onSkipBackward,
  onSkipForward,
  onMuteToggle,
  onDetach
}: AudioHomeToolbarProps) {
  return (
    <div className="bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-b border-pink-200 dark:border-pink-800 px-4 py-2">
      <div className="flex items-center gap-2">
        {/* Lecture Section */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-pink-700 dark:text-pink-300 mr-2">Lecture</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onPlayPause}
            className="h-8 px-3 hover:bg-pink-200 dark:hover:bg-pink-800"
            title={isPlaying ? "Pause" : "Lecture"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onStop}
            className="h-8 px-3 hover:bg-pink-200 dark:hover:bg-pink-800"
            title="Arrêter"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkipBackward}
            className="h-8 px-3 hover:bg-pink-200 dark:hover:bg-pink-800"
            title="Reculer 10s"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkipForward}
            className="h-8 px-3 hover:bg-pink-200 dark:hover:bg-pink-800"
            title="Avancer 10s"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-2" />

        {/* Volume Section */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-pink-700 dark:text-pink-300 mr-2">Audio</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMuteToggle}
            className="h-8 px-3 hover:bg-pink-200 dark:hover:bg-pink-800"
            title={isMuted ? "Réactiver le son" : "Couper le son"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-2" />

        {/* Window Section */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-pink-700 dark:text-pink-300 mr-2">Fenêtre</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDetach}
            className="h-8 px-3 hover:bg-pink-200 dark:hover:bg-pink-800"
            title="Détacher dans une nouvelle fenêtre"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Détacher
          </Button>
        </div>
      </div>
    </div>
  )
}
