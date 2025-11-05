import * as React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, Upload, Folder, Home, File } from "lucide-react";
import { GenericModal, ModalField, ModalButton } from "@/components/ui/generic-modal";
import { FolderSelectionModal, type FolderNode } from "@/components/ui/folder-selection-modal";

export interface DocumentMeta {
  id: string;
  name: string;
  parentPath: string;
  createdAt: string;
  tags?: string[];
  content?: string;
  type?: string;
}

export interface AddPptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onDocumentCreated: (document: DocumentMeta) => void;
  onRefreshTree?: () => void;
}

export function AddPptDialog({ open, onOpenChange, parentPath, onDocumentCreated, onRefreshTree }: AddPptDialogProps) {
  const [documentName, setDocumentName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [existingFolders, setExistingFolders] = useState<any[]>([]);
  const [showFolderModal, setShowFolderModal] = useState(false);

  // Supported PowerPoint file types only
  const supportedExtensions = ['.ppt', '.pptx'];
  const supportedMimeTypes = [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  useEffect(() => {
    if (window.electronAPI?.foldersScan) {
      window.electronAPI.foldersScan().then((scannedFolders: any[]) => {
        setExistingFolders(scannedFolders);
      }).catch((error) => {
        console.error('Error scanning folders:', error);
      });
    }
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setDocumentName("");
      setSelectedFile(null);
      setTags([]);
      setCurrentTag("");
      setParentId(undefined);
      setCreationError(null);
      setCreationSuccess(null);
    }
  }, [open]);

  const folderNodes: FolderNode[] = React.useMemo(() => {
    const convertTreeToNodesFromArray = (children: any[], parentPath?: string): FolderNode[] => {
      if (!Array.isArray(children)) return [];
      return children
        .filter(child => child && child.isDirectory)
        .map(child => {
          const nodeId = child.path || `${parentPath}-${child.name}`;
          return {
            id: nodeId,
            name: child.name,
            path: child.path,
            children: child.children ? convertTreeToNodesFromArray(child.children, child.path) : [],
            parent: parentPath
          };
        });
    };

    if (existingFolders.length > 0 && (existingFolders[0] as any).children) {
      return convertTreeToNodesFromArray((existingFolders[0] as any).children || []);
    }
    return [];
  }, [existingFolders]);

  const handleFolderSelect = (folderId: string | null, folderPath: string) => {
    setParentId(folderId || undefined);
    setShowFolderModal(false);
  };

  const getSelectedFolderName = React.useMemo(() => {
    if (!parentId) return "Racine";

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

    return "Racine";
  }, [parentId, existingFolders]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidType = supportedExtensions.includes(fileExtension) ||
                         supportedMimeTypes.includes(file.type);

      if (!isValidType) {
        setCreationError(`Type de fichier non supporté. Extensions supportées: ${supportedExtensions.join(', ')}`);
        return;
      }

      setSelectedFile(file);
      setCreationError(null);
      setDocumentName(file.name);
    } else {
      setSelectedFile(null);
      setDocumentName("");
    }
  };

  const handleCreateDocument = async () => {
    setCreationError(null);
    setCreationSuccess(null);

    if (!documentName.trim()) {
      setCreationError("Veuillez entrer un nom pour le document.");
      return;
    }

    if (!selectedFile) {
      setCreationError("Veuillez sélectionner un fichier PowerPoint.");
      return;
    }

    try {
      let finalParentPath = parentPath;
      if (parentId && existingFolders.length > 0 && (existingFolders[0] as any).children) {
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
        const parentFolder = findInTree((existingFolders[0] as any).children || []);
        finalParentPath = parentFolder?.path || parentPath;
      }

      const fileContent = await selectedFile.arrayBuffer();
      let finalNameWithExtension = documentName.trim();
      
      if (!finalNameWithExtension.includes('.')) {
        const originalExtension = selectedFile.name.split('.').pop();
        if (originalExtension) {
          finalNameWithExtension = `${finalNameWithExtension}.${originalExtension}`;
        }
      }

      const result = await (window.electronAPI as any).documentCreate({
        name: finalNameWithExtension,
        parentPath: finalParentPath,
        tags,
        content: fileContent,
        type: selectedFile.type,
        isBinary: true,
      });

      if (!result.success) {
        setCreationError(result.error || "Erreur lors de l'upload du document.");
        return;
      }

      const newDocument: DocumentMeta = {
        id: Date.now().toString(),
        name: finalNameWithExtension,
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
        type: selectedFile.type,
      };

      setCreationSuccess(`Présentation "${finalNameWithExtension}" uploadée avec succès !`);
      if (onDocumentCreated) onDocumentCreated(newDocument);
      if (onRefreshTree) onRefreshTree();

      setTimeout(() => {
        setDocumentName("");
        setSelectedFile(null);
        setTags([]);
        setCurrentTag("");
        setCreationSuccess(null);
        setCreationError(null);
        onOpenChange(false);
      }, 1500);

    } catch (error) {
      console.error('Error uploading PowerPoint:', error);
      setCreationError("Erreur lors de l'upload de la présentation.");
    }
  };

  const acceptString = supportedExtensions.join(',');

  const fields: ModalField[] = [
    {
      id: 'name',
      label: 'Nom du fichier',
      type: 'text',
      placeholder: 'Ex: presentation.pptx',
      required: false,
      value: documentName,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setDocumentName(e.target.value);
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
      id: 'file',
      label: 'Sélectionner une présentation PowerPoint',
      type: 'custom',
      required: false,
      content: (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Sélectionner une présentation PowerPoint</Label>
          <Input
            id="ppt-file-input"
            type="file"
            accept={acceptString}
            onChange={handleFileChange}
            className="transition-all duration-200 focus:ring-2 focus:ring-opacity-50"
          />
          {selectedFile && (
            <div className="text-sm text-green-600 flex items-center gap-2">
              <File className="h-4 w-4" />
              Fichier sélectionné: {selectedFile.name}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Formats supportés: .ppt, .pptx
          </div>
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

  const buttons: ModalButton[] = React.useMemo(() => [
    {
      label: 'Ajouter la présentation',
      variant: 'default',
      onClick: handleCreateDocument,
      disabled: !selectedFile
    }
  ], [selectedFile, handleCreateDocument]);

  return (
    <>
      <GenericModal
        open={open}
        onOpenChange={onOpenChange}
        title="Ajouter une présentation PowerPoint"
        icon={<Upload className="h-6 w-6" />}
        description="Sélectionnez un fichier PowerPoint (.ppt, .pptx) depuis votre ordinateur"
        colorTheme="orange"
        fileType="document"
        size="lg"
        fields={fields}
        buttons={buttons}
        showCancelButton={true}
        cancelLabel="Annuler"
        validationRules={{}}
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
