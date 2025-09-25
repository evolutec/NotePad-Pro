import * as React from "react";
import { useState, useEffect } from "react";
import { GenericModal, ModalTab, ModalField, ModalButton } from "@/components/ui/generic-modal";
import { Code as CodeIcon, FilePlus } from "lucide-react"; // Using Code for code icon

export interface CodeMeta {
  id: string;
  name: string;
  type: string; // e.g., "js", "py", "ts"
  parentPath: string;
  createdAt: string;
  tags?: string[];
}

export interface AddCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onCodeCreated: (code: CodeMeta) => void;
}

export function AddCodeDialog({ open, onOpenChange, parentPath, onCodeCreated }: AddCodeDialogProps) {
  const [codeName, setCodeName] = useState("");
  const [codeType, setCodeType] = useState<string>("js"); // Default to js code
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

  const handleCreateCode = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!codeName.trim()) return;

    let finalParentPath = parentPath;
    if (parentId) {
      const parentFolder = existingFolders.find(f => f.id === parentId);
      finalParentPath = parentFolder?.path || parentPath;
    }

    if (window.electronAPI?.codeCreate) {
      const result = await window.electronAPI.codeCreate({
        name: codeName.trim(),
        type: codeType,
        parentPath: finalParentPath,
        tags,
      });

      if (!result.success) {
        setCreationError(result.error || "Erreur lors de la création du fichier de code.");
        return;
      }

      const newCode: CodeMeta = {
        id: Date.now().toString(),
        name: codeName.trim(),
        type: codeType,
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
      };

      setCreationSuccess("Fichier de code créé avec succès !");
      if (onCodeCreated) onCodeCreated(newCode);
      setTimeout(() => {
        setCodeName("");
        setCodeType("js");
        setTags([]);
        setCurrentTag("");
        setCreationSuccess(null);
        setCreationError(null);
        onOpenChange(false);
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
      id: 'parentFolder',
      label: 'Dossier parent',
      type: 'select',
      placeholder: 'Dossier sélectionné par défaut',
      required: false,
      options: [
        { label: 'Dossier sélectionné par défaut', value: '' },
        ...existingFolders.map(f => ({ label: f.name, value: f.id }))
      ]
    },
    {
      id: 'codeName',
      label: 'Nom du fichier de code',
      type: 'text',
      placeholder: 'Ex: script.js, main.py, index.ts...',
      required: true
    },
    {
      id: 'codeType',
      label: 'Type de code',
      type: 'select',
      required: true,
      options: [
        { label: 'JavaScript (.js)', value: 'js' },
        { label: 'Python (.py)', value: 'py' },
        { label: 'TypeScript (.ts)', value: 'ts' }
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
      label: 'Créer le fichier de code',
      variant: 'default',
      onClick: handleCreateCode,
      disabled: !codeName.trim()
    }
  ];

  return (
    <GenericModal
      open={open}
      onOpenChange={onOpenChange}
      title="Créer un nouveau fichier de code"
      icon={<CodeIcon className="h-6 w-6" />}
      description="Créez un nouveau fichier de code dans le type de votre choix"
      colorTheme="orange"
      fileType="code"
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
