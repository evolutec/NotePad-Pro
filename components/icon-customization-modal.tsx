import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { HexAlphaColorPicker } from "react-colorful"
import { Check, RefreshCw, X, ChevronLeft, ChevronRight } from "lucide-react"

export type IconShape = "square" | "rounded" | "circle" | "none"

export type IconCustomization = {
  shape: IconShape
  bgColor: string
  iconColor: string
  size: number // px
  borderWidth?: number
  borderColor?: string
  opacity?: number // 0-100
  shadowEnabled?: boolean
  shadowColor?: string
  shadowBlur?: number
  shadowOffsetY?: number
  shadowSpread?: number
  padding?: number
  rotate?: number // degrees
  gradientEnabled?: boolean
  gradientFrom?: string
  gradientTo?: string
  gradientAngle?: number
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
  size: 40,
  opacity: 100,
  shadowEnabled: false,
  shadowColor: "#000000",
  shadowBlur: 8,
  shadowOffsetY: 2,
  shadowSpread: 0,
  padding: 6,
  rotate: 0,
  gradientEnabled: false,
  gradientFrom: "#2B6CB0",
  gradientTo: "#2C7A7B",
  gradientAngle: 90,
}

const renderIconLocal = (iconComp: any, size: number, color: string) => {
  if (!iconComp) return null
  try {
    if (React.isValidElement(iconComp)) {
      const el = iconComp as React.ReactElement<any>
      return React.cloneElement(el, { style: { ...(el.props?.style || {}), color }, className: el.props?.className || "" })
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
  const [showBorderPicker, setShowBorderPicker] = useState(false)
  const [showPreviewBgPicker, setShowPreviewBgPicker] = useState(false)
  const [previewBgColor, setPreviewBgColor] = useState<string | null>(null)
  const [borderWidth, setBorderWidth] = useState<number>(initial?.borderWidth ?? 0)
  const [borderColor, setBorderColor] = useState<string>(initial?.borderColor || "transparent")
  const [opacity, setOpacity] = useState<number>((initial?.opacity ?? defaultCustomization.opacity) as number)

  const [shadowEnabled, setShadowEnabled] = useState<boolean>((initial?.shadowEnabled ?? defaultCustomization.shadowEnabled) as boolean)
  const [shadowColor, setShadowColor] = useState<string>((initial?.shadowColor || defaultCustomization.shadowColor) as string)
  const [shadowBlur, setShadowBlur] = useState<number>((initial?.shadowBlur ?? defaultCustomization.shadowBlur) as number)
  const [shadowOffsetY, setShadowOffsetY] = useState<number>((initial?.shadowOffsetY ?? defaultCustomization.shadowOffsetY) as number)
  const [shadowSpread, setShadowSpread] = useState<number>((initial?.shadowSpread ?? defaultCustomization.shadowSpread) as number)

  const [paddingVal, setPaddingVal] = useState<number>((initial?.padding ?? defaultCustomization.padding) as number)
  const [rotate, setRotate] = useState<number>((initial?.rotate ?? defaultCustomization.rotate) as number)

  const [gradientEnabled, setGradientEnabled] = useState<boolean>((initial?.gradientEnabled ?? defaultCustomization.gradientEnabled) as boolean)
  const [gradientFrom, setGradientFrom] = useState<string>((initial?.gradientFrom || defaultCustomization.gradientFrom) as string)
  const [gradientTo, setGradientTo] = useState<string>((initial?.gradientTo || defaultCustomization.gradientTo) as string)
  const [gradientAngle, setGradientAngle] = useState<number>((initial?.gradientAngle ?? defaultCustomization.gradientAngle) as number)

  const [showGradientFromPicker, setShowGradientFromPicker] = useState(false)
  const [showGradientToPicker, setShowGradientToPicker] = useState(false)
  const [showShadowPicker, setShowShadowPicker] = useState(false)
  const [previewState, setPreviewState] = useState<"normal" | "hover" | "active">("normal")
  const [previewSizePreset, setPreviewSizePreset] = useState<"sm" | "md" | "lg" | "xl">("md")

  useEffect(() => {
    if (open) {
      setShape(initial?.shape || defaultCustomization.shape)
      setBgColor(initial?.bgColor || defaultCustomization.bgColor)
      setIconColor(initial?.iconColor || defaultCustomization.iconColor)
      setSize(initial?.size || defaultCustomization.size)
      setBorderWidth(initial?.borderWidth ?? 0)
      setBorderColor(initial?.borderColor || "transparent")
      setOpacity((initial?.opacity ?? defaultCustomization.opacity) as number)
      setShadowEnabled((initial?.shadowEnabled ?? defaultCustomization.shadowEnabled) as boolean)
      setShadowColor((initial?.shadowColor || defaultCustomization.shadowColor) as string)
      setShadowBlur((initial?.shadowBlur ?? defaultCustomization.shadowBlur) as number)
      setShadowOffsetY((initial?.shadowOffsetY ?? defaultCustomization.shadowOffsetY) as number)
      setShadowSpread((initial?.shadowSpread ?? defaultCustomization.shadowSpread) as number)
      setPaddingVal((initial?.padding ?? defaultCustomization.padding) as number)
      setRotate((initial?.rotate ?? defaultCustomization.rotate) as number)
      setGradientEnabled((initial?.gradientEnabled ?? defaultCustomization.gradientEnabled) as boolean)
      setGradientFrom((initial?.gradientFrom || defaultCustomization.gradientFrom) as string)
      setGradientTo((initial?.gradientTo || defaultCustomization.gradientTo) as string)
      setGradientAngle((initial?.gradientAngle ?? defaultCustomization.gradientAngle) as number)
    }
  }, [open, initial])

  const handleSave = () => {
    const cfg: IconCustomization = {
      shape,
      bgColor,
      iconColor,
      size,
      borderWidth: Number(borderWidth || 0),
      borderColor: borderColor || "transparent",
      opacity: Number(opacity || 100),
      shadowEnabled: Boolean(shadowEnabled),
      shadowColor: shadowColor || "#000",
      shadowBlur: Number(shadowBlur || 0),
      shadowOffsetY: Number(shadowOffsetY || 0),
      shadowSpread: Number(shadowSpread || 0),
      padding: Number(paddingVal || 0),
      rotate: Number(rotate || 0),
      gradientEnabled: Boolean(gradientEnabled),
      gradientFrom: gradientFrom || bgColor,
      gradientTo: gradientTo || bgColor,
      gradientAngle: Number(gradientAngle || 90),
    }
    onSave(mappingKey, cfg)
    onOpenChange(false)
  }

  const handleReset = () => {
    const src = initial || defaultCustomization
    setShape(src.shape || defaultCustomization.shape)
    setBgColor(src.bgColor || defaultCustomization.bgColor)
    setIconColor(src.iconColor || defaultCustomization.iconColor)
    setSize(src.size || defaultCustomization.size)
    setBorderWidth(src.borderWidth ?? 0)
    setBorderColor(src.borderColor || "transparent")
    setOpacity((src.opacity ?? defaultCustomization.opacity) as number)
    setShadowEnabled((src.shadowEnabled ?? defaultCustomization.shadowEnabled) as boolean)
    setShadowColor((src.shadowColor || defaultCustomization.shadowColor) as string)
    setShadowBlur((src.shadowBlur ?? defaultCustomization.shadowBlur) as number)
    setShadowOffsetY((src.shadowOffsetY ?? defaultCustomization.shadowOffsetY) as number)
    setShadowSpread((src.shadowSpread ?? defaultCustomization.shadowSpread) as number)
    setPaddingVal((src.padding ?? defaultCustomization.padding) as number)
    setRotate((src.rotate ?? defaultCustomization.rotate) as number)
    setGradientEnabled((src.gradientEnabled ?? defaultCustomization.gradientEnabled) as boolean)
    setGradientFrom((src.gradientFrom || defaultCustomization.gradientFrom) as string)
    setGradientTo((src.gradientTo || defaultCustomization.gradientTo) as string)
    setGradientAngle((src.gradientAngle ?? defaultCustomization.gradientAngle) as number)
  }

  // Presets: quick-apply visual styles
  const PRESETS: Array<{ id: string; label: string; cfg: Partial<IconCustomization> }> = [
    { id: "preset-blue", label: "Pastille bleue", cfg: { shape: "rounded", bgColor: "#2B6CB0", iconColor: "#fff", size: 40, padding: 6 } },
    { id: "preset-neutral", label: "Pastille neutre", cfg: { shape: "rounded", bgColor: "#F3F4F6", iconColor: "#111827", size: 36, padding: 6 } },
    { id: "preset-ghost", label: "Sans pastille", cfg: { shape: "none", bgColor: "transparent", iconColor: "#111827", size: 28, padding: 0 } },
    { id: "preset-gradient", label: "Gradient", cfg: { shape: "circle", gradientEnabled: true, gradientFrom: "#7F7FD5", gradientTo: "#86A8E7", gradientAngle: 120, iconColor: "#fff", size: 44 } },
  ]

  const applyPreset = (p: typeof PRESETS[number]) => {
    const src = p.cfg
    setShape((src.shape as IconShape) || defaultCustomization.shape)
    setBgColor(src.bgColor || defaultCustomization.bgColor)
    setIconColor(src.iconColor || defaultCustomization.iconColor)
    setSize(src.size || defaultCustomization.size)
    setBorderWidth(src.borderWidth ?? 0)
    setBorderColor(src.borderColor || "transparent")
    setOpacity((src.opacity ?? defaultCustomization.opacity) as number)
    setShadowEnabled((src.shadowEnabled ?? defaultCustomization.shadowEnabled) as boolean)
    setShadowColor((src.shadowColor ?? defaultCustomization.shadowColor) as string)
    setShadowBlur(Number(src.shadowBlur ?? defaultCustomization.shadowBlur))
    setShadowOffsetY(Number(src.shadowOffsetY ?? defaultCustomization.shadowOffsetY))
    setShadowSpread(Number(src.shadowSpread ?? defaultCustomization.shadowSpread))
    setPaddingVal(Number(src.padding ?? defaultCustomization.padding))
    setRotate(Number(src.rotate ?? defaultCustomization.rotate))
    setGradientEnabled(Boolean(src.gradientEnabled ?? defaultCustomization.gradientEnabled))
    setGradientFrom((src.gradientFrom ?? defaultCustomization.gradientFrom) as string)
    setGradientTo((src.gradientTo ?? defaultCustomization.gradientTo) as string)
    setGradientAngle(Number(src.gradientAngle ?? defaultCustomization.gradientAngle))
  }

  const basePreviewSize = Math.max(24, Math.min(80, size))
  const previewSizeMap: Record<string, number> = { sm: 24, md: 40, lg: 64, xl: 96 }
  const previewSize = previewSizeMap[previewSizePreset] || basePreviewSize

  // ---- DESIGN ONLY: Frosted Dark Option B layout ----
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90vh] w-[120rem] max-w-[96vw] flex flex-col overflow-hidden" style={{ height: '90vh', width: '120rem', maxWidth: '96vw' }}>
        <div className="flex flex-col h-full bg-[rgba(10,11,13,0.6)] backdrop-blur-sm border border-white/6">
          <div className="px-6 py-4 border-b border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.2))]">
            <div className="flex items-center justify-between">
              <div>
                <DialogHeader className="p-0 m-0">
                  <DialogTitle className="text-white text-lg font-semibold">
                    Personnaliser l'icône{mappingLabel ? ` : ${mappingLabel}` : ""}
                  </DialogTitle>
                </DialogHeader>
                <div className="text-xs text-white/60 mt-1">Frosted dark · Aperçu en temps réel</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => { handleReset(); }} className="hidden md:inline-flex">
                  <RefreshCw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button variant="ghost" onClick={() => onOpenChange(false)} className="ml-2">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* LEFT SIDEBAR: narrow, scrollable controls */}
            <aside className="w-[380px] min-w-[380px] p-4 overflow-y-auto border-r border-white/6 bg-[rgba(20,20,22,0.45)] backdrop-blur-sm">
              <div className="space-y-5">
                {/* FORMES */}
                <div className="space-y-2">
                  <Label className="text-white/90">Forme</Label>
                  <select
                    value={shape}
                    onChange={(e) => setShape(e.target.value as IconShape)}
                    className="w-full rounded-lg px-3 py-2 bg-black text-white border border-white/8"
                  >
                    <option value="square">Carré</option>
                    <option value="rounded">Arrondi</option>
                    <option value="circle">Rond</option>
                    <option value="none">Sans pastille</option>
                  </select>
                </div>

                {/* COULEURS (bg + icon) */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-white/90">Fond</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input className="flex-1 rounded-md px-3 py-2 bg-white/6 border border-white/8 text-white" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
                      <button
                        aria-label="bg picker"
                        onClick={() => setShowBgPicker((s) => !s)}
                        className="w-10 h-10 rounded-md border border-white/8 shadow-sm"
                        style={{ background: bgColor }}
                      />
                    </div>
                    {/* Background color picker in its own modal to ensure proper pointer interactions (alpha + color) */}
                    <Dialog open={showBgPicker} onOpenChange={setShowBgPicker}>
                        <DialogContent showCloseButton={false} className="w-[28rem] max-w-[90vw]" style={{ transform: 'none' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium">Couleur de fond</div>
                          <Button variant="ghost" size="sm" onClick={() => setShowBgPicker(false)}><X className="w-4 h-4" /></Button>
                        </div>
                        <div className="p-1 rounded bg-black" style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 100000 }}>
                          <HexAlphaColorPicker color={bgColor} onChange={setBgColor} />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div>
                    <Label className="text-white/90">Couleur icône</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input className="flex-1 rounded-md px-3 py-2 bg-white/6 border border-white/8 text-white" value={iconColor} onChange={(e) => setIconColor(e.target.value)} />
                      <button
                        aria-label="icon picker"
                        onClick={() => setShowIconPicker((s) => !s)}
                        className="w-10 h-10 rounded-md border border-white/8 shadow-sm"
                        style={{ background: iconColor }}
                      />
                    </div>
                    {/* Icon color picker modal */}
                    <Dialog open={showIconPicker} onOpenChange={setShowIconPicker}>
                        <DialogContent showCloseButton={false} className="w-[28rem] max-w-[90vw]" style={{ transform: 'none' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium">Couleur icône</div>
                          <Button variant="ghost" size="sm" onClick={() => setShowIconPicker(false)}><X className="w-4 h-4" /></Button>
                        </div>
                        <div className="p-1 rounded bg-black" style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 100000 }}>
                          <HexAlphaColorPicker color={iconColor} onChange={setIconColor} />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* TAILLE */}
                <div>
                  <Label className="text-white/90">Taille</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Button variant="ghost" size="sm" onClick={() => setSize(Math.max(24, size - 1))} className="p-1 h-8 w-8">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <input type="range" min={24} max={96} value={size} onChange={(e) => setSize(Number(e.target.value))} className="flex-1" />
                    <Button variant="ghost" size="sm" onClick={() => setSize(Math.min(96, size + 1))} className="p-1 h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="w-12 text-right text-white/80">{size}px</div>
                  </div>
                </div>

                {/* BORDURE */}
                <div>
                  <Label className="text-white/90">Bordure</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Button variant="ghost" size="sm" onClick={() => setBorderWidth(Math.max(0, borderWidth - 1))} className="p-1 h-8 w-8">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <input type="range" min={0} max={12} value={borderWidth} onChange={(e) => setBorderWidth(Number(e.target.value))} className="flex-1" />
                    <Button variant="ghost" size="sm" onClick={() => setBorderWidth(Math.min(12, borderWidth + 1))} className="p-1 h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="w-12 text-right text-white/80">{borderWidth}px</div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <input className="flex-1 rounded-md px-3 py-2 bg-white/6 border border-white/8 text-white" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} />
                    <button
                      aria-label="border color"
                      onClick={() => setShowBorderPicker((s) => !s)}
                      className="w-10 h-10 rounded-md border border-white/8"
                      style={{ background: borderColor }}
                    />
                  </div>
                  {/* Border color picker modal */}
                  <Dialog open={showBorderPicker} onOpenChange={setShowBorderPicker}>
                        <DialogContent showCloseButton={false} className="w-[28rem] max-w-[90vw]" style={{ transform: 'none' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">Couleur bordure</div>
                        <Button variant="ghost" size="sm" onClick={() => setShowBorderPicker(false)}><X className="w-4 h-4" /></Button>
                      </div>
                      <div className="p-1 rounded bg-black" style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 100000 }}>
                        <HexAlphaColorPicker color={borderColor} onChange={setBorderColor} />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* PRESETS quick row */}
                <div className="pt-2">
                  <Label className="text-white/90">Presets</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => applyPreset(p)}
                        className="px-3 py-1 rounded-md text-sm bg-white/6 border border-white/8 text-white hover:bg-white/10"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* CENTER: large preview */}
            <main className="flex-1 p-6 flex flex-col items-center justify-center overflow-auto">
              <div className="w-full">
                <div className="mb-4 flex items-center justify-between relative">
                  <div className="text-sm text-white/70">Aperçu</div>

                  <div className="flex items-center gap-2">
                    <select value={previewState} onChange={(e) => setPreviewState(e.target.value as any)} className="rounded-md px-2 py-1 bg-black text-white border border-white/8">
                      <option value="normal">Normal</option>
                      <option value="hover">Hover</option>
                      <option value="active">Actif</option>
                    </select>

                    <select value={previewSizePreset} onChange={(e) => setPreviewSizePreset(e.target.value as any)} className="rounded-md px-2 py-1 bg-black text-white border border-white/8">
                      <option value="sm">SM</option>
                      <option value="md">MD</option>
                      <option value="lg">LG</option>
                      <option value="xl">XL</option>
                    </select>
                    {/* Preview background color control */}
                    <div className="ml-2 flex items-center gap-2">
                      <button
                        aria-label="Changer arrière-plan aperçu"
                        onClick={() => setShowPreviewBgPicker(s => !s)}
                        className="w-8 h-8 rounded-md border border-white/8"
                        style={{ background: previewBgColor || undefined }}
                      />
                      {showPreviewBgPicker && (
                        <Dialog open={showPreviewBgPicker} onOpenChange={setShowPreviewBgPicker}>
                          <DialogContent showCloseButton={false} className="w-[28rem] max-w-[90vw]" style={{ transform: 'none' }}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-medium">Arrière-plan aperçu</div>
                              <Button variant="ghost" size="sm" onClick={() => setShowPreviewBgPicker(false)}><X className="w-4 h-4" /></Button>
                            </div>
                            <div className="p-1 rounded bg-black" style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 100000 }}>
                              <HexAlphaColorPicker color={previewBgColor || '#000000'} onChange={setPreviewBgColor} />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="mx-auto rounded-2xl p-8 flex items-center justify-center"
                  style={{
                    width: "100%",
                    minHeight: 360,
                    background: previewBgColor || "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.25))",
                    border: "1px solid rgba(255,255,255,0.03)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {/* preview box */}
                  {(() => {
                    const rad = shape === "circle" ? "9999px" : shape === "rounded" ? "18px" : "6px"
                    const bg = gradientEnabled ? `linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo})` : bgColor
                    const bw = borderWidth ? `${borderWidth}px solid ${borderColor}` : undefined
                    const baseBoxShadow = shadowEnabled ? `0 ${shadowOffsetY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}` : undefined

                    const stateAdjustments: React.CSSProperties =
                      previewState === "hover"
                        ? {
                            transform: `rotate(${rotate}deg) scale(1.06)`,
                            boxShadow: baseBoxShadow ? `${baseBoxShadow}, 0 20px 40px rgba(0,0,0,0.4)` : "0 20px 40px rgba(0,0,0,0.4)",
                          }
                        : previewState === "active"
                        ? {
                            transform: `rotate(${rotate}deg) scale(0.96)`,
                            boxShadow: baseBoxShadow ? `${baseBoxShadow}, inset 0 4px 10px rgba(0,0,0,0.3)` : "inset 0 4px 10px rgba(0,0,0,0.3)",
                          }
                        : { transform: `rotate(${rotate}deg)`, boxShadow: baseBoxShadow }

                    const wrapperStyle: React.CSSProperties = {
                      background: bg,
                      width: previewSize + paddingVal * 2 + 48,
                      height: previewSize + paddingVal * 2 + 48,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: rad,
                      color: iconColor,
                      border: bw,
                      opacity: (opacity ?? 100) / 100,
                      padding: paddingVal,
                      transition: "transform 180ms ease, box-shadow 180ms ease, opacity 120ms",
                      ...stateAdjustments,
                    }

                    if (shape === "none") {
                      return (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: previewSize, height: previewSize, display: "flex", alignItems: "center", justifyContent: "center", color: iconColor }}>
                            {iconComp ? renderIconLocal(iconComp, previewSize, iconColor) : <div style={{ width: previewSize, height: previewSize, background: "rgba(0,0,0,0.06)" }} />}
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div style={wrapperStyle as any}>
                        <div style={{ width: previewSize, height: previewSize, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {iconComp ? renderIconLocal(iconComp, previewSize, iconColor) : <div style={{ width: previewSize, height: previewSize, background: "rgba(255,255,255,0.12)", borderRadius: 6 }} />}
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* small hints row */}
                <div className="mt-4 text-xs text-white/60">
                  Astuce: utilise les presets pour des styles rapides · Contraste et opacité disponibles à droite
                </div>
              </div>
            </main>

            {/* RIGHT SIDEBAR: compact actions & advanced sliders */}
            <aside className="w-[380px] min-w-[380px] p-4 border-l border-white/6 bg-[rgba(18,18,20,0.45)] backdrop-blur-sm overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <Label className="text-white/90">Opacité</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Button variant="ghost" size="sm" onClick={() => setOpacity(Math.max(0, opacity - 1))} className="p-1 h-8 w-8">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <input type="range" min={0} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="flex-1" />
                    <Button variant="ghost" size="sm" onClick={() => setOpacity(Math.min(100, opacity + 1))} className="p-1 h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="w-12 text-right text-white/80">{opacity}%</div>
                  </div>
                </div>

                <div>
                  <Label className="text-white/90">Ombre</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" checked={shadowEnabled} onChange={(e) => setShadowEnabled(e.target.checked)} />
                    <span className="text-white/80">Activer</span>
                  </div>

                  {shadowEnabled && (
                    <div className="mt-2 space-y-2">
                      <div>
                        <Label className="text-xs text-white/80">Couleur</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input className="flex-1 rounded-md px-2 py-1 bg-white/6 border border-white/8 text-white" value={shadowColor} onChange={(e) => setShadowColor(e.target.value)} />
                          <button onClick={() => setShowShadowPicker(s => !s)} className="w-8 h-8 rounded-md border border-white/8" style={{ background: shadowColor }} aria-label="shadow color picker" />
                        </div>
                        {showShadowPicker && (
                          <Dialog open={showShadowPicker} onOpenChange={setShowShadowPicker}>
                            <DialogContent showCloseButton={false} className="w-[28rem] max-w-[90vw]" style={{ transform: 'none' }}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium">Couleur ombre</div>
                                <Button variant="ghost" size="sm" onClick={() => setShowShadowPicker(false)}><X className="w-4 h-4" /></Button>
                              </div>
                              <div className="p-1 rounded bg-black" style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 100000 }}>
                                <HexAlphaColorPicker color={shadowColor} onChange={setShadowColor} />
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs text-white/80">Flou</Label>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setShadowBlur(Math.max(0, shadowBlur - 1))} className="p-1 h-6 w-6">
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <input type="range" min={0} max={40} value={shadowBlur} onChange={(e) => setShadowBlur(Number(e.target.value))} className="flex-1" />
                          <Button variant="ghost" size="sm" onClick={() => setShadowBlur(Math.min(40, shadowBlur + 1))} className="p-1 h-6 w-6">
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-white/60 text-center mt-1">{shadowBlur}px</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-white/80">Décalage Y</Label>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setShadowOffsetY(Math.max(-12, shadowOffsetY - 1))} className="p-1 h-6 w-6">
                              <ChevronLeft className="h-3 w-3" />
                            </Button>
                            <input type="range" min={-12} max={24} value={shadowOffsetY} onChange={(e) => setShadowOffsetY(Number(e.target.value))} className="flex-1" />
                            <Button variant="ghost" size="sm" onClick={() => setShadowOffsetY(Math.min(24, shadowOffsetY + 1))} className="p-1 h-6 w-6">
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-white/80">Étendue</Label>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setShadowSpread(Math.max(-20, shadowSpread - 1))} className="p-1 h-6 w-6">
                              <ChevronLeft className="h-3 w-3" />
                            </Button>
                            <input type="range" min={-20} max={20} value={shadowSpread} onChange={(e) => setShadowSpread(Number(e.target.value))} className="flex-1" />
                            <Button variant="ghost" size="sm" onClick={() => setShadowSpread(Math.min(20, shadowSpread + 1))} className="p-1 h-6 w-6">
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-white/90">Padding</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Button variant="ghost" size="sm" onClick={() => setPaddingVal(Math.max(0, paddingVal - 1))} className="p-1 h-8 w-8">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <input type="range" min={0} max={20} value={paddingVal} onChange={(e) => setPaddingVal(Number(e.target.value))} className="flex-1" />
                    <Button variant="ghost" size="sm" onClick={() => setPaddingVal(Math.min(20, paddingVal + 1))} className="p-1 h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="w-12 text-right text-white/80">{paddingVal}px</div>
                  </div>
                </div>

                <div>
                  <Label className="text-white/90">Rotation</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Button variant="ghost" size="sm" onClick={() => setRotate(Math.max(-180, rotate - 1))} className="p-1 h-8 w-8">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <input type="range" min={-180} max={180} value={rotate} onChange={(e) => setRotate(Number(e.target.value))} className="flex-1" />
                    <Button variant="ghost" size="sm" onClick={() => setRotate(Math.min(180, rotate + 1))} className="p-1 h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="w-12 text-right text-white/80">{rotate}°</div>
                  </div>
                </div>

                <div>
                  <Label className="text-white/90">Dégradé</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" checked={gradientEnabled} onChange={(e) => setGradientEnabled(e.target.checked)} />
                    <span className="text-white/80">Activer</span>
                  </div>

                  {gradientEnabled && (
                    <div className="mt-2 space-y-2">
                      <div>
                        <Label className="text-xs text-white/80">Début</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input className="flex-1 rounded-md px-2 py-1 bg-white/6 border border-white/8 text-white" value={gradientFrom} onChange={(e) => setGradientFrom(e.target.value)} />
                          <button onClick={() => setShowGradientFromPicker((s) => !s)} className="w-8 h-8 rounded-md border border-white/8" style={{ background: gradientFrom }} />
                        </div>
                        {showGradientFromPicker && (
                          <Dialog open={showGradientFromPicker} onOpenChange={setShowGradientFromPicker}>
                            <DialogContent showCloseButton={false} className="w-[28rem] max-w-[90vw]" style={{ transform: 'none' }}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium">Couleur début</div>
                                <Button variant="ghost" size="sm" onClick={() => setShowGradientFromPicker(false)}><X className="w-4 h-4" /></Button>
                              </div>
                              <div className="p-1 rounded bg-black" style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 100000 }}>
                                <HexAlphaColorPicker color={gradientFrom} onChange={setGradientFrom} />
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs text-white/80">Fin</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input className="flex-1 rounded-md px-2 py-1 bg-white/6 border border-white/8 text-white" value={gradientTo} onChange={(e) => setGradientTo(e.target.value)} />
                          <button onClick={() => setShowGradientToPicker((s) => !s)} className="w-8 h-8 rounded-md border border-white/8" style={{ background: gradientTo }} />
                        </div>
                        {showGradientToPicker && (
                          <Dialog open={showGradientToPicker} onOpenChange={setShowGradientToPicker}>
                            <DialogContent showCloseButton={false} className="w-[28rem] max-w-[90vw]">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium">Couleur fin</div>
                                <Button variant="ghost" size="sm" onClick={() => setShowGradientToPicker(false)}><X className="w-4 h-4" /></Button>
                              </div>
                              <div className="p-1 rounded bg-black" style={{ cursor: 'pointer', pointerEvents: 'auto', position: 'relative', zIndex: 100000 }}>
                                <HexAlphaColorPicker color={gradientTo} onChange={setGradientTo} />
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs text-white/80">Angle</Label>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setGradientAngle(Math.max(0, gradientAngle - 1))} className="p-1 h-6 w-6">
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <input type="range" min={0} max={360} value={gradientAngle} onChange={(e) => setGradientAngle(Number(e.target.value))} className="flex-1" />
                          <Button variant="ghost" size="sm" onClick={() => setGradientAngle(Math.min(360, gradientAngle + 1))} className="p-1 h-6 w-6">
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-white/60 text-center mt-1">{gradientAngle}°</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="pt-4 border-t border-white/6">
                  <Button onClick={handleSave} className="w-full mb-2 bg-white/12 text-white py-3 rounded-lg flex items-center justify-center">
                    <Check className="w-4 h-4 mr-2" /> Enregistrer
                  </Button>
                  <Button onClick={handleReset} variant="ghost" className="w-full mb-2 bg-white/6 text-white py-3 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 mr-2" /> Réinitialiser
                  </Button>
                  <Button onClick={() => onOpenChange(false)} variant="secondary" className="w-full py-3 rounded-lg">
                    <X className="w-4 h-4 mr-2" /> Fermer
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default IconCustomizationModal
