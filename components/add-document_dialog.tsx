import * as React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, FilePlus } from "lucide-react";
import { GenericModal, ModalField, ModalButton } from "@/components/ui/generic-modal";
import { FolderTreeSelector, type FolderNode } from "@/components/ui/folder-tree-selector";

export interface DocumentMeta {
  id: string;
  name: string;
  parentPath: string;
  createdAt: string;
  tags?: string[];
  content?: string; // Add content field for uploaded file
}

export interface AddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onDocumentCreated: (document: DocumentMeta) => void;
  onRefreshTree?: () => void;
}

export function AddDocumentDialog({ open, onOpenChange, parentPath, onDocumentCreated, onRefreshTree }: AddDocumentDialogProps) {
  const [documentName, setDocumentName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // New state for selected file
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Keep the original filename with extension
      setDocumentName(file.name);
    } else {
      setSelectedFile(null);
      setDocumentName("");
    }
  };

  const isBinaryFile = (file: File): boolean => {
    const binaryTypes = [
      'application/pdf',
      'image/',
      'video/',
      'audio/',
      'application/zip',
      'application/x-zip-compressed'
    ];
    return binaryTypes.some(type => file.type.startsWith(type)) ||
           file.name.toLowerCase().endsWith('.pdf');
  };

  const handleCreateDocument = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!documentName.trim() && !selectedFile) {
      setCreationError("Veuillez entrer un nom de document ou sélectionner un fichier.");
      return;
    }

    let finalParentPath = parentPath;
    if (parentId) {
      const parentFolder = existingFolders.find(f => f.id === parentId);
      finalParentPath = parentFolder?.path || parentPath;
    }

    let fileContent: string | ArrayBuffer | undefined = undefined;
    let isBinary = false;

    if (selectedFile) {
      try {
        // Check if it's a binary file
        if (isBinaryFile(selectedFile)) {
          console.log('Reading binary file:', selectedFile.name);
          fileContent = await selectedFile.arrayBuffer(); // Read as binary
          isBinary = true;
        } else {
          console.log('Reading text file:', selectedFile.name);
          fileContent = await selectedFile.text(); // Read as text
          isBinary = false;
        }
      } catch (error) {
        setCreationError("Erreur lors de la lecture du fichier.");
        return;
      }
    }

    if (window.electronAPI?.documentCreate) {
      const result = await window.electronAPI.documentCreate({
        name: documentName.trim(),
        parentPath: finalParentPath,
        tags,
        content: fileContent, // Pass file content (binary or text)
        type: selectedFile?.type || 'text/plain', // Infer type from file or default
        isBinary, // Flag to indicate binary file
      });

      if (!result.success) {
        setCreationError(result.error || "Erreur lors de la création du document.");
        return;
      }

      const newDocument: DocumentMeta = {
        id: Date.now().toString(),
        name: documentName.trim(),
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
        content: typeof fileContent === 'string' ? fileContent : undefined,
      };

      setCreationSuccess("Document créé avec succès !");
      if (onDocumentCreated) onDocumentCreated(newDocument);
      // Trigger tree refresh
      if (onRefreshTree) {
        onRefreshTree();
      }
      setTimeout(() => {
        setDocumentName("");
        setSelectedFile(null);
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
      id: 'file',
      label: 'Importer un fichier',
      type: 'file',
      accept: '.pdf,.doc,.docx,.txt,.rtf,.odt',
      required: false
    },
    {
      id: 'name',
      label: 'Nom du document',
      type: 'text',
      placeholder: 'Ex: Rapport, Article, Liste...',
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
      label: 'Créer le document',
      variant: 'default',
      onClick: handleCreateDocument,
      disabled: !documentName.trim() && !selectedFile
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
      title="Créer ou importer un document"
      icon={<FileText className="h-6 w-6" />}
      description="Importez un document PDF, Word ou texte depuis votre ordinateur"
      colorTheme="red"
      fileType="document"
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
    >
      {customContent}
    </GenericModal>
  );
}
