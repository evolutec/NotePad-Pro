"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sliders, RotateCcw } from "lucide-react"

export interface AudioEqualizerToolbarProps {
  equalizerGains: number[]
  onEqualizerChange: (index: number, value: number) => void
  onEqualizerReset: () => void
  showEqualizer: boolean
  onToggleEqualizer: () => void
}

export function AudioEqualizerToolbar({
  equalizerGains,
  onEqualizerChange,
  onEqualizerReset,
  showEqualizer,
  onToggleEqualizer
}: AudioEqualizerToolbarProps) {
  const frequencyBands = ['60', '170', '310', '600', '1k', '3k', '6k', '12k', '14k', '16k']

  return (
    <div className="bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-b border-pink-200 dark:border-pink-800 px-4 py-2">
      <div className="flex items-center gap-2">
        {/* Equalizer Controls */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-pink-700 dark:text-pink-300 mr-2">Égaliseur</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleEqualizer}
            className="h-8 px-3 hover:bg-pink-200 dark:hover:bg-pink-800"
            title={showEqualizer ? "Masquer l'égaliseur" : "Afficher l'égaliseur"}
          >
            <Sliders className="h-4 w-4 mr-2" />
            {showEqualizer ? "Masquer" : "Afficher"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEqualizerReset}
            className="h-8 px-3 hover:bg-pink-200 dark:hover:bg-pink-800"
            title="Réinitialiser l'égaliseur"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        </div>

        {showEqualizer && (
          <>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <div className="flex items-center gap-3 flex-1 overflow-x-auto">
              {frequencyBands.map((freq, index) => (
                <div key={freq} className="flex flex-col items-center gap-1 min-w-[40px]">
                  <span className="text-xs text-pink-600 dark:text-pink-400 font-medium">{freq}Hz</span>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={equalizerGains[index] || 0}
                    onChange={(e) => onEqualizerChange(index, parseFloat(e.target.value))}
                    className="h-20 w-6 appearance-none bg-transparent [writing-mode:vertical-lr] cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pink-500 
                      [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-runnable-track]:w-2 [&::-webkit-slider-runnable-track]:h-full 
                      [&::-webkit-slider-runnable-track]:bg-pink-200 [&::-webkit-slider-runnable-track]:rounded-full
                      dark:[&::-webkit-slider-runnable-track]:bg-pink-800"
                    title={`${freq}Hz: ${equalizerGains[index]?.toFixed(1) || 0}dB`}
                  />
                  <span className="text-xs text-pink-500 font-mono">{(equalizerGains[index] || 0).toFixed(0)}dB</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
