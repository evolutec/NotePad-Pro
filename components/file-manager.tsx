"use client"

import React from "react"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Archive, Copy, Download, Edit, Eye, File, FileCode, FileText, FileWarning, Folder, FolderOpen, ImageIcon, Link, MoreHorizontal, Move, Music, NotebookText, Palette, Plus, Scissors, Search, SearchX, Share, Trash, Upload, UploadCloud, Video, FilePlus, ChevronLeft, ChevronRight, Home, FileImage, FileVideo, FileAudio, Sheet, Presentation, List, LayoutGrid } from "lucide-react"
import { FileConflictDialog } from "./file-conflict-dialog"

// Custom PDF icon component
const FileIconPdf = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <text x="7" y="16" fontSize="3" fill="currentColor" fontWeight="bold">PDF</text>
  </svg>
)


import { cn } from "@/lib/utils"
import { AddPdfDocumentDialog } from "./add-pdf-document_dialog"
import { AddDrawDialog } from "./add-draw_dialog"

import { RenameDialog } from "./rename-dialog"

interface FileManagerProps {
  selectedFolder: string | null
  folderTree?: any // Ajout de la structure des dossiers
  onFolderSelect?: (folderPath: string) => void
  onNoteSelect?: (notePath: string) => void
  onImageSelect?: (imagePath: string, imageName: string, imageType: string) => void
  onVideoSelect?: (videoPath: string, videoName: string, videoType: string) => void
  onDocumentSelect?: (documentPath: string, documentName: string, documentType: string) => void
  selectedNote?: string | null; // Add selectedNote prop
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  viewMode?: "grid" | "list";
}

type FileType = "image" | "document" | "draw" | "audio" | "video" | "archive" | "link" | "other" | "code" | "note" | "folder" | "pdf"

interface FileItem {
  id: string
  name: string
  type: FileType
  size: number
  url?: string
  uploadDate: Date
  folderId?: string
  thumbnail?: string
  description?: string
  isDirectory?: boolean
  owner?: string
  permissions?: string
  attributes?: {
    isReadable?: boolean
    isWritable?: boolean
    isExecutable?: boolean
    isHidden?: boolean
    isSystem?: boolean
  }
  modifiedAt?: Date
  createdAt?: Date
}

const FILE_TYPES: {
  [key: string]: {
    icon: any,
    color: string,
    extensions: string[]
  }
} = {
  folder: { icon: Folder, color: "text-yellow-500", extensions: [] },
  image: { icon: FileImage, color: "text-yellow-500", extensions: ["jpg", "jpeg", "png", "gif", "svg", "webp"] },
  pdf: { icon: FileText, color: "text-red-600", extensions: ["pdf"] },
  document: { icon: FileText, color: "text-blue-600", extensions: ["doc", "docx", "rtf"] },
  excel: { icon: Sheet, color: "text-green-600", extensions: ["xls", "xlsx"] },
  powerpoint: { icon: Presentation, color: "text-orange-600", extensions: ["ppt", "pptx"] },
  note: { icon: FileText, color: "text-blue-500", extensions: ["md", "txt"] },
  draw: { icon: Palette, color: "text-purple-600", extensions: ["draw"] },
  audio: { icon: FileAudio, color: "text-pink-500", extensions: ["mp3", "wav", "wave", "ogg", "oga", "opus", "flac", "aac", "m4a", "m4b", "m4p", "wma", "aiff", "aif", "ape", "mka", "wv", "tta", "tak", "mp2", "mp1", "mpa", "ac3", "dts", "amr", "3gp", "ra", "ram", "weba"] },
  video: { icon: FileVideo, color: "text-gray-500", extensions: ["mp4", "webm", "ogv", "avi", "mov", "mkv", "wmv", "flv"] },
  archive: { icon: Archive, color: "text-gray-500", extensions: ["zip", "rar", "7z", "tar"] },
  link: { icon: Link, color: "text-cyan-600", extensions: [] },
  code: { icon: FileCode, color: "text-orange-500", extensions: ["js", "ts", "jsx", "tsx", "py", "java", "cpp", "cs", "html", "css", "json"] },
  other: { icon: File, color: "text-gray-600", extensions: [] },
}

// Fonction utilitaire pour obtenir l'icône et la couleur selon le type de fichier
const getFileIconAndColor = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  
  // Vérifier chaque type de fichier
  for (const [type, config] of Object.entries(FILE_TYPES)) {
    if (config.extensions.includes(ext)) {
      return { Icon: config.icon, color: config.color, type }
    }
  }
  
  // Cas spéciaux basés sur l'extension complète
  if (fileName.endsWith('.draw')) {
    return { Icon: Palette, color: "text-purple-600", type: 'draw' }
  }
  
  // Par défaut
  return { Icon: File, color: "text-gray-600", type: 'other' }
}

// FileListRow component for list view
const FileListRow = React.memo(({
  file, 
  handleFileClick, 
  handleDeleteFile,
  setRenameFileState,
  setFileConflict
}: {
  file: FileItem;
  handleFileClick: (file: FileItem) => void;
  handleDeleteFile: (file: FileItem) => void;
  setRenameFileState: (state: { file: FileItem; isOpen: boolean } | null) => void;
  setFileConflict: (state: { 
    fileName: string; 
    sourcePath: string; 
    targetFolder: string;
    isMove: boolean;
    oldPath?: string;
    newPath?: string;
  } | null) => void;
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const { Icon, color } = getFileIconAndColor(file.name);

  return (
    <div
      className="flex items-center gap-4 p-3 hover:bg-muted/50 cursor-pointer border-b border-border/50 group"
      onClick={() => handleFileClick(file)}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
        <Icon className={`w-6 h-6 ${color}`} />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{file.name}</div>
        {file.description && (
          <div className="text-xs text-muted-foreground truncate">{file.description}</div>
        )}
      </div>

      {/* Size */}
      <div className="flex-shrink-0 w-20 text-right text-sm text-muted-foreground">
        {file.isDirectory ? '--' : formatFileSize(file.size)}
      </div>

      {/* Modified Date */}
      <div className="flex-shrink-0 w-40 text-sm text-muted-foreground">
        {formatDate(file.modifiedAt || file.uploadDate)}
      </div>

      {/* Owner */}
      <div className="flex-shrink-0 w-24 text-sm text-muted-foreground">
        {file.owner || '--'}
      </div>

      {/* Permissions */}
      <div className="flex-shrink-0 w-16 text-sm text-muted-foreground font-mono">
        {file.permissions || '--'}
      </div>

      {/* Actions */}
      {!file.isDirectory && (
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-8 h-8"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onSelect={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  /* handleCopy(file) */ 
                }}
              >
                <Copy className="mr-2 h-4 w-4" /> Copy
              </DropdownMenuItem>
              <DropdownMenuItem 
                onSelect={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  /* handleMove(file) */ 
                }}
              >
                <Move className="mr-2 h-4 w-4" /> Move
              </DropdownMenuItem>
              <DropdownMenuItem 
                onSelect={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteFile(file); 
                }}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
              {file.url && (
                <DropdownMenuItem 
                  onSelect={(e) => { 
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(file.url, '_blank'); 
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" /> Open Link
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
});

FileListRow.displayName = 'FileListRow';

// FileCard component to handle individual file drag & drop with hooks
const FileCard = React.memo(({
  file,
  handleFileClick,
  handleDeleteFile,
  setRenameFileState,
  uploadProgress,
  setFileConflict
}: {
  file: FileItem;
  handleFileClick: (file: FileItem) => void;
  handleDeleteFile: (file: FileItem) => void;
  setRenameFileState: (state: { file: FileItem; isOpen: boolean } | null) => void;
  uploadProgress: { [key: string]: number };
  setFileConflict: (state: {
    fileName: string;
    sourcePath: string;
    targetFolder: string;
    isMove: boolean;
    oldPath?: string;
    newPath?: string;
  } | null) => void;
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  
  return (
    <div
      key={file.id}
      draggable
      className={cn(
        "relative group cursor-pointer transition-all duration-200 hover:shadow-md",
        file.isDirectory ? "hover:scale-105" : "",
        isDragOver && file.isDirectory && "ring-2 ring-primary bg-primary/10"
      )}
      style={{
        pointerEvents: 'auto',
        zIndex: 10,
        position: 'relative'
      }}
      onDragStart={(e: React.DragEvent) => {
        e.stopPropagation();
        const dragData = {
          sourcePath: file.id,
          sourceNode: file,
          sourceType: 'filemanager'
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'move';
        console.log('🔵 Drag started from filemanager:', file.id);
      }}
      onDragOver={(e: React.DragEvent) => {
        if (file.isDirectory) {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'move';
          setIsDragOver(true);
        }
      }}
      onDragLeave={(e: React.DragEvent) => {
        e.stopPropagation();
        setIsDragOver(false);
      }}
      onDrop={async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        
        if (!file.isDirectory) return;
        
        try {
          const dragDataStr = e.dataTransfer.getData('application/json');
          if (!dragDataStr) return;
          
          const dragData = JSON.parse(dragDataStr);
          const sourcePath = dragData.sourcePath;
          const targetPath = file.id;
          
          console.log('🟢 Drop detected on folder:', targetPath);
          console.log('📁 Source:', sourcePath);
          console.log('📁 Target:', targetPath);
          
          // Don't allow dropping on self or parent
          if (sourcePath === targetPath || targetPath.startsWith(sourcePath)) {
            console.log('❌ Cannot drop on self or child folder');
            return;
          }
          
          // Move the file/folder using Electron API
          if (typeof window !== 'undefined' && window.electronAPI?.fsMove) {
            const fileName = sourcePath.split('\\').pop() || sourcePath.split('/').pop();
            const newPath = `${targetPath}\\${fileName}`;
            
            console.log('🚀 Moving file:', sourcePath, '→', newPath);
            const result = await window.electronAPI.fsMove(sourcePath, newPath);
            
            if (result.success) {
              console.log('✅ File moved successfully');
              // Trigger refresh via DOM event
              window.dispatchEvent(new Event('folderTreeRefresh'));
              window.dispatchEvent(new Event('recentFilesRefresh'));
            } else if (result.conflict) {
              // File conflict detected, show dialog
              console.log('⚠️ File conflict detected:', result.existingFileName);
              setFileConflict({
                fileName: result.existingFileName || fileName || '',
                sourcePath: '',
                targetFolder: '',
                isMove: true,
                oldPath: sourcePath,
                newPath: newPath
              });
            } else {
              console.error('❌ Move failed:', result.error);
            }
          }
        } catch (error) {
          console.error('❌ Drop error:', error);
        }
      }}
      onClick={(e) => {
        console.log('=== FILEMANAGER CARD CLICK DETECTED ===');
        console.log('Event:', e);
        console.log('File:', file.name, file.id);
        handleFileClick(file);
      }}
      onMouseDown={(e) => {
        console.log('=== FILEMANAGER CARD MOUSEDOWN ===');
        e.stopPropagation();
      }}
    >
      {file.isDirectory ? (
        /* Folder with icon */
        <div className="relative flex flex-col items-center p-4">
          <Folder className="w-20 h-20 text-yellow-500" />
          <span className="text-xs font-medium text-center truncate max-w-full px-1 mt-2">
            {file.name}
          </span>
        </div>
      ) : (
        /* Regular files - Same design as sidebar */
        <div className="flex flex-col items-center justify-center p-4">
          {(() => {
            const { Icon, color } = getFileIconAndColor(file.name)

            return (
              <div className="relative flex flex-col items-center justify-center gap-2">
                <Icon className={`w-20 h-20 ${color}`} />
                <span className="text-xs font-medium text-center truncate max-w-full px-1">
                  {file.name}
                </span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Dropdown menu for non-folder items */}
      {!file.isDirectory && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-8 h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Kebab menu clicked for file:', file.name);
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* <DropdownMenuItem 
                onSelect={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  setRenameFileState({ file, isOpen: true }); 
                }}
              >
                <Edit className="mr-2 h-4 w-4" /> Rename
              </DropdownMenuItem> */}
              <DropdownMenuItem 
                onSelect={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  /* handleCopy(file) */ 
                }}
              >
                <Copy className="mr-2 h-4 w-4" /> Copy
              </DropdownMenuItem>
              <DropdownMenuItem 
                onSelect={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  /* handleMove(file) */ 
                }}
              >
                <Move className="mr-2 h-4 w-4" /> Move
              </DropdownMenuItem>
              <DropdownMenuItem 
                onSelect={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteFile(file); 
                }}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
              {file.url && (
                <DropdownMenuItem 
                  onSelect={(e) => { 
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(file.url, '_blank'); 
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" /> Open Link
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {uploadProgress[file.id] !== undefined && (
        <Progress value={uploadProgress[file.id]} className="w-full mt-2" />
      )}
    </div>
  );
});

FileCard.displayName = 'FileCard';

export function FileManager({
  selectedFolder,
  folderTree,
  onFolderSelect,
  onNoteSelect,
  onImageSelect,
  onVideoSelect,
  onDocumentSelect,
  selectedNote, // Add selectedNote here
  searchQuery: externalSearchQuery = "",
  onSearchQueryChange,
  viewMode: externalViewMode = "grid",
}: FileManagerProps) {
  console.log("FileManager: Component re-rendered with selectedNote", selectedNote);
  // Buffer pour copier/couper/coller
  const [clipboard, setClipboard] = useState<{ action: "cut" | "copy"; folder: any } | null>(null);

  // État pour le dialogue de renommage
  const [renameFileState, setRenameFileState] = useState<{ file: FileItem; isOpen: boolean } | null>(null);

  // État pour le dialogue de conflit de fichier
  const [fileConflict, setFileConflict] = useState<{ 
    fileName: string; 
    sourcePath: string; 
    targetFolder: string;
    isMove: boolean;
    oldPath?: string;
    newPath?: string;
  } | null>(null);

  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [selectedFileForView, setSelectedFileForView] = useState<FileItem | null>(null);
  const [existingFolders, setExistingFolders] = useState<any[]>([]);

  useEffect(() => {
    console.log("FileManager: useEffect for selectedNote triggered", selectedNote);
    const loadSelectedNote = async () => {
      if (selectedNote) {
        const fileExtension = selectedNote.split('.').pop()?.toLowerCase();
        if (fileExtension === 'pdf') {
          // Assuming selectedNote is the full path to the file
          const fileItem: FileItem = {
            id: selectedNote, // Or a proper ID if available
            name: selectedNote.split('\\').pop() || '', // Extract file name
            type: 'document',
            size: 0, // Placeholder
            uploadDate: new Date(),
          };
          setSelectedFileForView(fileItem);
          if (typeof window !== "undefined" && window.electronAPI && window.electronAPI.readFile) {
            try {
              const result = await window.electronAPI.readFile(selectedNote);
              if (result.success) {
                setSelectedFileContent(`data:application/pdf;base64,${result.data}`);
              } else {
                console.error("Error reading PDF file:", result.error);
              }
            } catch (error) {
              console.error("Error reading PDF file with Electron API:", error);
            }
          }
        } else {
          setSelectedFileForView(null);
          setSelectedFileContent(null);
        }
      } else {
        setSelectedFileForView(null);
        setSelectedFileContent(null);
      }
    };
    loadSelectedNote();
  }, [selectedNote]);

  // Actions kebab menu pour dossiers
  const cutFolder = (folder: any) => {
    setClipboard({ action: "cut", folder });
  };

  const copyFolder = (folder: any) => {
    setClipboard({ action: "copy", folder });
  };

  const pasteFolder = async (targetFolderId: string) => {
    if (clipboard) {
      // Logic to move/copy folder
      console.log(`${clipboard.action} folder ${clipboard.folder.name} to ${targetFolderId}`);
      setClipboard(null);
    }
  };

  const renameFolder = async (folder: any, newName: string) => {
    console.log(`Renaming folder ${folder.name} to ${newName}`);
    // Implement actual rename logic
  };

  const deleteFolder = async (folder: any) => {
    console.log(`Deleting folder ${folder.name}`);
    try {
      if (window.electronAPI?.fileDelete) {
        const result = await window.electronAPI.fileDelete(folder.path || folder.id);
        if (result.success) {
          console.log(`Folder ${folder.name} deleted successfully`);

          // Clean up folder from folders.json
          await cleanupFolderFromJson(folder.id);

          // Refresh the folder tree or reload folders
          if (window.electronAPI?.foldersLoad) {
            const updatedFolders = await window.electronAPI.foldersLoad();
            setExistingFolders(updatedFolders);
          }
        } else {
          console.error(`Failed to delete folder ${folder.name}:`, result.error);
        }
      } else {
        console.error('Electron API fileDelete not available');
      }
    } catch (error) {
      console.error(`Error deleting folder ${folder.name}:`, error);
    }
  };

  // Actions kebab menu pour fichiers
  const handleRenameFile = async (newName: string) => {
    if (!renameFileState) return;

    console.log('=== FILEMANAGER RENAME DEBUG START ===');
    console.log('Renaming file:', renameFileState.file.name, 'to:', newName);
    console.log('File path:', renameFileState.file.id);

    try {
      if (!window.electronAPI?.fileRename) {
        console.error('Electron API fileRename not available');
        return;
      }

      const oldPath = renameFileState.file.id;
      console.log('Original path:', oldPath);

      const result = await window.electronAPI.fileRename(oldPath, newName);

      if (result.success) {
        console.log(`Successfully renamed: ${oldPath} -> ${result.newPath || newName}`);

        // Calculate the new path
        const parentDir = oldPath.substring(0, oldPath.lastIndexOf('\\'));
        const newPath = `${parentDir}\\${newName}`;

        // Dispatch detailed rename event with old and new paths
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('fileRenamed', {
            detail: {
              oldPath: oldPath,
              newPath: newPath,
              fileType: renameFileState.file.type,
              timestamp: Date.now()
            }
          }));

          // Also dispatch the standard refresh events
          window.dispatchEvent(new CustomEvent('folderTreeRefresh', {
            detail: { timestamp: Date.now() }
          }));

          window.dispatchEvent(new CustomEvent('fileManagerRefresh', {
            detail: { timestamp: Date.now() }
          }));

          window.dispatchEvent(new CustomEvent('recentFilesRefresh', {
            detail: { timestamp: Date.now() }
          }));
        }

        console.log('✅ File rename operation completed successfully - UI should refresh immediately');

      } else {
        console.error(`❌ Failed to rename ${oldPath}:`, result.error);
        alert(`Erreur lors du renommage: ${result.error}`);
      }
    } catch (error) {
      console.error('Error during rename:', error);
      alert(`Erreur lors du renommage: ${error instanceof Error ? error.message : error}`);
    }

    // Close the rename dialog
    setRenameFileState(null);
  };

  const handleDeleteFile = async (file: FileItem) => {
    console.log(`Deleting file ${file.name}`);
    try {
      if (window.electronAPI?.fileDelete) {
        const result = await window.electronAPI.fileDelete(file.id);
        if (result.success) {
          console.log(`File ${file.name} deleted successfully`);

          // Clean up metadata from JSON files based on file type
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          if (fileExtension === 'pdf') {
            await cleanupPdfFromJson(file.id);
          } else if (fileExtension === 'md') {
            await cleanupNoteFromJson(file.id);
          } else if (fileExtension === 'draw') {
            await cleanupDrawFromJson(file.id);
          }

          // Refresh the file list or reload files
          // This would need to be connected to your file state management
        } else {
          console.error(`Failed to delete file ${file.name}:`, result.error);
        }
      } else {
        console.error('Electron API fileDelete not available');
      }
    } catch (error) {
      console.error(`Error deleting file ${file.name}:`, error);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  // JSON file management functions
  const readJsonFile = async (filename: string): Promise<any[]> => {
    try {
      if (window.electronAPI?.readFile) {
        const result = await window.electronAPI.readFile(filename);
        if (result.success && result.data) {
          return JSON.parse(result.data);
        }
      }
    } catch (error) {
      console.error(`Error reading ${filename}:`, error);
    }
    return [];
  };

  const writeJsonFile = async (filename: string, data: any[]): Promise<boolean> => {
    try {
      if (window.electronAPI?.writeFile) {
        const result = await window.electronAPI.writeFile(filename, JSON.stringify(data, null, 2));
        return result?.success || false;
      }
    } catch (error) {
      console.error(`Error writing ${filename}:`, error);
    }
    return false;
  };

  const cleanupFolderFromJson = async (folderId: string): Promise<void> => {
    try {
      // Remove from folders.json
      const folders = await readJsonFile('folders.json');
      const filteredFolders = folders.filter((f: any) => f.id !== folderId);
      const success = await writeJsonFile('folders.json', filteredFolders);
      if (success) {
        console.log(`Cleaned up folder ${folderId} from folders.json`);
      }
    } catch (error) {
      console.error(`Error cleaning up folder ${folderId} from JSON:`, error);
    }
  };

  const cleanupNoteFromJson = async (noteId: string): Promise<void> => {
    try {
      // Remove from notes.json
      const notes = await readJsonFile('notes.json');
      const filteredNotes = notes.filter((n: any) => n.id !== noteId);
      if (window.electronAPI?.writeFile) {
        const writeResult = await window.electronAPI.writeFile('notes.json', JSON.stringify(filteredNotes, null, 2));
        if (writeResult?.success) {
          console.log(`Cleaned up note ${noteId} from notes.json`);
        }
      }
    } catch (error) {
      console.error(`Error cleaning up note ${noteId} from JSON:`, error);
    }
  };

  const cleanupDrawFromJson = async (drawId: string): Promise<void> => {
    try {
      // Remove from draws.json
      const draws = await readJsonFile('draws.json');
      const filteredDraws = draws.filter((d: any) => d.id !== drawId);
      if (window.electronAPI?.writeFile) {
        const writeResult = await window.electronAPI.writeFile('draws.json', JSON.stringify(filteredDraws, null, 2));
        if (writeResult?.success) {
          console.log(`Cleaned up draw ${drawId} from draws.json`);
        }
      }
    } catch (error) {
      console.error(`Error cleaning up draw ${drawId} from JSON:`, error);
    }
  };

  const cleanupPdfFromJson = async (pdfId: string): Promise<void> => {
    try {
      // Remove from pdfs.json
      const pdfs = await readJsonFile('pdfs.json');
      const filteredPdfs = pdfs.filter((p: any) => p.id !== pdfId);
      if (window.electronAPI?.writeFile) {
        const writeResult = await window.electronAPI.writeFile('pdfs.json', JSON.stringify(filteredPdfs, null, 2));
        if (writeResult?.success) {
          console.log(`Cleaned up PDF ${pdfId} from pdfs.json`);
        }
      }
    } catch (error) {
      console.error(`Error cleaning up PDF ${pdfId} from JSON:`, error);
    }
  };

  const getFileType = (filename: string): FileType => {
    const extension = filename.split(".").pop()?.toLowerCase();
    if (!extension) return "other";

    // Check for PDF first (most specific)
    if (FILE_TYPES.pdf.extensions.includes(extension)) {
      console.log('PDF file detected in file-manager getFileType:', filename);
      return "pdf";
    }

    // Then check other types
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
  };

  const files = useMemo(() => {
    if (!selectedFolder || !folderTree) {
      console.log('FileManager: No selectedFolder or folderTree, returning empty array');
      return [];
    }

    console.log('FileManager: Looking for selectedFolder:', selectedFolder);
    console.log('FileManager: folderTree:', folderTree);

    // Function to find folder in tree structure with path normalization
    const findFolderInTree = (tree: any, targetPath: string): any => {
      // Normalize paths for comparison (convert backslashes to forward slashes)
      const normalizePath = (path: string) => path.replace(/\\/g, '/');
      const normalizedTreePath = normalizePath(tree.path || '');
      const normalizedTargetPath = normalizePath(targetPath);

      console.log('FileManager: Checking tree node:', normalizedTreePath, 'against target:', normalizedTargetPath);

      if (normalizedTreePath === normalizedTargetPath) {
        console.log('FileManager: Found matching folder:', tree.path);
        return tree;
      }

      // Also try exact string match as fallback
      if (tree.path === targetPath) {
        console.log('FileManager: Found exact match:', tree.path);
        return tree;
      }

      if (tree.children) {
        for (const child of tree.children) {
          const found = findFolderInTree(child, targetPath);
          if (found) return found;
        }
      }
      return null;
    };

    const selectedFolderData = findFolderInTree(folderTree, selectedFolder);

    if (selectedFolderData) {
      console.log('FileManager: Found selectedFolderData:', selectedFolderData);

      // Convert tree structure to FileItem array
      const convertToFileItems = (items: any[]): FileItem[] => {
        return items.map(item => ({
          id: item.path || item.id || item.name,
          name: item.name,
          type: item.type === 'folder' ? 'folder' : getFileType(item.name),
          size: item.size || 0,
          url: item.url,
          uploadDate: item.modifiedAt ? new Date(item.modifiedAt) : new Date(),
          folderId: item.parent,
          thumbnail: item.thumbnail,
          description: item.description,
          isDirectory: item.type === 'folder' || item.isDirectory || !!item.children,
          owner: item.owner,
          permissions: item.permissions,
          attributes: item.attributes,
          modifiedAt: item.modifiedAt ? new Date(item.modifiedAt) : undefined,
          createdAt: item.createdAt ? new Date(item.createdAt) : undefined
        }));
      };

      // Get files and subfolders
      const allItems: FileItem[] = [];

      if (selectedFolderData.children) {
        allItems.push(...convertToFileItems(selectedFolderData.children));
        console.log('FileManager: Converted items:', allItems.length, 'items');
      } else {
        console.log('FileManager: No children in selectedFolderData');
      }

      return allItems;
    } else {
      console.log('FileManager: selectedFolder not found in tree:', selectedFolder);
      console.log('FileManager: Available paths in tree:');
      const collectPaths = (node: any, prefix = '') => {
        const currentPath = prefix ? `${prefix}/${node.name}` : node.name;
        console.log('  -', node.path || currentPath);
        if (node.children) {
          node.children.forEach((child: any) => collectPaths(child, node.path || currentPath));
        }
      };
      if (folderTree) collectPaths(folderTree);

      // Enhanced fallback: try to find a folder that contains the selected path
      console.log('FileManager: Attempting enhanced fallback...');
      const findContainingFolder = (tree: any, targetPath: string): any => {
        const normalizePath = (path: string) => path.replace(/\\/g, '/');
        const normalizedTreePath = normalizePath(tree.path || '');
        const normalizedTargetPath = normalizePath(targetPath);

        // Check if target path starts with tree path (tree is parent of target)
        if (normalizedTargetPath.startsWith(normalizedTreePath) && normalizedTreePath !== normalizedTargetPath) {
          console.log('FileManager: Found parent folder:', tree.path);
          return tree;
        }

        // Check children recursively
        if (tree.children) {
          for (const child of tree.children) {
            const found = findContainingFolder(child, targetPath);
            if (found) return found;
          }
        }
        return null;
      };

      const containingFolder = findContainingFolder(folderTree, selectedFolder);
      if (containingFolder) {
        console.log('FileManager: Using containing folder as fallback:', containingFolder.path);
        // Convert tree structure to FileItem array for the containing folder
        const convertToFileItems = (items: any[]): FileItem[] => {
          return items.map(item => ({
            id: item.path || item.id || item.name,
            name: item.name,
            type: item.type === 'folder' ? 'folder' : getFileType(item.name),
            size: item.size || 0,
            url: item.url,
            uploadDate: item.modifiedAt ? new Date(item.modifiedAt) : new Date(),
            folderId: item.parent,
            thumbnail: item.thumbnail,
            description: item.description,
            isDirectory: item.type === 'folder' || item.isDirectory || !!item.children,
            owner: item.owner,
            permissions: item.permissions,
            attributes: item.attributes,
            modifiedAt: item.modifiedAt ? new Date(item.modifiedAt) : undefined,
            createdAt: item.createdAt ? new Date(item.createdAt) : undefined
          }));
        };

        return containingFolder.children ? convertToFileItems(containingFolder.children) : [];
      }

      // Final fallback: use root folder
      console.log('FileManager: Using root folder as final fallback');
      if (folderTree && folderTree.children) {
        const convertToFileItems = (items: any[]): FileItem[] => {
          return items.map(item => ({
            id: item.path || item.id || item.name,
            name: item.name,
            type: item.type === 'folder' ? 'folder' : getFileType(item.name),
            size: item.size || 0,
            url: item.url,
            uploadDate: item.modifiedAt ? new Date(item.modifiedAt) : new Date(),
            folderId: item.parent,
            thumbnail: item.thumbnail,
            description: item.description,
            isDirectory: item.type === 'folder' || item.isDirectory || !!item.children,
            owner: item.owner,
            permissions: item.permissions,
            attributes: item.attributes,
            modifiedAt: item.modifiedAt ? new Date(item.modifiedAt) : undefined,
            createdAt: item.createdAt ? new Date(item.createdAt) : undefined
          }));
        };
        return convertToFileItems(folderTree.children);
      }
    }

    console.log('FileManager: Returning empty array');
    return [];
  }, [selectedFolder, folderTree]);

  const handleFileUpload = async (selectedFiles: FileList) => {
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileId = `file-${Date.now()}-${i}`;
      setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress <= 100) {
          setUploadProgress((prev) => ({ ...prev, [fileId]: progress }));
        } else {
          clearInterval(interval);
        }
      }, 100);

      try {
        const uploadedFile = await simulateUpload(file);
        // Add the uploaded file to the current folder's files
        // This part needs to be connected to your state management for files
        console.log("Uploaded file:", uploadedFile);
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        setUploadProgress((prev) => {
          const newState = { ...prev };
          delete newState[fileId];
          return newState;
        });
      }
    }
  };

  const handleAddLink = (url: string) => {
    console.log("Adding link:", url);
    // Implement logic to add link to the current folder
  };

  const simulateUpload = async (file: File): Promise<FileItem> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `file-${Date.now()}`,
          name: file.name,
          type: getFileType(file.name),
          size: file.size,
          uploadDate: new Date(),
          folderId: selectedFolder || "root",
        });
      }, 1000);
    });
  };

  const handleFileClick = useCallback(async (file: FileItem) => {
    console.log('=== FILEMANAGER CLICK DEBUG ===');
    console.log('FileManager: handleFileClick called with file:', file.name, 'type:', file.type, 'isDirectory:', file.isDirectory);
    console.log('File details:', file);
    console.log('Available handlers:', { onFolderSelect, onNoteSelect, onImageSelect, onVideoSelect });

    if (file.isDirectory) {
      console.log('FileManager: Folder clicked, calling onFolderSelect');
      onFolderSelect?.(file.id);
      return;
    }

    // Check if it's an image file
    if (file.type === 'image' && onImageSelect) {
      console.log('FileManager: Image file clicked, calling onImageSelect');
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'png';
      onImageSelect(file.id, file.name, fileExtension);
      return;
    }

    // Check if it's a video file
    if (file.type === 'video' && onVideoSelect) {
      console.log('FileManager: Video file clicked, calling onVideoSelect');
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      onVideoSelect(file.id, file.name, fileExtension);
      return;
    }

    // For other files, use the note handler
    console.log('FileManager: Other file clicked, calling onNoteSelect');
    onNoteSelect?.(file.id);
    console.log('=== FILEMANAGER CLICK END ===');
  }, [onFolderSelect, onNoteSelect, onImageSelect, onVideoSelect]);

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes((externalSearchQuery || "").toLowerCase())
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderFileIcon = (file: FileItem) => {
    const fileType = file.isDirectory ? "folder" : getFileType(file.name);

    // Special case for PDF files - use custom PDF icon
    if (fileType === "pdf" || (file.name && file.name.toLowerCase().endsWith('.pdf'))) {
      console.log('PDF file detected in file-manager renderFileIcon:', file.name);
      return <FileIconPdf className="h-10 w-10 text-red-600" />;
    }

    const Icon = FILE_TYPES[fileType]?.icon || File;
    const colorClass = FILE_TYPES[fileType]?.color || "text-gray-600";
    return <Icon className={cn("h-10 w-10", colorClass)} />;
  };

  return (
    <Card className="flex flex-col h-full">
      <div 
        className="flex flex-col h-full w-full"
        onDragOver={(e: React.DragEvent) => {
          // Check if this is an external file drag (not from our app)
          const hasFiles = e.dataTransfer.types.includes('Files');
          const hasJson = e.dataTransfer.types.includes('application/json');
          
          // If it has Files but no JSON data, it's likely external
          if (hasFiles && !hasJson) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔵 Possible external file dragOver detected');
          }
        }}
        onDrop={async (e: React.DragEvent) => {
          console.log('🟢 Drop event triggered!');
          console.log('Data types:', e.dataTransfer.types);
          console.log('Files count:', e.dataTransfer.files.length);
          
          // Try to get JSON data first (internal drag)
          let jsonData = null;
          try {
            const jsonStr = e.dataTransfer.getData('application/json');
            if (jsonStr) {
              jsonData = JSON.parse(jsonStr);
              console.log('📋 JSON data found - this is an internal drag:', jsonData);
            }
          } catch (err) {
            // No JSON data or parse error
          }
          
          // If we have JSON data, it's an internal drag - let FileCard handle it
          if (jsonData) {
            console.log('ℹ️ Internal drag detected - not handling here');
            return; // Don't prevent default, let it bubble to FileCard
          }
          
          // Check if this is an external file drop (Files but no JSON data)
          const hasFiles = e.dataTransfer.types.includes('Files');
          
          if (hasFiles && e.dataTransfer.files.length > 0) {
            // Use Electron's webUtils.getPathForFile to get the real file path
            const firstFile = e.dataTransfer.files[0];
            let filePath: string | null = null;
            
            if (typeof window !== 'undefined' && window.electronAPI?.getPathForFile) {
              try {
                filePath = window.electronAPI.getPathForFile(firstFile);
                console.log('📋 File path from webUtils:', filePath);
              } catch (error) {
                console.error('❌ Error getting file path:', error);
              }
            }
            
            // If no path, it's not a real external file
            if (!filePath) {
              console.log('ℹ️ No file path found - this is likely an internal browser drag, ignoring');
              return;
            }
            
            // This is a real external file drop from Windows Explorer
            e.preventDefault();
            e.stopPropagation();
            
            console.log('📦 External files dropped from Windows:', e.dataTransfer.files.length);
            
            // Process each dropped file
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
              const file = e.dataTransfer.files[i];
              console.log('📄 Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);
              
              const filePathStr = window.electronAPI?.getPathForFile ? window.electronAPI.getPathForFile(file) : null;
              if (!filePathStr) {
                console.error('❌ Could not get path for file:', file.name);
                continue;
              }
              
              console.log('📂 File path:', filePathStr);
              console.log('📂 Target folder:', selectedFolder || folderTree?.path);
              
              // Import the file into the current folder
              if (typeof window !== 'undefined' && window.electronAPI?.copyExternalFile) {
                try {
                  const result = await window.electronAPI.copyExternalFile(
                    filePathStr, // Source path (Electron provides this via file.path)
                    selectedFolder || folderTree?.path || '' // Target folder
                  );
                  
                  if (result.success) {
                    console.log('✅ File imported successfully:', result.targetPath);
                    // Refresh the file list
                    window.dispatchEvent(new Event('folderTreeRefresh'));
                    window.dispatchEvent(new Event('recentFilesRefresh'));
                  } else if (result.conflict) {
                    // File conflict detected, show dialog
                    console.log('⚠️ File conflict detected:', result.existingFileName);
                    setFileConflict({
                      fileName: result.existingFileName || file.name,
                      sourcePath: filePathStr,
                      targetFolder: selectedFolder || folderTree?.path || '',
                      isMove: false
                    });
                  } else {
                    console.error('❌ Import failed:', result.error);
                  }
                } catch (error) {
                  console.error('❌ Import error:', error);
                }
              } else {
                console.error('❌ copyExternalFile API not available');
              }
            }
          }
        }}
      >
      <style jsx>{`
        .folder {
          width: 120px;
          height: 90px;
          margin: 0 auto;
          position: relative;
          background-color: #eab308;
          border-radius: 0 8px 8px 8px;
          box-shadow: 4px 4px 7px rgba(0, 0, 0, 0.2);
        }

        .folder:before {
          content: '';
          width: 60%;
          height: 12px;
          border-radius: 0 20px 0 0;
          background-color: #eab308;
          position: absolute;
          top: -12px;
          left: 0px;
        }

        .folder:hover {
          background-color: #ca8a04;
          transform: scale(1.05);
        }

        .folder:hover:before {
          background-color: #ca8a04;
        }

        .folder-content {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          pointer-events: none;
        }

        .folder-name {
          color: white;
          font-size: 11px;
          font-weight: 600;
          text-align: center;
          word-break: break-all;
          line-height: 1.2;
          max-height: 32px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      `}</style>
      <div className="flex flex-col pt-0 pb-1 px-4 border-b">
        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              // Navigate to parent folder
              if (selectedFolder && selectedFolder.includes('\\')) {
                const parentPath = selectedFolder.substring(0, selectedFolder.lastIndexOf('\\'));
                if (onFolderSelect && parentPath) {
                  onFolderSelect(parentPath);
                }
              } else if (folderTree?.path) {
                // Go to root
                if (onFolderSelect) {
                  onFolderSelect(folderTree.path);
                }
              }
            }}
            disabled={!selectedFolder || selectedFolder === folderTree?.path}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {/* Breadcrumb path */}
          <div className="flex items-center gap-1 flex-1 overflow-x-auto">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                if (folderTree?.path && onFolderSelect) {
                  onFolderSelect(folderTree.path);
                }
              }}
              className="flex items-center gap-1 h-8"
            >
              <Home className="h-3 w-3" />
              <span className="text-sm">Home</span>
            </Button>
            
            {selectedFolder && selectedFolder !== folderTree?.path && (() => {
              const parts = selectedFolder.split('\\');
              const rootParts = folderTree?.path?.split('\\') || [];
              const relativeParts = parts.slice(rootParts.length);
              
              return relativeParts.map((part, index) => {
                const fullPath = [...rootParts, ...relativeParts.slice(0, index + 1)].join('\\');
                return (
                  <div key={index} className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        if (onFolderSelect) {
                          onFolderSelect(fullPath);
                        }
                      }}
                      className="h-8 text-sm"
                    >
                      {part}
                    </Button>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFileUpload(e.target.files);
          e.target.value = ''; // Reset input
        }}
        multiple
      />
      <input
        type="url"
        ref={linkInputRef}
        className="hidden"
        onBlur={(e) => {
          if (e.target.value) handleAddLink(e.target.value);
          e.target.value = ''; // Reset input
        }}
        placeholder="Enter URL"
      />

      <ScrollArea className="h-full flex-grow p-4">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <SearchX className="h-16 w-16 mb-4" />
            <p>Aucun fichier dans ce dossier. Faites glisser et déposez des fichiers ici, ou cliquez sur 'Ajouter' pour en créer un nouveau</p>
          </div>
        ) : externalViewMode === "list" ? (
          <div className="w-full">
            {/* Table Header */}
            <div className="flex items-center gap-4 p-3 border-b-2 border-border font-medium text-sm text-muted-foreground bg-muted/30">
              <div className="flex-shrink-0 w-8"></div>
              <div className="flex-1">Nom</div>
              <div className="flex-shrink-0 w-20 text-right">Taille</div>
              <div className="flex-shrink-0 w-40">Modifié</div>
              <div className="flex-shrink-0 w-24">Propriétaire</div>
              <div className="flex-shrink-0 w-16">Permissions</div>
              <div className="flex-shrink-0 w-8"></div>
            </div>
            {/* Table Rows */}
            <div className="divide-y divide-border">
              {filteredFiles.map((file) => (
                <FileListRow
                  key={file.id}
                  file={file}
                  handleFileClick={handleFileClick}
                  handleDeleteFile={handleDeleteFile}
                  setRenameFileState={setRenameFileState}
                  setFileConflict={setFileConflict}
                />
              ))}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-4",
              "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            )}
          >
            {filteredFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                handleFileClick={handleFileClick}
                handleDeleteFile={handleDeleteFile}
                setRenameFileState={setRenameFileState}
                uploadProgress={uploadProgress}
                setFileConflict={setFileConflict}
              />
            ))}
          </div>
        )}
      </ScrollArea>
      {renameFileState && (
        <RenameDialog
          open={renameFileState.isOpen}
          onOpenChange={() => setRenameFileState(null)}
          currentName={renameFileState.file.name}
          currentPath={renameFileState.file.id}
          isFolder={false}
          onRename={handleRenameFile}
        />
      )}
      {fileConflict && (
        <FileConflictDialog
          open={true}
          fileName={fileConflict.fileName}
          onReplace={async () => {
            if (fileConflict.isMove && fileConflict.oldPath && fileConflict.newPath) {
              // Internal move with replace
              if (window.electronAPI?.fsMove) {
                const result = await window.electronAPI.fsMove(
                  fileConflict.oldPath, 
                  fileConflict.newPath, 
                  { replace: true }
                );
                if (result?.success) {
                  console.log('✅ File replaced and moved successfully');
                  window.dispatchEvent(new Event('folderTreeRefresh'));
                  window.dispatchEvent(new Event('recentFilesRefresh'));
                } else {
                  console.error('❌ Replace move failed:', result?.error);
                }
              }
            } else {
              // External copy with replace
              if (window.electronAPI?.copyExternalFile) {
                const result = await window.electronAPI.copyExternalFile(
                  fileConflict.sourcePath, 
                  fileConflict.targetFolder, 
                  { replace: true }
                );
                if (result?.success) {
                  console.log('✅ File replaced successfully');
                  window.dispatchEvent(new Event('folderTreeRefresh'));
                  window.dispatchEvent(new Event('recentFilesRefresh'));
                } else {
                  console.error('❌ Replace failed:', result?.error);
                }
              }
            }
            setFileConflict(null);
          }}
          onRename={async (newFileName) => {
            if (fileConflict.isMove && fileConflict.oldPath && fileConflict.newPath) {
              // Internal move with rename
              if (window.electronAPI?.fsMove) {
                const result = await window.electronAPI.fsMove(
                  fileConflict.oldPath, 
                  fileConflict.newPath, 
                  { newFileName }
                );
                if (result?.success) {
                  console.log('✅ File renamed and moved successfully');
                  window.dispatchEvent(new Event('folderTreeRefresh'));
                  window.dispatchEvent(new Event('recentFilesRefresh'));
                } else {
                  console.error('❌ Rename move failed:', result?.error);
                }
              }
            } else {
              // External copy with rename
              if (window.electronAPI?.copyExternalFile) {
                const result = await window.electronAPI.copyExternalFile(
                  fileConflict.sourcePath, 
                  fileConflict.targetFolder, 
                  { newFileName }
                );
                if (result?.success) {
                  console.log('✅ File imported with new name successfully');
                  window.dispatchEvent(new Event('folderTreeRefresh'));
                  window.dispatchEvent(new Event('recentFilesRefresh'));
                } else {
                  console.error('❌ Rename import failed:', result?.error);
                }
              }
            }
            setFileConflict(null);
          }}
          onCancel={() => {
            setFileConflict(null);
          }}
        />
      )}
      </div>
    </Card>
  );
}

interface AddNoteDialogProps {
  onNoteCreated: () => void;
}

const AddNoteDialog: React.FC<AddNoteDialogProps> = ({ onNoteCreated }) => {
  const [open, setOpen] = useState(false);
  const [noteName, setNoteName] = useState("");
  const [noteType, setNoteType] = useState<"text" | "markdown">("text");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [existingFolders, setExistingFolders] = useState<any[]>([]);

  useEffect(() => {
    if (open && window.electronAPI?.foldersLoad) {
      window.electronAPI.foldersLoad().then((loadedFolders: any[]) => {
        setExistingFolders(loadedFolders);
      });
    }
  }, [open]);

  const handleCreateNote = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!noteName.trim()) return;
    let finalParentPath = parentId ? existingFolders.find(f => f.id === parentId)?.path || undefined : undefined;

    if (window.electronAPI?.noteCreate) {
      const result = await window.electronAPI.noteCreate({
        name: noteName.trim(),
        type: noteType,
        parentPath: finalParentPath,
        tags,
      });
      if (!result.success) {
        setCreationError(result.error || "Erreur lors de la création de la note.");
        return;
      }
      const newNote: FileItem = {
        id: result.id,
        name: noteName.trim(),
        type: "note",
        size: 0,
        uploadDate: new Date(),
        folderId: finalParentPath,
        isDirectory: false,
      };

      onNoteCreated();
      setCreationSuccess("Note créée avec succès !");
      setTimeout(() => {
        setNoteName("");
        setNoteType("text");
        setTags([]);
        setCurrentTag("");
        setCreationSuccess(null);
        setCreationError(null);
        setOpen(false);
      }, 1000);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => {
          e.preventDefault();
          setOpen(true);
        }}>
          <FileText className="mr-2 h-4 w-4" /> New Note
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlus className="h-5 w-5" />
            Créer une nouvelle note
          </DialogTitle>
          <div className="h-1 w-full bg-blue-500 mt-2" />
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Dossier parent <span className="text-xs text-muted-foreground">(optionnel)</span></Label>
            <select
              className="w-full border rounded p-2 bg-zinc-900 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={parentId || ""}
              onChange={(e) => setParentId(e.target.value || undefined)}
            >
              <option value="">Dossier sélectionné par défaut</option>
              {existingFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-name">Nom de la note</Label>
            <Input
              id="note-name"
              placeholder="Ex: Compte rendu, Idée, TODO..."
              value={noteName}
              onChange={(e) => setNoteName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Type de fichier</Label>
            <div className="flex gap-2">
              <Button
                variant={noteType === "text" ? "default" : "outline"}
                onClick={() => setNoteType("text")}
                className="h-10 px-4 py-2"
              >
                <FileText className="w-4 h-4 mr-1" /> Texte
              </Button>
              <Button
                variant={noteType === "markdown" ? "default" : "outline"}
                onClick={() => setNoteType("markdown")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.md</span> Markdown
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Étiquettes</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une étiquette..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button type="button" onClick={addTag} size="sm" variant="outline">
                Ajouter
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span key={tag} className="bg-muted px-2 py-1 rounded text-xs cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </span>
              ))}
            </div>
          </div>
          {creationError && (
            <div className="text-sm text-red-500 mb-2">{creationError}</div>
          )}
          {creationSuccess && (
            <div className="text-sm text-green-600 mb-2">{creationSuccess}</div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleCreateNote} disabled={!noteName.trim()} className="flex-1">
              Créer la note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
