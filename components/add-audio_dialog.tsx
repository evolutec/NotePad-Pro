import * as React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Music as MusicIcon, FilePlus } from "lucide-react";
import { GenericModal, ModalField, ModalButton } from "@/components/ui/generic-modal";

export interface AudioMeta {
  id: string;
  name: string;
  type: string; // e.g., "mp3", "wav", "ogg"
  parentPath: string;
  createdAt: string;
  tags?: string[];
}

export interface AddAudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onAudioCreated: (audio: AudioMeta) => void;
  onRefreshTree?: () => void;
}

export function AddAudioDialog({ open, onOpenChange, parentPath, onAudioCreated, onRefreshTree }: AddAudioDialogProps) {
  const [audioName, setAudioName] = useState("");
  const [audioType, setAudioType] = useState<string>("mp3"); // Default to mp3 audio
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

  const handleCreateAudio = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!audioName.trim()) return;

    let finalParentPath = parentPath;
    if (parentId) {
      const parentFolder = existingFolders.find(f => f.id === parentId);
      finalParentPath = parentFolder?.path || parentPath;
    }

    if (window.electronAPI?.audioCreate) {
      const result = await window.electronAPI.audioCreate({
        name: audioName.trim(),
        type: audioType,
        parentPath: finalParentPath,
        tags,
      });

      if (!result.success) {
        setCreationError(result.error || "Erreur lors de la création de l'audio.");
        return;
      }

      const newAudio: AudioMeta = {
        id: Date.now().toString(),
        name: audioName.trim(),
        type: audioType,
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
      };

      setCreationSuccess("Audio créé avec succès !");
      if (onAudioCreated) onAudioCreated(newAudio);
      // Trigger tree refresh
      if (onRefreshTree) {
        onRefreshTree();
      }
      setTimeout(() => {
        setAudioName("");
        setAudioType("mp3");
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
      label: 'Nom de l\'audio',
      type: 'text',
      placeholder: 'Ex: Chanson, Podcast, Enregistrement...',
      required: true
    },
    {
      id: 'type',
      label: 'Type d\'audio',
      type: 'select',
      placeholder: 'Sélectionner le type d\'audio...',
      required: true,
      options: [
        { label: 'MP3', value: 'mp3' },
        { label: 'WAV', value: 'wav' },
        { label: 'OGG', value: 'ogg' }
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
      label: 'Créer l\'audio',
      variant: 'default',
      onClick: handleCreateAudio,
      disabled: !audioName.trim()
    }
  ];

  return (
    <GenericModal
      open={open}
      onOpenChange={onOpenChange}
      title="Créer un nouvel audio"
      icon={<MusicIcon className="h-6 w-6" />}
      description="Créez un fichier audio MP3, WAV ou OGG"
      colorTheme="pink"
      fileType="audio"
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
  );
}
