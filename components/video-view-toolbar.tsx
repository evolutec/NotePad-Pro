"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Sun,
  Moon,
  Monitor,
  Grid3x3,
  Info
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface VideoViewToolbarProps {
  zoom?: number
  onZoomIn?: () => void
  onZoomOut?: () => void
  onZoomReset?: () => void
  isFullscreen: boolean
  onFullscreenToggle: () => void
  showControls?: boolean
  onControlsToggle?: () => void
  showStats?: boolean
  onStatsToggle?: () => void
  theme?: string
  onThemeChange?: (theme: string) => void
}

export function VideoViewToolbar({
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  isFullscreen,
  onFullscreenToggle,
  showControls = true,
  onControlsToggle,
  showStats = false,
  onStatsToggle,
  theme = "auto",
  onThemeChange
}: VideoViewToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 border-b bg-background">
      {/* Zoom */}
      {onZoomIn && onZoomOut && onZoomReset && (
        <>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">Zoom</span>
            <Button variant="ghost" size="sm" onClick={onZoomOut} title="Zoom arrière">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomReset}
              className="min-w-[60px]"
              title="Réinitialiser le zoom"
            >
              {Math.round(zoom * 100)}%
            </Button>
            <Button variant="ghost" size="sm" onClick={onZoomIn} title="Zoom avant">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Plein écran */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-2">Affichage</span>
        <Button variant="ghost" size="sm" onClick={onFullscreenToggle} title="Plein écran">
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          <span className="ml-2 text-xs">{isFullscreen ? "Fenêtré" : "Plein écran"}</span>
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Options d'affichage */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground">Options</span>
        
        {onControlsToggle && (
          <div className="flex items-center gap-2">
            <Switch
              id="show-controls"
              checked={showControls}
              onCheckedChange={onControlsToggle}
            />
            <Label htmlFor="show-controls" className="text-xs cursor-pointer">
              Contrôles
            </Label>
          </div>
        )}

        {onStatsToggle && (
          <div className="flex items-center gap-2">
            <Switch
              id="show-stats"
              checked={showStats}
              onCheckedChange={onStatsToggle}
            />
            <Label htmlFor="show-stats" className="text-xs cursor-pointer">
              <Info className="h-3 w-3 inline mr-1" />
              Statistiques
            </Label>
          </div>
        )}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Thème */}
      {onThemeChange && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2">Thème</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                {theme === "light" && <Sun className="h-4 w-4 mr-2" />}
                {theme === "dark" && <Moon className="h-4 w-4 mr-2" />}
                {theme === "auto" && <Monitor className="h-4 w-4 mr-2" />}
                {theme === "light" ? "Clair" : theme === "dark" ? "Sombre" : "Auto"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onThemeChange("light")}>
                <Sun className="h-4 w-4 mr-2" />
                Clair
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onThemeChange("dark")}>
                <Moon className="h-4 w-4 mr-2" />
                Sombre
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onThemeChange("auto")}>
                <Monitor className="h-4 w-4 mr-2" />
                Auto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
