import * as React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FilePlus, FileText, Folder, Home, Type, Hash } from "lucide-react";
import { GenericModal, ModalField, ModalButton, type GenericModalRef } from "@/components/ui/generic-modal";
import { FolderSelectionModal, type FolderNode } from "@/components/ui/folder-selection-modal";

export interface NoteMeta {
  id: string;
  name: string;
  type: "text" | "markdown";
  parentPath: string;
  createdAt: string;
  tags?: string[];
}

export interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onNoteCreated: (note: NoteMeta) => void;
}

export function AddNoteDialog({ open, onOpenChange, parentPath, onNoteCreated }: AddNoteDialogProps) {
  const [noteName, setNoteName] = useState("");
  const [noteType, setNoteType] = useState<"text" | "markdown">("text");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [existingFolders, setExistingFolders] = useState<any[]>([]);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const modalRef = React.useRef<GenericModalRef>(null);

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
    console.log('=== handleFolderSelect called ===');
    console.log('folderId:', folderId);
    console.log('folderPath:', folderPath);
    console.log('Setting parentId to:', folderId);
    setParentId(folderId || undefined);
    setShowFolderModal(false); // Close the modal after selection
  };

  const handleCreateNote = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!noteName.trim()) return;
    let finalParentPath = parentPath;
    if (parentId) {
      const parentFolder = existingFolders.find(f => f.id === parentId);
      finalParentPath = parentFolder?.path || parentPath;
    }
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
      const newNote: NoteMeta = {
        id: Date.now().toString(),
        name: noteName.trim(),
        type: noteType,
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
      };

      // For note files, we'll use a simple approach for now
      // In the future, we could extend the API to support file metadata storage
      console.log('✅ Note file created successfully with metadata:', {
        id: newNote.id,
        name: newNote.name,
        type: newNote.type,
        path: result.path,
        parentPath: newNote.parentPath,
        createdAt: newNote.createdAt,
        tags: newNote.tags
      });
      setCreationSuccess("Note créée avec succès !");
      if (onNoteCreated) onNoteCreated(newNote);
      setTimeout(() => {
        setNoteName("");
        setNoteType("text");
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

  // Define fields for the GenericModal - reordered to put name first, then path selector
  const fields: ModalField[] = [
    {
      id: 'name',
      label: 'Nom de la note',
      type: 'text',
      placeholder: 'Ex: Compte rendu, Idée, TODO...',
      required: true,
      value: noteName,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setNoteName(e.target.value);
      }
    },
    {
      id: 'path',
      label: 'Dossier parent',
      type: 'custom',
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
      id: 'type',
      label: 'Type de fichier',
      type: 'custom',
      content: (
        <div className="grid grid-cols-2 gap-2">
          {/* Text Card */}
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              noteType === 'text'
                ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200'
                : 'hover:bg-gray-50 border-gray-200'
            }`}
            onClick={() => setNoteType('text')}
          >
            <CardContent className="p-3 text-center">
              <div className="flex flex-col items-center gap-1">
                <Type className={`w-4 h-4 ${noteType === 'text' ? 'text-blue-600' : 'text-gray-600'}`} />
                <div>
                  <div className={`font-medium text-sm ${noteType === 'text' ? 'text-blue-900' : 'text-gray-900'}`}>
                    Texte
                  </div>
                  <div className={`text-xs ${noteType === 'text' ? 'text-blue-700' : 'text-gray-600'}`}>
                    Format simple
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Markdown Card */}
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              noteType === 'markdown'
                ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200'
                : 'hover:bg-gray-50 border-gray-200'
            }`}
            onClick={() => setNoteType('markdown')}
          >
            <CardContent className="p-3 text-center">
              <div className="flex flex-col items-center gap-1">
                <Hash className={`w-4 h-4 ${noteType === 'markdown' ? 'text-blue-600' : 'text-gray-600'}`} />
                <div>
                  <div className={`font-medium text-sm ${noteType === 'markdown' ? 'text-blue-900' : 'text-gray-900'}`}>
                    Markdown
                  </div>
                  <div className={`text-xs ${noteType === 'markdown' ? 'text-blue-700' : 'text-gray-600'}`}>
                    Format riche
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
      label: 'Créer la note',
      variant: 'default',
      onClick: handleCreateNote,
      disabled: !noteName.trim()
    }
  ];

  return (
    <>
      <GenericModal
        open={open}
        onOpenChange={onOpenChange}
        title="Créer une nouvelle note"
        icon={<FilePlus className="h-6 w-6" />}
        description="Créez une note textuelle ou markdown pour organiser vos idées"
        colorTheme="blue"
        fileType="note"
        size="lg"
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
        description="Choisissez le dossier dans lequel créer la nouvelle note"
      />
    </>
  );
}
