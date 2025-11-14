import React, { useEffect, useMemo, useState } from "react"
import * as LucideIcons from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Search, Palette } from "lucide-react"

type MappingItem = {
  key: string
  label: string
  currentIcon: string
  library: string // 'Lucide' | 'Material UI'
}

type IconSection = {
  title: string
  description: string
  mappings: MappingItem[]
}

const DEFAULT_SECTIONS: IconSection[] = [
  {
    title: "Icônes de dossiers (FolderTree)",
    description: "Icônes utilisées dans l'arborescence des fichiers",
    mappings: [
      { key: "folder_default", label: "Dossier (fermé)", currentIcon: "Folder", library: "Lucide" },
      { key: "folder_open", label: "Dossier (ouvert)", currentIcon: "Folder", library: "Lucide" }
    ]
  },
  {
    title: "Icônes d'ajout (Sidebar)",
    description: "Icônes des boutons d'ajout dans la barre latérale",
    mappings: [
      { key: "add_folder", label: "Ajouter dossier", currentIcon: "FolderPlus", library: "Lucide" },
      { key: "add_note", label: "Ajouter note", currentIcon: "FilePlus", library: "Lucide" },
      { key: "add_draw", label: "Ajouter dessin", currentIcon: "Palette", library: "Lucide" },
      { key: "add_excel", label: "Ajouter tableur", currentIcon: "Table", library: "Lucide" },
      { key: "add_powerpoint", label: "Ajouter présentation", currentIcon: "Presentation", library: "Lucide" },
      { key: "add_pdf", label: "Ajouter PDF", currentIcon: "FileText", library: "Lucide" },
      { key: "add_image", label: "Ajouter image", currentIcon: "FileImage", library: "Lucide" },
      { key: "add_video", label: "Ajouter vidéo", currentIcon: "FileVideo", library: "Lucide" },
      { key: "add_audio", label: "Ajouter audio", currentIcon: "FileAudio", library: "Lucide" }
    ]
  },
  {
    title: "Icônes de fichiers (Extensions)",
    description: "Icônes pour les différents types de fichiers",
    mappings: [
      { key: "ext_pdf", label: "Fichier PDF", currentIcon: "FileText", library: "Lucide" },
      { key: "ext_md", label: "Fichier Markdown", currentIcon: "FileText", library: "Lucide" },
      { key: "ext_txt", label: "Fichier texte", currentIcon: "FileText", library: "Lucide" },
      { key: "ext_doc", label: "Document Word", currentIcon: "FileText", library: "Lucide" },
      { key: "ext_docx", label: "Document Word", currentIcon: "FileText", library: "Lucide" },
      { key: "ext_xls", label: "Feuille Excel", currentIcon: "FileSpreadsheet", library: "Lucide" },
      { key: "ext_xlsx", label: "Feuille Excel", currentIcon: "FileSpreadsheet", library: "Lucide" },
      { key: "ext_ppt", label: "Présentation PowerPoint", currentIcon: "Presentation", library: "Lucide" },
      { key: "ext_pptx", label: "Présentation PowerPoint", currentIcon: "Presentation", library: "Lucide" },
      { key: "ext_image", label: "Image (jpg/png)", currentIcon: "FileImage", library: "Lucide" },
      { key: "ext_jpg", label: "Image JPG", currentIcon: "FileImage", library: "Lucide" },
      { key: "ext_jpeg", label: "Image JPEG", currentIcon: "FileImage", library: "Lucide" },
      { key: "ext_png", label: "Image PNG", currentIcon: "FileImage", library: "Lucide" },
      { key: "ext_gif", label: "Image GIF", currentIcon: "FileImage", library: "Lucide" },
      { key: "ext_svg", label: "Image SVG", currentIcon: "FileImage", library: "Lucide" },
      { key: "ext_video", label: "Vidéo", currentIcon: "FileVideo", library: "Lucide" },
      { key: "ext_mp4", label: "Vidéo MP4", currentIcon: "FileVideo", library: "Lucide" },
      { key: "ext_avi", label: "Vidéo AVI", currentIcon: "FileVideo", library: "Lucide" },
      { key: "ext_mov", label: "Vidéo MOV", currentIcon: "FileVideo", library: "Lucide" },
      { key: "ext_audio", label: "Audio", currentIcon: "FileAudio", library: "Lucide" },
      { key: "ext_mp3", label: "Audio MP3", currentIcon: "FileAudio", library: "Lucide" },
      { key: "ext_wav", label: "Audio WAV", currentIcon: "FileAudio", library: "Lucide" },
      { key: "ext_zip", label: "Archive ZIP", currentIcon: "Archive", library: "Lucide" },
      { key: "ext_rar", label: "Archive RAR", currentIcon: "Archive", library: "Lucide" },
      { key: "ext_json", label: "Fichier JSON", currentIcon: "FileCode", library: "Lucide" },
      { key: "ext_js", label: "Fichier JavaScript", currentIcon: "FileCode", library: "Lucide" },
      { key: "ext_ts", label: "Fichier TypeScript", currentIcon: "FileCode", library: "Lucide" },
      { key: "ext_html", label: "Fichier HTML", currentIcon: "FileCode", library: "Lucide" },
      { key: "ext_css", label: "Fichier CSS", currentIcon: "FileCode", library: "Lucide" }
    ]
  }
]

const renderIcon = (iconComp: any, className = "w-8 h-8") => {
  if (!iconComp) return null
  try {
    // If it's already a valid React element, clone it to apply classes/styles
    if (React.isValidElement(iconComp)) {
      return React.cloneElement(iconComp, {
        className: (iconComp.props?.className ? iconComp.props.className + ' ' : '') + className + ' text-black dark:text-white',
        style: { ...(iconComp.props?.style || {}), color: 'currentColor' }
      })
    }

    // Many icon libraries export forwardRef objects (typeof === 'object'), functions, or module default exports.
    // React.createElement handles function components and forwardRef objects uniformly.
    const Comp = iconComp?.default || iconComp
    return React.createElement(Comp, { className: className + ' text-black dark:text-white', style: { color: 'currentColor' } })
  } catch (e) {
    // fallback: nothing
    return null
  }
}

export const IconsSettings: React.FC = () => {
  const [sections, setSections] = useState<IconSection[]>(DEFAULT_SECTIONS)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["Icônes de dossiers (FolderTree)"]))
  const [openPicker, setOpenPicker] = useState(false)
  const [selected, setSelected] = useState<MappingItem | null>(null)
  const [search, setSearch] = useState("")

  // cache of currently-used MUI components (if loaded)
  const [usedMui, setUsedMui] = useState<Record<string, any>>({})

  // lucide keys
  const lucideKeys = useMemo(() => Object.keys(LucideIcons).sort(), [])

  // material-ui loader state
  const [muiIcons, setMuiIcons] = useState<Record<string, any> | null>(null)
  const [loadingMui, setLoadingMui] = useState(false)

  useEffect(() => {
    // Try load saved mappings from config.json
    const load = async () => {
      try {
        if (window.electronAPI?.loadSettings) {
          const s = await window.electronAPI.loadSettings()
          if (s && s.icons && Array.isArray(s.icons.mappings)) {
            const saved = s.icons.mappings.map((it: any) => ({
              key: String(it.key || ""),
              label: String(it.label || it.key || ""),
              currentIcon: String(it.currentIcon || "Folder"),
              library: String(it.library || "Lucide")
            }))
            // merge: keep default structure but apply saved overrides
            const mergedSections = DEFAULT_SECTIONS.map(section => ({
              ...section,
              mappings: section.mappings.map(defaultMapping => {
                const savedMapping = saved.find((x: any) => x.key === defaultMapping.key)
                return savedMapping ? { ...defaultMapping, currentIcon: savedMapping.currentIcon, library: savedMapping.library } : defaultMapping
              })
            }))
            setSections(mergedSections)
          }
        }
      } catch (err) {
        console.warn("icons-settings: failed to load saved mappings", err)
      }
    }
    load()
  }, [])

  // keep caches of currently-used icon components in sync with sections & muiIcons
  useEffect(() => {
    const muiMap: Record<string, any> = {}
    sections.forEach(section => {
      section.mappings.forEach(m => {
        if (muiIcons) {
          const comp = muiIcons[m.currentIcon]
          if (comp) muiMap[m.currentIcon] = comp
        }
      })
    })
    setUsedMui(muiMap)
  }, [sections, muiIcons])

  const saveMappings = async (nextSections: IconSection[]) => {
    try {
      // Load existing settings from config.json
      const existingSettings = window.electronAPI?.loadSettings ? await window.electronAPI.loadSettings() : {}
      
      // Flatten all mappings from sections
      const allMappings = nextSections.flatMap(section => section.mappings)
      
      // Add/update icons section
      const newSettings = { 
        ...existingSettings,
        icons: { mappings: allMappings }
      }
      
      // Save to config.json
      if (window.electronAPI?.saveSettings) {
        await window.electronAPI.saveSettings(newSettings)
      }
    } catch (err) {
      console.warn("icons-settings: failed to save mappings to config.json", err)
    }

    try {
      // notify other parts of the app
      const allMappings = nextSections.flatMap(section => section.mappings)
      const evt = new CustomEvent("iconMappingsUpdated", { detail: { mappings: allMappings } })
      window.dispatchEvent(evt)
    } catch (err) {
      const allMappings = nextSections.flatMap(section => section.mappings)
      ;(window as any).__lastIconMappings = allMappings
      window.dispatchEvent(new Event("iconMappingsUpdated"))
    }
  }

  const openFor = (mapping: MappingItem) => {
    setSelected(mapping)
    setSearch("")
    setOpenPicker(true)
  }

  const setIconForSelected = (name: string, library: string) => {
    if (!selected) return
    const updatedSections = sections.map(section => ({
      ...section,
      mappings: section.mappings.map(m => (m.key === selected.key ? { ...m, currentIcon: name, library } : m))
    }))
    setSections(updatedSections)
    saveMappings(updatedSections)
    setOpenPicker(false)
    setSelected(null)
  }

  const ensureLoadMui = async () => {
    if (muiIcons || loadingMui) return
    // Only load on client side and when explicitly requested, never during build
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV === 'production' && !window) return

    setLoadingMui(true)
    try {
      // Use eval to completely prevent static analysis from detecting the import
      const mod = await eval('import("@mui/icons-material")')
      // copy exports into a plain object (avoid referencing module namespace directly)
      const keys = Object.keys(mod).sort()
      const map: Record<string, any> = {}
      keys.forEach(k => { map[k] = (mod as any)[k] })
      setMuiIcons(map)
    } catch (err) {
      console.warn("Failed to load @mui/icons-material dynamically", err)
    } finally {
      setLoadingMui(false)
    }
  }

  const availableIcons = useMemo(() => {
    const results: Array<{ name: string; library: string; comp: any }> = []
    const s = (search || "").toLowerCase().trim()

    const pushIf = (name: string, lib: string, comp: any) => {
      if (!s || name.toLowerCase().includes(s)) results.push({ name, library: lib, comp })
    }

    lucideKeys.forEach(k => pushIf(k, "Lucide", (LucideIcons as any)[k]))

    if (muiIcons) {
      Object.keys(muiIcons).forEach(k => pushIf(k, "Material UI", muiIcons[k]))
    }

    return results.slice(0, 1000) // Increased limit for better selection
  }, [search, lucideKeys, muiIcons])

  const toggleSection = (title: string) => {
    const newOpenSections = new Set(openSections)
    if (newOpenSections.has(title)) {
      newOpenSections.delete(title)
    } else {
      newOpenSections.add(title)
    }
    setOpenSections(newOpenSections)
  }

  return (
    <div className="space-y-4">
      {/* Removed Lucide quick preview to simplify the settings UI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Icônes</CardTitle>
          <CardDescription>Personnalisez les icônes utilisées dans l'application (Lucide par défaut, Material UI sur demande).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sections.map(section => (
              <Collapsible
                key={section.title}
                open={openSections.has(section.title)}
                onOpenChange={() => toggleSection(section.title)}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                    <div className="text-left">
                      <div className="font-medium">{section.title}</div>
                      <div className="text-sm text-muted-foreground">{section.description}</div>
                    </div>
                    {openSections.has(section.title) ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {section.mappings.map(m => (
                      <div key={m.key} className="flex items-center gap-3 p-2 border rounded-md">
                        <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center">
                          {m.library === "Lucide" ? (
                            renderIcon((LucideIcons as any)[m.currentIcon], "w-10 h-10")
                          ) : (
                            // If MUI icons are loaded, render them; otherwise show a compact placeholder with the name
                            muiIcons && muiIcons[m.currentIcon] ? (
                              renderIcon(muiIcons[m.currentIcon], "w-10 h-10")
                            ) : (
                              <div className="flex flex-col items-center">
                                <div className="text-[10px] font-medium">MUI</div>
                                <div className="text-[10px] text-muted-foreground truncate max-w-[60px]">{m.currentIcon}</div>
                              </div>
                            )
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium truncate">{m.label}</div>
                          <div className="text-xs text-muted-foreground truncate">{m.key} • {m.library}</div>
                        </div>
                        <div className="shrink-0">
                          <Button size="sm" variant="outline" onClick={() => openFor(m)}>Changer</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={openPicker} onOpenChange={setOpenPicker}>
  <DialogContent className="h-[90vh] w-[120rem] max-w-[96vw] flex flex-col overflow-hidden" style={{ height: '90vh', width: '120rem', maxWidth: '96vw' }}>
          <DialogHeader className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm">
            <DialogTitle>Choisir une icône pour {selected?.label}</DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label>Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input className="pl-10" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom de l'icône..." />
              </div>
            </div>
            <div className="w-44 flex flex-col">
              <Label>Matériaux</Label>
              <div className="flex gap-2">
                <Button size="sm" onClick={ensureLoadMui} disabled={loadingMui || !!muiIcons}>{loadingMui ? 'Chargement...' : (muiIcons ? 'Chargé' : 'Charger Material UI')}</Button>
              </div>
            </div>
          </div>

            <div className="border-t pt-4 flex-1 min-h-0">
            <ScrollArea className="h-full hide-scrollbar">
              <div className="grid grid-cols-3 gap-3 p-3">
                {availableIcons.map(ic => (
                  <Button key={`${ic.library}-${ic.name}`} variant="ghost" className="flex flex-col items-center gap-1 p-3 h-auto" onClick={() => setIconForSelected(ic.name, ic.library)}>
                    <div className="w-14 h-14 flex items-center justify-center">{renderIcon(ic.comp, "w-12 h-12")}</div>
                    <div className="text-xs text-center truncate w-full">{ic.name}</div>
                    <div className="text-[10px] text-muted-foreground">{ic.library}</div>
                  </Button>
                ))}
                {availableIcons.length === 0 && <div className="p-4 text-sm text-muted-foreground col-span-3">Aucune icône trouvée. Essayez d'élargir la recherche ou de charger Material UI.</div>}
              </div>
            </ScrollArea>
          </div>

        </DialogContent>
      </Dialog>
    </div>
  )
}

export default IconsSettings

