import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Archive as ArchiveIcon, FilePlus, Folder, Home } from "lucide-react"; // Using Archive for archive icon
import { FolderSelectionModal, type FolderNode } from "@/components/ui/folder-selection-modal";

export interface ArchiveMeta {
  id: string;
  name: string;
  type: string; // e.g., "zip", "rar", "7z"
  parentPath: string;
  createdAt: string;
  tags?: string[];
}

export interface AddArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onArchiveCreated: (archive: ArchiveMeta) => void;
}

export function AddArchiveDialog({ open, onOpenChange, parentPath, onArchiveCreated }: AddArchiveDialogProps) {
  const [archiveName, setArchiveName] = useState("");
  const [archiveType, setArchiveType] = useState<string>("zip"); // Default to zip archive
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [existingFolders, setExistingFolders] = useState<any[]>([]);
  const [showFolderModal, setShowFolderModal] = useState(false);

  useEffect(() => {
    if (window.electronAPI?.foldersScan) {
      window.electronAPI.foldersScan().then((scannedFolders: any[]) => {
        setExistingFolders(scannedFolders);
      });
    }
  }, [open]);

  // Convert folders to FolderNode format for the tree selector
  const folderNodes: FolderNode[] = React.useMemo(() => {
    // Handle the tree structure returned by foldersScan
    const convertTreeToNodes = (treeNode: any, parentId?: string): FolderNode[] => {
      if (!treeNode || typeof treeNode !== 'object') return [];

      const nodes: FolderNode[] = [];

      // Add the current node if it's a directory
      if (treeNode.isDirectory) {
        nodes.push({
          id: treeNode.path || `${parentId}-${treeNode.name}`,
          name: treeNode.name,
          path: treeNode.path,
          children: treeNode.children ? convertTreeToNodesFromArray(treeNode.children, treeNode.path) : [],
          parent: parentId
        });
      }

      return nodes;
    };

    const convertTreeToNodesFromArray = (children: any[], parentPath?: string): FolderNode[] => {
      if (!Array.isArray(children)) return [];

      return children
        .filter(child => child && child.isDirectory)
        .map(child => ({
          id: child.path || `${parentPath}-${child.name}`,
          name: child.name,
          path: child.path,
          children: child.children ? convertTreeToNodesFromArray(child.children, child.path) : [],
          parent: parentPath
        }));
    };

    // Handle both flat array of folders (from foldersLoad) and tree structure (from foldersScan)
    if (existingFolders.length > 0 && (existingFolders[0] as any).children) {
      // Tree structure from foldersScan
      return convertTreeToNodesFromArray((existingFolders[0] as any).children || []);
    } else {
      // Flat array structure from foldersLoad
      const buildTree = (folders: any[], parentId?: string): FolderNode[] => {
        return folders
          .filter(folder => folder.parentId === parentId)
          .map(folder => ({
            id: folder.id,
            name: folder.name,
            path: folder.path || folder.name,
            children: buildTree(folders, folder.id),
            parent: parentId
          }));
      };
      return buildTree(existingFolders);
    }
  }, [existingFolders]);

  // Handle folder selection
  const handleFolderSelect = (folderId: string | null, folderPath: string) => {
    setParentId(folderId || undefined);
  };

  // Get selected folder name for display
  const getSelectedFolderName = React.useMemo(() => {
    console.log('=== getSelectedFolderName called ===');
    console.log('parentId:', parentId);
    console.log('existingFolders:', existingFolders);

    if (!parentId) {
      console.log('No parentId, returning Racine');
      return "Racine";
    }

    // First try to find in existingFolders (from foldersScan)
    const folder = existingFolders.find(f => {
      console.log('Checking folder:', f.id, f.name, 'against parentId:', parentId);
      return f.id === parentId;
    });

    if (folder?.name) {
      console.log('Found folder with name:', folder.name);
      return folder.name;
    }

    // If not found in root level, try to search in the tree structure
    if (existingFolders.length > 0 && (existingFolders[0] as any).children) {
      const findInTree = (nodes: any[]): any => {
        for (const node of nodes) {
          if (node.path === parentId || node.id === parentId) {
            console.log('Found in tree:', node.name);
            return node;
          }
          if (node.children) {
            const found = findInTree(node.children);
            if (found) return found;
          }
        }
        return null;
      };

      const foundFolder = findInTree((existingFolders[0] as any).children || []);
      if (foundFolder?.name) {
        console.log('Found folder in tree with name:', foundFolder.name);
        return foundFolder.name;
      }
    }

    // If not found, try to extract from the path
    if (typeof parentId === 'string' && parentId.includes('/')) {
      const pathParts = parentId.split('/');
      const folderName = pathParts[pathParts.length - 1] || "Racine";
      console.log('Extracted from path:', folderName);
      return folderName;
    }

    console.log('Using default: Racine');
    return "Racine";
  }, [parentId, existingFolders]);

  const handleCreateArchive = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!archiveName.trim()) return;

    let finalParentPath = parentPath;
    if (parentId) {
      const parentFolder = existingFolders.find(f => f.id === parentId);
      finalParentPath = parentFolder?.path || parentPath;
    }

    if (window.electronAPI?.archiveCreate) {
      const result = await window.electronAPI.archiveCreate({
        name: archiveName.trim(),
        type: archiveType,
        parentPath: finalParentPath,
        tags,
      });

      if (!result.success) {
        setCreationError(result.error || "Erreur lors de la création de l'archive.");
        return;
      }

      const newArchive: ArchiveMeta = {
        id: Date.now().toString(),
        name: archiveName.trim(),
        type: archiveType,
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
      };

      setCreationSuccess("Archive créée avec succès !");
      if (onArchiveCreated) onArchiveCreated(newArchive);
      setTimeout(() => {
        setArchiveName("");
        setArchiveType("zip");
        setTags([]);
        setCurrentTag("");
        setCreationSuccess(null);
        setCreationError(null);
        if (onOpenChange) onOpenChange(false);
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArchiveIcon className="h-5 w-5" /> {/* Archive icon */}
              Créer une nouvelle archive
            </DialogTitle>
            <div className="h-1 w-full bg-gray-500 mt-2" /> {/* Gray line for archives */}
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Dossier parent <span className="text-xs text-muted-foreground">(optionnel)</span></Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between text-left font-normal"
                onClick={() => setShowFolderModal(true)}
              >
                <div className="flex items-center gap-2 truncate">
                  <Home className="w-4 h-4" />
                  <span className="truncate">{getSelectedFolderName}</span>
                </div>
                <Folder className="w-4 h-4 opacity-50" />
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="archive-name">Nom de l'archive</Label>
              <Input
                id="archive-name"
                placeholder="Ex: documents.zip, photos.rar, backup.7z..."
                value={archiveName}
                onChange={(e) => setArchiveName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type d'archive</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={archiveType === "zip" ? "default" : "outline"}
                  onClick={() => setArchiveType("zip")}
                  className="h-10 px-4 py-2"
                >
                  <span className="font-mono text-xs mr-1">.zip</span> ZIP
                </Button>
                <Button
                  variant={archiveType === "rar" ? "default" : "outline"}
                  onClick={() => setArchiveType("rar")}
                  className="h-10 px-4 py-2"
                >
                  <span className="font-mono text-xs mr-1">.rar</span> RAR
                </Button>
                <Button
                  variant={archiveType === "7z" ? "default" : "outline"}
                  onClick={() => setArchiveType("7z")}
                  className="h-10 px-4 py-2"
                >
                  <span className="font-mono text-xs mr-1">.7z</span> 7Z
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
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Annuler
              </Button>
              <Button onClick={handleCreateArchive} disabled={!archiveName.trim()} className="flex-1">
                Créer l'archive
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Folder Selection Modal */}
      <FolderSelectionModal
        open={showFolderModal}
        onOpenChange={setShowFolderModal}
        folders={folderNodes}
        selectedFolderId={parentId}
        onFolderSelect={handleFolderSelect}
        title="Sélectionner le dossier parent"
        description="Choisissez le dossier dans lequel créer la nouvelle archive"
      />
    </>
  );
}
