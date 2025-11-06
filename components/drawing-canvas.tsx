"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { OnlyOfficeLikeToolbar } from "@/components/ui/onlyoffice-like-toolbar"
import { OnlyOfficeFileMenu } from "@/components/ui/onlyoffice-file-menu"
import { PageLayoutToolbar } from "@/components/page-layout-toolbar"
import { HomeToolbar } from "@/components/home-toolbar"
import { ViewToolbar } from "@/components/view-toolbar"
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

// Composant toolbar pour les outils de dessin
function WhiteboardToolbar({ currentTool, setCurrentTool, clearCanvas, undo, redo, undoStack, redoStack, autoConvert, setAutoConvert, strokeSmoothing, setStrokeSmoothing, performOCR, isProcessingOCR, saveDrawing }: any) {
  return (
    <div className="border-b border-border bg-card p-4">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Drawing Tools */}
        <div className="flex items-center gap-2">
          <Button
            variant={currentTool.type === "pen" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentTool((prev: any) => ({ ...prev, type: "pen" }))}
            className="flex items-center gap-2"
          >
            <Pen className="h-4 w-4" />
            <span className="hidden sm:inline">Pen</span>
          </Button>
          <Button
            variant={currentTool.type === "eraser" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentTool((prev: any) => ({ ...prev, type: "eraser" }))}
            className="flex items-center gap-2"
          >
            <Eraser className="h-4 w-4" />
            <span className="hidden sm:inline">Eraser</span>
          </Button>
          <Button
            variant={currentTool.type === "rectangle" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentTool((prev: any) => ({ ...prev, type: "rectangle" }))}
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            <span className="hidden sm:inline">Rectangle</span>
          </Button>
          <Button
            variant={currentTool.type === "circle" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentTool((prev: any) => ({ ...prev, type: "circle" }))}
            className="flex items-center gap-2"
          >
            <Circle className="h-4 w-4" />
            <span className="hidden sm:inline">Circle</span>
          </Button>
          <Button
            variant={currentTool.type === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentTool((prev: any) => ({ ...prev, type: "text" }))}
            className="flex items-center gap-2"
          >
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline">Text</span>
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Couleur:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-12 h-8 p-0">
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
                    onClick={() => setCurrentTool((prev: any) => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Brush Size */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Taille:</span>
          <div className="w-24">
            <Slider
              value={[currentTool.size]}
              onValueChange={([size]) => setCurrentTool((prev: any) => ({ ...prev, size }))}
              min={1}
              max={20}
              step={1}
            />
          </div>
          <span className="text-sm w-8">{currentTool.size}</span>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Additional Tools */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearCanvas} className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Effacer</span>
          </Button>
          <Button variant="outline" size="sm" onClick={undo} disabled={undoStack.length === 0} className="flex items-center gap-2">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={redoStack.length === 0} className="flex items-center gap-2">
            <Redo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={saveDrawing} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Sauvegarder</span>
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Options */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Auto-conversion:</span>
            <Switch checked={autoConvert} onCheckedChange={setAutoConvert} />
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-green-600" />
            <span className="text-sm">Lissage:</span>
            <Switch checked={strokeSmoothing} onCheckedChange={setStrokeSmoothing} />
          </div>
        </div>
      </div>
    </div>
  )
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
  const backupCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [activeTab, setActiveTab] = useState("Accueil")
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
  
  // Shape drawing states
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null)
  const [currentShape, setCurrentShape] = useState<DrawingStroke | null>(null)
  
  // Page layout states
  const [pageOrientation, setPageOrientation] = useState<"portrait" | "landscape">("landscape")
  const [showGrid, setShowGrid] = useState(false)
  const [showRuler, setShowRuler] = useState(false)
  const [canvasZoom, setCanvasZoom] = useState(100)
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState("#FFFFFF")
  
  // View states
  const [fullscreen, setFullscreen] = useState(false)
  const [viewTheme, setViewTheme] = useState<"light" | "dark" | "auto">("auto")

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
    // Use a different approach to store the backup canvas
    if (backupCanvasRef.current) {
      backupCanvasRef.current.remove()
    }
    backupCanvasRef.current = backupCanvas

    return () => {
      if (tesseractWorker) {
        tesseractWorker.terminate()
        tesseractWorker = null
      }
    }
  }, [])

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    console.log("[v0] Redrawing canvas with", strokes.length, "strokes")

    strokes.forEach((stroke) => {
      if (stroke.points.length < 1) return

      ctx.strokeStyle = stroke.tool.color
      ctx.fillStyle = stroke.tool.color
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.lineWidth = stroke.tool.size

      if (stroke.tool.type === "eraser") {
        ctx.globalCompositeOperation = "destination-out"
      } else {
        ctx.globalCompositeOperation = "source-over"
      }

      // Dessiner les rectangles
      if (stroke.tool.type === "rectangle" && stroke.points.length >= 2) {
        const start = stroke.points[0]
        const end = stroke.points[stroke.points.length - 1]
        const width = end.x - start.x
        const height = end.y - start.y
        ctx.strokeRect(start.x, start.y, width, height)
        return
      }

      // Dessiner les cercles/ellipses
      if (stroke.tool.type === "circle" && stroke.points.length >= 2) {
        const start = stroke.points[0]
        const end = stroke.points[stroke.points.length - 1]
        const centerX = (start.x + end.x) / 2
        const centerY = (start.y + end.y) / 2
        const radiusX = Math.abs(end.x - start.x) / 2
        const radiusY = Math.abs(end.y - start.y) / 2
        
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
        ctx.stroke()
        return
      }

      // Dessiner pen et eraser
      const pointsToUse = strokeSmoothing && stroke.smoothedPoints ? stroke.smoothedPoints : stroke.points

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

    // Dessiner les textes convertis
    convertedTexts.forEach((convertedText) => {
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = convertedText.color
      ctx.font = `${convertedText.fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      ctx.fillText(convertedText.text, convertedText.position.x, convertedText.position.y)
    })

    ctx.globalCompositeOperation = "source-over"
  }, [strokes, convertedTexts, strokeSmoothing])

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
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Définir les dimensions du canvas basées sur l'orientation
    const width = pageOrientation === "landscape" ? 1122 : 794
    const height = pageOrientation === "landscape" ? 794 : 1122

    // Sauvegarder le contenu existant
    const backupCanvas = backupCanvasRef.current
    if (backupCanvas && canvas.width > 0 && canvas.height > 0) {
      backupCanvas.width = canvas.width
      backupCanvas.height = canvas.height
      const backupCtx = backupCanvas.getContext("2d")
      if (backupCtx) {
        backupCtx.drawImage(canvas, 0, 0)
      }
    }

    // Configurer le canvas avec des dimensions fixes (pas de scaling DPR)
    canvas.width = width
    canvas.height = height

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    console.log("[v0] Canvas configured:", {
      width: canvas.width,
      height: canvas.height,
      orientation: pageOrientation
    })

    // Restaurer le contenu ou redessiner
    if (backupCanvas && backupCanvas.width > 0 && backupCanvas.height > 0) {
      ctx.drawImage(backupCanvas, 0, 0, width, height)
    } else {
      redrawCanvas()
    }
  }, [pageOrientation, redrawCanvas])

  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  // Fullscreen effect
  useEffect(() => {
    const handleFullscreen = async () => {
      try {
        if (fullscreen) {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen()
          }
        } else {
          if (document.fullscreenElement && document.exitFullscreen) {
            await document.exitFullscreen()
          }
        }
      } catch (error) {
        console.error('Erreur lors du changement de mode plein écran:', error)
      }
    }

    handleFullscreen()

    // Listen for fullscreen changes from escape key
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && fullscreen) {
        setFullscreen(false)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [fullscreen])

  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 }

    const rect = canvas.getBoundingClientRect()
    
    // Position relative au canvas visible (après zoom et transformations)
    const x = (e.clientX - rect.left)
    const y = (e.clientY - rect.top)
    
    // Pas besoin de scaling car on dessine directement sur le canvas aux bonnes coordonnées
    // Le canvas lui-même gère son propre système de coordonnées

    let pressure = 0.5
    if (e.pointerType === "pen" && e.pressure > 0) {
      pressure = Math.max(0.1, Math.min(1.0, e.pressure))
      setIsStylusActive(true)
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

    const pos = getPointerPos(e)
    setCurrentPressure(pos.pressure)

    console.log("[v0] Starting draw:", {
      pointerType: e.pointerType,
      pressure: e.pressure,
      pos,
      tool: currentTool.type,
    })

    // Pour les formes (rectangle, circle), on stocke juste le point de départ
    if (currentTool.type === "rectangle" || currentTool.type === "circle") {
      setShapeStart({ x: pos.x, y: pos.y })
      setIsDrawing(true)
      return
    }

    // Pour pen et eraser, on commence un nouveau trait
    setIsDrawing(true)

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

    // Dessiner les formes en preview
    if ((currentTool.type === "rectangle" || currentTool.type === "circle") && shapeStart) {
      const tempShape: DrawingStroke = {
        id: "temp-shape",
        tool: { ...currentTool },
        points: [
          { x: shapeStart.x, y: shapeStart.y, pressure: pos.pressure },
          { x: pos.x, y: pos.y, pressure: pos.pressure }
        ],
        timestamp: new Date(),
      }
      setCurrentShape(tempShape)
      
      // Redessiner immédiatement pour la preview
      requestAnimationFrame(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        
        // Redessiner tout
        redrawCanvas()
        
        // Dessiner la preview de la forme
        ctx.strokeStyle = currentTool.color
        ctx.lineWidth = currentTool.size
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        
        if (currentTool.type === "rectangle") {
          const width = pos.x - shapeStart.x
          const height = pos.y - shapeStart.y
          ctx.strokeRect(shapeStart.x, shapeStart.y, width, height)
        } else if (currentTool.type === "circle") {
          const centerX = (shapeStart.x + pos.x) / 2
          const centerY = (shapeStart.y + pos.y) / 2
          const radiusX = Math.abs(pos.x - shapeStart.x) / 2
          const radiusY = Math.abs(pos.y - shapeStart.y) / 2
          
          ctx.beginPath()
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
          ctx.stroke()
        }
      })
      return
    }

    // Pour pen et eraser, ajouter des points
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

    // Finaliser les formes
    if ((currentTool.type === "rectangle" || currentTool.type === "circle") && shapeStart) {
      const pos = getPointerPos(e)
      
      const finalShape: DrawingStroke = {
        id: Date.now().toString(),
        tool: { ...currentTool },
        points: [
          { x: shapeStart.x, y: shapeStart.y, pressure: 0.5 },
          { x: pos.x, y: pos.y, pressure: 0.5 }
        ],
        timestamp: new Date(),
      }
      
      setStrokes((prev) => [...prev, finalShape])
      setUndoStack((prev) => [...prev, strokes])
      setRedoStack([])
      setShapeStart(null)
      setCurrentShape(null)
    }

    setIsDrawing(false)
    setIsStylusActive(false)
    setCurrentPressure(0.5)

    if (strokeSmoothing && currentTool.type === "pen") {
      setStrokes((prev) => {
        const newStrokes = [...prev]
        const lastStroke = newStrokes[newStrokes.length - 1]
        if (lastStroke && lastStroke.points.length > 2 && lastStroke.tool.type === "pen") {
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
          data.words.forEach((word: any) => {
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
    <div className="h-full flex flex-col bg-background relative">
      {/* OnlyOffice-like Toolbar */}
      <OnlyOfficeLikeToolbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { label: "Fichier" },
          { label: "Accueil" },
          { label: "Dessiner" },
          { label: "Mise en Page" },
          { label: "Affichage" },
        ]}
      />

      {/* Mega Menu for "Fichier" */}
      {activeTab === "Fichier" && (
        <OnlyOfficeFileMenu
          type="draw"
          onClose={() => setActiveTab("Accueil")}
          onExport={exportCanvas}
        />
      )}

      {/* Home Toolbar for "Accueil" tab */}
      {activeTab === "Accueil" && (
        <HomeToolbar
          undo={undo}
          redo={redo}
          undoStack={undoStack}
          redoStack={redoStack}
          clearCanvas={clearCanvas}
          saveDrawing={saveDrawing}
          exportCanvas={exportCanvas}
          zoom={canvasZoom}
          onZoomChange={setCanvasZoom}
        />
      )}

      {/* Drawing Tools for "Dessiner" tab */}
      {activeTab === "Dessiner" && (
        <WhiteboardToolbar
          currentTool={currentTool}
          setCurrentTool={setCurrentTool}
          clearCanvas={clearCanvas}
          undo={undo}
          redo={redo}
          undoStack={undoStack}
          redoStack={redoStack}
          autoConvert={autoConvert}
          setAutoConvert={setAutoConvert}
          strokeSmoothing={strokeSmoothing}
          setStrokeSmoothing={setStrokeSmoothing}
          performOCR={performOCR}
          isProcessingOCR={isProcessingOCR}
          saveDrawing={saveDrawing}
        />
      )}

      {/* Page Layout Toolbar for "Mise en Page" tab */}
      {activeTab === "Mise en Page" && (
        <PageLayoutToolbar
          orientation={pageOrientation}
          onOrientationChange={setPageOrientation}
          showGrid={showGrid}
          onShowGridChange={setShowGrid}
          showRuler={showRuler}
          onShowRulerChange={setShowRuler}
          zoom={canvasZoom}
          onZoomChange={setCanvasZoom}
          backgroundColor={canvasBackgroundColor}
          onBackgroundColorChange={setCanvasBackgroundColor}
        />
      )}

      {/* View Toolbar for "Affichage" tab */}
      {activeTab === "Affichage" && (
        <ViewToolbar
          zoom={canvasZoom}
          onZoomChange={setCanvasZoom}
          showGrid={showGrid}
          onShowGridChange={setShowGrid}
          showRuler={showRuler}
          onShowRulerChange={setShowRuler}
          fullscreen={fullscreen}
          onFullscreenToggle={() => setFullscreen(!fullscreen)}
          theme={viewTheme}
          onThemeChange={setViewTheme}
          showOCR={showOCR}
          onShowOCRToggle={() => setShowOCR(!showOCR)}
          canvasBackgroundColor={canvasBackgroundColor}
          onBackgroundColorChange={setCanvasBackgroundColor}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative overflow-auto" ref={containerRef} style={{ backgroundColor: canvasBackgroundColor }}>
          {/* Grid overlay */}
          {showGrid && (
            <div 
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
            />
          )}

          {/* Ruler - horizontal */}
          {showRuler && (
            <>
              <div className="absolute top-0 left-8 right-0 h-8 bg-gray-100 border-b border-gray-300 z-20 flex">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div key={i} className="relative" style={{ width: '10px' }}>
                    <div className={`absolute bottom-0 left-0 w-px bg-gray-400 ${i % 10 === 0 ? 'h-4' : i % 5 === 0 ? 'h-3' : 'h-2'}`} />
                    {i % 10 === 0 && <span className="absolute bottom-4 left-0 text-[8px] text-gray-600">{i}</span>}
                  </div>
                ))}
              </div>
              
              {/* Ruler - vertical */}
              <div className="absolute left-0 top-8 bottom-0 w-8 bg-gray-100 border-r border-gray-300 z-20 flex flex-col">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div key={i} className="relative" style={{ height: '10px' }}>
                    <div className={`absolute right-0 top-0 h-px bg-gray-400 ${i % 10 === 0 ? 'w-4' : i % 5 === 0 ? 'w-3' : 'w-2'}`} />
                    {i % 10 === 0 && <span className="absolute right-4 top-0 text-[8px] text-gray-600 -rotate-90 origin-top-right">{i}</span>}
                  </div>
                ))}
              </div>
              
              {/* Corner box */}
              <div className="absolute top-0 left-0 w-8 h-8 bg-gray-200 border-r border-b border-gray-300 z-20" />
            </>
          )}

          <div 
            className="relative"
            style={{ 
              transform: `scale(${canvasZoom / 100})`,
              transformOrigin: 'top left',
              width: `${100 / (canvasZoom / 100)}%`,
              height: `${100 / (canvasZoom / 100)}%`,
              marginLeft: showRuler ? '32px' : '0',
              marginTop: showRuler ? '32px' : '0'
            }}
          >
            <canvas
              ref={canvasRef}
              className="cursor-crosshair border border-border"
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              style={{ 
                touchAction: "none",
                backgroundColor: canvasBackgroundColor,
                width: pageOrientation === "landscape" ? "1122px" : "794px",
                height: pageOrientation === "landscape" ? "794px" : "1122px"
              }}
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

export default DrawingCanvas
