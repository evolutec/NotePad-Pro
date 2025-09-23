"use client"

import type React from "react"

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
import { Archive, Copy, Download, Edit, Eye, File, FileCode, FileText, FileWarning, Folder, FolderOpen, Grid, ImageIcon, Link, List, MoreHorizontal, Move, Music, NotebookText, Palette, Plus, Scissors, Search, SearchX, Share, Trash, Upload, UploadCloud, Video, FilePlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { AddDocumentDialog } from "./add-document_dialog"
import { AddDrawDialog } from "./add-draw_dialog"

import { RenameDialog } from "./rename-dialog"

interface FileManagerProps {
  selectedFolder: string | null
  folderTree?: any // Ajout de la structure des dossiers
  onFolderSelect?: (folderPath: string) => void
  onNoteSelect?: (notePath: string) => void
  selectedNote?: string | null; // Add selectedNote prop
}

type FileType = "image" | "document" | "draw" | "audio" | "video" | "archive" | "link" | "other" | "code" | "note" | "folder"

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
  other: { icon: File, color: "text-gray-600", extensions: [] },
}

export function FileManager({
  selectedFolder,
  folderTree,
  onFolderSelect,
  onNoteSelect,
  selectedNote, // Add selectedNote here
}: FileManagerProps) {
  console.log("FileManager: Component re-rendered with selectedNote", selectedNote);
  // Buffer pour copier/couper/coller
  const [clipboard, setClipboard] = useState<{ action: "cut" | "copy"; folder: any } | null>(null);

  // État pour le dialogue de renommage
  const [renameFileState, setRenameFileState] = useState<{ file: FileItem; isOpen: boolean } | null>(null);

  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [selectedFileForView, setSelectedFileForView] = useState<FileItem | null>(null);

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
    // Implement actual delete logic
  };

  // Actions kebab menu pour fichiers
  const handleRenameFile = async (newName: string) => {
    console.log(`Renaming file to ${newName}`);
    // Implement actual rename logic
  };

  const handleDeleteFile = async (file: FileItem) => {
    console.log(`Deleting file ${file.name}`);
    // Implement actual delete logic
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

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
  };

  const files = useMemo(() => {
    if (!selectedFolder || !folderTree) return [];

    // Function to find folder in tree structure
    const findFolderInTree = (tree: any, targetPath: string): any => {
      if (tree.path === targetPath) {
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
          isDirectory: item.type === 'folder' || item.isDirectory || !!item.children
        }));
      };

      // Get files and subfolders
      const allItems: FileItem[] = [];

      if (selectedFolderData.children) {
        allItems.push(...convertToFileItems(selectedFolderData.children));
      }

      return allItems;
    }

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
    if (file.isDirectory) {
      onFolderSelect?.(file.id);
      return;
    }
    onNoteSelect?.(file.id);
  }, [onFolderSelect, onNoteSelect]);

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
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
    const Icon = FILE_TYPES[fileType]?.icon || File;
    const colorClass = FILE_TYPES[fileType]?.color || "text-gray-600";
    return <Icon className={cn("h-5 w-5", colorClass)} />;
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-xl font-semibold">File Manager</h2>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <AddNoteDialog onNoteCreated={() => { /* Gérer la création de note */ }} />
              <AddDocumentDialog open={false} onOpenChange={() => {}} parentPath={selectedFolder || ''} onDocumentCreated={() => { /* Gérer la création de document */ }} />
              <AddDrawDialog open={false} onOpenChange={() => {}} parentPath={selectedFolder || ''} onDrawCreated={() => { /* Gérer la création de dessin */ }} />
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <UploadCloud className="mr-2 h-4 w-4" /> Upload File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => linkInputRef.current?.click()}>
                <Link className="mr-2 h-4 w-4" /> Add Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        ) : (
          <div
            className={cn(
              "grid gap-4",
              viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
            )}
          >
            {filteredFiles.map((file) => (
              <Card
                key={file.id}
                className={cn(
                  "relative group flex flex-col items-center p-4 cursor-pointer",
                  file.isDirectory ? "bg-yellow-50 dark:bg-yellow-950" : "bg-white dark:bg-gray-800"
                )}
                onClick={() => handleFileClick(file)}
              >
                {file.isDirectory && (
                  <FolderOpen className="h-12 w-12 text-yellow-500 mb-2" />
                )}
                {!file.isDirectory && renderFileIcon(file)}
                <p className="text-sm font-medium text-center mt-2 break-all">{file.name}</p>
                {!file.isDirectory && file.type !== "link" && (
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenameFileState({ file, isOpen: true }); }}>
                        <Edit className="mr-2 h-4 w-4" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* handleCopy(file) */ }}>
                        <Copy className="mr-2 h-4 w-4" /> Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* handleMove(file) */ }}>
                        <Move className="mr-2 h-4 w-4" /> Move
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteFile(file); }}>
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                      {file.url && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(file.url, '_blank'); }}>
                          <Eye className="mr-2 h-4 w-4" /> Open Link
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {uploadProgress[file.id] !== undefined && (
                  <Progress value={uploadProgress[file.id]} className="w-full mt-2" />
                )}
              </Card>
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
    let finalParentPath = parentId ? existingFolders.find(f => f.id === parentId)?.path : undefined;

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
