"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import path from "path"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrianglePatternGenerator } from "./triangle-pattern-generator"
import { GPUFluidBackground } from "./gpu-fluid-background"

interface BackgroundConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSettings: {
    backgroundImage: string | null
    fixedImage: string | null
    animatedIndex: number
    backgroundParams?: any
  }
  onSave: (settings: { backgroundImage?: string | null; fixedImage?: string | null; animatedIndex?: number; backgroundParams?: any }) => void
}

export function BackgroundConfigModal({ open, onOpenChange, currentSettings, onSave }: BackgroundConfigModalProps) {
  const [selectedAnimated, setSelectedAnimated] = useState(currentSettings.animatedIndex)
  const [selectedFixed, setSelectedFixed] = useState(currentSettings.fixedImage)
  const [uploadedImage, setUploadedImage] = useState<string | null>(
    currentSettings.backgroundImage === "__gpu_fluid_background__" ? null : currentSettings.backgroundImage
  )
  // On ne garde que le générateur triangle
  const [selectedGenerator] = useState<string>("triangle")
  const [selectedFluidEffect, setSelectedFluidEffect] = useState<string>(
    currentSettings.backgroundImage === "__gpu_fluid_background__" ? "gpu-fluid" : ""
  )

  // GPU fluid preview controls
  const [fluidSpeed, setFluidSpeed] = useState<number>(1.0)
  const [fluidScale, setFluidScale] = useState<number>(1.0)
  const [fluidOpacity, setFluidOpacity] = useState<number>(0.8)
  const [fluidTint, setFluidTint] = useState<string>('#2463ff')

  // Initialize fluid params from currentSettings if provided
  React.useEffect(() => {
    try {
      if (currentSettings && currentSettings.backgroundParams) {
        const p = currentSettings.backgroundParams
        if (typeof p.speed === 'number') setFluidSpeed(p.speed)
        if (typeof p.scale === 'number') setFluidScale(p.scale)
        if (typeof p.opacity === 'number') setFluidOpacity(p.opacity)
        if (typeof p.tint === 'string') setFluidTint(p.tint)
      }
      if (currentSettings && currentSettings.backgroundImage === "__gpu_fluid_background__") {
        setSelectedFluidEffect('gpu-fluid')
      }
    } catch (e) {
      // ignore
    }
  }, [currentSettings])

  const handleSave = () => {
    if (selectedFluidEffect === "gpu-fluid") {
      // Set special value for GPU fluid background
      onSave({ backgroundImage: "__gpu_fluid_background__", fixedImage: null, animatedIndex: 0, backgroundParams: { speed: fluidSpeed, scale: fluidScale, tint: fluidTint, opacity: fluidOpacity } })
    } else if (uploadedImage) {
      onSave({ backgroundImage: uploadedImage, fixedImage: null, animatedIndex: 0 })
    } else if (selectedFixed) {
      onSave({ backgroundImage: null, fixedImage: selectedFixed, animatedIndex: 0 })
    } else {
      onSave({ backgroundImage: null, fixedImage: null, animatedIndex: selectedAnimated })
    }
    onOpenChange(false)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setUploadedImage(result)
        setSelectedFixed(null)
        setSelectedAnimated(0)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handler pour importer depuis Lively Wallpaper
  const livelyPath = "C:/Users/evolu/AppData/Local/Packages/12030rocksdanister.LivelyWallpaper_97hta09mmv6hy/LocalCache/Local/Lively Wallpaper/Library/wallpapers/0wj1biqk.f41"
  const handleLivelyImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setUploadedImage(result)
        setSelectedFixed(null)
        setSelectedAnimated(0)
      }
      reader.readAsDataURL(file)
    }
  }

  const fixedBackgrounds = [
    { id: 'fixed-bg1', src: '/backgrounds/fixed-bg1.svg', name: 'Orange Gradient' },
    { id: 'fixed-bg2', src: '/backgrounds/fixed-bg2.svg', name: 'Purple Blue' },
    { id: 'fixed-bg3', src: '/backgrounds/fixed-bg3.svg', name: 'Pink Red' },
    { id: 'fixed-bg4', src: '/backgrounds/fixed-bg4.svg', name: 'Blue Cyan' },
    { id: 'fixed-bg5', src: '/backgrounds/fixed-bg5.svg', name: 'Green Cyan' },
  ]

  const animatedBackgrounds = [
    { id: 0, src: '/backgrounds/bg1.svg', name: 'Animated 1' },
    { id: 1, src: '/backgrounds/bg2.svg', name: 'Animated 2' },
    { id: 2, src: '/backgrounds/bg3.svg', name: 'Animated 3' },
    { id: 3, src: '/backgrounds/bg4.svg', name: 'Animated 4' },
    { id: 4, src: '/backgrounds/bg5.svg', name: 'Animated 5' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Configurer l'arrière-plan</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="animated" className="w-full">
          <TabsList className="flex w-full">
            <TabsTrigger value="animated">Animé</TabsTrigger>
            <TabsTrigger value="fixed">Fixe</TabsTrigger>
            <TabsTrigger value="custom">Personnalisé</TabsTrigger>
            <TabsTrigger value="advanced">Avancé</TabsTrigger>
          </TabsList>

          <TabsContent value="animated" className="space-y-4">
            <div className="grid grid-cols-5 gap-4">
              {animatedBackgrounds.map((bg) => (
                <Card
                  key={bg.id}
                  className={`cursor-pointer ${selectedAnimated === bg.id && !uploadedImage && !selectedFixed ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => {
                    setSelectedAnimated(bg.id)
                    setSelectedFixed(null)
                    setUploadedImage(null)
                  }}
                >
                  <CardContent className="p-2">
                    <img src={bg.src} alt={bg.name} className="w-full h-20 object-cover rounded" />
                    <p className="text-xs text-center mt-1">{bg.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="fixed" className="space-y-4">
            <div className="grid grid-cols-5 gap-4">
              {fixedBackgrounds.map((bg) => (
                <Card
                  key={bg.id}
                  className={`cursor-pointer ${selectedFixed === bg.src && !uploadedImage ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => {
                    setSelectedFixed(bg.src)
                    setSelectedAnimated(0)
                    setUploadedImage(null)
                  }}
                >
                  <CardContent className="p-2">
                    <img src={bg.src} alt={bg.name} className="w-full h-20 object-cover rounded" />
                    <p className="text-xs text-center mt-1">{bg.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Télécharger une image personnalisée</CardTitle>
                <CardDescription>Sélectionnez une image depuis votre ordinateur</CardDescription>
              </CardHeader>
              <CardContent>
                <Input type="file" accept="image/*" onChange={handleFileUpload} />
                {uploadedImage && (
                  <div className="mt-4">
                    <Label>Aperçu:</Label>
                    <img src={uploadedImage} alt="Uploaded" className="w-full h-32 object-cover rounded mt-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="mb-2">
              <label htmlFor="fluid-effect-select" className="block text-sm font-medium mb-1">Effet avancé :</label>
              <select
                id="fluid-effect-select"
                className="border rounded px-2 py-1"
                value={selectedFluidEffect}
                onChange={e => setSelectedFluidEffect(e.target.value)}
              >
                <option value="">Motif triangulaire</option>
                <option value="gpu-fluid">GPU Fluid (Arrière-plan réel)</option>
                <option value="fluids-2d-iframe">Fluids-2D (Iframe)</option>
              </select>
            </div>
            {selectedFluidEffect === "" && (
              <TrianglePatternGenerator onApplyPattern={(pattern) => {
                setUploadedImage(pattern)
                setSelectedFixed(null)
                setSelectedAnimated(0)
              }} />
            )}
            {selectedFluidEffect === "gpu-fluid" && (
              <div>
                <div className="mb-2 text-sm text-muted-foreground">
                  Aperçu du GPU Fluid - Sera appliqué comme arrière-plan réel
                </div>
                <div className="border rounded overflow-hidden h-56 relative bg-transparent">
                  {/* GPU canvas as absolute background within the preview */}
                  <GPUFluidBackground
                    className="absolute inset-0 w-full h-full"
                    speed={fluidSpeed}
                    scale={fluidScale}
                    tint={fluidTint}
                    opacity={fluidOpacity}
                  />

                  {/* Simple landing-page mock overlay to preview how content looks on top of the fluid */}
                  <div className="relative z-10 w-full h-full flex flex-col justify-center items-center text-center p-4">
                    <img src="/icon-512.png" alt="Logo" className="w-10 h-10 mb-2 drop-shadow" />
                    <div className="text-white text-lg font-bold">FUSION</div>
                    <div className="text-white/80 text-xs mt-1">Votre espace de travail créatif</div>
                    <div className="mt-3 flex gap-2">
                      <button className="px-3 py-1 rounded bg-white/10 text-white text-xs">Explorer mes fichiers</button>
                      <button className="px-3 py-1 rounded bg-white/6 text-white/90 text-xs">Créer une note</button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <label className="w-28">Vitesse</label>
                    <input type="range" min="0.1" max="4" step="0.1" value={fluidSpeed} onChange={e => setFluidSpeed(Number(e.target.value))} className="flex-1" />
                    <span className="w-12 text-right text-xs">{fluidSpeed.toFixed(1)}x</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-28">Échelle</label>
                    <input type="range" min="0.5" max="3" step="0.1" value={fluidScale} onChange={e => setFluidScale(Number(e.target.value))} className="flex-1" />
                    <span className="w-12 text-right text-xs">{fluidScale.toFixed(1)}x</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-28">Opacité</label>
                    <input type="range" min="0" max="1" step="0.05" value={fluidOpacity} onChange={e => setFluidOpacity(Number(e.target.value))} className="flex-1" />
                    <span className="w-12 text-right text-xs">{Math.round(fluidOpacity * 100)}%</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-28">Couleur</label>
                    <input type="color" value={fluidTint} onChange={e => setFluidTint(e.target.value)} />
                    <span className="text-xs ml-2">{fluidTint}</span>
                  </div>
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  <a href="https://github.com/haxiomic/GPU-Fluid-Experiments" target="_blank" rel="noopener noreferrer" className="underline">Basé sur GPU-Fluid-Experiments</a>
                </div>
              </div>
            )}
            {selectedFluidEffect === "fluids-2d-iframe" && (
              <div>
                <iframe
                  src="http://www.csc.kth.se/~mathar/fluids-2d/"
                  title="Fluids-2D"
                  width="100%"
                  height="400"
                  style={{ border: '1px solid #ccc', borderRadius: 8 }}
                  allowFullScreen
                />
                <div className="mt-2 text-xs text-muted-foreground">
                  <a href="https://github.com/mharrys/fluids-2d" target="_blank" rel="noopener noreferrer" className="underline">Source sur GitHub</a>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave}>Selectionner</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}