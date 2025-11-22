"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import * as LucideIcons from 'lucide-react'
import {
  FolderPlus,
  FileText,
  Palette,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  Clock,
  Star,
  Plus,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Home,
  Zap,
  Layers,
  Heart,
  Wrench
} from "lucide-react"
import { MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, normalizeIconForThumbnail } from "@/lib/utils"
import { FILE_TYPES, getFileTypeConfig, type FileType } from "@/lib/file-types"
import type { EnhancedFolderNode } from "@/components/ui/FolderTree-modern"
import { ModernFolderTree } from "@/components/ui/FolderTree-modern"

// Runtime cache for dynamically loaded Phosphor icons
let _phosphorIconsCache: Record<string, any> | null = null

async function ensurePhosphorIconsLoaded() {
  if (_phosphorIconsCache) return _phosphorIconsCache
  try {
    const mod = await import('phosphor-react')
    const map: Record<string, any> = {}
    // Only keep exports that look like icon components
    const blacklist = new Set(['default', 'Context', 'Provider', 'Consumer', 'IconContext'])
    Object.keys(mod).forEach(k => {
      if (!k || blacklist.has(k)) return
      if (!/^[A-Z][A-Za-z0-9_]+$/.test(k)) return
      try {
        const exportVal = (mod as any)[k]
        if (typeof exportVal === 'function' || (typeof exportVal === 'object' && exportVal.$$typeof)) {
          map[k] = exportVal
        }
      } catch (e) {
        // ignore
      }
    })
    _phosphorIconsCache = map
    return _phosphorIconsCache
  } catch (err) {
    console.warn('Failed to dynamically load phosphor-react', err)
    return null
  }
}

// Runtime cache for dynamically loaded Tabler icons
let _tablerIconsCache: Record<string, any> | null = null

async function ensureTablerIconsLoaded() {
  if (_tablerIconsCache) return _tablerIconsCache
  try {
    const mod = await import('tabler-icons-react')
    const map: Record<string, any> = {}
    const blacklist = new Set(['default', 'Context', 'Provider', 'Consumer', 'IconContext'])
    Object.keys(mod).forEach(k => {
      if (!k || blacklist.has(k)) return
      if (!/^[A-Z][A-Za-z0-9_]+$/.test(k)) return
      try {
        const exportVal = (mod as any)[k]
        if (typeof exportVal === 'function' || (typeof exportVal === 'object' && exportVal.$$typeof)) {
          map[k] = exportVal
        }
      } catch (e) {
        // ignore
      }
    })
    _tablerIconsCache = map
    return _tablerIconsCache
  } catch (err) {
    console.warn('Failed to dynamically load tabler-icons-react', err)
    return null
  }
}

// Runtime cache for dynamically loaded React Icons
let _reactIconsCache: Record<string, any> | null = null

async function ensureReactIconsLoaded() {
  if (_reactIconsCache) return _reactIconsCache
  try {
    const [fa, md, ai] = await Promise.all([
      import('react-icons/fa'),
      import('react-icons/md'),
      import('react-icons/ai')
    ])
    // Merge exports into one map
    const merged: Record<string, any> = Object.assign({}, fa, md, ai)
    const map: Record<string, any> = {}
    const blacklist = new Set(['default'])
    Object.keys(merged).forEach(k => {
      if (!k || blacklist.has(k)) return
      if (!/^[A-Z][A-Za-z0-9]+$/.test(k)) return
      try {
        const exportVal = (merged as any)[k]
        if (typeof exportVal === 'function' || (typeof exportVal === 'object' && exportVal.$$typeof)) {
          map[k] = exportVal
        }
      } catch (e) {
        // ignore
      }
    })
    _reactIconsCache = map
    return _reactIconsCache
  } catch (err) {
    console.warn('Failed to dynamically load react-icons packs', err)
    return null
  }
}

// Runtime cache for dynamically loaded MUI icons
let _muiIconsCache: Record<string, any> | null = null

async function ensureMuiIconsLoaded() {
  if (_muiIconsCache) return _muiIconsCache
  try {
    const mod = await eval('import("@mui/icons-material")')
    const map: Record<string, any> = {}
    Object.keys(mod).forEach(k => { map[k] = (mod as any)[k] })
    _muiIconsCache = map
    return _muiIconsCache
  } catch (err) {
    console.warn('Failed to dynamically load @mui/icons-material', err)
    return null
  }
}

interface LandingPageProps {
  onNavigateToFiles: () => void;
  onNavigateToEditor: (filePath: string) => void;
  onNoteSelect: (filePath: string) => void;
  onCreateNew: (type: FileType) => void;
  folderTree: EnhancedFolderNode | null;
  editMode: boolean;
  onEditModeChange?: (edit: boolean) => void;
}

export function LandingPage({
  onNavigateToFiles,
  onNavigateToEditor,
  onNoteSelect,
  onCreateNew,
  folderTree,
  editMode,
  onEditModeChange
}: LandingPageProps) {
  const [mounted, setMounted] = useState(false)
  const [recentFilesVersion, setRecentFilesVersion] = useState(0)
  const [iconMappings, setIconMappings] = useState<Record<string, { currentIcon: string; library: string; customization?: any }>>({})
  const [designSettings, setDesignSettings] = useState<{ backgroundImage: string | null; fixedImage?: string | null; animatedIndex?: number; elements?: Record<string, any> }>({ backgroundImage: null, fixedImage: null, animatedIndex: 0, elements: {} })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Listen for recent files refresh events
  useEffect(() => {
    const handleRecentFilesRefresh = () => {
      console.log('🔄 Recent files refresh event received in landing page');
      setRecentFilesVersion(prev => prev + 1);
    };

    if (typeof window !== 'undefined') {
      console.log('🔄 Setting up recent files refresh listener in landing page');
      window.addEventListener('recentFilesRefresh', handleRecentFilesRefresh);
      
      return () => {
        console.log('🔄 Removing recent files refresh listener from landing page');
        window.removeEventListener('recentFilesRefresh', handleRecentFilesRefresh);
      };
    }
  }, []);

  // Load icon mappings from settings and listen for updates
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        if (window.electronAPI?.loadSettings) {
          const s = await window.electronAPI.loadSettings()
          if (s && s.icons && Array.isArray(s.icons.mappings)) {
            const map: Record<string, any> = {}
            s.icons.mappings.forEach((m: any) => {
              if (m && m.key) map[m.key] = { currentIcon: String(m.currentIcon || ''), library: String(m.library || 'Lucide'), customization: m.customization || undefined }
            })
            if (mounted) setIconMappings(map)

            // Load design settings
            if (s.design) {
              setDesignSettings({ animatedIndex: s.design.animatedIndex ?? 0, backgroundImage: s.design.backgroundImage ?? null, fixedImage: s.design.fixedImage ?? null, elements: s.design.elements ?? {} })
            }

            // Preload libraries used in mappings
            const usedLibraries = new Set(s.icons.mappings.map((m: any) => m.library))
            const preloadPromises = []
            if (usedLibraries.has('Phosphor')) {
              preloadPromises.push(ensurePhosphorIconsLoaded().catch(() => {}))
            }
            if (usedLibraries.has('Tabler')) {
              preloadPromises.push(ensureTablerIconsLoaded().catch(() => {}))
            }
            if (usedLibraries.has('ReactIcons')) {
              preloadPromises.push(ensureReactIconsLoaded().catch(() => {}))
            }
            if (usedLibraries.has('Material UI')) {
              preloadPromises.push(ensureMuiIconsLoaded().catch(() => {}))
            }
            await Promise.all(preloadPromises)
            console.log('landing-page: preloaded icon libraries')
          }
        }
      } catch (err) {
        console.warn('landing-page: failed to load icon mappings', err)
      }
    }
    load()

    const handler = (e: any) => {
      try {
        const mappings = e?.detail?.mappings || (window as any).__lastIconMappings
        if (!mappings) return
        const map: Record<string, any> = {}
        mappings.forEach((m: any) => { if (m && m.key) map[m.key] = { currentIcon: String(m.currentIcon || ''), library: String(m.library || 'Lucide'), customization: m.customization || undefined } })
        if (mounted) setIconMappings(map)

        // Update design settings if provided
        if (e?.detail?.design) {
          setDesignSettings({ animatedIndex: e.detail.design.animatedIndex ?? 0, backgroundImage: e.detail.design.backgroundImage ?? null, fixedImage: e.detail.design.fixedImage ?? null, elements: e.detail.design.elements ?? {} })
        }
      } catch (err) {
        // ignore
      }
    }

    window.addEventListener('iconMappingsUpdated', handler as EventListener)
    return () => { mounted = false; window.removeEventListener('iconMappingsUpdated', handler as EventListener) }
  }, [])

  // Listen for design settings updates
  useEffect(() => {
    const handleSettingsUpdate = (e: any) => {
      try {
        if (e?.detail?.design) {
          setDesignSettings(prev => ({
            ...prev,
            ...e.detail.design,
            elements: { ...prev.elements, ...e.detail.design.elements }
          }))
        }
      } catch (err) {
        // ignore
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('settingsUpdated', handleSettingsUpdate)
      return () => {
        window.removeEventListener('settingsUpdated', handleSettingsUpdate)
      }
    }
  }, [])

  // Render an icon element using mapping customization (size, color, bg, shape, border)
  const renderMappedIcon = (mappingKey: string, fallbackIcon: any = FileText, defaultSize = 32) => {
    // Try to resolve exact mapping first
    const mapping = iconMappings[mappingKey]
    let Comp: any = fallbackIcon

    // If there is still no custom mapping, render the fallback icon as before (no pastille wrapper)
    if (!mapping) {
      const svgSize = Math.max(4, Math.round(defaultSize * 0.6))
      try {
        return (
          <div style={{ width: defaultSize, height: defaultSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {React.createElement(fallbackIcon, { style: { width: svgSize, height: svgSize } })}
          </div>
        )
      } catch (e) {
        return React.createElement(fallbackIcon, { className: `w-8 h-8` })
      }
    }

    // Load icon from appropriate library
    try {
      if (mapping.library === 'Lucide') {
        Comp = (LucideIcons as any)[mapping.currentIcon] || fallbackIcon
      } else if (mapping.library === 'Phosphor' && _phosphorIconsCache && _phosphorIconsCache[mapping.currentIcon]) {
        Comp = _phosphorIconsCache[mapping.currentIcon]
      } else if (mapping.library === 'Tabler' && _tablerIconsCache && _tablerIconsCache[mapping.currentIcon]) {
        Comp = _tablerIconsCache[mapping.currentIcon]
      } else if (mapping.library === 'ReactIcons' && _reactIconsCache && _reactIconsCache[mapping.currentIcon]) {
        Comp = _reactIconsCache[mapping.currentIcon]
      } else if (_muiIconsCache && _muiIconsCache[mapping.currentIcon]) {
        Comp = _muiIconsCache[mapping.currentIcon]
      } else {
        // Library not loaded yet, kick off load in background and fallback to Lucide
        if (mapping.library === 'Phosphor') {
          ensurePhosphorIconsLoaded().catch(() => {})
        } else if (mapping.library === 'Tabler') {
          ensureTablerIconsLoaded().catch(() => {})
        } else if (mapping.library === 'ReactIcons') {
          ensureReactIconsLoaded().catch(() => {})
        } else if (mapping.library === 'Material UI') {
          ensureMuiIconsLoaded().catch(() => {})
        }
        Comp = (LucideIcons as any)[mapping.currentIcon] || fallbackIcon
      }
    } catch (error) {
      console.warn(`landing-page: Failed to load icon for mapping '${mappingKey}':`, error)
      Comp = fallbackIcon
    }

    const customization = mapping?.customization || {}

    // Use shared normalization so landing page icons match file-manager/sidebar behavior
    const normalized = normalizeIconForThumbnail(customization, defaultSize, { respectIconSize: true })
    const wrapperPx = normalized.wrapperPx
    const iconInnerSize = normalized.iconInnerSize
    const paddingVal = normalized.padding

    const iconColor = customization.iconColor || 'currentColor'
    const bg = customization.bgColor || 'transparent'
    const shape = customization.shape || 'rounded'
    const borderWidth = customization.borderWidth ?? 0
    const borderColor = customization.borderColor || 'transparent'

    const wrapperStyle: React.CSSProperties = {
      background: bg,
      width: wrapperPx,
      height: wrapperPx,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: shape === 'circle' ? 9999 : shape === 'rounded' ? 10 : 4,
      color: iconColor,
      border: borderWidth ? `${borderWidth}px solid ${borderColor}` : undefined,
      padding: paddingVal
    }

    try {
      const svgProps: any = { style: { color: iconColor, width: iconInnerSize, height: iconInnerSize } }
      return (
        <div style={wrapperStyle} className="flex-shrink-0">
          {React.createElement(Comp, svgProps)}
        </div>
      )
    } catch (e) {
      console.warn('landing-page: renderMappedIcon error for', mappingKey, e)
      return React.createElement(fallbackIcon, { className: `w-8 h-8`, style: { color: iconColor } })
    }
  }

  // Calculer les fichiers récents à partir du folderTree
  const getRecentFiles = (): EnhancedFolderNode[] => {
    // Extensions de tous les types de fichiers supportés par l'application
    const supportedExtensions = [
      // Notes et texte
      'md', 'txt', 'markdown', 'text',
      // Dessins
      'draw',
      // Documents
      'pdf', 'doc', 'docx', 'rtf', 'odt',
      // Images
      'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp',
      // Vidéos
      'mp4', 'webm', 'ogv', 'avi', 'mov', 'mkv', 'wmv', 'flv', '3gp',
      // Audio
      'mp3', 'wav', 'wave', 'ogg', 'oga', 'opus', 'm4a', 'm4b', 'flac', 'aac', 'wma', 'weba', 'aiff', 'aif', 'ape', 'mka', 'wv', 'tta', 'tak', 'mp2', 'mp1', 'mpa', 'ac3', 'dts', 'amr', '3gp', 'ra', 'ram',
      // Code
      'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'cs', 'html', 'css', 'json', 'xml', 'yaml', 'yml',
      // Tableurs
      'xlsx', 'xls',
      // Présentations
      'pptx', 'ppt'
    ];

    const files: EnhancedFolderNode[] = [];
    const collectFiles = (node: EnhancedFolderNode) => {
      if (!node.isDirectory) {
        const extension = node.name.split('.').pop()?.toLowerCase();
        if (extension && supportedExtensions.includes(extension)) {
          files.push(node);
        }
      }
      node.children?.forEach(collectFiles);
    };
    if (folderTree) collectFiles(folderTree);
    // Trier par date de modification (plus récent en premier) et limiter à 10 fichiers
    return files.sort((a, b) => (b.modifiedAt?.getTime() || 0) - (a.modifiedAt?.getTime() || 0)).slice(0, 10);
  };

  // Recalculer les fichiers récents quand folderTree ou recentFilesVersion change
  const recentFiles = React.useMemo(() => getRecentFiles(), [folderTree, recentFilesVersion]);

  const colorThemes = [
    { name: 'yellow', gradient: 'from-yellow-400 via-yellow-500 to-yellow-600', bg: 'bg-yellow-50', accent: 'bg-yellow-500' },
    { name: 'blue', gradient: 'from-blue-400 via-blue-500 to-blue-600', bg: 'bg-blue-50', accent: 'bg-blue-500' },
    { name: 'purple', gradient: 'from-purple-400 via-purple-500 to-purple-600', bg: 'bg-purple-50', accent: 'bg-purple-500' },
    { name: 'red', gradient: 'from-red-400 via-red-500 to-red-600', bg: 'bg-red-50', accent: 'bg-red-500' },
    { name: 'green', gradient: 'from-green-400 via-green-500 to-green-600', bg: 'bg-green-50', accent: 'bg-green-500' },
    { name: 'pink', gradient: 'from-pink-400 via-pink-500 to-pink-600', bg: 'bg-pink-50', accent: 'bg-pink-500' },
    { name: 'orange', gradient: 'from-orange-400 via-orange-500 to-orange-600', bg: 'bg-orange-50', accent: 'bg-orange-500' },
    { name: 'gray', gradient: 'from-gray-400 via-gray-500 to-gray-600', bg: 'bg-gray-50', accent: 'bg-gray-500' }
  ]

  const getRandomColorTheme = () => {
    return colorThemes[Math.floor(Math.random() * colorThemes.length)]
  }

  const [currentTheme, setCurrentTheme] = useState(getRandomColorTheme())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTheme(getRandomColorTheme())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const renderTreePreview = (node: EnhancedFolderNode | null, depth = 0): React.ReactNode => {
    if (!node || depth > 2) return null

    return (
      <div key={node.path} className="space-y-1">
        <div className={cn(
          "flex items-center gap-2 py-1 px-2 rounded text-sm",
          depth === 0 ? "font-semibold" : "font-normal"
        )}>
          {node.children && node.children.length > 0 ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <div className="w-3 h-3" />
          )}
          <div className={cn(
            "w-4 h-4 rounded",
            node.type === 'folder' ? "bg-yellow-400" : "bg-gray-400"
          )} />
          <span className="truncate">{node.name}</span>
        </div>
        {node.children && node.children.slice(0, 3).map(child => renderTreePreview(child, depth + 1))}
      </div>
    )
  }

  // Use the actual ModernFolderTree component for better hierarchy display
  const renderFolderTree = () => {
    if (!folderTree) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <FolderPlus className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-sm">Aucun dossier trouvé</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={onNavigateToFiles}
          >
            Créer un dossier
          </Button>
        </div>
      )
    }

    return (
      <div className="h-[400px] overflow-auto">
        <ModernFolderTree
          tree={folderTree}
          onFolderSelect={(path) => {
            // Navigate to files view with selected folder
            onNavigateToFiles();
          }}
          onNoteSelect={(path) => {
            // Navigate to editor with selected file
            onNavigateToEditor(path);
          }}
          selectedFolder={null} // No selection in landing page
          selectedNote={null} // No selection in landing page
          initialExpandedPaths={folderTree ? [folderTree.path] : []} // Expand root folder by default
          editMode={editMode}
        />
      </div>
    )
  }

  const renderRecentFile = (file: EnhancedFolderNode) => {
    // Convertir le type si nécessaire
    const fileType = (file.type === 'link' ? 'generic' : file.type) as FileType
    const config = getFileTypeConfig(fileType || 'generic')
    const Icon = config.icon

    // Determine extension mapping key for recents
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const mappingKey = 'landing_recents_' + ext

    return (
      <motion.div
        key={file.path}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-accent cursor-pointer transition-all"
        onClick={() => onNoteSelect(file.path)}
      >
        {renderMappedIcon(mappingKey, Icon, 32)}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {file.modifiedAt ? new Date(file.modifiedAt).toLocaleDateString() : 'Aucune date'}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
      </motion.div>
    )
  }

  const renderAddButton = (type: FileType) => {
    const config = getFileTypeConfig(type)
    const Icon = config.buttonIcon

    return (
      <motion.div
        key={type}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => onCreateNew(type)}
          className={cn(
            "h-20 w-20 flex-col gap-2 text-white shadow-lg hover:shadow-xl transition-all",
            config.modal.accent
          )}
        >
          <Icon className="w-6 h-6" />
          <span className="text-xs font-medium">{config.name}</span>
        </Button>
      </motion.div>
    )
  }

  if (!mounted) {
    return null
  }

  const renderAnimatedBackground = (variant = 0) => {
    // several simple variants — keep them lightweight
    const count = 18
    if (variant === 1) {
      return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {[...Array(count)].map((_, i) => (
            <motion.div
              key={`v1-${i}`}
              className={cn("absolute rounded-full opacity-10", colorThemes[i % colorThemes.length].accent)}
              style={{
                width: 80 + (i % 5) * 30,
                height: 80 + (i % 5) * 30,
                left: `${(i * 37) % 100}%`,
                top: `${(i * 23) % 100}%`,
              }}
              animate={{ x: [0, (i % 7) - 3], y: [0, (i % 5) - 2], scale: [1, 1.05, 1] }}
              transition={{ duration: 8 + (i % 6), repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )
    }

    if (variant === 2) {
      return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {[...Array(count)].map((_, i) => (
            <motion.div
              key={`v2-${i}`}
              className={cn("absolute rounded-lg opacity-10", colorThemes[(i+2) % colorThemes.length].accent)}
              style={{
                width: 60 + (i % 6) * 28,
                height: 40 + (i % 4) * 40,
                left: `${(i * 41) % 100}%`,
                top: `${(i * 29) % 100}%`,
                borderRadius: 20 + (i % 3) * 10
              }}
              animate={{ x: [0, (i % 9) - 4], y: [0, (i % 6) - 3], rotate: [0, (i%10)-5, 0] }}
              transition={{ duration: 10 + (i % 5), repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )
    }

    if (variant === 3) {
      return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {[...Array(count)].map((_, i) => (
            <motion.div
              key={`v3-${i}`}
              className={cn("absolute opacity-8", colorThemes[i % colorThemes.length].accent)}
              style={{
                width: 140 + (i % 4) * 60,
                height: 140 + (i % 4) * 60,
                left: `${(i * 33) % 100}%`,
                top: `${(i * 21) % 100}%`,
                borderRadius: '50%'
              }}
              animate={{ x: [0, (i % 11) - 5], y: [0, (i % 7) - 3], scale: [1, 1.15, 1] }}
              transition={{ duration: 12 + (i % 6), repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )
    }

    if (variant === 4) {
      return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {[...Array(count)].map((_, i) => (
            <motion.div
              key={`v4-${i}`}
              className={cn("absolute rounded-full opacity-8", colorThemes[(i+3) % colorThemes.length].accent)}
              style={{
                width: 40 + (i % 7) * 20,
                height: 40 + (i % 7) * 20,
                left: `${(i * 47) % 100}%`,
                top: `${(i * 19) % 100}%`,
              }}
              animate={{ x: [0, (i % 5) - 2], y: [0, (i % 6) - 3], scale: [1, 0.95, 1] }}
              transition={{ duration: 6 + (i % 4), repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )
    }

    // default variant 0 (original circles)
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "absolute rounded-full opacity-10",
              colorThemes[i % colorThemes.length].accent
            )}
            style={{
              width: Math.random() * 200 + 50,
              height: Math.random() * 200 + 50,
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      {/* Custom Background Image ou Fixed ou Animated Background, cliquable en mode édition */}
      {designSettings?.backgroundImage ? (
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{
            backgroundImage: `url(${designSettings.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      ) : designSettings?.fixedImage ? (
        <div
          className="fixed inset-0 z-0"
          style={{
            ...(designSettings?.fixedImage.startsWith('#') ?
              { backgroundColor: designSettings.fixedImage } :
              { backgroundImage: `url(${designSettings.fixedImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
            ),
            filter: (designSettings as any).backgroundParams ?
              `brightness(${(designSettings as any).backgroundParams.brightness ?? 100}%) contrast(${(designSettings as any).backgroundParams.contrast ?? 100}%) saturate(${(designSettings as any).backgroundParams.saturation ?? 100}%) hue-rotate(${(designSettings as any).backgroundParams.hue ?? 0}deg) blur(${(designSettings as any).backgroundParams.blur ?? 0}px)` : undefined,
          }}
        />
      ) : (
        <motion.div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: `url(/backgrounds/bg${((designSettings?.animatedIndex ?? 0) % 20) + 1}.svg)` }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Kebab menu (3 dots) shown only when editMode is active — opens background config */}
      {editMode && (
        <div className="fixed top-16 right-4 z-[70]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 bg-white text-black p-0 rounded-full shadow-sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('openBackgroundConfigModal'))}>
                Fond d'écran
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('openIconSettingsModal'))}>
                Icônes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Header déplacé dans le layout principal (pages/index.tsx) */}
      <div className="relative z-10">

        {/* Main Content Grid */}
        <div className="max-w-7xl mx-auto px-8 pb-12">
          <ScrollArea className="h-[calc(100vh-200px)] scrollbar-hide">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pr-4">

            {/* Folder Tree Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              { (designSettings?.elements?.folder?.visible !== false) ? (
                <Card className="h-[500px] bg-card/80 backdrop-blur-sm border-2 border-border/50" style={{
                  background: designSettings?.elements?.folder?.backgroundImage
                    ? `url(${designSettings.elements.folder.backgroundImage}) center/cover no-repeat`
                    : (designSettings?.elements?.folder?.fixedImage
                      ? (designSettings.elements.folder.fixedImage.startsWith('#') 
                        ? designSettings.elements.folder.fixedImage 
                        : `url(${designSettings.elements.folder.fixedImage}) center/cover no-repeat`)
                      : (designSettings?.elements?.folder?.animatedIndex !== undefined && designSettings.elements.folder.animatedIndex >= 0
                        ? `url(/backgrounds/bg${((designSettings.elements.folder.animatedIndex ?? 0) % 20) + 1}.svg) center/cover no-repeat`
                        : undefined)),
                  filter: designSettings?.elements?.folder?.backgroundParams
                    ? `brightness(${designSettings.elements.folder.backgroundParams.brightness ?? 100}%) contrast(${designSettings.elements.folder.backgroundParams.contrast ?? 100}%) saturate(${designSettings.elements.folder.backgroundParams.saturation ?? 100}%) hue-rotate(${designSettings.elements.folder.backgroundParams.hue ?? 0}deg) blur(${designSettings.elements.folder.backgroundParams.blur ?? 0}px)`
                    : undefined
                }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {renderMappedIcon('landing_folder', Layers, 20)}
                        Arborescence
                      </CardTitle>
                      {editMode && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('openBackgroundConfigModal', { detail: { context: 'folder' } }))}>
                              Gérer le fond
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('openIconSettingsModal', { detail: { context: 'folder' } }))}>
                              Personnaliser l'icône
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              // Toggle visibility of folder tree card
                              const newElements = { ...designSettings?.elements, folder: { ...designSettings?.elements?.folder, visible: false } };
                              setDesignSettings({ ...designSettings, elements: newElements });
                              // Save to settings
                              if (window.electronAPI?.saveSettings && window.electronAPI?.loadSettings) {
                                window.electronAPI.loadSettings().then(existing => {
                                  const next = { ...existing, design: { ...existing.design, elements: newElements } };
                                  if (window.electronAPI?.saveSettings) {
                                    window.electronAPI.saveSettings(next);
                                  }
                                  window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { design: next.design } }));
                                });
                              }
                            }}>
                              Masquer cette carte
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <CardDescription>
                      Votre structure de dossiers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {renderFolderTree()}
                  </CardContent>
                </Card>
              ) : editMode ? (
                <Card className="h-[500px] bg-card/40 backdrop-blur-sm border-2 border-dashed border-border/50 relative">
                  <div className="absolute inset-0 flex items-center justify-center bg-card/20 backdrop-blur-sm rounded-lg">
                    <div className="text-center space-y-4">
                      <Layers className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Carte masquée</p>
                        <p className="text-xs text-muted-foreground">Arborescence</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Show the folder tree card
                          const newElements = { ...designSettings?.elements, folder: { ...designSettings?.elements?.folder, visible: true } };
                          setDesignSettings({ ...designSettings, elements: newElements });
                          // Save to settings
                          if (window.electronAPI?.saveSettings && window.electronAPI?.loadSettings) {
                            window.electronAPI.loadSettings().then(existing => {
                              const next = { ...existing, design: { ...existing.design, elements: newElements } };
                              if (window.electronAPI?.saveSettings) {
                                window.electronAPI.saveSettings(next);
                              }
                              window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { design: next.design } }));
                            });
                          }
                        }}
                      >
                        Afficher cette carte
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : null}
            </motion.div>            {/* Recent Files Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              { (designSettings?.elements?.recents?.visible !== false) ? (
              <Card className="h-[500px] bg-card/80 backdrop-blur-sm border-2 border-border/50" style={{
                background: designSettings.elements?.recents?.backgroundImage
                  ? `url(${designSettings.elements.recents.backgroundImage}) center/cover no-repeat`
                  : (designSettings.elements?.recents?.fixedImage
                    ? (designSettings.elements.recents.fixedImage.startsWith('#') 
                      ? designSettings.elements.recents.fixedImage 
                      : `url(${designSettings.elements.recents.fixedImage}) center/cover no-repeat`)
                    : (designSettings.elements?.recents?.animatedIndex !== undefined && designSettings.elements.recents.animatedIndex >= 0
                      ? `url(/backgrounds/bg${((designSettings.elements.recents.animatedIndex ?? 0) % 20) + 1}.svg) center/cover no-repeat`
                      : undefined)),
                filter: designSettings.elements?.recents?.backgroundParams
                  ? `brightness(${designSettings.elements.recents.backgroundParams.brightness ?? 100}%) contrast(${designSettings.elements.recents.backgroundParams.contrast ?? 100}%) saturate(${designSettings.elements.recents.backgroundParams.saturation ?? 100}%) hue-rotate(${designSettings.elements.recents.backgroundParams.hue ?? 0}deg) blur(${designSettings.elements.recents.backgroundParams.blur ?? 0}px)`
                  : undefined
              }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {renderMappedIcon('landing_recents', Clock, 20)}
                      Fichiers Récents
                    </CardTitle>
                    {editMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('openBackgroundConfigModal', { detail: { context: 'recents' } }))}>
                            Gérer le fond
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('openIconSettingsModal', { detail: { context: 'recents' } }))}>
                            Personnaliser l'icône
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            // Toggle visibility of recents card
                            const newElements = { ...designSettings?.elements, recents: { ...designSettings?.elements?.recents, visible: false } };
                            setDesignSettings({ ...designSettings, elements: newElements });
                            // Save to settings
                            if (window.electronAPI?.saveSettings && window.electronAPI?.loadSettings) {
                              window.electronAPI.loadSettings().then(existing => {
                                const next = { ...existing, design: { ...existing.design, elements: newElements } };
                                if (window.electronAPI?.saveSettings) {
                                  window.electronAPI.saveSettings(next);
                                }
                                window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { design: next.design } }));
                              });
                            }
                          }}>
                            Masquer cette carte
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <CardDescription>
                    Vos derniers fichiers modifiés
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {recentFiles.length > 0 ? (
                        recentFiles.slice(0, 5).map(renderRecentFile)
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <FileText className="w-12 h-12 mb-4 opacity-50" />
                          <p className="text-sm">Aucun fichier récent</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => onCreateNew('note')}
                          >
                            Créer une note
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
              ) : editMode ? (
                <Card className="h-[500px] bg-card/40 backdrop-blur-sm border-2 border-dashed border-border/50 relative">
                  <div className="absolute inset-0 flex items-center justify-center bg-card/20 backdrop-blur-sm rounded-lg">
                    <div className="text-center space-y-4">
                      <Clock className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Carte masquée</p>
                        <p className="text-xs text-muted-foreground">Fichiers Récents</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Show the recents card
                          const newElements = { ...designSettings?.elements, recents: { ...designSettings?.elements?.recents, visible: true } };
                          setDesignSettings({ ...designSettings, elements: newElements });
                          // Save to settings
                          if (window.electronAPI?.saveSettings && window.electronAPI?.loadSettings) {
                            window.electronAPI.loadSettings().then(existing => {
                              const next = { ...existing, design: { ...existing.design, elements: newElements } };
                              if (window.electronAPI?.saveSettings) {
                                window.electronAPI.saveSettings(next);
                              }
                              window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { design: next.design } }));
                            });
                          }
                        }}
                      >
                        Afficher cette carte
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : null}
            </motion.div>

            {/* Add Buttons Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 }}
            >
              { (designSettings?.elements?.create?.visible !== false) ? (
              <Card className="h-[500px] bg-card/80 backdrop-blur-sm border-2 border-border/50" style={{
                background: designSettings.elements?.create?.backgroundImage
                  ? `url(${designSettings.elements.create.backgroundImage}) center/cover no-repeat`
                  : (designSettings.elements?.create?.fixedImage
                    ? (designSettings.elements.create.fixedImage.startsWith('#') 
                      ? designSettings.elements.create.fixedImage 
                      : `url(${designSettings.elements.create.fixedImage}) center/cover no-repeat`)
                    : (designSettings.elements?.create?.animatedIndex !== undefined && designSettings.elements.create.animatedIndex >= 0
                      ? `url(/backgrounds/bg${((designSettings.elements.create.animatedIndex ?? 0) % 20) + 1}.svg) center/cover no-repeat`
                      : undefined)),
                filter: designSettings.elements?.create?.backgroundParams
                  ? `brightness(${designSettings.elements.create.backgroundParams.brightness ?? 100}%) contrast(${designSettings.elements.create.backgroundParams.contrast ?? 100}%) saturate(${designSettings.elements.create.backgroundParams.saturation ?? 100}%) hue-rotate(${designSettings.elements.create.backgroundParams.hue ?? 0}deg) blur(${designSettings.elements.create.backgroundParams.blur ?? 0}px)`
                  : undefined
              }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {renderMappedIcon('landing_create', Plus, 20)}
                      Créer Nouveau
                    </CardTitle>
                    {editMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('openBackgroundConfigModal', { detail: { context: 'create' } }))}>
                            Gérer le fond
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('openIconSettingsModal', { detail: { context: 'create' } }))}>
                            Personnaliser l'icône
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            // Toggle visibility of create card
                            const newElements = { ...designSettings?.elements, create: { ...designSettings?.elements?.create, visible: false } };
                            setDesignSettings({ ...designSettings, elements: newElements });
                            // Save to settings
                            if (window.electronAPI?.saveSettings && window.electronAPI?.loadSettings) {
                              window.electronAPI.loadSettings().then(existing => {
                                const next = { ...existing, design: { ...existing.design, elements: newElements } };
                                if (window.electronAPI?.saveSettings) {
                                  window.electronAPI.saveSettings(next);
                                }
                                window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { design: next.design } }));
                              });
                            }
                          }}>
                            Masquer cette carte
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <CardDescription>
                    Commencez par créer quelque chose
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="grid grid-cols-3 gap-3">
                    {/* Filtrer uniquement les types présents dans la sidebar */}
                    {(['folder', 'note', 'draw', 'excel', 'powerpoint', 'image', 'video', 'audio'] as FileType[])
                      .map((type) => {
                        const config = FILE_TYPES[type];
                        return (
                          <motion.div
                            key={type}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex flex-col items-center gap-2 p-3 rounded-lg bg-card hover:bg-accent transition-all cursor-pointer border border-border/50"
                            onClick={() => onCreateNew(type as FileType)}
                          >
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                              config.sidebarButton.background,
                              config.sidebarButton.darkBackground
                            )}>
                              <config.icon className={cn("w-6 h-6", config.sidebarButton.text, config.sidebarButton.darkText)} />
                            </div>
                            <div className="font-medium text-sm text-center">{config.name}</div>
                          </motion.div>
                        );
                      })
                    }
                  </div>
                </CardContent>
              </Card>
              ) : editMode ? (
                <Card className="h-[500px] bg-card/40 backdrop-blur-sm border-2 border-dashed border-border/50 relative">
                  <div className="absolute inset-0 flex items-center justify-center bg-card/20 backdrop-blur-sm rounded-lg">
                    <div className="text-center space-y-4">
                      <Plus className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Carte masquée</p>
                        <p className="text-xs text-muted-foreground">Créer Nouveau</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Show the create card
                          const newElements = { ...designSettings?.elements, create: { ...designSettings?.elements?.create, visible: true } };
                          setDesignSettings({ ...designSettings, elements: newElements });
                          // Save to settings
                          if (window.electronAPI?.saveSettings && window.electronAPI?.loadSettings) {
                            window.electronAPI.loadSettings().then(existing => {
                              const next = { ...existing, design: { ...existing.design, elements: newElements } };
                              if (window.electronAPI?.saveSettings) {
                                window.electronAPI.saveSettings(next);
                              }
                              window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { design: next.design } }));
                            });
                          }
                        }}
                      >
                        Afficher cette carte
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : null}
            </motion.div>
            </div>

            {/* Copyright */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="mt-8 text-center"
            >
              <div className="text-sm text-muted-foreground">
                © 2025 FUSION. Tous droits réservés.
              </div>
            </motion.div>

            {/* Bottom spacing for mobile scroll */}
            <div className="h-32 md:h-16"></div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
