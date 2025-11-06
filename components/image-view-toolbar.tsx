"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Sun,
  Moon,
  Monitor,
  Grid3x3,
  Ruler,
  Eye,
  Palette
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ImageViewToolbarProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  showGrid?: boolean
  onGridToggle?: () => void
  showRuler?: boolean
  onRulerToggle?: () => void
  onFullscreen?: () => void
  theme?: string
  onThemeChange?: (theme: string) => void
  backgroundColor?: string
  onBackgroundColorChange?: (color: string) => void
}

export function ImageViewToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  showGrid = false,
  onGridToggle,
  showRuler = false,
  onRulerToggle,
  onFullscreen,
  theme = "auto",
  onThemeChange,
  backgroundColor = "#ffffff",
  onBackgroundColorChange
}: ImageViewToolbarProps) {
  const zoomPresets = [25, 50, 75, 100, 125, 150, 200, 400]
  const backgroundColors = [
    { name: "Blanc", value: "#ffffff" },
    { name: "Noir", value: "#000000" },
    { name: "Gris", value: "#808080" },
    { name: "Transparent", value: "transparent" }
  ]

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-background">
      {/* Zoom */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-2">Zoom</span>
        <Button variant="ghost" size="sm" onClick={onZoomOut} title="Zoom arrière">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="min-w-[60px]">
              {Math.round(zoom * 100)}%
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {zoomPresets.map((preset) => (
              <DropdownMenuItem
                key={preset}
                onClick={() => onZoomReset()}
                className={Math.round(zoom * 100) === preset ? "bg-accent" : ""}
              >
                {preset}%
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="sm" onClick={onZoomIn} title="Zoom avant">
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Options d'affichage */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground">Affichage</span>
        
        {onGridToggle && (
          <div className="flex items-center gap-2">
            <Switch
              id="show-grid"
              checked={showGrid}
              onCheckedChange={onGridToggle}
            />
            <Label htmlFor="show-grid" className="text-xs cursor-pointer flex items-center gap-1">
              <Grid3x3 className="h-3 w-3" />
              Grille
            </Label>
          </div>
        )}

        {onRulerToggle && (
          <div className="flex items-center gap-2">
            <Switch
              id="show-ruler"
              checked={showRuler}
              onCheckedChange={onRulerToggle}
            />
            <Label htmlFor="show-ruler" className="text-xs cursor-pointer flex items-center gap-1">
              <Ruler className="h-3 w-3" />
              Règle
            </Label>
          </div>
        )}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Plein écran */}
      {onFullscreen && (
        <>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onFullscreen} title="Plein écran">
              <Maximize className="h-4 w-4 mr-2" />
              Plein écran
            </Button>
          </div>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Couleur d'arrière-plan */}
      {onBackgroundColorChange && (
        <>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">Fond</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Palette className="h-4 w-4 mr-2" />
                  Couleur
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {backgroundColors.map((color) => (
                  <DropdownMenuItem
                    key={color.value}
                    onClick={() => onBackgroundColorChange(color.value)}
                    className={backgroundColor === color.value ? "bg-accent" : ""}
                  >
                    <div
                      className="w-4 h-4 rounded border mr-2"
                      style={{ backgroundColor: color.value }}
                    />
                    {color.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

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
