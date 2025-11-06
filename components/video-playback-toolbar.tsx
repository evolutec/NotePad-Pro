"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Gauge,
  Settings,
  Clock,
  RepeatIcon,
  Sliders
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface VideoPlaybackToolbarProps {
  playbackRate: number
  onPlaybackRateChange: (rate: number) => void
  onQualityChange?: (quality: string) => void
  onLoopToggle?: () => void
  isLooping?: boolean
}

export function VideoPlaybackToolbar({
  playbackRate,
  onPlaybackRateChange,
  onQualityChange,
  onLoopToggle,
  isLooping = false
}: VideoPlaybackToolbarProps) {
  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]
  const qualities = ["Auto", "1080p", "720p", "480p", "360p"]

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-background">
      {/* Vitesse de lecture */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-2">Vitesse</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Gauge className="h-4 w-4 mr-2" />
              {playbackRate}x
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {playbackRates.map((rate) => (
              <DropdownMenuItem
                key={rate}
                onClick={() => onPlaybackRateChange(rate)}
                className={playbackRate === rate ? "bg-accent" : ""}
              >
                {rate}x {rate === 1 ? "(Normal)" : ""}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Qualité vidéo */}
      {onQualityChange && (
        <>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">Qualité</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Qualité
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {qualities.map((quality) => (
                  <DropdownMenuItem
                    key={quality}
                    onClick={() => onQualityChange(quality)}
                  >
                    {quality}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Lecture en boucle */}
      {onLoopToggle && (
        <>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">Options</span>
            <Button
              variant={isLooping ? "default" : "ghost"}
              size="sm"
              onClick={onLoopToggle}
              title="Lecture en boucle"
            >
              <RepeatIcon className="h-4 w-4 mr-2" />
              Boucle
            </Button>
          </div>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Informations */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-2">Informations</span>
        <Button variant="ghost" size="sm" title="Afficher les informations de la vidéo">
          <Clock className="h-4 w-4 mr-2" />
          Propriétés
        </Button>
      </div>
    </div>
  )
}
