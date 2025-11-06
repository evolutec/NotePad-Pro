import React from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { 
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Grid3x3,
  Ruler,
  Eye,
  EyeOff,
  Palette,
  Sun,
  Moon,
  Monitor,
  Contrast,
  SlidersHorizontal
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface ViewToolbarProps {
  zoom: number
  onZoomChange: (zoom: number) => void
  showGrid: boolean
  onShowGridChange: (show: boolean) => void
  showRuler: boolean
  onShowRulerChange: (show: boolean) => void
  fullscreen: boolean
  onFullscreenToggle: () => void
  theme: "light" | "dark" | "auto"
  onThemeChange: (theme: "light" | "dark" | "auto") => void
  showOCR: boolean
  onShowOCRToggle: () => void
  canvasBackgroundColor: string
  onBackgroundColorChange: (color: string) => void
}

const ZOOM_PRESETS = [25, 50, 75, 100, 125, 150, 200, 300, 400]

const BACKGROUND_COLORS = [
  { name: "Blanc", color: "#FFFFFF" },
  { name: "Crème", color: "#FFFEF0" },
  { name: "Gris clair", color: "#F5F5F5" },
  { name: "Bleu clair", color: "#E3F2FD" },
  { name: "Vert clair", color: "#E8F5E9" },
  { name: "Rose clair", color: "#FCE4EC" },
  { name: "Noir", color: "#000000" },
]

export function ViewToolbar({
  zoom,
  onZoomChange,
  showGrid,
  onShowGridChange,
  showRuler,
  onShowRulerChange,
  fullscreen,
  onFullscreenToggle,
  theme,
  onThemeChange,
  showOCR,
  onShowOCRToggle,
  canvasBackgroundColor,
  onBackgroundColorChange,
}: ViewToolbarProps) {
  return (
    <div className="border-b border-border bg-card p-3">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Zoom:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onZoomChange(Math.max(25, zoom - 25))}
            disabled={zoom <= 25}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-20">
                {zoom}%
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {ZOOM_PRESETS.map((preset) => (
                <DropdownMenuItem
                  key={preset}
                  onClick={() => onZoomChange(preset)}
                  className={zoom === preset ? "bg-accent" : ""}
                >
                  {preset}%
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onZoomChange(Math.min(400, zoom + 25))}
            disabled={zoom >= 400}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Display Options */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Affichage:</span>
          <div className="flex items-center gap-2">
            <Grid3x3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Grille</span>
            <Switch checked={showGrid} onCheckedChange={onShowGridChange} />
          </div>
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Règle</span>
            <Switch checked={showRuler} onCheckedChange={onShowRulerChange} />
          </div>
          <div className="flex items-center gap-2">
            {showOCR ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
            <span className="text-sm">OCR</span>
            <Switch checked={showOCR} onCheckedChange={onShowOCRToggle} />
          </div>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* View Mode */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Mode:</span>
          <Button
            variant={fullscreen ? "default" : "outline"}
            size="sm"
            onClick={onFullscreenToggle}
            className="flex items-center gap-2"
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{fullscreen ? "Normal" : "Plein écran"}</span>
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Theme */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Thème:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                {theme === "light" && <Sun className="h-4 w-4" />}
                {theme === "dark" && <Moon className="h-4 w-4" />}
                {theme === "auto" && <Monitor className="h-4 w-4" />}
                <span className="hidden sm:inline capitalize">{theme === "light" ? "Clair" : theme === "dark" ? "Sombre" : "Auto"}</span>
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

        <Separator orientation="vertical" className="h-8" />

        {/* Background Color */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Fond:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <div 
                  className="w-5 h-5 rounded border" 
                  style={{ backgroundColor: canvasBackgroundColor }}
                />
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {BACKGROUND_COLORS.map((bg) => (
                <DropdownMenuItem
                  key={bg.color}
                  onClick={() => onBackgroundColorChange(bg.color)}
                  className="flex items-center gap-2"
                >
                  <div 
                    className="w-5 h-5 rounded border" 
                    style={{ backgroundColor: bg.color }}
                  />
                  <span>{bg.name}</span>
                  {canvasBackgroundColor === bg.color && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Additional View Options */}
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Contrast className="h-4 w-4" />
          <span className="hidden sm:inline">Contraste</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Ajuster</span>
        </Button>
      </div>
    </div>
  )
}
