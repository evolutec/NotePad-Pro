'use client'

import * as React from 'react'
import { Contrast } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'

export function BrightnessControl() {
  const { theme } = useTheme()
  const [brightness, setBrightness] = React.useState(100)

  // Load saved brightness on mount
  React.useEffect(() => {
    const savedBrightness = localStorage.getItem('brightness')
    if (savedBrightness) {
      const brightnessValue = parseInt(savedBrightness, 10)
      setBrightness(brightnessValue)
      document.documentElement.style.filter = `brightness(${brightnessValue}%)`
    }
  }, [])

  const handleBrightnessChange = (value: number[]) => {
    const newBrightness = value[0]
    setBrightness(newBrightness)

    // Apply brightness filter to the entire document
    document.documentElement.style.filter = `brightness(${newBrightness}%)`

    // Store in localStorage
    localStorage.setItem('brightness', newBrightness.toString())
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Ajuster la luminosité"
        >
          <Contrast className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Luminosité</h4>
            <span className="text-sm text-muted-foreground">{brightness}%</span>
          </div>
          <Slider
            value={[brightness]}
            onValueChange={handleBrightnessChange}
            max={150}
            min={50}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>50%</span>
            <span>100%</span>
            <span>150%</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}