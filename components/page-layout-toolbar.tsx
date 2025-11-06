import React from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  Maximize2, 
  Minimize2,
  RectangleHorizontal,
  RectangleVertical,
  Ruler,
  Grid3x3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Palette
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface PageLayoutToolbarProps {
  orientation: "portrait" | "landscape"
  onOrientationChange: (orientation: "portrait" | "landscape") => void
  showGrid: boolean
  onShowGridChange: (show: boolean) => void
  showRuler: boolean
  onShowRulerChange: (show: boolean) => void
  zoom: number
  onZoomChange: (zoom: number) => void
  backgroundColor: string
  onBackgroundColorChange: (color: string) => void
}

const BACKGROUND_COLORS = [
  { name: "Blanc", color: "#FFFFFF" },
  { name: "Crème", color: "#FFFEF0" },
  { name: "Gris clair", color: "#F5F5F5" },
  { name: "Bleu clair", color: "#E3F2FD" },
  { name: "Vert clair", color: "#E8F5E9" },
  { name: "Jaune clair", color: "#FFFDE7" },
  { name: "Noir", color: "#000000" },
]

const ZOOM_LEVELS = [25, 50, 75, 100, 125, 150, 200, 300, 400]

export function PageLayoutToolbar({
  orientation,
  onOrientationChange,
  showGrid,
  onShowGridChange,
  showRuler,
  onShowRulerChange,
  zoom,
  onZoomChange,
  backgroundColor,
  onBackgroundColorChange,
}: PageLayoutToolbarProps) {
  return (
    <div className="border-b border-border bg-card p-3">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Orientation */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Orientation:</span>
          <Button
            variant={orientation === "portrait" ? "default" : "outline"}
            size="sm"
            onClick={() => onOrientationChange("portrait")}
            className="flex items-center gap-2"
          >
            <RectangleVertical className="h-4 w-4" />
            <span className="hidden sm:inline">Portrait</span>
          </Button>
          <Button
            variant={orientation === "landscape" ? "default" : "outline"}
            size="sm"
            onClick={() => onOrientationChange("landscape")}
            className="flex items-center gap-2"
          >
            <RectangleHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Paysage</span>
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Affichage */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Affichage:</span>
          <Button
            variant={showGrid ? "default" : "outline"}
            size="sm"
            onClick={() => onShowGridChange(!showGrid)}
            className="flex items-center gap-2"
          >
            <Grid3x3 className="h-4 w-4" />
            <span className="hidden sm:inline">Grille</span>
          </Button>
          <Button
            variant={showRuler ? "default" : "outline"}
            size="sm"
            onClick={() => onShowRulerChange(!showRuler)}
            className="flex items-center gap-2"
          >
            <Ruler className="h-4 w-4" />
            <span className="hidden sm:inline">Règle</span>
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Zoom */}
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
              {ZOOM_LEVELS.map((level) => (
                <DropdownMenuItem
                  key={level}
                  onClick={() => onZoomChange(level)}
                  className={zoom === level ? "bg-accent" : ""}
                >
                  {level}%
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

        {/* Background Color */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Fond:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-32 justify-start gap-2">
                <div 
                  className="w-5 h-5 rounded border" 
                  style={{ backgroundColor }}
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
                  {backgroundColor === bg.color && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Format de page */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Format:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                A4
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>A4 (21 × 29,7 cm)</DropdownMenuItem>
              <DropdownMenuItem>A3 (29,7 × 42 cm)</DropdownMenuItem>
              <DropdownMenuItem>A5 (14,8 × 21 cm)</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Letter (21,6 × 27,9 cm)</DropdownMenuItem>
              <DropdownMenuItem>Legal (21,6 × 35,6 cm)</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Personnalisé...</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
