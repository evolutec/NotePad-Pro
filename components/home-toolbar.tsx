import React from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Copy,
  Clipboard,
  Scissors,
  Undo,
  Redo,
  Trash2,
  Save,
  FileDown,
  Printer,
  Share2,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Image as ImageIcon
} from "lucide-react"

interface HomeToolbarProps {
  undo: () => void
  redo: () => void
  undoStack: any[]
  redoStack: any[]
  clearCanvas: () => void
  saveDrawing: () => void
  exportCanvas: () => void
  zoom: number
  onZoomChange: (zoom: number) => void
}

export function HomeToolbar({
  undo,
  redo,
  undoStack,
  redoStack,
  clearCanvas,
  saveDrawing,
  exportCanvas,
  zoom,
  onZoomChange,
}: HomeToolbarProps) {
  return (
    <div className="border-b border-border bg-card p-3">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Clipboard Actions */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Presse-papiers:</span>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Scissors className="h-4 w-4" />
            <span className="hidden sm:inline">Couper</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">Copier</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Clipboard className="h-4 w-4" />
            <span className="hidden sm:inline">Coller</span>
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* History */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Historique:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={undoStack.length === 0}
            className="flex items-center gap-2"
          >
            <Undo className="h-4 w-4" />
            <span className="hidden sm:inline">Annuler</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={redoStack.length === 0}
            className="flex items-center gap-2"
          >
            <Redo className="h-4 w-4" />
            <span className="hidden sm:inline">Rétablir</span>
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Actions:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={clearCanvas}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Effacer tout</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={saveDrawing}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Enregistrer</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCanvas}
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

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
          <span className="text-sm font-medium w-16 text-center">{zoom}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onZoomChange(Math.min(400, zoom + 25))}
            disabled={zoom >= 400}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onZoomChange(100)}
          >
            100%
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Additional Tools */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Rechercher</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Insérer image</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Partager</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
