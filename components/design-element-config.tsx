"use client"

import React from 'react'
import { GPUFluidBackground } from './gpu-fluid-background'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'

interface ElementConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  elementId: string | null
  elementSettings: any
  onSave: (id: string | null, settings: any) => void
}

const BUILT_IN_BACKGROUNDS = [
  '/backgrounds/bg1.svg',
  '/backgrounds/bg2.svg',
  '/backgrounds/bg3.svg',
  '/backgrounds/bg4.svg',
  '/backgrounds/bg5.svg',
  '/backgrounds/bg6.svg',
  '/backgrounds/bg7.svg',
  '/backgrounds/bg8.svg',
  '/backgrounds/bg9.svg',
  '/backgrounds/bg10.svg',
  '/backgrounds/bg11.svg',
  '/backgrounds/bg12.svg',
  '/backgrounds/bg13.svg',
  '/backgrounds/bg14.svg',
  '/backgrounds/bg15.svg',
  '/backgrounds/bg16.svg',
  '/backgrounds/bg17.svg',
  '/backgrounds/bg18.svg',
  '/backgrounds/bg19.svg',
  '/backgrounds/bg20.svg',
]

export default function ElementConfigModal({ open, onOpenChange, elementId, elementSettings, onSave }: ElementConfigModalProps) {
  const [visible, setVisible] = React.useState<boolean>(true)
  const [backgroundMode, setBackgroundMode] = React.useState<'none'|'builtin'|'upload'|'gpu'>('none')
  const [fixedImage, setFixedImage] = React.useState<string | null>(null)
  const [backgroundImage, setBackgroundImage] = React.useState<string | null>(null)
  // GPU fluid params
  const [fluidSpeed, setFluidSpeed] = React.useState<number>(1.0)
  const [fluidScale, setFluidScale] = React.useState<number>(1.0)
  const [fluidTint, setFluidTint] = React.useState<string>('#2463ff')
  const [fluidOpacity, setFluidOpacity] = React.useState<number>(0.8)

  React.useEffect(() => {
    if (elementSettings) {
      setVisible(typeof elementSettings.visible === 'boolean' ? elementSettings.visible : true)
      setFixedImage(elementSettings.fixedImage || null)
      setBackgroundImage(elementSettings.backgroundImage || null)
      if (elementSettings.backgroundImage) setBackgroundMode('upload')
      else if (elementSettings.fixedImage) setBackgroundMode('builtin')
      else setBackgroundMode('none')
      // Load previously saved GPU params if available
      try {
        const params = elementSettings.backgroundParams
        if (params) {
          if (typeof params.speed === 'number') setFluidSpeed(params.speed)
          if (typeof params.scale === 'number') setFluidScale(params.scale)
          if (typeof params.opacity === 'number') setFluidOpacity(params.opacity)
          if (typeof params.tint === 'string') setFluidTint(params.tint)
        }
        if (elementSettings.backgroundImage === "__gpu_fluid_background__") {
          setBackgroundMode('gpu')
        }
      } catch (e) {
        // ignore
      }
    } else {
      setVisible(true)
      setFixedImage(null)
      setBackgroundImage(null)
      setBackgroundMode('none')
    }
  }, [elementSettings])

  // Listen for global design settings updates (from BackgroundConfigModal via SettingsDialog)
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (event: any) => {
      try {
        const design = event.detail?.design
        if (!design) return

        // Apply to preview: GPU, upload, builtin, animated
        if (design.backgroundImage === '__gpu_fluid_background__') {
          setBackgroundMode('gpu')
          const p = design.backgroundParams || {}
          if (typeof p.speed === 'number') setFluidSpeed(p.speed)
          if (typeof p.scale === 'number') setFluidScale(p.scale)
          if (typeof p.opacity === 'number') setFluidOpacity(p.opacity)
          if (typeof p.tint === 'string') setFluidTint(p.tint)
          setBackgroundImage(null)
          setFixedImage(null)
        } else if (design.backgroundImage) {
          setBackgroundMode('upload')
          setBackgroundImage(design.backgroundImage)
          setFixedImage(null)
        } else if (design.fixedImage) {
          setBackgroundMode('builtin')
          setFixedImage(design.fixedImage)
          setBackgroundImage(null)
        } else if (typeof design.animatedIndex === 'number') {
          // map animated index to one of the built-in backgrounds for preview (support up to 20 presets)
          const idx = (design.animatedIndex % 20) + 1
          const path = `/backgrounds/bg${idx}.svg`
          setBackgroundMode('builtin')
          setFixedImage(path)
          setBackgroundImage(null)
        } else {
          setBackgroundMode('none')
          setBackgroundImage(null)
          setFixedImage(null)
        }
      } catch (err) {
        console.warn('design-element-config: settingsUpdated handler error', err)
      }
    }

    window.addEventListener('settingsUpdated', handler as EventListener)
    return () => window.removeEventListener('settingsUpdated', handler as EventListener)
  }, [])

  // Persist the current selection into config.json via the preload API and apply globally
  const handlePersistToConfig = async () => {
    if (typeof window === 'undefined') return
    if (!window.electronAPI || !window.electronAPI.loadSettings || !window.electronAPI.saveSettings) {
      console.warn('Electron settings API not available')
      return
    }

    try {
      const existing = (await window.electronAPI.loadSettings()) || {}
      const design = { ...(existing.design || {}) }

      // set according to current preview mode
      if (backgroundMode === 'gpu') {
        design.backgroundImage = '__gpu_fluid_background__'
        design.fixedImage = null
        design.animatedIndex = 0
        design.backgroundParams = { speed: fluidSpeed, scale: fluidScale, tint: fluidTint, opacity: fluidOpacity }
      } else if (backgroundMode === 'upload' && backgroundImage) {
        design.backgroundImage = backgroundImage
        design.fixedImage = null
        design.animatedIndex = 0
        design.backgroundParams = null
      } else if (backgroundMode === 'builtin' && fixedImage) {
        design.backgroundImage = null
        design.fixedImage = fixedImage
        design.animatedIndex = 0
        design.backgroundParams = null
      } else {
        design.backgroundImage = null
        design.fixedImage = null
        design.backgroundParams = null
      }

      const merged = { ...existing, design }
      const saveResult = await window.electronAPI.saveSettings(merged)
      if (saveResult) {
        // notify app to apply immediately
        window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { design } }))
        onOpenChange(false)
      } else {
        console.error('Failed to save settings from design-element-config')
      }
    } catch (err) {
      console.error('Error persisting settings from design-element-config', err)
    }
  }

  const handleUpload = (file?: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setBackgroundImage(base64)
      setFixedImage(null)
      setBackgroundMode('upload')
    }
    reader.readAsDataURL(file)
  }

  const handleSelectBuiltIn = (path: string) => {
    setFixedImage(path)
    setBackgroundImage(null)
    setBackgroundMode('builtin')
  }

  const handleRemoveBackground = () => {
    setFixedImage(null)
    setBackgroundImage(null)
    setBackgroundMode('none')
  }

  const handleSave = () => {
    const payload: any = { visible }
    if (backgroundMode === 'upload' && backgroundImage) payload.backgroundImage = backgroundImage
    if (backgroundMode === 'builtin' && fixedImage) payload.fixedImage = fixedImage
    if (backgroundMode === 'gpu') payload.backgroundImage = "__gpu_fluid_background__"
    onSave(elementId, payload)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configuration d'élément</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <Label>Visible</Label>
            </div>
            <Switch checked={visible} onCheckedChange={(v) => setVisible(Boolean(v))} />
          </div>

          <div>
            <Label>Arrière-plan de l'élément</Label>
            <p className="text-sm text-muted-foreground">Choisissez une image intégrée ou téléversez la vôtre pour cet élément.</p>

            <div className="mt-3 grid grid-cols-5 gap-2">
              {/* GPU Fluid quick option */}
              <button onClick={() => { setBackgroundMode('gpu'); setFixedImage(null); setBackgroundImage(null); }} className={"border rounded overflow-hidden p-1 flex flex-col items-center justify-center " + (backgroundMode === 'gpu' ? 'ring-2 ring-primary' : '')}>
                <div className="w-full h-14 flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
                  GPU Fluid
                </div>
              </button>
              {BUILT_IN_BACKGROUNDS.map((p) => (
                <button key={p} onClick={() => handleSelectBuiltIn(p)} className={"border rounded overflow-hidden p-1 " + (fixedImage === p ? 'ring-2 ring-primary' : '')}>
                  <img src={p} alt={p} className="w-full h-14 object-cover" />
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Input type="file" accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0] || undefined)} />
              <Button variant="outline" onClick={handleRemoveBackground}>Supprimer</Button>
            </div>

            {(backgroundImage || fixedImage || backgroundMode === 'gpu') && (
              <div className="mt-3">
                <Label>Aperçu</Label>
                <div className="mt-2 w-full h-56 border rounded overflow-hidden relative bg-transparent">
                  {backgroundMode === 'gpu' ? (
                    <>
                      <GPUFluidBackground key="gpu-preview" className="absolute inset-0 w-full h-full" speed={fluidSpeed} scale={fluidScale} tint={fluidTint} opacity={fluidOpacity} />
                      <div className="relative z-10 w-full h-full flex flex-col justify-center items-center text-center p-4 text-white">
                        <div className="font-bold">FUSION</div>
                        <div className="text-xs text-white/80">Aperçu GPU Fluid</div>
                      </div>
                    </>
                  ) : (
                    <img src={backgroundImage || fixedImage || ''} alt="preview" className="w-full h-full object-cover" />
                  )}
                </div>
                {backgroundMode === 'gpu' && (
                  <div className="mt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <Label>Vitesse</Label>
                      <div>
                        <Slider value={[fluidSpeed]} min={0.1} max={3.0} step={0.1} onValueChange={([v]) => setFluidSpeed(v)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <Label>Échelle</Label>
                      <div>
                        <Slider value={[fluidScale]} min={0.5} max={4.0} step={0.1} onValueChange={([v]) => setFluidScale(v)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <Label>Opacité</Label>
                      <div>
                        <Slider value={[fluidOpacity]} min={0.0} max={1.0} step={0.05} onValueChange={([v]) => setFluidOpacity(v)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <Label>Teinte</Label>
                      <div>
                        <Input type="color" value={fluidTint} onChange={(e) => setFluidTint(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => {
                        // quick save of current fluid params into the element settings payload
                        const payload: any = { visible }
                        payload.backgroundImage = "__gpu_fluid_background__"
                        payload.backgroundParams = { speed: fluidSpeed, scale: fluidScale, tint: fluidTint, opacity: fluidOpacity }
                        onSave(elementId, payload)
                        onOpenChange(false)
                      }}>Enregistrer les options du fluid</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={handleSave}>Enregistrer</Button>
            <Button variant="default" onClick={handlePersistToConfig}>Sauvegarder les paramètres</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
