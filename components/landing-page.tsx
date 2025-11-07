"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
import { cn } from "@/lib/utils"
import { FILE_TYPES, getFileTypeConfig, type FileType } from "@/lib/file-types"
import type { EnhancedFolderNode } from "@/components/ui/FolderTree-modern"
import { ModernFolderTree } from "@/components/ui/FolderTree-modern"

interface LandingPageProps {
  onNavigateToFiles: () => void
  onNavigateToEditor: (filePath: string) => void
  onCreateNew: (type: FileType) => void
  folderTree: EnhancedFolderNode | null
  recentFiles: any[]
}

export function LandingPage({
  onNavigateToFiles,
  onNavigateToEditor,
  onCreateNew,
  folderTree,
  recentFiles
}: LandingPageProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const renderRecentFile = (file: any) => {
    const config = getFileTypeConfig(file.type || 'generic')
    const Icon = config.icon

    return (
      <motion.div
        key={file.path}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-accent cursor-pointer transition-all"
        onClick={() => onNavigateToEditor(file.path)}
      >
        <div className={cn("w-8 h-8 rounded flex items-center justify-center", config.sidebarButton.background)}>
          <Icon className={cn("w-4 h-4", config.sidebarButton.text)} />
        </div>
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
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 text-center"
        >
          <motion.div
            animate={{
              background: `linear-gradient(45deg, ${currentTheme.gradient})`
            }}
            className="inline-block p-1 rounded-full"
          >
            <div className="bg-background rounded-full p-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-primary" />
              </motion.div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold mt-6 mb-2"
          >
              <div className="flex items-center justify-center mb-2">
                <img src="/icon.ico" alt="Fusion Icon" style={{ width: 36, height: 36, marginRight: 10 }} />
                Bienvenue dans FUSION
              </div>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-muted-foreground mb-4"
          >
            Votre espace de travail créatif vous attend
          </motion.p>

          {/* Animated FOCUS explanation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <div className="text-center space-y-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-lg font-semibold text-primary"
              >
                FUSION = FOCUS
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                className="text-sm text-muted-foreground"
              >
                Fichiers • Organisation • Création • Utilisation Systémique
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="text-xs text-muted-foreground max-w-md mx-auto"
              >
                Tous vos fichiers dans une interface cohérente et universelle
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center gap-4"
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
                  <div className="grid grid-cols-5 gap-2 h-[400px] overflow-y-auto">
                    {Object.entries(FILE_TYPES).map(([type, config]) => (
                      <motion.div
                        key={type}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-3 p-2 rounded-lg bg-card hover:bg-accent transition-all cursor-pointer border border-border/50"
                        onClick={() => onCreateNew(type as FileType)}
                      >
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", config.sidebarButton.background)}>
                          <config.icon className={cn("w-5 h-5", config.sidebarButton.text)} />
                        </div>
                        <div className="font-medium text-sm truncate">{config.name}</div>
                      </motion.div>
                    ))}
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
