import * as React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FilePlus, FileText, Folder, Home } from "lucide-react";
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
      if (window.electronAPI?.notesLoad && window.electronAPI?.notesSave) {
        const notes = await window.electronAPI.notesLoad();
        await window.electronAPI.notesSave([...notes, newNote]);
      }
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
  const getSelectedFolderName = () => {
    if (!parentId) return "Racine";
    const folder = existingFolders.find(f => f.id === parentId);
    return folder?.name || "Racine";
  };

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
            <span className="truncate">{getSelectedFolderName()}</span>
          </div>
          <Folder className="w-4 h-4 opacity-50" />
        </Button>
      )
    },
    {
      id: 'type',
      label: 'Type de fichier',
      type: 'select',
      placeholder: 'Sélectionner le type de fichier...',
      required: true,
      options: [
        { label: 'Texte', value: 'text' },
        { label: 'Markdown', value: 'markdown' }
      ]
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
