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
import { ChevronDown, ChevronRight, Search, Palette, Check, X } from "lucide-react"

// Config preview removed: buttons that exposed or copied raw config were removed per request.

type MappingItem = {
  key: string
  label: string
  currentIcon: string
  library: string // 'Lucide' | 'Material UI'
  customization?: IconCustomization
  // optional context: 'expanded' | 'collapsed' | undefined (undefined === expanded/general)
  context?: 'expanded' | 'collapsed'
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
    title: "Icônes de dossiers (FileManager)",
    description: "Icônes utilisées pour les dossiers dans le gestionnaire de fichiers",
    mappings: [
      { key: "fm_folder_grid", label: "Dossier (vue grille)", currentIcon: "Folder", library: "Lucide" },
      { key: "fm_folder_list", label: "Dossier (vue liste)", currentIcon: "Folder", library: "Lucide" }
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
  // Collapsed sidebar specific mappings — users can override the compact icons independently
  {
    title: "Icônes d'ajout (Sidebar — réduit)",
    description: "Icônes utilisées lorsque la barre latérale est réduite (collapsed)",
    mappings: [
      { key: "add_folder", label: "Ajouter dossier (réduit)", currentIcon: "FolderPlus", library: "Lucide", context: 'collapsed' },
      { key: "add_note", label: "Ajouter note (réduit)", currentIcon: "FilePlus", library: "Lucide", context: 'collapsed' },
      { key: "add_draw", label: "Ajouter dessin (réduit)", currentIcon: "Palette", library: "Lucide", context: 'collapsed' },
      { key: "add_excel", label: "Ajouter tableur (réduit)", currentIcon: "Table", library: "Lucide", context: 'collapsed' },
      { key: "add_powerpoint", label: "Ajouter présentation (réduit)", currentIcon: "Presentation", library: "Lucide", context: 'collapsed' },
      { key: "add_pdf", label: "Ajouter PDF (réduit)", currentIcon: "FileText", library: "Lucide", context: 'collapsed' },
      { key: "add_image", label: "Ajouter image (réduit)", currentIcon: "FileImage", library: "Lucide", context: 'collapsed' },
      { key: "add_video", label: "Ajouter vidéo (réduit)", currentIcon: "FileVideo", library: "Lucide", context: 'collapsed' },
      { key: "add_audio", label: "Ajouter audio (réduit)", currentIcon: "FileAudio", library: "Lucide", context: 'collapsed' }
    ]
  },
  {
    title: "Icônes de la page d'accueil",
    description: "Icônes utilisées pour les cartes de la page d'accueil",
    mappings: [
      { key: "landing_folder", label: "Carte Arborescence", currentIcon: "FolderTree", library: "Lucide" },
      { key: "landing_recents", label: "Carte Fichiers Récents", currentIcon: "Clock", library: "Lucide" },
      { key: "landing_create", label: "Carte Créer Nouveau", currentIcon: "Plus", library: "Lucide" }
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
  { key: "ext_oga", label: "Audio OGA", currentIcon: "FileAudio", library: "Lucide" },
  { key: "ext_webm", label: "Vidéo WEBM", currentIcon: "FileVideo", library: "Lucide" },
  { key: "ext_draw", label: "Dessin (draw)", currentIcon: "FileImage", library: "Lucide" },
      { key: "ext_zip", label: "Archive ZIP", currentIcon: "Archive", library: "Lucide" },
      { key: "ext_rar", label: "Archive RAR", currentIcon: "Archive", library: "Lucide" },
  // Additional common extensions
  { key: "ext_csv", label: "Fichier CSV", currentIcon: "FileSpreadsheet", library: "Lucide" },
  { key: "ext_json", label: "Fichier JSON", currentIcon: "FileCode", library: "Lucide" },
  { key: "ext_js", label: "Fichier JavaScript", currentIcon: "FileCode", library: "Lucide" },
  { key: "ext_jsx", label: "Fichier JSX", currentIcon: "FileCode", library: "Lucide" },
  { key: "ext_ts", label: "Fichier TypeScript", currentIcon: "FileCode", library: "Lucide" },
  { key: "ext_tsx", label: "Fichier TSX", currentIcon: "FileCode", library: "Lucide" },
  
  { key: "ext_rb", label: "Fichier Ruby", currentIcon: "FileCode", library: "Lucide" },
  { key: "ext_go", label: "Fichier Go", currentIcon: "FileCode", library: "Lucide" },
  { key: "ext_rs", label: "Fichier Rust", currentIcon: "FileCode", library: "Lucide" },
  { key: "ext_c", label: "Fichier C", currentIcon: "FileCode", library: "Lucide" },
  { key: "ext_cpp", label: "Fichier C++", currentIcon: "FileCode", library: "Lucide" },
  { key: "ext_cs", label: "Fichier C#", currentIcon: "FileCode", library: "Lucide" },
  { key: "ext_java", label: "Fichier Java", currentIcon: "FileCode", library: "Lucide" },
  { key: "ext_yaml", label: "Fichier YAML", currentIcon: "FileCode", library: "Lucide" },
  { key: "ext_yml", label: "Fichier YAML", currentIcon: "FileCode", library: "Lucide" },
  { key: "ext_toml", label: "Fichier TOML", currentIcon: "FileCode", library: "Lucide" },
  { key: "ext_ini", label: "Fichier INI", currentIcon: "FileCode", library: "Lucide" },
  { key: "ext_lock", label: "Fichier lock", currentIcon: "Lock", library: "Lucide" },
  { key: "ext_rtf", label: "Fichier RTF", currentIcon: "FileText", library: "Lucide" },
  { key: "ext_odt", label: "OpenDocument Texte (ODT)", currentIcon: "FileText", library: "Lucide" },
  { key: "ext_ods", label: "OpenDocument Feuille (ODS)", currentIcon: "FileSpreadsheet", library: "Lucide" },
  { key: "ext_odp", label: "OpenDocument Présentation (ODP)", currentIcon: "Presentation", library: "Lucide" },
  { key: "ext_epub", label: "EPUB", currentIcon: "FileText", library: "Lucide" },
  { key: "ext_mobi", label: "MOBI", currentIcon: "FileText", library: "Lucide" },
  { key: "ext_psd", label: "Fichier Photoshop (PSD)", currentIcon: "FileImage", library: "Lucide" },
  { key: "ext_exe", label: "Exécutable (EXE)", currentIcon: "Package", library: "Lucide" },
  { key: "ext_dmg", label: "Image macOS (DMG)", currentIcon: "HardDrive", library: "Lucide" },
  { key: "ext_iso", label: "Image ISO", currentIcon: "HardDrive", library: "Lucide" },
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

const renderIcon = (iconComp: any, className = "w-8 h-8", sizePx?: number) => {
  if (!iconComp) return null
  try {
    // If it's already a valid React element, clone it to apply classes/styles and optional sizing
    if (React.isValidElement(iconComp)) {
      const el = iconComp as React.ReactElement<any>
      const style = { ...(el.props?.style || {}), color: 'currentColor' } as React.CSSProperties
      if (sizePx) {
        style.width = sizePx
        style.height = sizePx
      }
      return React.cloneElement(el, {
        className: (el.props?.className ? el.props.className + ' ' : '') + className + ' text-black dark:text-white',
        style
      })
    }

    const Comp = iconComp?.default || iconComp
    if (!isRenderableExport(Comp)) return null

    try {
      // Provide both a size prop (for icon libraries that accept it) and inline width/height
      const style: React.CSSProperties = { color: 'currentColor' }
      if (sizePx) {
        style.width = sizePx
        style.height = sizePx
        // When sizePx is provided, don't use Tailwind width/height classes that might conflict
        className = className.replace(/w-\d+\s*h-\d+/g, '').trim() || 'text-black dark:text-white'
      }
      return React.createElement(Comp, { className: className + (sizePx ? '' : ' text-black dark:text-white'), style, size: sizePx || 20 })
    } catch (renderError) {
      return null
    }
  } catch (e) {
    return null
  }
}

interface IconsSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: () => void
  context?: string
}

export const IconsSettings: React.FC<IconsSettingsProps> = ({ open, onOpenChange, onSave, context }) => {
  const [sections, setSections] = useState<IconSection[]>(DEFAULT_SECTIONS)
  // By default keep all sections collapsed when opening the Icons tab
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())
  const [openPicker, setOpenPicker] = useState(false)
  const [selected, setSelected] = useState<MappingItem | null>(null)
  const lastOpenedMappingKeyRef = React.useRef<string | null>(null)
  const [openCustomization, setOpenCustomization] = useState(false)
  const [customizationTarget, setCustomizationTarget] = useState<MappingItem | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [search, setSearch] = useState("")
  const [selectedLibrary, setSelectedLibrary] = useState<string>('Lucide')

  // Filter sections based on context
  const filteredSections = useMemo(() => {
    if (!context) return sections
    if (context === 'folder') {
      return sections.filter(s => s.title === "Icônes de dossiers (FolderTree)" || s.title === "Icônes de fichiers (Extensions)")
    }
    if (context === 'recents') {
      return sections.filter(s => s.title === "Icônes de fichiers (Extensions)")
    }
    if (context === 'create') {
      return sections.filter(s => s.title === "Icônes d'ajout (Sidebar)")
    }
    return sections
  }, [sections, context])

  console.log('IconsSettings: component mounted, window.electronAPI available:', typeof window !== 'undefined' && !!window.electronAPI)

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
      return mod
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
      return mod
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
      return merged
    } catch (err) {
      console.warn('icons-settings: failed to load react-icons packs', err)
    }
  }

  useEffect(() => {
    // Will load saved mappings from config.json. Also callable on demand (event listener).
  const loadSavedMappings = async () => {
      try {
        if (window.electronAPI?.loadSettings) {
          const s = await window.electronAPI.loadSettings()
          if (s && s.icons && Array.isArray(s.icons.mappings)) {
            // collapsedMappings is optional and contains overrides used when sidebar is collapsed
            const collapsedSaved = Array.isArray(s.icons.collapsedMappings) ? s.icons.collapsedMappings : []
            // Check which libraries are used in saved mappings and preload them
            const usedLibraries = new Set(s.icons.mappings.map((it: any) => String(it.library || "Lucide")))
            const preloadPromises = []
            if (usedLibraries.has('Phosphor')) preloadPromises.push(loadPhosphor().catch(() => {}))
            if (usedLibraries.has('Tabler')) preloadPromises.push(loadTabler().catch(() => {}))
            if (usedLibraries.has('ReactIcons')) preloadPromises.push(loadReactIcons().catch(() => {}))
            await Promise.all(preloadPromises)

            // Preload actual modules and use the returned module objects to check existence immediately
            const phosphorLoaded = usedLibraries.has('Phosphor') ? await loadPhosphor().catch(() => null) : phosphorModule
            const tablerLoaded = usedLibraries.has('Tabler') ? await loadTabler().catch(() => null) : tablerModule
            const reactIconsLoaded = usedLibraries.has('ReactIcons') ? await loadReactIcons().catch(() => null) : reactIconsModule

            // Helper: check for icon existence in the right library (use returned modules first, fall back to state)
            const iconExistsInLibrary = (lib: string, iconName: string) => {
              try {
                if (lib === 'Lucide') return !!(LucideIcons as any)[iconName]
                if (lib === 'Phosphor') return !!(phosphorLoaded as any)?.[iconName] || !!(phosphorModule as any)?.[iconName]
                if (lib === 'Tabler') return !!(tablerLoaded as any)?.[iconName] || !!(tablerModule as any)?.[iconName]
                if (lib === 'ReactIcons') return !!(reactIconsLoaded as any)?.[iconName] || !!(reactIconsModule as any)?.[iconName]
                return false
              } catch (e) {
                return false
              }
            }

            const saved = s.icons.mappings.map((it: any) => ({
              key: String(it.key || ""),
              label: String(it.label || it.key || ""),
              currentIcon: String(it.currentIcon || "Folder"),
              library: String(it.library || "Lucide"),
              customization: it.customization,
              context: it.context || 'expanded'
            }))
            const savedCollapsed = collapsedSaved.map((it: any) => ({
              key: String(it.key || ""),
              label: String(it.label || it.key || ""),
              currentIcon: String(it.currentIcon || "Folder"),
              library: String(it.library || "Lucide"),
              customization: it.customization,
              context: 'collapsed'
            }))
            // merge: keep default structure but apply saved overrides
            const mergedSections = DEFAULT_SECTIONS.map(section => ({
              ...section,
              mappings: section.mappings.map(defaultMapping => {
                // Prefer collapsed saved mapping when this defaultMapping is a collapsed context
                const savedMappingCollapsed = savedCollapsed.find((x: any) => x.key === defaultMapping.key)
                if (savedMappingCollapsed && defaultMapping.context === 'collapsed') {
                  const lib = savedMappingCollapsed.library || 'Lucide'
                  const exists = iconExistsInLibrary(lib, savedMappingCollapsed.currentIcon)
                  if (exists) {
                    return {
                      ...defaultMapping,
                      currentIcon: savedMappingCollapsed.currentIcon,
                      library: lib,
                      customization: savedMappingCollapsed.customization || undefined,
                      context: 'collapsed'
                    }
                  }
                }

                const savedMapping = saved.find((x: any) => x.key === defaultMapping.key && (x.context === undefined || x.context === 'expanded'))
                if (savedMapping) {
                  const lib = savedMapping.library || 'Lucide'
                  const exists = iconExistsInLibrary(lib, savedMapping.currentIcon)
                  if (exists) {
                    return {
                      ...defaultMapping,
                      currentIcon: savedMapping.currentIcon,
                      library: lib,
                      customization: savedMapping.customization || undefined,
                      context: savedMapping.context || 'expanded'
                    }
                  }
                  if (iconExistsInLibrary('Lucide', savedMapping.currentIcon)) {
                    return { ...defaultMapping, currentIcon: savedMapping.currentIcon, library: 'Lucide', customization: savedMapping.customization || undefined }
                  }
                  console.warn('icons-settings: saved icon not found in any loaded libraries, falling back to default', savedMapping)
                  return defaultMapping
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

    // initial load
    loadSavedMappings()

    // Listen for updates (when other parts save mappings) and reload when the window becomes visible
    const onIconMappingsUpdated = () => { loadSavedMappings().catch(() => {}) }
    window.addEventListener('iconMappingsUpdated', onIconMappingsUpdated as EventListener)
    const onVisibility = () => { if (document.visibilityState === 'visible') { loadSavedMappings().catch(() => {}) } }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('iconMappingsUpdated', onIconMappingsUpdated as EventListener)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])



  const saveMappings = async (nextSections: IconSection[]) => {
    console.log('icons-settings: saveMappings called with', nextSections.length, 'sections')
    setSaveStatus('saving')
    try {
      // Load existing settings from config.json
      console.log('icons-settings: checking window.electronAPI', !!window.electronAPI)
      const existingSettings = window.electronAPI?.loadSettings ? await window.electronAPI.loadSettings() : {}
      console.log('icons-settings: loaded existing settings', existingSettings)

      // Flatten mappings and split into expanded vs collapsed with robust classification.
      const allMappings = nextSections.flatMap(section => section.mappings || [])
      const expandedMappings: any[] = []
      const collapsedMappings: any[] = []

      // Helper to determine if a mapping label hints it's the reduced/collapsed version
      const looksLikeCollapsed = (m: any) => {
        try {
          return typeof m.label === 'string' && /réduit|reduit|collapsed|compact/i.test(m.label)
        } catch (e) { return false }
      }

      // Group by key to handle duplicates (expanded + collapsed entries sharing same key)
      const byKey: Record<string, any[]> = {}
      allMappings.forEach(m => {
        if (!m || !m.key) return
        byKey[m.key] = byKey[m.key] || []
        byKey[m.key].push(m)
      })

      Object.keys(byKey).forEach(key => {
        const group = byKey[key]
        // Prefer explicit context markers
        const explicitCollapsed = group.find(g => (g as any).context === 'collapsed')
        const explicitExpanded = group.find(g => (g as any).context === 'expanded' || !(g as any).context)

        if (explicitCollapsed) {
          collapsedMappings.push({ ...explicitCollapsed, context: 'collapsed' })
        } else {
          // fallback: find by label hint
          const hinted = group.find(g => looksLikeCollapsed(g))
          if (hinted) {
            collapsedMappings.push({ ...hinted, context: 'collapsed' })
          }
        }

        if (explicitExpanded) {
          expandedMappings.push({ ...explicitExpanded, context: 'expanded' })
        } else {
          // choose first non-collapsed as expanded
          const nonCollapsed = group.find(g => ((g as any).context || 'expanded') !== 'collapsed')
          if (nonCollapsed) expandedMappings.push({ ...nonCollapsed, context: 'expanded' })
        }
      })

      console.log('icons-settings: flattened mappings', allMappings.length, 'mappings', { expanded: expandedMappings.length, collapsed: collapsedMappings.length })

      // Sanitize mappings to ensure only plain JSON-serializable fields are written
      const sanitize = (m: any) => ({
        key: String(m.key || ""),
        label: String(m.label || m.key || ""),
        currentIcon: String(m.currentIcon || ""),
        library: String(m.library || "Lucide"),
        customization: m.customization ? JSON.parse(JSON.stringify(m.customization)) : undefined,
        context: m.context || undefined
      })

      const sanitizedExpanded = expandedMappings.map(sanitize)
      const sanitizedCollapsed = collapsedMappings.map(sanitize)

      // Add/update icons section: keep backward-compatible `mappings` for expanded/general
      const newSettings = {
        ...existingSettings,
        icons: { mappings: sanitizedExpanded, collapsedMappings: sanitizedCollapsed }
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
      // notify other parts of the app with both expanded and collapsed lists
      const allMappings = nextSections.flatMap(section => section.mappings || [])
      const expandedMappings = allMappings.filter(m => !(m as any).context || (m as any).context === 'expanded')
      const collapsedMappings = allMappings.filter(m => (m as any).context === 'collapsed')
      console.log('icons-settings: dispatching iconMappingsUpdated event with', { expanded: expandedMappings.length, collapsed: collapsedMappings.length })
      const evt = new CustomEvent("iconMappingsUpdated", { detail: { mappings: expandedMappings, collapsedMappings } })
      window.dispatchEvent(evt)
    } catch (err) {
      console.warn('icons-settings: failed to dispatch event', err)
      const allMappings = nextSections.flatMap(section => section.mappings || [])
      ;(window as any).__lastIconMappings = allMappings.filter(m => !(m as any).context || (m as any).context === 'expanded')
      ;(window as any).__lastIconMappingsCollapsed = allMappings.filter(m => (m as any).context === 'collapsed')
      window.dispatchEvent(new Event("iconMappingsUpdated"))
    }
  }

  const openFor = (mapping: MappingItem) => {
    setSelected(mapping)
    setSearch("")
    setOpenPicker(true)
    // keep a ref copy to avoid timing/race issues when user clicks quickly in the picker
    lastOpenedMappingKeyRef.current = mapping.key
    // Preload additional libraries on demand
    // preload other icon libraries so user can immediately pick from them (avoids race where module isn't loaded yet)
    Promise.all([loadPhosphor().catch(() => {}), loadTabler().catch(() => {}), loadReactIcons().catch(() => {})]).catch(() => {})
  }

  const setIconForSelected = async (name: string, library?: string, mappingKey?: string) => {
    // mappingKey can be passed explicitly to avoid relying on closure/timing of `selected`
    const key = mappingKey || selected?.key || lastOpenedMappingKeyRef.current
    if (!key) {
      console.warn('setIconForSelected: no mapping selected, aborting', { name, library, selected, lastOpened: lastOpenedMappingKeyRef.current })
      return
    }
    const lib = library || selected?.library || 'Lucide'
    console.log('setIconForSelected:', { key, name, lib, selectedKey: selected?.key, lastOpened: lastOpenedMappingKeyRef.current })
    // Determine target context: prefer selected.context if available, otherwise default to 'expanded'
    const targetContext = (selected as any)?.context || 'expanded'
    const updatedSections = sections.map(section => ({
      ...section,
      mappings: (section.mappings || []).map(m => {
        const mContext = (m as any).context || 'expanded'
        if (m.key === key && mContext === targetContext) {
          return { ...m, currentIcon: name, library: lib }
        }
        return m
      })
    }))
    setSections(updatedSections)
    try {
      // persist and wait to ensure mapping is saved before closing to avoid races
      await saveMappings(updatedSections)
    } catch (e) {
      // saveMappings handles errors internally; still proceed to close but log
      console.warn('setIconForSelected: saveMappings failed', e)
    }
    setOpenPicker(false)
    setSelected(null)
  }

  const openCustomizationFor = (mapping: MappingItem) => {
    setCustomizationTarget(mapping)
    setOpenCustomization(true)
  }

  const handleSaveCustomization = (key: string | undefined, customization: IconCustomization) => {
    if (!key) return
    // Only update the mapping entry that matches both key and the context (expanded vs collapsed)
    const targetContext = (customizationTarget as any)?.context || 'expanded'
    const updatedSections = sections.map(section => ({
      ...section,
      mappings: (section.mappings || []).map(m => {
        const mContext = (m as any).context || 'expanded'
        if (m.key === key && mContext === targetContext) {
          return { ...m, customization }
        }
        return m
      })
    }))
    setSections(updatedSections)
    saveMappings(updatedSections)
    setCustomizationTarget(null)
    setOpenCustomization(false)
    // Call onSave to exit edit mode after saving
    if (onSave) onSave()
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
    loader?: () => Promise<any>
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

  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('icons-settings: testAPI called')
        window.dispatchEvent(new Event('iconMappingsUpdated'))
      } catch (e) {
        console.warn('icons-settings: testAPI failed', e)
      }
    }

    const testLoad = async () => {
      try {
        console.log('icons-settings: testLoad called')
        window.dispatchEvent(new Event('iconMappingsUpdated'))
      } catch (e) {
        console.warn('icons-settings: testLoad failed', e)
      }
    }

    ;(window as any).iconsSettings = ((window as any).iconsSettings || {})
    ;(window as any).iconsSettings.testAPI = testAPI
    ;(window as any).iconsSettings.testLoad = testLoad

    return () => {
      if ((window as any).iconsSettings) {
        try { delete (window as any).iconsSettings.testAPI } catch (e) {}
        try { delete (window as any).iconsSettings.testLoad } catch (e) {}
      }
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed top-14 left-0 right-0 bottom-0 w-screen h-[calc(100vh-3.5rem)] m-0 p-0 flex flex-col overflow-hidden">
        <DialogHeader className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm items-center gap-0 py-6">
          <div className="relative w-full mb-4">
            <DialogTitle className="text-lg leading-none font-semibold text-center">
              <Palette className="h-5 w-5 inline-block mr-2" />
              Paramètres des icônes
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
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-6">
          <div className="space-y-4">
            {/* Removed Lucide quick preview to simplify the settings UI */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Icônes</CardTitle>
                <CardDescription>Personnalisez les icônes utilisées dans l'application.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Config preview removed (buttons to show/reload/copy config were removed) */}

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
                  
                  {filteredSections.map((section, idx) => (
                    <div key={section.title}>
                      {idx > 0 && <div className="my-3 border-t border-white/6" />}
                      <Collapsible
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
                            const borderWidth = customization?.borderWidth ?? 0
                            const borderColor = customization?.borderColor || 'transparent'
                            const opacity = customization?.opacity ?? 100
                            const shadowEnabled = customization?.shadowEnabled ?? false
                            const shadowColor = customization?.shadowColor || '#000000'
                            const shadowBlur = customization?.shadowBlur ?? 8
                            const shadowOffsetY = customization?.shadowOffsetY ?? 2
                            const shadowSpread = customization?.shadowSpread ?? 0
                            const padding = customization?.padding ?? 6
                            const rotate = customization?.rotate ?? 0
                            const gradientEnabled = customization?.gradientEnabled ?? false
                            const gradientFrom = customization?.gradientFrom || bg
                            const gradientTo = customization?.gradientTo || bg
                            const gradientAngle = customization?.gradientAngle ?? 90

                            // Calculate background with gradient if enabled
                            const finalBg = gradientEnabled
                              ? `linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo})`
                              : bg

                            // Calculate box shadow if enabled
                            const boxShadow = shadowEnabled
                              ? `${shadowOffsetY}px ${shadowOffsetY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`
                              : undefined

                            // Make the preview wrapper match the configured size so the preview is accurate.
                            // Account for padding when sizing the wrapper so the inner SVG fits as expected.
                            // Use explicit wrapperSize when provided to match customization modal preview
                            const wrapperOuterSize = customization?.wrapperSize ?? Math.max(12, size + (padding * 2))
                            const wrapperStyle: React.CSSProperties = {
                              background: finalBg,
                              width: wrapperOuterSize,
                              height: wrapperOuterSize,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: shape === 'circle' ? 9999 : shape === 'rounded' ? 18 : 6,
                              color: iconColor,
                              border: borderWidth ? `${borderWidth}px solid ${borderColor}` : undefined,
                              opacity: opacity / 100,
                              boxShadow,
                              padding: shape === 'none' ? 0 : padding,
                              transform: `rotate(${rotate}deg)`
                            }

                            // When sizePx is provided to renderIcon, it will handle sizing via inline styles
                            // Don't pass conflicting Tailwind width/height classes
                            const iconSizePx = size

                            return (
                              <div key={m.key} className="flex items-center gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                                {shape === 'none' ? (
                                  <div
                                    className="flex-shrink-0"
                                    style={{
                                      width: wrapperOuterSize,
                                      height: wrapperOuterSize,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: iconColor,
                                      opacity: opacity / 100,
                                      transform: `rotate(${rotate}deg)`,
                                      border: borderWidth ? `${borderWidth}px solid ${borderColor}` : undefined,
                                      borderRadius: 4,
                                      padding: borderWidth ? 4 : 0
                                    }}
                                  >
                                    {renderIcon(comp, "text-black dark:text-white", iconSizePx) || renderIcon((LucideIcons as any).Folder, "w-8 h-8", iconSizePx)}
                                  </div>
                                ) : (
                                  <div style={wrapperStyle} className="flex-shrink-0">
                                    {renderIcon(comp, "text-black dark:text-white", iconSizePx) || renderIcon((LucideIcons as any).Folder, "w-8 h-8", iconSizePx)}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">{m.label}</div>
                                  {/* Show the mapping key (extension identifier) so users can see ext_xls / ext_docx etc. */}
                                    <div className="mt-1 flex items-center gap-2">
                                      {/* Show the extension without the 'ext_' prefix when applicable */}
                                      {(() => {
                                        const displayKey = (m.key || '').startsWith('ext_') ? (m.key || '').replace(/^ext_/, '') : (m.key || '')
                                        return (
                                          <>
                                            <div className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{displayKey}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                              Icône actuelle: <span className="font-mono text-primary">{m.currentIcon}</span>
                                            </div>
                                          </>
                                        )
                                      })()}
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
      <Dialog open={openPicker} onOpenChange={setOpenPicker}>
        <DialogContent className="h-[90vh] max-w-[96vw] sm:max-w-4xl flex flex-col overflow-hidden">
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
              <div className="grid grid-cols-4 gap-3 p-3">
                {availableIcons.map(ic => {
                  // mark current only when both name and library match the selected mapping
                  const isCurrent = selected && ic.name === selected.currentIcon && ic.library === selected.library
                  return (
                    <Button 
                      key={`${ic.library}-${ic.name}`} 
                      variant={isCurrent ? "default" : "ghost"} 
                      className={`flex flex-col items-center gap-1 p-3 h-auto relative ${
                        isCurrent ? 'ring-2 ring-primary' : ''
                      }`} 
                      onClick={() => setIconForSelected(ic.name, ic.library, selected?.key)}
                    >
                      {isCurrent && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      )}
                      <div className="w-28 h-28 flex items-center justify-center overflow-visible">{renderIcon(ic.comp, "text-black dark:text-white", 72)}</div>
                      <div className="text-xs text-center truncate w-full">{ic.name}</div>
                      <div className="text-[10px] text-muted-foreground">{ic.library}</div>
                    </Button>
                  )
                })}
                {availableIcons.length === 0 && <div className="p-4 text-sm text-muted-foreground col-span-4">Aucune icône trouvée. Essayez d'élargir la recherche.</div>}
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
    </Dialog>
  )
}

export default IconsSettings

