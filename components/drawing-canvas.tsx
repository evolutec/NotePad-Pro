"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Pen,
  Eraser,
  Square,
  Circle,
  Type,
  Undo,
  Redo,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Wand2,
  RefreshCw,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createWorker } from "tesseract.js"

interface DrawingCanvasProps {
  selectedNote: string | null
  selectedFolder: string | null
}

interface DrawingTool {
  type: "pen" | "eraser" | "rectangle" | "circle" | "text"
  color: string
  size: number
}

interface DrawingStroke {
  id: string
  tool: DrawingTool
  points: { x: number; y: number; pressure: number }[]
  timestamp: Date
  smoothedPoints?: { x: number; y: number; pressure: number }[]
}

interface OCRResult {
  text: string
  confidence: number
  boundingBox: { x: number; y: number; width: number; height: number }
  engine: "tesseract"
  isConverted?: boolean
}

interface ConvertedText {
  id: string
  originalStrokeIds: string[]
  text: string
  position: { x: number; y: number }
  fontSize: number
  color: string
}

const COLORS = [
  "#000000", // Noir
  "#1f2937", // Gris foncé
  "#dc2626", // Rouge
  "#ea580c", // Orange
  "#ca8a04", // Jaune
  "#16a34a", // Vert
  "#0891b2", // Cyan
  "#2563eb", // Bleu
  "#7c3aed", // Violet
  "#c026d3", // Magenta
]

let tesseractWorker: any = null

const getTesseractWorker = async () => {
  if (!tesseractWorker) {
    tesseractWorker = await createWorker("fra+eng", 1, {
      logger: () => {}, // Désactive les logs pour optimiser
    })
    await tesseractWorker.setParameters({
      tessedit_pageseg_mode: "8", // Traite l'image comme un seul mot
      tesseract_char_whitelist:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?-'\"àáâäèéêëìíîïòóôöùúûüçñ",
      tessedit_ocr_engine_mode: "1", // Mode neural network LSTM
    })
  }
  return tesseractWorker
}

const smoothStroke = (
  points: { x: number; y: number; pressure: number }[],
): { x: number; y: number; pressure: number }[] => {
  if (points.length < 3) return points

  const smoothed = [points[0]]

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]

    // Lissage par moyenne pondérée
    const smoothedPoint = {
      x: prev.x * 0.25 + curr.x * 0.5 + next.x * 0.25,
      y: prev.y * 0.25 + curr.y * 0.5 + next.y * 0.25,
      pressure: prev.pressure * 0.25 + curr.pressure * 0.5 + next.pressure * 0.25,
    }

    smoothed.push(smoothedPoint)
  }

  smoothed.push(points[points.length - 1])
  return smoothed
}

export function DrawingCanvas({ selectedNote, selectedFolder }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const backupCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState<DrawingTool>({
    type: "pen",
    color: "#000000",
    size: 2,
  })
  const [strokes, setStrokes] = useState<DrawingStroke[]>([])
  const [convertedTexts, setConvertedTexts] = useState<ConvertedText[]>([])
  const [undoStack, setUndoStack] = useState<DrawingStroke[][]>([])
  const [redoStack, setRedoStack] = useState<DrawingStroke[][]>([])
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([])
  const [showOCR, setShowOCR] = useState(false)
  const [isProcessingOCR, setIsProcessingOCR] = useState(false)
  const [currentPressure, setCurrentPressure] = useState(0.5)
  const [isStylusActive, setIsStylusActive] = useState(false)
  const [calibrationOffset, setCalibrationOffset] = useState({ x: 0, y: 0 })
  const [autoConvert, setAutoConvert] = useState(true)
  const [strokeSmoothing, setStrokeSmoothing] = useState(true)
  const [lastStrokeTime, setLastStrokeTime] = useState(0)
  const [pendingStrokes, setPendingStrokes] = useState<string[]>([])

  // Charger le fichier de dessin sélectionné
  useEffect(() => {
    const loadDrawing = async () => {
      if (!selectedNote || !selectedNote.endsWith('.draw')) return
      
      try {
        if (window.electronAPI?.drawLoad) {
          const result = await window.electronAPI.drawLoad(selectedNote)
          if (result.success && result.data) {
            // Charger les traits sauvegardés
            if (result.data.strokes) {
              setStrokes(result.data.strokes)
            }
            // Charger les textes convertis
            if (result.data.convertedTexts) {
              setConvertedTexts(result.data.convertedTexts)
            }
            console.log('Dessin chargé:', selectedNote)
          } else {
            console.log('Aucun dessin trouvé ou erreur:', result.error)
            // Réinitialiser le canvas pour un nouveau dessin
            setStrokes([])
            setConvertedTexts([])
          }
        } else {
          console.log('API de chargement non disponible')
        }
      } catch (error) {
        console.error('Erreur lors du chargement du dessin:', error)
      }
    }

    loadDrawing()
  }, [selectedNote])

  useEffect(() => {
    const backupCanvas = document.createElement("canvas")
    backupCanvasRef.current = backupCanvas

    return () => {
      if (tesseractWorker) {
        tesseractWorker.terminate()
        tesseractWorker = null
      }
    }
  }, [])

  useEffect(() => {
    if (!autoConvert || pendingStrokes.length === 0) return

    const timer = setTimeout(async () => {
      await performAutoOCR(pendingStrokes)
      setPendingStrokes([])
    }, 2000) // 2 secondes après la dernière écriture

    return () => clearTimeout(timer)
  }, [lastStrokeTime, pendingStrokes, autoConvert])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      const containerRect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      const backupCanvas = backupCanvasRef.current
      if (backupCanvas && canvas.width > 0 && canvas.height > 0) {
        backupCanvas.width = canvas.width
        backupCanvas.height = canvas.height
        const backupCtx = backupCanvas.getContext("2d")
        if (backupCtx) {
          backupCtx.drawImage(canvas, 0, 0)
        }
      }

      canvas.width = containerRect.width * dpr
      canvas.height = containerRect.height * dpr

      canvas.style.width = containerRect.width + "px"
      canvas.style.height = containerRect.height + "px"

      ctx.scale(dpr, dpr)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"

      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      console.log("[v0] Canvas resized:", {
        width: canvas.width,
        height: canvas.height,
        displayWidth: containerRect.width,
        displayHeight: containerRect.height,
        dpr,
      })

      if (backupCanvas && backupCanvas.width > 0 && backupCanvas.height > 0) {
        const scaleX = containerRect.width / (backupCanvas.width / dpr)
        const scaleY = containerRect.height / (backupCanvas.height / dpr)
        ctx.drawImage(backupCanvas, 0, 0, containerRect.width * scaleX, containerRect.height * scaleY)
      } else {
        redrawCanvas()
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(resizeCanvas)
    })

    resizeObserver.observe(container)
    resizeCanvas()

    const savedCalibration = localStorage.getItem("stylus-calibration")
    if (savedCalibration) {
      setCalibrationOffset(JSON.parse(savedCalibration))
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1))

    console.log("[v0] Redrawing canvas with", strokes.length, "strokes")

    strokes.forEach((stroke) => {
      if (stroke.points.length < 1) return

      const pointsToUse = strokeSmoothing && stroke.smoothedPoints ? stroke.smoothedPoints : stroke.points

      ctx.beginPath()
      ctx.strokeStyle = stroke.tool.color
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      if (stroke.tool.type === "eraser") {
        ctx.globalCompositeOperation = "destination-out"
      } else {
        ctx.globalCompositeOperation = "source-over"
      }

      if (pointsToUse.length === 1) {
        const point = pointsToUse[0]
        const pressureMultiplier = Math.max(0.3, Math.min(2.0, point.pressure * 1.5))
        ctx.lineWidth = stroke.tool.size * pressureMultiplier

        ctx.beginPath()
        ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.moveTo(pointsToUse[0].x, pointsToUse[0].y)

        for (let i = 1; i < pointsToUse.length - 1; i++) {
          const currentPoint = pointsToUse[i]
          const nextPoint = pointsToUse[i + 1]

          const pressureMultiplier = Math.max(0.3, Math.min(2.0, currentPoint.pressure * 1.5))
          ctx.lineWidth = stroke.tool.size * pressureMultiplier

          const midX = (currentPoint.x + nextPoint.x) / 2
          const midY = (currentPoint.y + nextPoint.y) / 2

          ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, midX, midY)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(midX, midY)
        }

        if (pointsToUse.length > 1) {
          const lastPoint = pointsToUse[pointsToUse.length - 1]
          ctx.lineTo(lastPoint.x, lastPoint.y)
          ctx.stroke()
        }
      }
    })

    convertedTexts.forEach((convertedText) => {
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = convertedText.color
      ctx.font = `${convertedText.fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      ctx.fillText(convertedText.text, convertedText.position.x, convertedText.position.y)
    })

    ctx.globalCompositeOperation = "source-over"
  }, [strokes, convertedTexts, strokeSmoothing])

  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width / (window.devicePixelRatio || 1)
    const scaleY = canvas.height / rect.height / (window.devicePixelRatio || 1)

    const x = (e.clientX - rect.left) * scaleX + calibrationOffset.x
    const y = (e.clientY - rect.top) * scaleY + calibrationOffset.y

    let pressure = 0.5
    if (e.pointerType === "pen" && e.pressure > 0) {
      pressure = Math.max(0.1, Math.min(1.0, e.pressure))
    } else if (e.pointerType === "touch") {
      pressure = 0.7
    }

    return { x, y, pressure }
  }

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    const canvas = canvasRef.current
    if (canvas) {
      canvas.setPointerCapture(e.pointerId)
    }

    setIsDrawing(true)

    const isStylusInput = e.pointerType === "pen"
    setIsStylusActive(isStylusInput)

    const pos = getPointerPos(e)
    setCurrentPressure(pos.pressure)

    console.log("[v0] Starting draw:", {
      pointerType: e.pointerType,
      pressure: e.pressure,
      pos,
      isStylusInput,
    })

    const newStroke: DrawingStroke = {
      id: Date.now().toString(),
      tool: { ...currentTool },
      points: [{ x: pos.x, y: pos.y, pressure: pos.pressure }],
      timestamp: new Date(),
    }

    setStrokes((prev) => [...prev, newStroke])
    setUndoStack((prev) => [...prev, strokes])
    setRedoStack([])

    if (autoConvert) {
      setPendingStrokes((prev) => [...prev, newStroke.id])
    }
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()

    const pos = getPointerPos(e)
    setCurrentPressure(pos.pressure)

    setStrokes((prev) => {
      const newStrokes = [...prev]
      const currentStroke = newStrokes[newStrokes.length - 1]
      if (currentStroke) {
        currentStroke.points.push({ x: pos.x, y: pos.y, pressure: pos.pressure })
      }
      return newStrokes
    })
  }

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    const canvas = canvasRef.current
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId)
    }

    setIsDrawing(false)
    setIsStylusActive(false)
    setCurrentPressure(0.5)

    if (strokeSmoothing) {
      setStrokes((prev) => {
        const newStrokes = [...prev]
        const lastStroke = newStrokes[newStrokes.length - 1]
        if (lastStroke && lastStroke.points.length > 2) {
          lastStroke.smoothedPoints = smoothStroke(lastStroke.points)
        }
        return newStrokes
      })
    }

    setLastStrokeTime(Date.now())
  }

  const performAutoOCR = async (strokeIds: string[]) => {
    if (strokeIds.length === 0) return

    try {
      const canvas = canvasRef.current
      if (!canvas) return

      // Créer un canvas temporaire avec seulement les traits spécifiés
      const tempCanvas = document.createElement("canvas")
      const tempCtx = tempCanvas.getContext("2d")
      if (!tempCtx) return

      const relevantStrokes = strokes.filter((stroke) => strokeIds.includes(stroke.id))
      if (relevantStrokes.length === 0) return

      // Calculer la bounding box des traits
      let minX = Number.POSITIVE_INFINITY,
        minY = Number.POSITIVE_INFINITY,
        maxX = Number.NEGATIVE_INFINITY,
        maxY = Number.NEGATIVE_INFINITY
      relevantStrokes.forEach((stroke) => {
        stroke.points.forEach((point) => {
          minX = Math.min(minX, point.x)
          minY = Math.min(minY, point.y)
          maxX = Math.max(maxX, point.x)
          maxY = Math.max(maxY, point.y)
        })
      })

      const padding = 20
      const width = maxX - minX + padding * 2
      const height = maxY - minY + padding * 2

      tempCanvas.width = width
      tempCanvas.height = height

      tempCtx.fillStyle = "white"
      tempCtx.fillRect(0, 0, width, height)
      tempCtx.lineCap = "round"
      tempCtx.lineJoin = "round"

      // Dessiner seulement les traits sélectionnés
      relevantStrokes.forEach((stroke) => {
        const pointsToUse = strokeSmoothing && stroke.smoothedPoints ? stroke.smoothedPoints : stroke.points

        tempCtx.beginPath()
        tempCtx.strokeStyle = stroke.tool.color

        pointsToUse.forEach((point, index) => {
          const x = point.x - minX + padding
          const y = point.y - minY + padding
          const pressureMultiplier = Math.max(0.3, Math.min(2.0, point.pressure * 1.5))
          tempCtx.lineWidth = stroke.tool.size * pressureMultiplier

          if (index === 0) {
            tempCtx.moveTo(x, y)
          } else {
            tempCtx.lineTo(x, y)
          }
        })
        tempCtx.stroke()
      })

      const imageData = tempCanvas.toDataURL("image/png")
      const worker = await getTesseractWorker()
      const { data } = await worker.recognize(imageData)

      if (data.text && data.text.trim() && data.confidence > 60) {
        // Créer un texte converti
        const convertedText: ConvertedText = {
          id: Date.now().toString(),
          originalStrokeIds: strokeIds,
          text: data.text.trim(),
          position: { x: minX, y: minY + height / 2 },
          fontSize: Math.max(12, Math.min(24, height / 3)),
          color: relevantStrokes[0]?.tool.color || "#000000",
        }

        setConvertedTexts((prev) => [...prev, convertedText])

        // Optionnellement masquer les traits originaux
        // setStrokes(prev => prev.filter(stroke => !strokeIds.includes(stroke.id)))
      }
    } catch (error) {
      console.error("[v0] Auto OCR error:", error)
    }
  }

  const undo = () => {
    if (undoStack.length === 0) return

    const previousState = undoStack[undoStack.length - 1]
    setRedoStack((prev) => [...prev, strokes])
    setStrokes(previousState)
    setUndoStack((prev) => prev.slice(0, -1))
  }

  const redo = () => {
    if (redoStack.length === 0) return

    const nextState = redoStack[redoStack.length - 1]
    setUndoStack((prev) => [...prev, strokes])
    setStrokes(nextState)
    setRedoStack((prev) => prev.slice(0, -1))
  }

  const clearCanvas = () => {
    setUndoStack((prev) => [...prev, strokes])
    setStrokes([])
    setConvertedTexts([])
    setRedoStack([])
    setOcrResults([])
    setPendingStrokes([])
  }

  const calibrateStylus = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const newOffset = { x: 0, y: 0 }
    setCalibrationOffset(newOffset)
    localStorage.setItem("stylus-calibration", JSON.stringify(newOffset))
  }

  const performOCR = async () => {
    if (strokes.length === 0) return

    setIsProcessingOCR(true)
    setOcrResults([])

    try {
      const canvas = canvasRef.current
      if (!canvas) return

      const tempCanvas = document.createElement("canvas")
      const tempCtx = tempCanvas.getContext("2d")
      if (!tempCtx) return

      // Réduction de la taille pour optimiser la vitesse
      const scale = Math.min(1, 800 / Math.max(canvas.width, canvas.height))
      tempCanvas.width = canvas.width * scale
      tempCanvas.height = canvas.height * scale

      tempCtx.fillStyle = "white"
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
      tempCtx.scale(scale, scale)
      tempCtx.drawImage(canvas, 0, 0)

      // Amélioration du contraste
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        const enhanced = avg < 128 ? 0 : 255
        data[i] = data[i + 1] = data[i + 2] = enhanced
      }
      tempCtx.putImageData(imageData, 0, 0)

      const optimizedImageData = tempCanvas.toDataURL("image/png")
      const results: OCRResult[] = []

      try {
        const worker = await getTesseractWorker()
        const { data } = await worker.recognize(optimizedImageData)

        if (data.words && data.words.length > 0) {
          data.words.forEach((word) => {
            if (word.text.trim() && word.confidence > 40) {
              results.push({
                text: word.text,
                confidence: word.confidence / 100,
                boundingBox: {
                  x: word.bbox.x0 / scale,
                  y: word.bbox.y0 / scale,
                  width: (word.bbox.x1 - word.bbox.x0) / scale,
                  height: (word.bbox.y1 - word.bbox.y0) / scale,
                },
                engine: "tesseract",
              })
            }
          })
        }
      } catch (error) {
        console.error("[v0] Tesseract OCR error:", error)
      }

      const uniqueResults = results
        .filter(
          (result, index, self) => index === self.findIndex((r) => r.text.toLowerCase() === result.text.toLowerCase()),
        )
        .sort((a, b) => b.confidence - a.confidence)

      setOcrResults(uniqueResults)
      if (uniqueResults.length > 0) {
        setShowOCR(true)
      }
    } catch (error) {
      console.error("[v0] OCR processing error:", error)
    } finally {
      setIsProcessingOCR(false)
    }
  }

  const exportCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = `note-${selectedNote || "untitled"}-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const saveDrawing = async () => {
    if (!selectedNote || !selectedNote.endsWith('.draw')) {
      console.log('Aucun fichier de dessin sélectionné')
      return
    }

    try {
      const drawingData = {
        strokes: strokes,
        convertedTexts: convertedTexts,
        timestamp: new Date().toISOString()
      }

      if (window.electronAPI?.drawSave) {
        const result = await window.electronAPI.drawSave(selectedNote, drawingData)
        if (result.success) {
          console.log('Dessin sauvegardé:', selectedNote)
        } else {
          console.error('Erreur lors de la sauvegarde:', result.error)
        }
      } else {
        console.log('API de sauvegarde non disponible')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du dessin:', error)
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={currentTool.type === "pen" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool((prev) => ({ ...prev, type: "pen" }))}
              >
                <Pen className="h-4 w-4" />
              </Button>
              <Button
                variant={currentTool.type === "eraser" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool((prev) => ({ ...prev, type: "eraser" }))}
              >
                <Eraser className="h-4 w-4" />
              </Button>
              <Button
                variant={currentTool.type === "rectangle" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool((prev) => ({ ...prev, type: "rectangle" }))}
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant={currentTool.type === "circle" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool((prev) => ({ ...prev, type: "circle" }))}
              >
                <Circle className="h-4 w-4" />
              </Button>
              <Button
                variant={currentTool.type === "text" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool((prev) => ({ ...prev, type: "text" }))}
              >
                <Type className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-12 h-8 p-0 bg-transparent">
                  <div className="w-6 h-6 rounded border" style={{ backgroundColor: currentTool.color }} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <div className="grid grid-cols-5 gap-1 p-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => setCurrentTool((prev) => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Taille:</span>
              <div className="w-24">
                <Slider
                  value={[currentTool.size]}
                  onValueChange={([size]) => setCurrentTool((prev) => ({ ...prev, size }))}
                  min={1}
                  max={20}
                  step={1}
                />
              </div>
              <span className="text-sm text-foreground w-6">{currentTool.size}</span>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-slate-600">Auto-conversion:</span>
                <Switch checked={autoConvert} onCheckedChange={setAutoConvert} />
              </div>

              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-600" />
                <span className="text-sm text-slate-600">Lissage:</span>
                <Switch checked={strokeSmoothing} onCheckedChange={setStrokeSmoothing} />
              </div>
            </div>

            {isStylusActive && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-foreground">Stylet</span>
                  <span className="text-xs text-slate-600">Pression: {Math.round(currentPressure * 100)}%</span>
                  <Button variant="ghost" size="sm" onClick={calibrateStylus}>
                    Calibrer
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={undo} disabled={undoStack.length === 0}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={redoStack.length === 0}>
              <Redo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={clearCanvas}>
              <Trash2 className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button variant="outline" size="sm" onClick={performOCR} disabled={isProcessingOCR || strokes.length === 0}>
              {isProcessingOCR ? "Analyse..." : "Analyser"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowOCR(!showOCR)} disabled={ocrResults.length === 0}>
              {showOCR ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button variant="outline" size="sm" onClick={exportCanvas}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="default" size="sm" onClick={saveDrawing}>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 relative" ref={containerRef}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair bg-white border-r border-border"
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            style={{ touchAction: "none" }}
          />

          {showOCR && ocrResults.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {ocrResults.map((result, index) => (
                <div
                  key={index}
                  className={`absolute border-2 rounded border-blue-500 bg-blue-500/10`}
                  style={{
                    left: result.boundingBox.x,
                    top: result.boundingBox.y,
                    width: result.boundingBox.width,
                    height: result.boundingBox.height,
                  }}
                >
                  <div className="absolute -top-6 left-0 text-xs px-1 rounded bg-blue-500 text-white">
                    {result.engine} {Math.round(result.confidence * 100)}%
                  </div>
                </div>
              ))}
            </div>
          )}

          {convertedTexts.map((convertedText) => (
            <div
              key={convertedText.id}
              className="absolute pointer-events-none bg-yellow-100/80 border border-yellow-300 rounded px-1"
              style={{
                left: convertedText.position.x,
                top: convertedText.position.y - convertedText.fontSize,
                fontSize: convertedText.fontSize,
                color: convertedText.color,
              }}
            >
              {convertedText.text}
            </div>
          ))}
        </div>

        {showOCR && ocrResults.length > 0 && (
          <div className="w-80 bg-card border-l border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-card-foreground">Texte reconnu</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowOCR(false)}>
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {ocrResults.map((result, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-2">
                      <Badge variant="default" className="text-xs">
                        {result.engine}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(result.confidence * 100)}% confiance
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-card-foreground">{result.text}</p>
                </Card>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  const allText = ocrResults.map((r) => r.text).join(" ")
                  navigator.clipboard.writeText(allText)
                }}
              >
                Copier tout le texte
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="h-8 bg-muted border-t border-border flex items-center justify-between px-4 text-xs text-slate-200">
        <div className="flex items-center gap-4">
          <span>Outil: {currentTool.type}</span>
          <span>Couleur: {currentTool.color}</span>
          <span>Taille: {currentTool.size}px</span>
          <span>Auto-conversion: {autoConvert ? "Activée" : "Désactivée"}</span>
          <span>Lissage: {strokeSmoothing ? "Activé" : "Désactivé"}</span>
          {isStylusActive && (
            <span className="text-green-300 font-medium">
              Stylet actif - Pression: {Math.round(currentPressure * 100)}% - Calibré:{" "}
              {calibrationOffset.x !== 0 || calibrationOffset.y !== 0 ? "Oui" : "Non"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>{strokes.length} traits</span>
          <span>{convertedTexts.length} textes convertis</span>
          <span>{ocrResults.length} textes reconnus</span>
          {selectedNote && <span>Note: {selectedNote}</span>}
        </div>
      </div>
    </div>
  )
}
