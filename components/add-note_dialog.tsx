import * as React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FilePlus, FileText } from "lucide-react";
import { GenericModal, ModalField, ModalButton } from "@/components/ui/generic-modal";

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

  useEffect(() => {
    if (window.electronAPI?.foldersLoad) {
      window.electronAPI.foldersLoad().then((loadedFolders: any[]) => {
        setExistingFolders(loadedFolders);
      });
    }
  }, [open]);

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

  // Define fields for the GenericModal
  const fields: ModalField[] = [
    {
      id: 'parent',
      label: 'Dossier parent',
      type: 'select',
      placeholder: 'Sélectionner le dossier parent...',
      required: false,
      options: [
        { label: 'Dossier sélectionné par défaut', value: '' },
        ...existingFolders.map(folder => ({ label: folder.name, value: folder.id }))
      ]
    },
    {
      id: 'name',
      label: 'Nom de la note',
      type: 'text',
      placeholder: 'Ex: Compte rendu, Idée, TODO...',
      required: true
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
  );
}
