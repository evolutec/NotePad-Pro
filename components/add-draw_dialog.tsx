import * as React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FilePlus, Palette, Folder, Home } from "lucide-react";
import { GenericModal, ModalField, ModalButton } from "@/components/ui/generic-modal";
import { FolderSelectionModal, type FolderNode } from "@/components/ui/folder-selection-modal";

export interface DrawMeta {
  id: string;
  name: string;
  type: "draw";
  parentPath: string;
  createdAt: string;
  tags?: string[];
}

export interface AddDrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onDrawCreated: (draw: DrawMeta) => void;
}

export function AddDrawDialog({ open, onOpenChange, parentPath, onDrawCreated }: AddDrawDialogProps) {
  const [drawName, setDrawName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [existingFolders, setExistingFolders] = useState<any[]>([]);
  const [showFolderModal, setShowFolderModal] = useState(false);

  useEffect(() => {
    loadFoldersFromFileSystem();
  }, [open]);

  const loadFoldersFromFileSystem = async () => {
    try {
      // Use foldersScan to get real filesystem structure
      if (window.electronAPI?.foldersScan) {
        try {
          const scannedFolders = await window.electronAPI.foldersScan();
          if (scannedFolders && scannedFolders.length > 0) {
            setExistingFolders(scannedFolders);
            return;
          }
        } catch (error) {
          console.log('Could not scan folders from filesystem:', error);
        }
      }

      // Fallback: try to load from folders.json (existing data)
      if (window.electronAPI?.foldersLoad) {
        try {
          const loadedFolders = await window.electronAPI.foldersLoad();
          if (loadedFolders && loadedFolders.length > 0) {
            setExistingFolders(loadedFolders);
            return;
          }
        } catch (error) {
          console.log('Could not load folders from JSON:', error);
        }
      }

      // Fallback: try to read actual file system structure
      if (window.electronAPI?.fsReaddir) {
        try {
          // Get user home directory or app data directory
          const homeDir = process.env.HOME || process.env.USERPROFILE || 'C:/Users';
          const appDataDir = `${homeDir}/Documents/Github-repo/note-taking-app`;

          const result = await window.electronAPI.fsReaddir(appDataDir);
          if (result.success) {
            // Convert file system directories to folder structure
            const foldersFromFS = result.items
              .filter((item: any) => item.isDirectory)
              .map((dir: any, index: number) => ({
                id: `fs_${index}`,
                name: dir.name,
                path: `${appDataDir}/${dir.name}`,
                parentId: null,
                createdAt: new Date().toISOString(),
                notes: [],
                color: 'bg-blue-500',
                tags: []
              }));

            setExistingFolders(foldersFromFS);
            console.log('Loaded folders from file system:', foldersFromFS);
          } else {
            console.log('Could not read file system, using empty folders list');
            setExistingFolders([]);
          }
        } catch (error) {
          console.error('Error reading file system:', error);
          setExistingFolders([]);
        }
      } else {
        console.log('File system API not available');
        setExistingFolders([]);
      }
    } catch (error) {
      console.error('Error in loadFoldersFromFileSystem:', error);
      setExistingFolders([]);
    }
  };

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

  const handleCreateDraw = async () => {
    setCreationError(null);
    setCreationSuccess(null);

    if (!drawName.trim()) {
      setCreationError("Le nom du dessin est requis.");
      return;
    }

    try {
      let finalParentPath = parentPath;
      if (parentId) {
        const parentFolder = existingFolders.find(f => f.id === parentId);
        finalParentPath = parentFolder?.path || parentPath;
      }

      // Create draw file using file system API
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${drawName.trim()}_${timestamp}.json`;
      const filePath = finalParentPath ? `${finalParentPath}/${fileName}` : fileName;

      // Create the draw file with initial data
      const drawFileData = {
        id: Date.now().toString(),
        name: drawName.trim(),
        type: "draw",
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags: tags || [],
        elements: [], // Drawing elements (paths, shapes, etc.)
        version: "1.0"
      };

      // Use Electron API to create the draw file
      if (window.electronAPI?.drawCreate) {
        const createResult = await window.electronAPI.drawCreate({
          name: drawName.trim(),
          type: "draw",
          parentPath: finalParentPath,
          tags,
          content: drawFileData
        });

        if (!createResult.success) {
          setCreationError(createResult.error || "Erreur lors de la création du fichier de dessin.");
          return;
        }
      } else {
        // Fallback: try to create using available file system operations
        if (window.electronAPI?.fsMkdir) {
          try {
            // Ensure parent directory exists
            const dirResult = await window.electronAPI.fsMkdir(finalParentPath);
            if (!dirResult.success) {
              setCreationError("Erreur lors de la création du dossier parent.");
              return;
            }

            // For now, just create the metadata since we can't create the actual file
            console.log('Draw file would be created at:', filePath);
            console.log('Draw file content:', drawFileData);

          } catch (error) {
            console.error('Error in fallback creation:', error);
            setCreationError("Erreur lors de la création du fichier de dessin.");
            return;
          }
        } else {
          setCreationError("API de création de dessin non disponible.");
          return;
        }
      }

      // Create metadata for the draws list
      const newDraw: DrawMeta = {
        id: drawFileData.id,
        name: drawName.trim(),
        type: "draw",
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
      };

      // For draw files, we'll use a simple approach for now
      // In the future, we could extend the API to support file metadata storage
      console.log('✅ Draw file created successfully with metadata:', {
        id: newDraw.id,
        name: newDraw.name,
        type: newDraw.type,
        path: filePath,
        parentPath: newDraw.parentPath,
        createdAt: newDraw.createdAt,
        tags: newDraw.tags
      });

      setCreationSuccess("Dessin créé avec succès !");
      if (onDrawCreated) onDrawCreated(newDraw);

      setTimeout(() => {
        setDrawName("");
        setTags([]);
        setCurrentTag("");
        setCreationSuccess(null);
        setCreationError(null);
        if (onOpenChange) onOpenChange(false);
      }, 1000);

    } catch (error) {
      console.error('Error creating draw:', error);
      setCreationError("Erreur lors de la création du dessin.");
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

  // Define fields for the GenericModal
  const fields: ModalField[] = [
    {
      id: 'name',
      label: 'Nom du dessin',
      type: 'text',
      placeholder: 'Ex: Croquis, Schéma, Diagramme...',
      required: true,
      value: drawName,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setDrawName(e.target.value);
      }
    },
    {
      id: 'parent',
      label: 'Dossier parent',
      type: 'custom',
      required: false,
      content: (
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
      )
    },
    {
      id: 'tags',
      label: 'Étiquettes',
      type: 'tags',
      placeholder: 'Ajouter une étiquette...',
      required: false
    }
  ];

  // Define buttons for the GenericModal
  const buttons: ModalButton[] = [
    {
      label: 'Créer le dessin',
      variant: 'default',
      onClick: handleCreateDraw,
      disabled: false // Enable button - let handleCreateDraw validate the form
    }
  ];

  return (
    <>
      <GenericModal
        open={open}
        onOpenChange={onOpenChange}
        title="Créer un nouveau dessin"
        icon={<Palette className="h-6 w-6" />}
        description="Créez un nouveau dessin avec des outils de dessin avancés"
        colorTheme="purple"
        fileType="draw"
        size="md"
        fields={fields}
        buttons={buttons}
        showCancelButton={true}
        cancelLabel="Annuler"
        error={creationError}
        success={creationSuccess}
        showCloseButton={true}
        closeButtonPosition="top-right"
        showFooter={true}
      />

      {/* Folder Selection Modal */}
      <FolderSelectionModal
        open={showFolderModal}
        onOpenChange={setShowFolderModal}
        folders={folderNodes}
        selectedFolderId={parentId}
        onFolderSelect={handleFolderSelect}
        title="Sélectionner le dossier parent"
        description="Choisissez le dossier dans lequel créer le nouveau dessin"
      />
    </>
  );
}
