"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface TrianglePatternGeneratorProps {
  onApplyPattern: (pattern: string) => void
}

export function TrianglePatternGenerator({ onApplyPattern }: TrianglePatternGeneratorProps) {
  const [svgContent, setSvgContent] = useState<string>("")
  const [colorHex, setColorHex] = useState<string>("#7f7f7f")
  const [saturation, setSaturation] = useState<number>(8)

  const generatePattern = () => {
    // derive hue from selected hex color
    const hexToHue = (hex: string) => {
      // convert #rrggbb to numeric
      const h = hex.replace('#', '')
      const r = parseInt(h.substring(0, 2), 16) / 255
      const g = parseInt(h.substring(2, 4), 16) / 255
      const b = parseInt(h.substring(4, 6), 16) / 255
      const max = Math.max(r, g, b), min = Math.min(r, g, b)
      let hue = 0
      if (max === min) hue = 0
      else if (max === r) hue = (60 * (0 + (g - b) / (max - min)) + 360) % 360
      else if (max === g) hue = (60 * (2 + (b - r) / (max - min)) + 360) % 360
      else hue = (60 * (4 + (r - g) / (max - min)) + 360) % 360
      return Math.round(hue)
    }
    const selectedHue = hexToHue(colorHex)
    // Grid-based triangulation with jitter. Produces a soft monochrome triangulated background.
    const width = 1200
    const height = 700
    const cols = 36
    const rows = 22
    const cellW = width / cols
    const cellH = height / rows

    // Generate points on a grid but jitter them to avoid regularity
    const points: { x: number; y: number }[] = []
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        const nx = i * cellW + (Math.random() - 0.5) * cellW * 0.9
        const ny = j * cellH + (Math.random() - 0.5) * cellH * 0.9
        points.push({ x: Math.max(0, Math.min(width, nx)), y: Math.max(0, Math.min(height, ny)) })
      }
    }

    const triangles: string[] = []
    const centerX = width / 2
    const centerY = height / 2

    // Helper to compute lightness based on distance to center
    const lightnessFor = (cx: number, cy: number) => {
      const dx = cx - centerX
      const dy = cy - centerY
      const d = Math.sqrt(dx * dx + dy * dy)
      const nd = d / Math.sqrt(centerX * centerX + centerY * centerY) // 0..1
      // center brighter, edges darker - squash curve for soft falloff
      const v = Math.pow(nd, 1.6)
      // base range around dark grays (10%..42%)
      const minL = 8
      const maxL = 36
      return Math.round(maxL - (maxL - minL) * v + (Math.random() - 0.5) * 2)
    }

    // Build two triangles per grid cell. Alternate diagonal to reduce visible grid lines.
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i00 = y * (cols + 1) + x
        const i10 = i00 + 1
        const i01 = i00 + (cols + 1)
        const i11 = i01 + 1

        // alternate diagonal based on cell parity
        if ((x + y) % 2 === 0) {
          const t1 = [points[i00], points[i10], points[i11]]
          const t2 = [points[i00], points[i11], points[i01]]
          ;[t1, t2].forEach((t) => {
            const cx = (t[0].x + t[1].x + t[2].x) / 3
            const cy = (t[0].y + t[1].y + t[2].y) / 3
            const l = lightnessFor(cx, cy)
            const color = `hsl(${selectedHue}, ${saturation}%, ${l}%)`
            triangles.push(`<polygon points="${t[0].x},${t[0].y} ${t[1].x},${t[1].y} ${t[2].x},${t[2].y}" fill="${color}" stroke="rgba(0,0,0,0.02)" stroke-width="1" />`)
          })
        } else {
          const t1 = [points[i00], points[i10], points[i01]]
          const t2 = [points[i10], points[i11], points[i01]]
          ;[t1, t2].forEach((t) => {
            const cx = (t[0].x + t[1].x + t[2].x) / 3
            const cy = (t[0].y + t[1].y + t[2].y) / 3
            const l = lightnessFor(cx, cy)
            const color = `hsl(${selectedHue}, ${saturation}%, ${l}%)`
            triangles.push(`<polygon points="${t[0].x},${t[0].y} ${t[1].x},${t[1].y} ${t[2].x},${t[2].y}" fill="${color}" stroke="rgba(0,0,0,0.02)" stroke-width="1" />`)
          })
        }
      }
    }

    // Optional subtle radial overlay for smooth center glow
    const overlay = `\n<radialGradient id="g1" cx="50%" cy="50%" r="60%">\n  <stop offset="0%" stop-color="#ffffff" stop-opacity="0.06"/>\n  <stop offset="60%" stop-color="#000000" stop-opacity="0.0"/>\n</radialGradient>\n<rect x="0" y="0" width="${width}" height="${height}" fill="url(#g1)" />`

    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">\n  <rect x="0" y="0" width="${width}" height="${height}" fill="#0b0b0b" />\n  ${triangles.join('\n  ')}\n  <defs>${overlay}</defs>\n</svg>`

    setSvgContent(svg)
    // Also notify parent with data URL so modal can immediately use the generated pattern
    try {
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        if (onApplyPattern) onApplyPattern(result)
      }
      reader.readAsDataURL(blob)
    } catch (e) {
      // ignore
    }
  }

  const applyPattern = () => {
    if (svgContent) {
      // Use a Blob + FileReader to safely create a data URL (handles UTF-8 correctly)
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        onApplyPattern(result)
      }
      reader.readAsDataURL(blob)
    }
  }

  useEffect(() => {
    generatePattern()
  }, [])

  return (
    <>
      <Card className="border-0 bg-transparent shadow-none box-border w-full max-w-full">
        <CardContent className="px-0">
          <div id="container" className="w-full">
            <div id="output" className="w-full h-56 overflow-hidden rounded-md border border-muted box-border">
              {svgContent && (
                <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: svgContent }} />
              )}
            </div>

            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <label className="text-sm">Couleur:</label>
                <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <label className="text-sm">Saturation:</label>
                <input type="range" min={0} max={60} value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} />
                <span className="text-xs w-8 text-right">{saturation}%</span>
              </div>
              <div className="ml-auto flex gap-2 min-w-0 flex-wrap md:flex-nowrap items-center">
                <Button onClick={generatePattern}>Générer nouveau motif</Button>
              </div>
            </div>

            <p className="mt-4 text-sm">Générateur de motif triangulaire simplifié</p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}