import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Chrome } from '@uiw/react-color'

export type IconShape = "square" | "rounded" | "circle" | "none"

export type IconCustomization = {
  shape: IconShape
  bgColor: string
  iconColor: string
  size: number // px
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mappingKey?: string
  mappingLabel?: string
  // the icon component to preview (optional) — can be a React component or module-like export
  iconComp?: any
  initial?: Partial<IconCustomization>
  onSave: (key: string | undefined, customization: IconCustomization) => void
}

const defaultCustomization: IconCustomization = {
  shape: "rounded",
  bgColor: "#2B6CB0", // blue by default
  iconColor: "#ffffff",
  size: 40
}

const renderIconLocal = (iconComp: any, size: number, color: string) => {
  if (!iconComp) return null
  try {
    if (React.isValidElement(iconComp)) {
      const el = iconComp as React.ReactElement<any>
      return React.cloneElement(el, { style: { ...(el.props?.style || {}), color }, className: (el.props?.className || "") })
    }
    const Comp = iconComp?.default || iconComp
    if (!Comp) return null
    try {
      // many icon libs accept size or width/height props
      return React.createElement(Comp, { size, style: { color } })
    } catch (e) {
      // fallback: try without size
      return React.createElement(Comp, { style: { color } })
    }
  } catch (e) {
    return null
  }
}

const IconCustomizationModal: React.FC<Props> = ({ open, onOpenChange, mappingKey, mappingLabel, iconComp, initial, onSave }) => {
  const [shape, setShape] = useState<IconShape>(initial?.shape || defaultCustomization.shape)
  const [bgColor, setBgColor] = useState<string>(initial?.bgColor || defaultCustomization.bgColor)
  const [iconColor, setIconColor] = useState<string>(initial?.iconColor || defaultCustomization.iconColor)
  const [size, setSize] = useState<number>(initial?.size || defaultCustomization.size)
  const [showBgPicker, setShowBgPicker] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)

  useEffect(() => {
    if (open) {
      setShape(initial?.shape || defaultCustomization.shape)
      setBgColor(initial?.bgColor || defaultCustomization.bgColor)
      setIconColor(initial?.iconColor || defaultCustomization.iconColor)
      setSize(initial?.size || defaultCustomization.size)
    }
  }, [open, initial])

  const handleSave = () => {
    const cfg: IconCustomization = { shape, bgColor, iconColor, size }
    onSave(mappingKey, cfg)
    onOpenChange(false)
  }

  const previewSize = Math.max(24, Math.min(80, size))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle>Personnaliser l'icône {mappingLabel ? `: ${mappingLabel}` : ''}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-4">
            <div>
              <Label>Forme</Label>
              <div className="mt-2">
                <select value={shape} onChange={e => setShape(e.target.value as IconShape)} className="border rounded px-2 py-1 bg-black text-white">
                  <option value="square" style={{ background: '#000', color: '#fff' }}>Carré</option>
                  <option value="rounded" style={{ background: '#000', color: '#fff' }}>Arrondi</option>
                  <option value="circle" style={{ background: '#000', color: '#fff' }}>Rond</option>
                  <option value="none" style={{ background: '#000', color: '#fff' }}>Sans pastille (icône seule)</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Couleur de fond</Label>
              <div className="mt-2 flex items-start gap-3">
                <div
                  role="button"
                  title="Ouvrir le sélecteur de couleur"
                  onClick={() => setShowBgPicker(s => !s)}
                  style={{ width: 40, height: 28, background: bgColor, borderRadius: 6, border: '1px solid rgba(0,0,0,0.12)', cursor: 'pointer' }}
                />
                <div className="flex-1">
                  <input className="w-full border rounded px-2 py-1" value={bgColor} onChange={e => setBgColor(e.target.value)} />
                </div>
              </div>
              {showBgPicker && (
                <div className="mt-2">
                  <Chrome
                    color={bgColor}
                    onChange={(color: any) => {
                      try { setBgColor(color.hex || color) } catch (e) { setBgColor(String(color)) }
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Couleur de l'icône</Label>
              <div className="mt-2 flex items-start gap-3">
                <div
                  role="button"
                  title="Ouvrir le sélecteur de couleur icône"
                  onClick={() => setShowIconPicker(s => !s)}
                  style={{ width: 40, height: 28, background: iconColor, borderRadius: 6, border: '1px solid rgba(0,0,0,0.12)', cursor: 'pointer' }}
                />
                <div className="flex-1">
                  <input className="w-full border rounded px-2 py-1" value={iconColor} onChange={e => setIconColor(e.target.value)} />
                </div>
              </div>
              {showIconPicker && (
                <div className="mt-2">
                  <Chrome
                    color={iconColor}
                    onChange={(color: any) => {
                      try { setIconColor(color.hex || color) } catch (e) { setIconColor(String(color)) }
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Taille</Label>
              <div className="flex items-center gap-3 mt-2">
                <input type="range" min={24} max={80} value={size} onChange={e => setSize(Number(e.target.value))} />
                <div className="w-12 text-right">{size}px</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-4">
            <div className="text-sm text-muted-foreground">Aperçu</div>
            {shape === 'none' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: previewSize + 24, height: previewSize + 24 }}>
                <div style={{ width: previewSize, height: previewSize, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor }}>
                  {iconComp ? renderIconLocal(iconComp, previewSize, iconColor) : (
                    <div style={{ width: previewSize, height: previewSize, background: 'rgba(0,0,0,0.06)' }} />
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                background: bgColor,
                width: previewSize + 24,
                height: previewSize + 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: shape === 'circle' ? '9999px' : shape === 'rounded' ? '12px' : '4px',
                color: iconColor
              }}>
                <div style={{ width: previewSize, height: previewSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {iconComp ? renderIconLocal(iconComp, previewSize, iconColor) : (
                    <div style={{ width: previewSize, height: previewSize, background: 'rgba(255,255,255,0.12)', borderRadius: 6 }} />
                  )}
                </div>
              </div>
            )}

            <div className="w-full flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button className="flex-1" onClick={handleSave}>Enregistrer</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default IconCustomizationModal
