"use client"

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Presentation, Folder, Home } from "lucide-react";
import { GenericModal, ModalField, ModalButton } from "@/components/ui/generic-modal";
import { FolderSelectionModal, type FolderNode } from "@/components/ui/folder-selection-modal";

export interface PowerpointMeta {
  id: string;
  name: string;
  type: "powerpoint";
  parentPath: string;
  createdAt: string;
  tags?: string[];
}

export interface AddPowerpointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onPowerpointCreated?: (powerpoint: PowerpointMeta) => void;
  onRefreshTree?: () => void;
}

export function AddPowerpointDialog({ open, onOpenChange, parentPath, onPowerpointCreated, onRefreshTree }: AddPowerpointDialogProps) {
  const [fileName, setFileName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [existingFolders, setExistingFolders] = useState<any[]>([]);
  const [showFolderModal, setShowFolderModal] = useState(false);

  useEffect(() => {
    if (open) {
      loadFoldersFromFileSystem();
    } else {
      // Reset form when modal closes
      setFileName("");
      setTags([]);
      setCurrentTag("");
      setCreationError(null);
      setCreationSuccess(null);
      setParentId(undefined);
    }
  }, [open]);

  const loadFoldersFromFileSystem = async () => {
    try {
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

      setExistingFolders([]);
    } catch (error) {
      console.error('Error in loadFoldersFromFileSystem:', error);
      setExistingFolders([]);
    }
  };

  const folderNodes: FolderNode[] = React.useMemo(() => {
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

    if (existingFolders.length > 0 && (existingFolders[0] as any).children) {
      return convertTreeToNodesFromArray((existingFolders[0] as any).children || []);
    } else {
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

  const handleFolderSelect = (folderId: string | null, folderPath: string) => {
    // Use folderPath instead of folderId because we need the actual path for file creation
    setParentId(folderPath || undefined);
  };

  const getSelectedFolderName = React.useMemo(() => {
    if (!parentId) return "Racine";
    const folder = existingFolders.find(f => f.id === parentId);
    if (folder?.name) return folder.name;
    if (existingFolders.length > 0 && (existingFolders[0] as any).children) {
      const findInTree = (nodes: any[]): any => {
        for (const node of nodes) {
          if (node.path === parentId || node.id === parentId) return node;
          if (node.children) {
            const found = findInTree(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      const foundFolder = findInTree((existingFolders[0] as any).children || []);
      if (foundFolder?.name) return foundFolder.name;
    }
    if (typeof parentId === 'string' && parentId.includes('/')) {
      const pathParts = parentId.split('/');
      return pathParts[pathParts.length - 1] || "Racine";
    }
    return "Racine";
  }, [parentId, existingFolders]);

  const handleCreatePowerpoint = async () => {
    setCreationError(null);
    setCreationSuccess(null);

    if (!fileName.trim()) {
      setCreationError("Le nom du fichier est requis.");
      return;
    }

    try {
      let finalParentPath = parentPath;
      if (parentId) {
        // Try to find folder by id or path
        const parentFolder = existingFolders.find(f => f.id === parentId || f.path === parentId);
        finalParentPath = parentFolder?.path || parentId; // Use parentId directly if it's already a path
        console.log('PowerPoint - Using parent path:', finalParentPath, 'from parentId:', parentId);
      }

      // Ensure filename has .pptx extension
      const finalFileName = fileName.trim().endsWith('.pptx') ? fileName.trim() : `${fileName.trim()}.pptx`;

      // Create PowerPoint file using Electron API
      if (window.electronAPI?.documentCreate) {
        const result = await window.electronAPI.documentCreate({
          name: finalFileName,
          parentPath: finalParentPath,
          tags,
          content: '', // Empty content for new PowerPoint file
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        });

        if (!result.success) {
          setCreationError(result.error || "Erreur lors de la création de la présentation.");
          return;
        }

        const newPowerpoint: PowerpointMeta = {
          id: Date.now().toString(),
          name: finalFileName,
          type: "powerpoint",
          parentPath: finalParentPath,
          createdAt: new Date().toISOString(),
          tags,
        };

        setCreationSuccess("Présentation créée avec succès !");
        if (onPowerpointCreated) onPowerpointCreated(newPowerpoint);
        if (onRefreshTree) onRefreshTree();

        setTimeout(() => {
          setFileName("");
          setTags([]);
          setCurrentTag("");
          setCreationSuccess(null);
          setCreationError(null);
          if (onOpenChange) onOpenChange(false);
        }, 1000);
      } else {
        setCreationError("API de création de fichier non disponible.");
      }

    } catch (error) {
      console.error('Error creating powerpoint:', error);
      setCreationError("Erreur lors de la création de la présentation.");
    }
  };

  const fields: ModalField[] = [
    {
      id: 'name',
      label: 'Nom du fichier',
      type: 'text',
      placeholder: 'Ex: Présentation.pptx',
      required: true,
      value: fileName,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFileName(e.target.value);
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

  const buttons: ModalButton[] = [
    {
      label: 'Créer la présentation',
      variant: 'default',
      onClick: handleCreatePowerpoint,
      disabled: false
    }
  ];

  return (
    <>
      <GenericModal
        open={open}
        onOpenChange={onOpenChange}
        title="Créer une nouvelle présentation"
        icon={<Presentation className="h-6 w-6" />}
        description="Créez une nouvelle présentation PowerPoint"
        colorTheme="orange"
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

      <FolderSelectionModal
        open={showFolderModal}
        onOpenChange={setShowFolderModal}
        folders={folderNodes}
        selectedFolderId={parentId}
        onFolderSelect={handleFolderSelect}
        title="Sélectionner le dossier parent"
        description="Choisissez le dossier dans lequel créer la nouvelle présentation"
      />
    </>
  );
}
