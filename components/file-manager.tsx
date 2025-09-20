"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Upload,
  File,
  ImageIcon,
  FileText,
  Music,
  Video,
  Archive,
  Link,
  Download,
  Trash2,
  MoreHorizontal,
  Search,
  Grid,
  List,
  FolderOpen,
  Eye,
  Share,
  Copy,
} from "lucide-react"

interface FileManagerProps {
  selectedFolder: string | null
  folderTree?: any // Ajout de la structure des dossiers
  onFolderSelect?: (folderPath: string) => void
}

interface FileItem {
  id: string
  name: string
  type: "image" | "document" | "audio" | "video" | "archive" | "link" | "other"
  size: number
  url?: string
  uploadDate: Date
  folderId?: string
  thumbnail?: string
  description?: string
}

const FILE_TYPES: {
  [key: string]: {
    icon: any,
    color: string,
    extensions: string[]
  }
} = {
  image: { icon: ImageIcon, color: "text-green-600", extensions: ["jpg", "jpeg", "png", "gif", "svg", "webp"] },
  document: { icon: FileText, color: "text-blue-600", extensions: ["pdf", "doc", "docx", "txt", "rtf"] },
  audio: { icon: Music, color: "text-purple-600", extensions: ["mp3", "wav", "ogg", "m4a"] },
  video: { icon: Video, color: "text-red-600", extensions: ["mp4", "avi", "mov", "webm"] },
  archive: { icon: Archive, color: "text-yellow-600", extensions: ["zip", "rar", "7z", "tar"] },
  link: { icon: Link, color: "text-cyan-600", extensions: [] },
  other: { icon: File, color: "text-gray-600", extensions: [] },
}

export function FileManager({ selectedFolder, folderTree, onFolderSelect }: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: "1",
      name: "Mockup_Interface.png",
      type: "image",
      size: 2048576,
      uploadDate: new Date("2024-01-15"),
      folderId: "C:/Users/evolu/Documents/Notes/Perso",
      thumbnail: "/interface-mockup.jpg",
      description: "Mockup de l'interface utilisateur",
    },
    {
      id: "2",
      name: "Specifications.pdf",
      type: "document",
      size: 1024000,
      uploadDate: new Date("2024-01-14"),
      folderId: "C:/Users/evolu/Documents/Notes/Perso",
      description: "Document de spécifications techniques",
    },
    {
      id: "3",
      name: "Presentation_Audio.mp3",
      type: "audio",
      size: 5242880,
      uploadDate: new Date("2024-01-13"),
      folderId: "C:/Users/evolu/Documents/Notes/Pro",
      description: "Enregistrement de la présentation",
    },
    {
      id: "4",
      name: "https://example.com/resource",
      type: "link",
      size: 0,
      url: "https://example.com/resource",
      uploadDate: new Date("2024-01-12"),
      folderId: "C:/Users/evolu/Documents/Notes/Perso",
      description: "Lien vers une ressource externe",
    },
  ])

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  type FileType = "image" | "document" | "audio" | "video" | "archive" | "link" | "other";
  const getFileType = (filename: string): FileType => {
    const extension = filename.split(".").pop()?.toLowerCase();
    if (!extension) return "other";
    if (FILE_TYPES.image.extensions.includes(extension)) return "image";
    if (FILE_TYPES.document.extensions.includes(extension)) return "document";
    if (FILE_TYPES.audio.extensions.includes(extension)) return "audio";
    if (FILE_TYPES.video.extensions.includes(extension)) return "video";
    if (FILE_TYPES.archive.extensions.includes(extension)) return "archive";
    // Si le nom est une URL, on considère comme 'link'
    if (filename.startsWith("http://") || filename.startsWith("https://")) return "link";
    return "other";
  }

  const simulateUpload = async (file: File): Promise<FileItem> => {
    const fileId = Date.now().toString()

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      setUploadProgress((prev) => ({ ...prev, [fileId]: progress }))
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Remove progress after completion
    setUploadProgress((prev) => {
      const newProgress = { ...prev }
      delete newProgress[fileId]
      return newProgress
    })

    const fileType = getFileType(file.name)
    const newFile: FileItem = {
      id: fileId,
      name: file.name,
      type: fileType,
      size: file.size,
      uploadDate: new Date(),
      folderId: selectedFolder || undefined,
      thumbnail: fileType === "image" ? URL.createObjectURL(file) : undefined,
    }

    return newFile
  }

  const handleFileUpload = async (uploadedFiles: FileList) => {
    const fileArray = Array.from(uploadedFiles)

    for (const file of fileArray) {
      try {
        const newFile = await simulateUpload(file)
        setFiles((prev) => [...prev, newFile])
      } catch (error) {
        console.error("Upload failed:", error)
      }
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const addLink = () => {
    const url = linkInputRef.current?.value
    if (!url) return

    const newFile: FileItem = {
      id: Date.now().toString(),
      name: url,
      type: "link",
      size: 0,
      url,
      uploadDate: new Date(),
      folderId: selectedFolder || undefined,
    }

    setFiles((prev) => [...prev, newFile])
    if (linkInputRef.current) {
      linkInputRef.current.value = ""
    }
  }

  const deleteFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const downloadFile = (file: FileItem) => {
    if (file.type === "link" && file.url) {
      window.open(file.url, "_blank")
    } else {
      // Simulate download
      console.log(`Downloading ${file.name}`)
    }
  }

  function normalizePath(path: string): string {
    return path.replace(/\\+$/, '').replace(/\/+$|\/+$|\\+$/, '').toLowerCase();
  }

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFolder = !selectedFolder || normalizePath(file.folderId || '') === normalizePath(selectedFolder)
    return matchesSearch && matchesFolder
  })

  // Trouver le dossier sélectionné
  function findFolderNode(tree: any, path: string): any {
    if (!tree) return null;
    if (tree.path === path) return tree;
    if (tree.children) {
      for (const child of tree.children) {
        const found = findFolderNode(child, path);
        if (found) return found;
      }
    }
    return null;
  }
  const selectedNode = selectedFolder && folderTree ? findFolderNode(folderTree, selectedFolder) : null;
  const childFolders = selectedNode?.children || [];

  // Debug : log selectedFolder, selectedNode, childFolders
  console.log('FileManager selectedFolder:', selectedFolder)
  console.log('FileManager selectedNode:', selectedNode)
  console.log('FileManager childFolders:', childFolders)

  const FileIcon = ({ file }: { file: FileItem }) => {
    const config = FILE_TYPES[file.type]
    const IconComponent = config.icon
    return <IconComponent className={`h-5 w-5 ${config.color}`} />
  }

  const FileCard = ({ file }: { file: FileItem }) => (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileIcon file={file} />
          <Badge variant="outline" className="text-xs">
            {file.type}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => downloadFile(file)}>
              {file.type === "link" ? <Eye className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              {file.type === "link" ? "Ouvrir" : "Télécharger"}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Copier le lien
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share className="h-4 w-4 mr-2" />
              Partager
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => deleteFile(file.id)} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {file.thumbnail && (
        <div className="mb-3">
          <img
            src={file.thumbnail || "/placeholder.svg"}
            alt={file.name}
            className="w-full h-32 object-cover rounded"
          />
        </div>
      )}

      <div className="space-y-2">
        <h4 className="font-medium text-sm truncate" title={file.name}>
          {file.name}
        </h4>
        {file.description && <p className="text-xs text-muted-foreground line-clamp-2">{file.description}</p>}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatFileSize(file.size)}</span>
          <span>{file.uploadDate.toLocaleDateString("fr-FR")}</span>
        </div>
      </div>

      {uploadProgress[file.id] !== undefined && (
        <div className="mt-2">
          <Progress value={uploadProgress[file.id]} className="h-1" />
        </div>
      )}
    </Card>
  )

  const FileRow = ({ file }: { file: FileItem }) => (
    <div className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <FileIcon file={file} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate">{file.name}</span>
          <Badge variant="outline" className="text-xs">
            {file.type}
          </Badge>
        </div>
        {file.description && <p className="text-xs text-muted-foreground truncate">{file.description}</p>}
      </div>
      <div className="text-xs text-muted-foreground text-right">
        <div>{formatFileSize(file.size)}</div>
        <div>{file.uploadDate.toLocaleDateString("fr-FR")}</div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => downloadFile(file)}>
            {file.type === "link" ? <Eye className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            {file.type === "link" ? "Ouvrir" : "Télécharger"}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy className="h-4 w-4 mr-2" />
            Copier le lien
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Share className="h-4 w-4 mr-2" />
            Partager
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => deleteFile(file.id)} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Gestionnaire de fichiers</h2>
            {selectedFolder && <Badge variant="outline">Dossier {selectedFolder}</Badge>}
          </div>

          <div className="flex items-center gap-2">
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des fichiers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>

          <div className="flex items-center gap-2">
            <Input ref={linkInputRef} placeholder="Coller un lien..." className="w-48" />
            <Button onClick={addLink} variant="outline">
              <Link className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={`flex-1 relative ${isDragOver ? "bg-primary/5 border-2 border-dashed border-primary" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/5 z-10">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium text-primary">Déposez vos fichiers ici</p>
              <p className="text-sm text-muted-foreground">Tous les types de fichiers sont acceptés</p>
            </div>
          </div>
        )}

        {/* Dossiers enfants + File List */}
        <ScrollArea className="h-full">
          <div className="p-4">
            {/* Affichage des dossiers enfants */}
            {childFolders.length > 0 && (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                  {childFolders.map((folder: any) => (
                    <Card
                      key={folder.path}
                      className="p-4 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow cursor-pointer"
                      onDoubleClick={() => onFolderSelect && onFolderSelect(folder.path)}
                    >
                      {/* Badge couleur + icône */}
                      <div className="flex items-center gap-2 mb-2">
                        {folder.color && <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: folder.color }} />}
                        {folder.icon && <span className="text-xl">{folder.icon}</span>}
                      </div>
                      <h4 className="font-medium text-sm text-center truncate" title={folder.name}>{folder.name}</h4>
                      {folder.description && <p className="text-xs text-muted-foreground text-center line-clamp-2">{folder.description}</p>}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-1 mb-6">
                  {childFolders.map((folder: any) => (
                    <div
                      key={folder.path}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                      onDoubleClick={() => onFolderSelect && onFolderSelect(folder.path)}
                    >
                      {folder.color && <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: folder.color }} />}
                      {folder.icon && <span className="text-xl">{folder.icon}</span>}
                      <span className="font-medium text-sm truncate" title={folder.name}>{folder.name}</span>
                      {folder.description && <span className="text-xs text-muted-foreground truncate ml-2">{folder.description}</span>}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Affichage des fichiers */}
            {(filteredFiles.length === 0 && childFolders.length === 0) ? (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground mb-2">Aucun fichier</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Glissez-déposez des fichiers ou cliquez sur Importer pour commencer
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importer des fichiers
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredFiles.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredFiles.map((file) => (
                  <FileRow key={file.id} file={file} />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Status Bar */}
      <div className="h-8 bg-muted border-t border-border flex items-center justify-between px-4 text-xs text-muted-foreground">
        <span>{filteredFiles.length} fichier(s)</span>
        <span>Taille totale: {formatFileSize(filteredFiles.reduce((total, file) => total + file.size, 0))}</span>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />
    </div>
  )
}
