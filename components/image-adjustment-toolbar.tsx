"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import {
  Sun,
  Moon,
  Contrast,
  Droplet,
  Sparkles,
  Palette,
  WandSparkles
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ImageAdjustmentToolbarProps {
  brightness?: number
  contrast?: number
  saturation?: number
  onBrightnessChange?: (value: number) => void
  onContrastChange?: (value: number) => void
  onSaturationChange?: (value: number) => void
  onFilterApply?: (filter: string) => void
  onReset?: () => void
}

export function ImageAdjustmentToolbar({
  brightness = 100,
  contrast = 100,
  saturation = 100,
  onBrightnessChange,
  onContrastChange,
  onSaturationChange,
  onFilterApply,
  onReset
}: ImageAdjustmentToolbarProps) {
  const filters = [
    { name: "Aucun", value: "none" },
    { name: "Noir et Blanc", value: "grayscale" },
    { name: "Sépia", value: "sepia" },
    { name: "Vintage", value: "vintage" },
    { name: "Vif", value: "vivid" },
    { name: "Froid", value: "cool" },
    { name: "Chaud", value: "warm" }
  ]

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-background">
      {/* Luminosité */}
      {onBrightnessChange && (
        <>
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-muted-foreground" />
            <Label className="text-xs text-muted-foreground min-w-[80px]">Luminosité</Label>
            <Slider
              value={[brightness]}
              onValueChange={(values) => onBrightnessChange(values[0])}
              min={0}
              max={200}
              step={1}
              className="w-32"
            />
            <span className="text-xs min-w-[40px] text-center">{brightness}%</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Contraste */}
      {onContrastChange && (
        <>
          <div className="flex items-center gap-2">
            <Contrast className="h-4 w-4 text-muted-foreground" />
            <Label className="text-xs text-muted-foreground min-w-[80px]">Contraste</Label>
            <Slider
              value={[contrast]}
              onValueChange={(values) => onContrastChange(values[0])}
              min={0}
              max={200}
              step={1}
              className="w-32"
            />
            <span className="text-xs min-w-[40px] text-center">{contrast}%</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Saturation */}
      {onSaturationChange && (
        <>
          <div className="flex items-center gap-2">
            <Droplet className="h-4 w-4 text-muted-foreground" />
            <Label className="text-xs text-muted-foreground min-w-[80px]">Saturation</Label>
            <Slider
              value={[saturation]}
              onValueChange={(values) => onSaturationChange(values[0])}
              min={0}
              max={200}
              step={1}
              className="w-32"
            />
            <span className="text-xs min-w-[40px] text-center">{saturation}%</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Filtres */}
      {onFilterApply && (
        <>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">Filtres</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Appliquer un filtre
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {filters.map((filter) => (
                  <DropdownMenuItem
                    key={filter.value}
                    onClick={() => onFilterApply(filter.value)}
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    {filter.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Réinitialiser */}
      {onReset && (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onReset} title="Réinitialiser tous les ajustements">
            <WandSparkles className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      )}
    </div>
  )
}
