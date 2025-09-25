import * as React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FilePlus, Palette } from "lucide-react";
import { GenericModal, ModalField, ModalButton } from "@/components/ui/generic-modal";
import { FolderTreeSelector, type FolderNode } from "@/components/ui/folder-tree-selector";

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

  useEffect(() => {
    if (window.electronAPI?.foldersLoad) {
      window.electronAPI.foldersLoad().then((loadedFolders: any[]) => {
        setExistingFolders(loadedFolders);
      });
    }
  }, [open]);

  // Convert folders to FolderNode format for the tree selector
  const folderNodes: FolderNode[] = React.useMemo(() => {
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
  }, [existingFolders]);

  // Handle folder selection
  const handleFolderSelect = (folderId: string | null, folderPath: string) => {
    setParentId(folderId || undefined);
  };

  const handleCreateDraw = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!drawName.trim()) return;
    let finalParentPath = parentPath;
    if (parentId) {
      const parentFolder = existingFolders.find(f => f.id === parentId);
      finalParentPath = parentFolder?.path || parentPath;
    }
    if (window.electronAPI?.drawCreate) {
      const result = await window.electronAPI.drawCreate({
        name: drawName.trim(),
        type: "draw",
        parentPath: finalParentPath,
        tags,
      });
      if (!result.success) {
        setCreationError(result.error || "Erreur lors de la création du dessin.");
        return;
      }
      const newDraw: DrawMeta = {
        id: Date.now().toString(),
        name: drawName.trim(),
        type: "draw",
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
      };
      if (window.electronAPI?.drawsLoad && window.electronAPI?.drawsSave) {
        const draws = await window.electronAPI.drawsLoad();
        await window.electronAPI.drawsSave([...draws, newDraw]);
      }
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
      required: true
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
      disabled: !drawName.trim()
    }
  ];

  // Custom content for the folder tree selector
  const customContent = (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Dossier parent</Label>
      <FolderTreeSelector
        folders={folderNodes}
        selectedFolderId={parentId}
        onFolderSelect={handleFolderSelect}
        placeholder="Sélectionner un dossier parent..."
        className="w-full"
      />
    </div>
  );

  return (
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
    >
      {customContent}
    </GenericModal>
  );
}
