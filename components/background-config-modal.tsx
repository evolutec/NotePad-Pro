"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Folder, Pen, Monitor, Palette, Image, X, ChevronDown, ChevronRight, Home } from "lucide-react"
import { TrianglePatternGenerator } from "./triangle-pattern-generator"
import { GPUFluidBackground } from "./gpu-fluid-background"

interface BackgroundItem {
  id: string
  name: string
  src?: string
  color?: string
}

interface BackgroundConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSettings: {
    backgroundImage?: string | null
    fixedImage?: string | null
    animatedIndex?: number
    backgroundParams?: any
  }
  onSave: (settings: { backgroundImage?: string | null; fixedImage?: string | null; animatedIndex?: number; backgroundParams?: any }) => void
};

export function BackgroundConfigModal(props: BackgroundConfigModalProps) {
  const { open, onOpenChange, currentSettings, onSave } = props
  const [selectedAnimated, setSelectedAnimated] = useState(currentSettings.animatedIndex)
  const [selectedFixed, setSelectedFixed] = useState(currentSettings.fixedImage)
  const [uploadedImage, setUploadedImage] = useState<string | null>(
    currentSettings.backgroundImage === "__gpu_fluid_background__" ? null : (currentSettings.backgroundImage ?? null)
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

  // Fixed background adjustment controls
  const [fixedBrightness, setFixedBrightness] = useState<number>(100)
  const [fixedContrast, setFixedContrast] = useState<number>(100)
  const [fixedSaturation, setFixedSaturation] = useState<number>(100)
  const [fixedHue, setFixedHue] = useState<number>(0)
  const [fixedBlur, setFixedBlur] = useState<number>(0)
  // Gradient controls
  const [gradientEnabled, setGradientEnabled] = useState<boolean>(false)
  const [gradientColor1, setGradientColor1] = useState<string>('#ff6b35')
  const [gradientColor2, setGradientColor2] = useState<string>('#f7931e')
  const [gradientDirection, setGradientDirection] = useState<string>('to right')

  // Initialize fluid params from currentSettings if provided
  React.useEffect(() => {
    try {
      if (currentSettings && currentSettings.backgroundParams) {
        const p = currentSettings.backgroundParams
        if (typeof p.speed === 'number') setFluidSpeed(p.speed)
        if (typeof p.scale === 'number') setFluidScale(p.scale)
        if (typeof p.opacity === 'number') setFluidOpacity(p.opacity)
        if (typeof p.tint === 'string') setFluidTint(p.tint)
        // Fixed params
        if (typeof p.brightness === 'number') setFixedBrightness(p.brightness)
        if (typeof p.contrast === 'number') setFixedContrast(p.contrast)
        if (typeof p.saturation === 'number') setFixedSaturation(p.saturation)
        if (typeof p.hue === 'number') setFixedHue(p.hue)
        if (typeof p.blur === 'number') setFixedBlur(p.blur)
        if (typeof p.gradientEnabled === 'boolean') setGradientEnabled(p.gradientEnabled)
        if (typeof p.gradientColor1 === 'string') setGradientColor1(p.gradientColor1)
        if (typeof p.gradientColor2 === 'string') setGradientColor2(p.gradientColor2)
        if (typeof p.gradientDirection === 'string') setGradientDirection(p.gradientDirection)
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
      const payload = { backgroundImage: "__gpu_fluid_background__", fixedImage: null, animatedIndex: 0, backgroundParams: { speed: fluidSpeed, scale: fluidScale, tint: fluidTint, opacity: fluidOpacity } }
      onSave(payload)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { design: payload } }))
      }
    } else if (uploadedImage) {
      const payload = { backgroundImage: uploadedImage, fixedImage: null, animatedIndex: 0 }
      onSave(payload)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { design: payload } }))
      }
    } else if (selectedFixed) {
      const payload = { backgroundImage: null, fixedImage: selectedFixed, animatedIndex: 0, backgroundParams: { brightness: fixedBrightness, contrast: fixedContrast, saturation: fixedSaturation, hue: fixedHue, blur: fixedBlur, gradientEnabled, gradientColor1, gradientColor2, gradientDirection } }
      onSave(payload)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { design: payload } }))
      }
    } else {
      const payload = { backgroundImage: null, fixedImage: null, animatedIndex: selectedAnimated }
      onSave(payload)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { design: payload } }))
      }
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
        setSelectedFluidEffect('')
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
        setSelectedFluidEffect('')
      }
      reader.readAsDataURL(file)
    }
  }

  const fixedBackgrounds: BackgroundItem[] = [
    { id: 'orange', color: '#ff6b35', name: 'Orange' },
    { id: 'fixed-bg2', src: '/backgrounds/fixed-bg2.svg', name: 'Purple Blue' },
    { id: 'fixed-bg3', src: '/backgrounds/fixed-bg3.svg', name: 'Pink Red' },
    { id: 'fixed-bg4', src: '/backgrounds/fixed-bg4.svg', name: 'Blue Cyan' },
    { id: 'fixed-bg5', src: '/backgrounds/fixed-bg5.svg', name: 'Green Cyan' },
    { id: 'grey', color: '#808080', name: 'Grey' },
    { id: 'black', color: '#000000', name: 'Black' },
    { id: 'white', color: '#ffffff', name: 'White' },
    { id: 'yellow', color: '#ffff00', name: 'Yellow' },
    { id: 'red', color: '#ff0000', name: 'Red' },
  ]

  const animatedBackgrounds = [
    { id: 0, src: '/backgrounds/bg1.svg', name: 'Animated 1' },
    { id: 1, src: '/backgrounds/bg2.svg', name: 'Animated 2' },
    { id: 2, src: '/backgrounds/bg3.svg', name: 'Animated 3' },
    { id: 3, src: '/backgrounds/bg4.svg', name: 'Animated 4' },
    { id: 4, src: '/backgrounds/bg5.svg', name: 'Animated 5' },
    { id: 5, src: '/backgrounds/bg6.svg', name: 'Animated 6' },
    { id: 6, src: '/backgrounds/bg7.svg', name: 'Animated 7' },
    { id: 7, src: '/backgrounds/bg8.svg', name: 'Animated 8' },
    { id: 8, src: '/backgrounds/bg9.svg', name: 'Animated 9' },
    { id: 9, src: '/backgrounds/bg10.svg', name: 'Animated 10' },
    { id: 10, src: '/backgrounds/bg11.svg', name: 'Animated 11' },
    { id: 11, src: '/backgrounds/bg12.svg', name: 'Animated 12' },
    { id: 12, src: '/backgrounds/bg13.svg', name: 'Animated 13' },
    { id: 13, src: '/backgrounds/bg14.svg', name: 'Animated 14' },
    { id: 14, src: '/backgrounds/bg15.svg', name: 'Animated 15' },
    { id: 15, src: '/backgrounds/bg16.svg', name: 'Animated 16' },
    { id: 16, src: '/backgrounds/bg17.svg', name: 'Animated 17' },
    { id: 17, src: '/backgrounds/bg18.svg', name: 'Animated 18' },
    { id: 18, src: '/backgrounds/bg19.svg', name: 'Animated 19' },
    { id: 19, src: '/backgrounds/bg20.svg', name: 'Animated 20' },
  ]

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Only allow opening, prevent closing from outside clicks
      if (newOpen) {
        onOpenChange(true);
      }
      // Ignore close requests (newOpen = false) to prevent outside click closing
    }}>
      <DialogContent className="fixed top-14 left-0 right-0 bottom-0 w-screen h-[calc(100vh-3.5rem)] m-0 p-0 flex flex-col overflow-hidden" showCloseButton={false}>
        <Tabs defaultValue="animated" className="w-full flex flex-col flex-1 min-h-0">
        <DialogHeader className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm items-center gap-0 py-6">
          <div className="relative w-full mb-4">
            <DialogTitle className="text-lg leading-none font-semibold text-center">
              <Image className="h-5 w-5 inline-block mr-2" />
              Configurer l'arrière-plan
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="absolute right-0 top-0 h-8 w-8 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <TabsList className="grid w-full grid-cols-4 py-1">
            <TabsTrigger value="animated" className="flex items-center gap-2 data-[state=active]:underline data-[state=active]:underline-offset-4 data-[state=active]:decoration-2 data-[state=active]:decoration-white hover:underline hover:decoration-white">Animé</TabsTrigger>
            <TabsTrigger value="fixed" className="flex items-center gap-2 data-[state=active]:underline data-[state=active]:underline-offset-4 data-[state=active]:decoration-2 data-[state=active]:decoration-white hover:underline hover:decoration-white">Fixe</TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2 data-[state=active]:underline data-[state=active]:underline-offset-4 data-[state=active]:decoration-2 data-[state=active]:decoration-white hover:underline hover:decoration-white">Personnalisé</TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2 data-[state=active]:underline data-[state=active]:underline-offset-4 data-[state=active]:decoration-2 data-[state=active]:decoration-white hover:underline hover:decoration-white">Avancé</TabsTrigger>
          </TabsList>
        </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-6">

          <TabsContent value="animated" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {animatedBackgrounds.map((bg) => (
                <Card
                  key={bg.id}
                  className={`cursor-pointer ${selectedAnimated === bg.id && !uploadedImage && !selectedFixed ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => {
                    setSelectedAnimated(bg.id)
                    setSelectedFixed(null)
                    setUploadedImage(null)
                    setSelectedFluidEffect('')
                  }}
                >
                  <CardContent className="p-2">
                    <img src={bg.src} alt={bg.name} className="w-full h-12 object-cover rounded" />
                    <p className="text-xs text-center mt-1 truncate">{bg.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="fixed" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {fixedBackgrounds.map((bg) => (
                <Card
                  key={bg.id}
                  className={`cursor-pointer ${selectedFixed === (bg.src || bg.color) && !uploadedImage ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => {
                    setSelectedFixed(bg.src || bg.color)
                    setSelectedAnimated(0)
                    setUploadedImage(null)
                    setSelectedFluidEffect('')
                    // Set hue to 0 for pure preset color
                    setFixedHue(0)
                    // Set gradient colors to preset color
                    if (bg.color) {
                      setGradientColor1(bg.color)
                      setGradientColor2(bg.color)
                      setGradientEnabled(false)
                    }
                  }}
                >
                  <CardContent className="p-2">
                    {bg.src ? (
                      <img src={bg.src} alt={bg.name} className="w-full h-12 object-cover rounded" />
                    ) : (
                      <div 
                        className="w-full h-12 rounded" 
                        style={{ backgroundColor: bg.color }}
                      />
                    )}
                    <p className="text-xs text-center mt-1 truncate">{bg.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedFixed && (
              <div className="mt-4">
                <Label className="text-sm font-medium">Aperçu avec ajustements</Label>
                <div className="mt-2 border rounded overflow-hidden h-24 relative">
                  {selectedFixed.startsWith('#') ? (
                    <div 
                      className="w-full h-full"
                      style={{ 
                        background: gradientEnabled ? `linear-gradient(${gradientDirection}, ${gradientColor1}, ${gradientColor2})` : selectedFixed,
                        filter: `brightness(${fixedBrightness}%) contrast(${fixedContrast}%) saturate(${fixedSaturation}%) hue-rotate(${fixedHue}deg) blur(${fixedBlur}px)`
                      }}
                    />
                  ) : (
                    <img 
                      src={selectedFixed} 
                      alt="Fixed background preview" 
                      className="w-full h-full object-cover"
                      style={{ 
                        filter: `brightness(${fixedBrightness}%) contrast(${fixedContrast}%) saturate(${fixedSaturation}%) hue-rotate(${fixedHue}deg) blur(${fixedBlur}px)`
                      }}
                    />
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <label className="w-28">Luminosité</label>
                      <input type="range" min="0" max="200" step="1" value={fixedBrightness} onChange={e => setFixedBrightness(Number(e.target.value))} className="flex-1" />
                      <span className="w-12 text-right text-xs">{fixedBrightness}%</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="w-28">Contraste</label>
                      <input type="range" min="0" max="200" step="1" value={fixedContrast} onChange={e => setFixedContrast(Number(e.target.value))} className="flex-1" />
                      <span className="w-12 text-right text-xs">{fixedContrast}%</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="w-28">Saturation</label>
                      <input type="range" min="0" max="200" step="1" value={fixedSaturation} onChange={e => setFixedSaturation(Number(e.target.value))} className="flex-1" />
                      <span className="w-12 text-right text-xs">{fixedSaturation}%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <label className="w-28">Teinte</label>
                      <input type="range" min="0" max="360" step="1" value={fixedHue} onChange={e => setFixedHue(Number(e.target.value))} className="flex-1" />
                      <span className="w-12 text-right text-xs">{fixedHue}°</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="w-28">Flou</label>
                      <input type="range" min="0" max="10" step="0.1" value={fixedBlur} onChange={e => setFixedBlur(Number(e.target.value))} className="flex-1" />
                      <span className="w-12 text-right text-xs">{fixedBlur}px</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="w-28">Gradient</label>
                      <input type="checkbox" checked={gradientEnabled} onChange={e => setGradientEnabled(e.target.checked)} />
                    </div>
                  </div>
                </div>

                {gradientEnabled && (
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <label className="w-28">Couleur 1</label>
                        <input type="color" value={gradientColor1} onChange={e => setGradientColor1(e.target.value)} />
                        <span className="text-xs ml-2">{gradientColor1}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="w-28">Couleur 2</label>
                        <input type="color" value={gradientColor2} onChange={e => setGradientColor2(e.target.value)} />
                        <span className="text-xs ml-2">{gradientColor2}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <label className="w-28">Direction</label>
                        <select value={gradientDirection} onChange={e => setGradientDirection(e.target.value)} className="flex-1">
                          <option value="to right">Horizontal</option>
                          <option value="to bottom">Vertical</option>
                          <option value="to bottom right">Diagonal</option>
                          <option value="to top right">Diagonal inverse</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
                    <img src={uploadedImage} alt="Uploaded" className="w-full h-24 object-cover rounded mt-2" />
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
                setSelectedFluidEffect('')
              }} />
            )}
            {selectedFluidEffect === "gpu-fluid" && (
              <div>
                <div className="mb-2 text-sm text-muted-foreground">
                  Aperçu du GPU Fluid - Sera appliqué comme arrière-plan réel
                </div>
                <div className="border rounded overflow-hidden h-40 relative bg-transparent">
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
                    <img src="/icon-512.png" alt="Logo" className="w-8 h-8 mb-2 drop-shadow" />
                    <div className="text-white text-sm font-bold">FUSION</div>
                    <div className="text-white/80 text-xs mt-1">Votre espace de travail créatif</div>
                    <div className="mt-2 flex gap-1">
                      <button className="px-2 py-1 rounded bg-white/10 text-white text-xs">Explorer</button>
                      <button className="px-2 py-1 rounded bg-white/6 text-white/90 text-xs">Créer</button>
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
                  height="300"
                  style={{ border: '1px solid #ccc', borderRadius: 8 }}
                  allowFullScreen
                />
                <div className="mt-2 text-xs text-muted-foreground">
                  <a href="https://github.com/mharrys/fluids-2d" target="_blank" rel="noopener noreferrer" className="underline">Source sur GitHub</a>
                </div>
              </div>
            )}
          </TabsContent>
        </div>
        </Tabs>

        <div className="pt-4 border-t flex justify-end gap-2 px-6 pb-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave}>Selectionner</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}