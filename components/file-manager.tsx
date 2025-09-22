"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
  import { Archive, Copy, Download, Edit, Eye, File, FileCode, FileText, FileWarning, Folder, FolderOpen, Grid, ImageIcon, Link, List, MoreHorizontal, Move, Music, NotebookText, Palette, Plus, Scissors, Search, SearchX, Share, Trash, Upload, UploadCloud, Video } from "lucide-react"
import { cn } from "@/lib/utils"

import { RenameDialog } from "./rename-dialog"
interface FileManagerProps {
  selectedFolder: string | null
  folderTree?: any // Ajout de la structure des dossiers
  onFolderSelect?: (folderPath: string) => void
}

interface FileItem {
  id: string
  name: string
  type: "image" | "document" | "draw" | "audio" | "video" | "archive" | "link" | "other"
  size: number
  url?: string
  uploadDate: Date
  folderId?: string
  thumbnail?: string
  description?: string
  isDirectory?: boolean
}

const FILE_TYPES: {
  [key: string]: {
    icon: any,
    color: string,
    extensions: string[]
  }
} = {
  folder: { icon: Folder, color: "text-yellow-500", extensions: [] },
  image: { icon: ImageIcon, color: "text-red-500", extensions: ["jpg", "jpeg", "png", "gif", "svg", "webp"] },
  document: { icon: FileText, color: "text-green-500", extensions: ["pdf", "doc", "docx", "txt", "rtf"] },
  note: { icon: NotebookText, color: "text-blue-500", extensions: ["md"] },
  draw: { icon: Palette, color: "text-purple-600 dark:text-purple-400", extensions: ["draw"] },
  audio: { icon: Music, color: "text-purple-500", extensions: ["mp3", "wav", "ogg", "m4a"] },
  video: { icon: Video, color: "text-blue-500", extensions: ["mp4", "avi", "mov", "webm"] },
  archive: { icon: Archive, color: "text-gray-500", extensions: ["zip", "rar", "7z", "tar"] },
  link: { icon: Link, color: "text-cyan-600", extensions: [] },
  code: { icon: FileCode, color: "text-orange-500", extensions: ["js", "ts", "jsx", "tsx", "py", "java", "cpp", "cs", "html", "css", "json"] },
  archive: { icon: Archive, color: "text-gray-500", extensions: ["zip", "rar", "7z", "tar"] },
  other: { icon: File, color: "text-gray-600", extensions: [] },
}

export function FileManager({ selectedFolder, folderTree, onFolderSelect }: FileManagerProps) {
  // Buffer pour copier/couper/coller
  const [clipboard, setClipboard] = useState<{ action: "cut" | "copy"; folder: any } | null>(null);

  // État pour le dialogue de renommage
  const [renameFileState, setRenameFileState] = useState<{ file: FileItem; isOpen: boolean } | null>(null);
  // Actions kebab menu pour dossiers
  const cutFolder = (folder: any) => {
    setClipboard({ action: "cut", folder });
    console.log("Couper dossier:", folder);
  };

  const copyFolder = (folder: any) => {
    setClipboard({ action: "copy", folder });
    console.log("Copier dossier:", folder);
  };

  const pasteFolder = (targetPath: string) => {
    if (!clipboard) return;
    // Logique de déplacement ou duplication à implémenter
    console.log(`Coller dossier ${clipboard.folder.name} dans ${targetPath} (action: ${clipboard.action})`);
    setClipboard(null);
  };

  const renameFolder = (folder: any) => {
    // Logique de renommage à implémenter
    console.log("Renommer dossier:", folder);
  };

  // Suppression réelle d’un dossier (filesystem + folders.json)
  const deleteFolder = async (folder: any) => {
    try {
      // Suppression du dossier dans le filesystem via IPC (Electron)
      if (typeof window !== "undefined" && window.electronAPI && window.electronAPI.deleteFolder && window.electronAPI.foldersSave && window.electronAPI.foldersLoad) {
        console.log("Appel suppression dossier via Electron :", folder.path);
        // Suppression physique du dossier
        const res = await window.electronAPI.deleteFolder(folder.path);
        if (res && res.success) {
          // Charger folders.json, retirer le dossier, sauvegarder
          const folders = await window.electronAPI.foldersLoad();
          if (folders && Array.isArray(folders)) {
            const updatedFolders = folders.filter((f: any) => f.path !== folder.path);
            await window.electronAPI.foldersSave(updatedFolders);
            console.log("Dossier supprimé du disque et de folders.json :", folder.path);
          }
        } else {
          console.error("Erreur suppression dossier:", res?.error);
        }
      } else {
        console.warn("API Electron deleteFolder/foldersSave/foldersLoad non disponible");
      }
      // Optionnel : feedback visuel ou reload
      console.log("Dossier supprimé :", folder.path);
    } catch (err) {
      console.error("Erreur suppression dossier :", err);
    }
  };
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
    {
      id: "5",
      name: "Sketch.draw",
      type: "draw",
      size: 512000,
      uploadDate: new Date("2024-01-11"),
      folderId: "C:/Users/evolu/Documents/Notes/Perso",
      description: "Dessin de croquis",
    },
  ])

  useEffect(() => {
    if (folderTree && selectedFolder) {
      const currentFolder = findFolderNode(folderTree, selectedFolder);
      if (currentFolder && currentFolder.children) {
        const newFiles: FileItem[] = currentFolder.children.map((node: any) => ({
          id: node.path,
          name: node.name,
          type: node.isDirectory ? "folder" : getFileType(node.name),
          size: node.size || 0,
          uploadDate: new Date(node.lastModified),
          folderId: currentFolder.path,
          isDirectory: node.isDirectory,
        }));
        setFiles(newFiles);
      } else {
        setFiles([]);
      }
    } else {
      setFiles([]);
    }
  }, [folderTree, selectedFolder]);

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

  type FileType = "image" | "document" | "draw" | "audio" | "video" | "archive" | "link" | "other" | "note";
  const getFileType = (filename: string): FileType => {
    const extension = filename.split(".").pop()?.toLowerCase();
    if (!extension) return "other";
    if (FILE_TYPES.image.extensions.includes(extension)) return "image";
    if (FILE_TYPES.document.extensions.includes(extension)) return "document";
    if (FILE_TYPES.note.extensions.includes(extension)) return "note";
    if (FILE_TYPES.draw.extensions.includes(extension)) return "draw";
    if (FILE_TYPES.audio.extensions.includes(extension)) return "audio";
    if (FILE_TYPES.video.extensions.includes(extension)) return "video";
    if (FILE_TYPES.archive.extensions.includes(extension)) return "archive";
    if (FILE_TYPES.code.extensions.includes(extension)) return "code";
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

    return {
      id: fileId,
      name: file.name,
      type: getFileType(file.name),
      size: file.size,
      uploadDate: new Date(),
      folderId: selectedFolder || undefined,
    }
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

  const handleLinkUpload = async (url: string) => {
    const fileId = Date.now().toString()
    const newFile: FileItem = {
      id: fileId,
      name: url,
      type: "link",
      size: 0,
      uploadDate: new Date(),
      folderId: selectedFolder || undefined,
      url: url,
    }
    setFiles((prev) => [...prev, newFile])
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles)
    }
  }, [handleFileUpload])

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

  const renameFile = (file: FileItem, newName: string) => {
    setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, name: newName } : f))
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
        <div className="flex items-center gap-3">
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
            <DropdownMenuItem onClick={() => setRenameFileState({ file, isOpen: true })}>
              <Edit className="h-4 w-4 mr-2" />
              Renommer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => deleteFile(file.id)} className="text-red-600 focus:text-red-600">
              <Trash className="h-4 w-4 mr-2" />
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
    <div className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
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
          <DropdownMenuItem onClick={() => setRenameFileState({ file, isOpen: true })}>
            <Edit className="h-4 w-4 mr-2" />
            Renommer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => deleteFile(file.id)} className="text-red-600 focus:text-red-600">
            <Trash className="h-4 w-4 mr-2" />
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <UploadCloud className="h-4 w-4 mr-2" />
                Fichier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsAddDrawOpen(true)}>
                <Palette className="h-4 w-4 mr-2" />
                Dessin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsAddNoteOpen(true)}>
                <NotebookText className="h-4 w-4 mr-2" />
                Note
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Link className="h-4 w-4 mr-2" />
                <Input
                  ref={linkInputRef}
                  placeholder="Coller un lien..."
                  className="h-8"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      addLink();
                    }
                  }}
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 overflow-auto p-4",
          isDragOver ? "border-2 border-dashed border-primary" : ""
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {filteredFiles.length === 0 && searchQuery === "" ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FileWarning className="h-12 w-12 mb-4" />
            <p>Aucun fichier dans ce dossier.</p>
            <p>Faites glisser et déposez des fichiers ici, ou cliquez sur "Ajouter" pour en créer un nouveau.</p>
          </div>
        ) : filteredFiles.length === 0 && searchQuery !== "" ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <SearchX className="h-12 w-12 mb-4" />
            <p>Aucun fichier ne correspond à votre recherche.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFiles.map((file) => (
              <FileRow key={file.id} file={file} />
            ))}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />



      {/* Rename File Dialog */}
      {renameFileState && (
        <RenameDialog
          open={renameFileState.isOpen}
          onOpenChange={(open) => setRenameFileState(open ? renameFileState : null)}
          currentName={renameFileState.file.name}
          currentPath={renameFileState.file.id}
          isFolder={false}
          onRename={(newName) => {
            renameFile(renameFileState.file, newName)
          }}
        />
      )}
    </div>
  )
}
