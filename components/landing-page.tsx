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
  Heart
} from "lucide-react"
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
  onNavigateToFiles: () => void
  onNavigateToEditor: (filePath: string) => void
  onNoteSelect: (filePath: string) => void
  onCreateNew: (type: FileType) => void
  folderTree: EnhancedFolderNode | null
}

export function LandingPage({
  onNavigateToFiles,
  onNavigateToEditor,
  onNoteSelect,
  onCreateNew,
  folderTree
}: LandingPageProps) {
  const [mounted, setMounted] = useState(false)
  const [recentFilesVersion, setRecentFilesVersion] = useState(0)
  const [iconMappings, setIconMappings] = useState<Record<string, { currentIcon: string; library: string; customization?: any }>>({})

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
      } catch (err) {
        // ignore
      }
    }

    window.addEventListener('iconMappingsUpdated', handler as EventListener)
    return () => { mounted = false; window.removeEventListener('iconMappingsUpdated', handler as EventListener) }
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
        />
      </div>
    )
  }

  const renderRecentFile = (file: EnhancedFolderNode) => {
    // Convertir le type si nécessaire
    const fileType = (file.type === 'link' ? 'generic' : file.type) as FileType
    const config = getFileTypeConfig(fileType || 'generic')
    const Icon = config.icon

    // Determine extension mapping key
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const mappingKey = 'ext_' + ext

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
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

      <div className="relative z-10">
        {/* Header - Optimisé pour utiliser toute la largeur */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-6 px-8"
        >
          <div className="max-w-7xl mx-auto">
            {/* Layout horizontal : Logo à gauche, texte au centre/droite */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Logo - Colonne gauche */}
              <motion.div 
                className="lg:col-span-3 flex justify-center lg:justify-start"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.img 
                  src="/icon-512.png" 
                  alt="Fusion Logo" 
                  className="w-32 h-32 lg:w-40 lg:h-40 drop-shadow-2xl"
                  animate={{ rotate: 360 }}
                  transition={{ 
                    duration: 20, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  whileHover={{ scale: 1.1 }}
                />
              </motion.div>

              {/* Texte principal - Colonnes centrales et droite */}
              <div className="lg:col-span-9 space-y-3 text-center lg:text-left">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl lg:text-4xl font-bold"
                >
                  Bienvenue dans FUSION
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg lg:text-xl text-muted-foreground"
                >
                  Votre espace de travail créatif vous attend
                </motion.p>

                {/* FUSION = FOCUS - Inline pour économiser l'espace vertical */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-1"
                >
                  <div className="text-base lg:text-lg font-semibold text-primary">
                    FUSION = FOCUS
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Fichiers • Organisation • Création • Utilisation Systémique
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Tous vos fichiers dans une interface cohérente et universelle
                  </div>
                </motion.div>

                {/* Bouton */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="pt-2 flex justify-center lg:justify-start"
                >
                  <Button
                    onClick={onNavigateToFiles}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Home className="w-5 h-5 mr-2" />
                    Explorer mes fichiers
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content Grid */}
        <div className="max-w-7xl mx-auto px-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Folder Tree Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="h-[500px] bg-card/80 backdrop-blur-sm border-2 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Arborescence
                  </CardTitle>
                  <CardDescription>
                    Votre structure de dossiers
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  {renderFolderTree()}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Files Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <Card className="h-[500px] bg-card/80 backdrop-blur-sm border-2 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Fichiers Récents
                  </CardTitle>
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
            </motion.div>

            {/* Add Buttons Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 }}
            >
              <Card className="h-[500px] bg-card/80 backdrop-blur-sm border-2 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Créer Nouveau
                  </CardTitle>
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
        </div>
      </div>
    </div>
  )
}
