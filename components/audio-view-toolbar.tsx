"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Activity, Eye, EyeOff } from "lucide-react"

export interface AudioViewToolbarProps {
  showVisualizer: boolean
  onToggleVisualizer: () => void
  visualizerStyle: 'bars' | 'waveform'
  onVisualizerStyleChange: (style: 'bars' | 'waveform') => void
  theme: string
  onThemeChange: (theme: string) => void
}

export function AudioViewToolbar({
  showVisualizer,
  onToggleVisualizer,
  visualizerStyle,
  onVisualizerStyleChange,
  theme,
  onThemeChange
}: AudioViewToolbarProps) {
  return (
    <div className="bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-b border-pink-200 dark:border-pink-800 px-4 py-2">
      <div className="flex items-center gap-2">
        {/* Visualizer Section */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-pink-700 dark:text-pink-300 mr-2">Visualisation</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleVisualizer}
            className="h-8 px-3 hover:bg-pink-200 dark:hover:bg-pink-800"
            title={showVisualizer ? "Masquer le visualiseur" : "Afficher le visualiseur"}
          >
            {showVisualizer ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {showVisualizer ? "Masquer" : "Afficher"}
          </Button>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <Button
            variant={visualizerStyle === 'bars' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onVisualizerStyleChange('bars')}
            className="h-8 px-3 hover:bg-pink-200 dark:hover:bg-pink-800"
            title="Barres de fréquence"
          >
            Barres
          </Button>
          <Button
            variant={visualizerStyle === 'waveform' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onVisualizerStyleChange('waveform')}
            className="h-8 px-3 hover:bg-pink-200 dark:hover:bg-pink-800"
            title="Forme d'onde"
          >
            Onde
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-2" />

        {/* Theme Section */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-pink-700 dark:text-pink-300 mr-2">Thème</span>
          <Button
            variant={theme === 'auto' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onThemeChange('auto')}
            className="h-8 px-3 hover:bg-pink-200 dark:hover:bg-pink-800"
          >
            Auto
          </Button>
          <Button
            variant={theme === 'light' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onThemeChange('light')}
            className="h-8 px-3 hover:bg-pink-200 dark:hover:bg-pink-800"
          >
            Clair
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onThemeChange('dark')}
            className="h-8 px-3 hover:bg-pink-200 dark:hover:bg-pink-800"
          >
            Sombre
          </Button>
        </div>
      </div>
    </div>
  )
}
