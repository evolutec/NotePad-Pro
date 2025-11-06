"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Download,
  Copy,
  Share2,
  Maximize
} from "lucide-react"

interface ImageHomeToolbarProps {
  zoom: number
  rotation: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onRotateClockwise: () => void
  onRotateCounterClockwise: () => void
  onFlipHorizontal?: () => void
  onFlipVertical?: () => void
  onCrop?: () => void
  onDownload?: () => void
  onCopy?: () => void
  onShare?: () => void
  onFullscreen?: () => void
}

export function ImageHomeToolbar({
  zoom,
  rotation,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onRotateClockwise,
  onRotateCounterClockwise,
  onFlipHorizontal,
  onFlipVertical,
  onCrop,
  onDownload,
  onCopy,
  onShare,
  onFullscreen
}: ImageHomeToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 border-b bg-background">
      {/* Zoom */}
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

      {/* Rotation */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-2">Rotation</span>
        <Button variant="ghost" size="sm" onClick={onRotateCounterClockwise} title="Rotation anti-horaire">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <span className="text-xs min-w-[40px] text-center">{rotation}°</span>
        <Button variant="ghost" size="sm" onClick={onRotateClockwise} title="Rotation horaire">
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Transformations */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-2">Transformer</span>
        {onFlipHorizontal && (
          <Button variant="ghost" size="sm" onClick={onFlipHorizontal} title="Retourner horizontalement">
            <FlipHorizontal className="h-4 w-4" />
          </Button>
        )}
        {onFlipVertical && (
          <Button variant="ghost" size="sm" onClick={onFlipVertical} title="Retourner verticalement">
            <FlipVertical className="h-4 w-4" />
          </Button>
        )}
        {onCrop && (
          <Button variant="ghost" size="sm" onClick={onCrop} title="Recadrer">
            <Crop className="h-4 w-4 mr-1" />
            Recadrer
          </Button>
        )}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-2">Actions</span>
        {onDownload && (
          <Button variant="ghost" size="sm" onClick={onDownload} title="Télécharger">
            <Download className="h-4 w-4" />
          </Button>
        )}
        {onCopy && (
          <Button variant="ghost" size="sm" onClick={onCopy} title="Copier">
            <Copy className="h-4 w-4" />
          </Button>
        )}
        {onShare && (
          <Button variant="ghost" size="sm" onClick={onShare} title="Partager">
            <Share2 className="h-4 w-4" />
          </Button>
        )}
        {onFullscreen && (
          <Button variant="ghost" size="sm" onClick={onFullscreen} title="Plein écran">
            <Maximize className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
