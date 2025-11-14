import React, { useEffect, useMemo, useState } from "react"
import * as LucideIcons from "lucide-react"
import IconCustomizationModal, { IconCustomization } from "@/components/icon-customization-modal"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Search, Palette, Check } from "lucide-react"

type MappingItem = {
  key: string
  label: string
  currentIcon: string
  library: string // 'Lucide' | 'Material UI'
  customization?: IconCustomization
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

// Reusable predicate to test whether an export looks like a renderable React component
const isRenderableExport = (c: any) => {
  if (!c) return false
  if (typeof c === 'function') return true
  // React.forwardRef / memo typically return objects with $$typeof symbol
  try {
    if (typeof c === 'object' && c != null) {
      if ((c as any).$$typeof) return true
      // Some libs export objects that contain a default function
      if ((c as any).default && typeof (c as any).default === 'function') return true
    }
  } catch (e) {
    // ignore
  }
  return false
}

const renderIcon = (iconComp: any, className = "w-8 h-8") => {
  if (!iconComp) return null
  try {
    // If it's already a valid React element, clone it to apply classes/styles
    if (React.isValidElement(iconComp)) {
      const el = iconComp as React.ReactElement<any>
      return React.cloneElement(el, {
        className: (el.props?.className ? el.props.className + ' ' : '') + className + ' text-black dark:text-white',
        style: { ...(el.props?.style || {}), color: 'currentColor' }
      })
    }

    // Many icon libraries export forwardRef objects (typeof === 'object'), functions, or module default exports.
    // React.createElement handles function components and forwardRef objects uniformly.
    const Comp = iconComp?.default || iconComp

    if (!isRenderableExport(Comp)) {
      return null
    }

    try {
      // Pass a size prop as many icon libraries accept it (Phosphor, etc.)
      return React.createElement(Comp, { className: className + ' text-black dark:text-white', style: { color: 'currentColor' }, size: 20 })
    } catch (renderError) {
      return null
    }
  } catch (e) {
    return null
  }
}

export const IconsSettings: React.FC = () => {
  const [sections, setSections] = useState<IconSection[]>(DEFAULT_SECTIONS)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["Icônes de dossiers (FolderTree)"]))
  const [openPicker, setOpenPicker] = useState(false)
  const [selected, setSelected] = useState<MappingItem | null>(null)
  const [openCustomization, setOpenCustomization] = useState(false)
  const [customizationTarget, setCustomizationTarget] = useState<MappingItem | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [search, setSearch] = useState("")
  const [selectedLibrary, setSelectedLibrary] = useState<string>('Lucide')

  console.log('IconsSettings: component mounted, window.electronAPI available:', !!window.electronAPI)

  // Known working Lucide icons - whitelist to avoid rendering issues
  const lucideKeys = useMemo(() => {
    const workingIcons = [
      'Folder', 'FolderOpen', 'FileText', 'FilePlus', 'Palette', 'Table', 'Presentation', 
      'FileImage', 'FileVideo', 'FileAudio', 'FileCode', 'Archive', 'File', 'Image', 
      'Video', 'Camera', 'Mic', 'Upload', 'Download', 'Edit', 'Trash', 'Copy', 'Scissors',
      'Plus', 'Minus', 'Search', 'Settings', 'User', 'Users', 'Home', 'Star', 'Heart',
      'Check', 'X', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight', 'ArrowRight',
      'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Play', 'Pause', 'Stop', 'Volume2', 'VolumeX',
      'Eye', 'EyeOff', 'Lock', 'Unlock', 'Key', 'Mail', 'Phone', 'MapPin', 'Calendar',
      'Clock', 'Sun', 'Moon', 'Cloud', 'Zap', 'Battery', 'Wifi', 'Bluetooth', 'Printer',
      'Monitor', 'Mouse', 'Keyboard', 'HardDrive', 'Save', 'Share', 'Link', 'ExternalLink',
      'Bookmark', 'Tag', 'Flag', 'Bell', 'MessageCircle', 'MessageSquare', 'Send',
      'Inbox', 'Outbox', 'Archive', 'Package', 'Box', 'ShoppingCart', 'CreditCard',
      'DollarSign', 'Euro', 'TrendingUp', 'TrendingDown', 'BarChart', 'PieChart',
      'Activity', 'Target', 'Award', 'Gift', 'Coffee', 'Smile', 'Frown', 'Meh'
    ];
    
    // Deduplicate and ensure the icon actually exists on the Lucide export
    return Array.from(new Set(
      workingIcons.filter(key => (LucideIcons as any)[key]) // Ensure the icon exists
    )).sort();
  }, [])

  // Phosphor dynamic loader state
  const [phosphorModule, setPhosphorModule] = useState<Record<string, any> | null>(null)
  const [phosphorKeys, setPhosphorKeys] = useState<string[]>([])

  // Tabler dynamic loader state
  const [tablerModule, setTablerModule] = useState<Record<string, any> | null>(null)
  const [tablerKeys, setTablerKeys] = useState<string[]>([])

  // React-Icons dynamic loader state (merge a few popular packs)
  const [reactIconsModule, setReactIconsModule] = useState<Record<string, any> | null>(null)
  const [reactIconsKeys, setReactIconsKeys] = useState<string[]>([])

  const loadPhosphor = async () => {
    if (phosphorModule) return
    try {
      const mod = await import('phosphor-react')
      setPhosphorModule(mod as any)
      // Only keep exports that look like icon components. Filter by name and shape.
      const blacklist = new Set(['default', 'Context', 'Provider', 'Consumer', 'IconContext'])
      const keys = Object.keys(mod).filter(k => {
        if (!k || blacklist.has(k)) return false
        // keep typical PascalCase icon names like Archive, FileText, Camera
        if (!/^[A-Z][A-Za-z0-9_]+$/.test(k)) return false
        try {
          const exportVal = (mod as any)[k]
          return isRenderableExport(exportVal)
        } catch (e) {
          return false
        }
      })
      setPhosphorKeys(keys.sort())
      console.log('icons-settings: loaded phosphor-react, keys:', keys.length, 'sample:', keys.slice(0,20))
    } catch (err) {
      console.warn('icons-settings: failed to load phosphor-react', err)
    }
  }

  const loadTabler = async () => {
    if (tablerModule) return
    try {
      const mod = await import('tabler-icons-react')
      setTablerModule(mod as any)
      const blacklist = new Set(['default', 'Context', 'Provider', 'Consumer', 'IconContext'])
      const keys = Object.keys(mod).filter(k => {
        if (!k || blacklist.has(k)) return false
        if (!/^[A-Z][A-Za-z0-9_]+$/.test(k)) return false
        try {
          const exportVal = (mod as any)[k]
          return isRenderableExport(exportVal)
        } catch (e) {
          return false
        }
      })
      setTablerKeys(keys.sort())
      console.log('icons-settings: loaded tabler-icons-react, keys:', keys.length, 'sample:', keys.slice(0,20))
    } catch (err) {
      console.warn('icons-settings: failed to load tabler-icons-react', err)
    }
  }

  const loadReactIcons = async () => {
    if (reactIconsModule) return
    try {
      // load a small set of popular packs to keep things manageable
      const [fa, md, ai] = await Promise.all([
        import('react-icons/fa'),
        import('react-icons/md'),
        import('react-icons/ai')
      ])
      // Merge exports into one map
      const merged: Record<string, any> = Object.assign({}, fa, md, ai)
      setReactIconsModule(merged)
      const blacklist = new Set(['default'])
      const keys = Object.keys(merged).filter(k => {
        if (!k || blacklist.has(k)) return false
        // react-icons names often start with a prefix like Fa, Md, Ai followed by PascalCase
        if (!/^[A-Z][A-Za-z0-9]+$/.test(k)) return false
        try {
          return isRenderableExport((merged as any)[k])
        } catch (e) {
          return false
        }
      })
      setReactIconsKeys(keys.sort())
      console.log('icons-settings: loaded react-icons packs, keys:', keys.length, 'sample:', keys.slice(0,20))
    } catch (err) {
      console.warn('icons-settings: failed to load react-icons packs', err)
    }
  }

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
                if (savedMapping) {
                  // Check if the saved icon exists in LucideIcons
                  const comp = (LucideIcons as any)[savedMapping.currentIcon]
                  const iconExists = comp && typeof comp === 'object' && comp.$$typeof
                  return {
                    ...defaultMapping,
                    currentIcon: iconExists ? savedMapping.currentIcon : defaultMapping.currentIcon,
                    library: savedMapping.library || "Lucide",
                    customization: savedMapping.customization || undefined
                  }
                }
                return defaultMapping
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



  const saveMappings = async (nextSections: IconSection[]) => {
    console.log('icons-settings: saveMappings called with', nextSections.length, 'sections')
    setSaveStatus('saving')
    try {
      // Load existing settings from config.json
      console.log('icons-settings: checking window.electronAPI', !!window.electronAPI)
      const existingSettings = window.electronAPI?.loadSettings ? await window.electronAPI.loadSettings() : {}
      console.log('icons-settings: loaded existing settings', existingSettings)

      // Flatten all mappings from sections (guard in case a section has no mappings)
      const allMappings = nextSections.flatMap(section => section.mappings || [])
      console.log('icons-settings: flattened mappings', allMappings.length, 'mappings')

      // Add/update icons section
      const newSettings = {
        ...existingSettings,
        icons: { mappings: allMappings }
      }
      console.log('icons-settings: new settings to save', newSettings)

      // Save to config.json
      if (window.electronAPI?.saveSettings) {
        console.log('icons-settings: calling saveSettings')
        await window.electronAPI.saveSettings(newSettings)
        console.log('icons-settings: saveSettings completed successfully')
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000) // Reset after 2 seconds
      } else {
        console.log('icons-settings: window.electronAPI.saveSettings not available')
        throw new Error('Electron API not available')
      }
    } catch (err) {
      console.warn("icons-settings: failed to save mappings to config.json", err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000) // Reset after 3 seconds
    }

    try {
      // notify other parts of the app
      const allMappings = nextSections.flatMap(section => section.mappings || [])
      console.log('icons-settings: dispatching iconMappingsUpdated event with', allMappings.length, 'mappings')
      const evt = new CustomEvent("iconMappingsUpdated", { detail: { mappings: allMappings } })
      window.dispatchEvent(evt)
    } catch (err) {
      console.warn('icons-settings: failed to dispatch event', err)
      const allMappings = nextSections.flatMap(section => section.mappings || [])
      ;(window as any).__lastIconMappings = allMappings
      window.dispatchEvent(new Event("iconMappingsUpdated"))
    }
  }

  const openFor = (mapping: MappingItem) => {
    setSelected(mapping)
    setSearch("")
    setOpenPicker(true)
    // Preload additional libraries on demand
    // load Phosphor when opening the picker so keys are available
    loadPhosphor().catch(() => {})
  }

  const setIconForSelected = (name: string, library?: string) => {
    if (!selected) return
    const lib = library || selected.library || 'Lucide'
    const updatedSections = sections.map(section => ({
      ...section,
      mappings: (section.mappings || []).map(m => (m.key === selected.key ? { ...m, currentIcon: name, library: lib } : m))
    }))
    setSections(updatedSections)
    saveMappings(updatedSections)
    setOpenPicker(false)
    setSelected(null)
  }

  const openCustomizationFor = (mapping: MappingItem) => {
    setCustomizationTarget(mapping)
    setOpenCustomization(true)
  }

  const handleSaveCustomization = (key: string | undefined, customization: IconCustomization) => {
    if (!key) return
    const updatedSections = sections.map(section => ({
      ...section,
      mappings: (section.mappings || []).map(m => (m.key === key ? { ...m, customization } : m))
    }))
    setSections(updatedSections)
    saveMappings(updatedSections)
    setCustomizationTarget(null)
    setOpenCustomization(false)
  }

  const resolveIconCompForMapping = (m?: MappingItem) => {
    if (!m) return null
    try {
      if (m.library === 'Phosphor' && phosphorModule && (phosphorModule as any)[m.currentIcon]) return (phosphorModule as any)[m.currentIcon]
      if (m.library === 'Tabler' && tablerModule && (tablerModule as any)[m.currentIcon]) return (tablerModule as any)[m.currentIcon]
      if (m.library === 'ReactIcons' && reactIconsModule && (reactIconsModule as any)[m.currentIcon]) return (reactIconsModule as any)[m.currentIcon]
      if ((LucideIcons as any)[m.currentIcon]) return (LucideIcons as any)[m.currentIcon]
    } catch (e) {
      return (LucideIcons as any).Folder
    }
    return (LucideIcons as any).Folder
  }



  // Library metadata for the visual dropdown. Declared after loader functions to avoid
  // referencing loader identifiers before they're defined (TypeScript strictness).
  const LIBRARIES: Array<{
    id: string
    label: string
    logo: string
    loader?: () => Promise<void>
  }> = [
    { id: 'All', label: 'Toutes', logo: '/icons/library-logos/all.svg', loader: async () => { await Promise.all([loadPhosphor(), loadTabler(), loadReactIcons()]) } },
    { id: 'Lucide', label: 'Lucide', logo: '/icons/library-logos/lucide.svg' },
    { id: 'Phosphor', label: 'Phosphor', logo: '/icons/library-logos/phosphor.svg', loader: loadPhosphor },
    { id: 'Tabler', label: 'Tabler', logo: '/icons/library-logos/tabler.svg', loader: loadTabler },
    { id: 'ReactIcons', label: 'React-Icons', logo: '/icons/library-logos/react-icons.svg', loader: loadReactIcons }
  ]

  const availableIcons = useMemo(() => {
    const results: Array<{ name: string; library: string; comp: any }> = []
    const s = (search || "").toLowerCase().trim()

    const pushIf = (name: string, lib: string, comp: any) => {
      if (!s || name.toLowerCase().includes(s)) results.push({ name, library: lib, comp })
    }

    // only include icons from the selected library to avoid mixing
    if (selectedLibrary === 'Lucide' || selectedLibrary === 'All') {
      lucideKeys.forEach(k => pushIf(k, 'Lucide', (LucideIcons as any)[k]))
    }
    // include phosphor icons when selected or when 'All' is chosen and Phosphor has been loaded
    if ((selectedLibrary === 'Phosphor' || selectedLibrary === 'All') && phosphorModule) {
      phosphorKeys.forEach(k => pushIf(k, 'Phosphor', (phosphorModule as any)[k]))
    }
    // include tabler icons when selected or when 'All' is chosen and Tabler has been loaded
    if ((selectedLibrary === 'Tabler' || selectedLibrary === 'All') && tablerModule) {
      tablerKeys.forEach(k => pushIf(k, 'Tabler', (tablerModule as any)[k]))
    }
    // include react-icons when selected or when 'All' is chosen and react-icons have been loaded
    if ((selectedLibrary === 'ReactIcons' || selectedLibrary === 'All') && reactIconsModule) {
      reactIconsKeys.forEach(k => pushIf(k, 'ReactIcons', (reactIconsModule as any)[k]))
    }

    return results.slice(0, 2000) // Increased limit for better selection
  }, [search, lucideKeys, selectedLibrary, phosphorModule, phosphorKeys])




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
          <CardDescription>Personnalisez les icônes utilisées dans l'application.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Debug button for testing Electron API */}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={async () => {
                  console.log('Testing Electron API availability...')
                  console.log('window.electronAPI:', window.electronAPI)
                  if (window.electronAPI?.saveSettings) {
                    try {
                      const testData = { test: 'icons-api-test', timestamp: Date.now() }
                      console.log('Calling saveSettings with:', testData)
                      await window.electronAPI.saveSettings(testData)
                      console.log('saveSettings succeeded')
                      alert('API test successful!')
                    } catch (err) {
                      console.error('saveSettings failed:', err)
                      alert('API test failed: ' + err)
                    }
                  } else {
                    console.log('window.electronAPI.saveSettings not available')
                    alert('Electron API not available')
                  }
                }}
              >
                Test API
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={async () => {
                  console.log('Testing loadSettings...')
                  if (window.electronAPI?.loadSettings) {
                    try {
                      const data = await window.electronAPI.loadSettings()
                      console.log('loadSettings result:', data)
                      alert('Load successful: ' + JSON.stringify(data, null, 2))
                    } catch (err) {
                      console.error('loadSettings failed:', err)
                      alert('Load failed: ' + err)
                    }
                  } else {
                    alert('Load API not available')
                  }
                }}
              >
                Test Load
              </Button>
            </div>

            {/* Save status indicator */}
            {saveStatus !== 'idle' && (
              <div className={`text-sm p-2 rounded-md ${
                saveStatus === 'saving' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                saveStatus === 'saved' ? 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300' :
                'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300'
              }`}>
                {saveStatus === 'saving' && 'Sauvegarde en cours...'}
                {saveStatus === 'saved' && '✓ Icônes sauvegardées'}
                {saveStatus === 'error' && '✗ Erreur de sauvegarde'}
              </div>
            )}
            
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
                    {(section.mappings || []).map(m => {
                      // Resolve icon component based on mapping.library
                      let comp: any = null
                      try {
                        if (m.library === 'Phosphor' && phosphorModule && (phosphorModule as any)[m.currentIcon]) comp = (phosphorModule as any)[m.currentIcon]
                        else if (m.library === 'Tabler' && tablerModule && (tablerModule as any)[m.currentIcon]) comp = (tablerModule as any)[m.currentIcon]
                        else if (m.library === 'ReactIcons' && reactIconsModule && (reactIconsModule as any)[m.currentIcon]) comp = (reactIconsModule as any)[m.currentIcon]
                        else if ((LucideIcons as any)[m.currentIcon]) comp = (LucideIcons as any)[m.currentIcon]
                      } catch (e) {
                        comp = (LucideIcons as any).Folder
                      }

                      const customization = m.customization
                      const bg = customization?.bgColor || 'rgba(0,0,0,0.04)'
                      const iconColor = customization?.iconColor || 'currentColor'
                      const shape = customization?.shape || 'rounded'
                      const size = customization?.size || 32

                      const wrapperStyle: React.CSSProperties = {
                        background: bg,
                        width: 48,
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: shape === 'circle' ? 9999 : shape === 'rounded' ? 10 : 4,
                        color: iconColor
                      }

                      const iconClass = `w-${Math.max(6, Math.round(size / 4))} h-${Math.max(6, Math.round(size / 4))}`

                      return (
                        <div key={m.key} className="flex items-center gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                          {shape === 'none' ? (
                            <div className="flex-shrink-0" style={{ color: iconColor }}>
                              {renderIcon(comp, iconClass) || renderIcon((LucideIcons as any).Folder, "w-8 h-8")}
                            </div>
                          ) : (
                            <div style={wrapperStyle} className="flex-shrink-0">
                              {renderIcon(comp, iconClass) || renderIcon((LucideIcons as any).Folder, "w-8 h-8")}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{m.label}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              Icône actuelle: <span className="font-mono text-primary">{m.currentIcon}</span>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => openFor(m)}>
                              Changer
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openCustomizationFor(m)}>
                              Personnaliser
                            </Button>
                          </div>
                        </div>
                      )
                    })}
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
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      {selectedLibrary}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {LIBRARIES.map(lib => (
                      <DropdownMenuItem key={lib.id} onSelect={async () => {
                        setSelectedLibrary(lib.id)
                        // call loader if provided
                        if (lib.loader) {
                          try { await lib.loader() } catch (e) { /* ignore */ }
                        }
                      }}>
                        {lib.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input className="pl-10" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom de l'icône..." />
                </div>
              </div>
            </div>
          </div>

            <div className="border-t pt-4 flex-1 min-h-0">
            <ScrollArea className="h-full hide-scrollbar">
              <div className="grid grid-cols-3 gap-3 p-3">
                {availableIcons.map(ic => {
                  const isCurrent = selected && ic.name === selected.currentIcon
                  return (
                    <Button 
                      key={`${ic.library}-${ic.name}`} 
                      variant={isCurrent ? "default" : "ghost"} 
                      className={`flex flex-col items-center gap-1 p-3 h-auto relative ${
                        isCurrent ? 'ring-2 ring-primary' : ''
                      }`} 
                      onClick={() => setIconForSelected(ic.name, ic.library)}
                    >
                      {isCurrent && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      )}
                      <div className="w-20 h-20 flex items-center justify-center">{renderIcon(ic.comp, "w-16 h-16")}</div>
                      <div className="text-xs text-center truncate w-full">{ic.name}</div>
                      <div className="text-[10px] text-muted-foreground">{ic.library}</div>
                    </Button>
                  )
                })}
                {availableIcons.length === 0 && <div className="p-4 text-sm text-muted-foreground col-span-3">Aucune icône trouvée. Essayez d'élargir la recherche.</div>}
              </div>
            </ScrollArea>
          </div>

        </DialogContent>
      </Dialog>
      <IconCustomizationModal
        open={openCustomization}
        onOpenChange={setOpenCustomization}
        mappingKey={customizationTarget?.key}
        mappingLabel={customizationTarget?.label}
  iconComp={resolveIconCompForMapping(customizationTarget ?? undefined)}
        initial={customizationTarget?.customization}
        onSave={handleSaveCustomization}
      />
    </div>
  )
}

export default IconsSettings

