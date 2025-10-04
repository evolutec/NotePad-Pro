import * as React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, Upload, Folder, Home } from "lucide-react";
import { GenericModal, ModalField, ModalButton } from "@/components/ui/generic-modal";
import { FolderSelectionModal, type FolderNode } from "@/components/ui/folder-selection-modal";

export interface DocumentMeta {
  id: string;
  name: string;
  parentPath: string;
  createdAt: string;
  tags?: string[];
  content?: string;
}

export interface AddPdfDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onDocumentCreated: (document: DocumentMeta) => void;
  onRefreshTree?: () => void;
}

export function AddPdfDocumentDialog({ open, onOpenChange, parentPath, onDocumentCreated, onRefreshTree }: AddPdfDocumentDialogProps) {
  const [documentName, setDocumentName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // New state for selected file
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [existingFolders, setExistingFolders] = useState<any[]>([]);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const modalRef = React.useRef<any>(null);

  useEffect(() => {
    if (window.electronAPI?.foldersScan) {
      window.electronAPI.foldersScan().then((scannedFolders: any[]) => {
        console.log('Folders scanned:', scannedFolders);
        setExistingFolders(scannedFolders);
      }).catch((error) => {
        console.error('Error scanning folders:', error);
      });
    }
  }, [open]);

  // Reset form when modal opens
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

  // Convert folders to FolderNode format for the tree selector
  const folderNodes: FolderNode[] = React.useMemo(() => {
    console.log('=== Converting folders to folderNodes ===');
    console.log('existingFolders:', existingFolders);

    // Handle the tree structure returned by foldersScan
    const convertTreeToNodes = (treeNode: any, parentId?: string): FolderNode[] => {
      if (!treeNode || typeof treeNode !== 'object') return [];

      const nodes: FolderNode[] = [];

      // Add the current node if it's a directory
      if (treeNode.isDirectory) {
        const nodeId = treeNode.path || `${parentId}-${treeNode.name}`;
        console.log('Creating node:', { id: nodeId, name: treeNode.name, path: treeNode.path });

        nodes.push({
          id: nodeId,
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
        .map(child => {
          const nodeId = child.path || `${parentPath}-${child.name}`;
          console.log('Creating child node:', { id: nodeId, name: child.name, path: child.path });

          return {
            id: nodeId,
            name: child.name,
            path: child.path,
            children: child.children ? convertTreeToNodesFromArray(child.children, child.path) : [],
            parent: parentPath
          };
        });
    };

    // Handle both flat array of folders (from foldersLoad) and tree structure (from foldersScan)
    if (existingFolders.length > 0 && (existingFolders[0] as any).children) {
      // Tree structure from foldersScan
      console.log('Using tree structure from foldersScan');
      const result = convertTreeToNodesFromArray((existingFolders[0] as any).children || []);
      console.log('Generated folderNodes:', result);
      return result;
    } else {
      // Flat array structure from foldersLoad
      console.log('Using flat structure from foldersLoad');
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
      const result = buildTree(existingFolders);
      console.log('Generated folderNodes from flat:', result);
      return result;
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== CUSTOM HANDLE FILE CHANGE TRIGGERED ===');
    console.log('Event:', event);
    console.log('Event target:', event.target);
    console.log('Event target files:', event.target.files);
    console.log('Event target value:', event.target.value);

    const file = event.target.files?.[0];
    console.log('Extracted file:', file);

    if (file) {
      console.log('File found, setting state...');
      setSelectedFile(file);

      // Only auto-set the name if the current name is empty or matches a previous file name pattern
      const currentName = documentName;
      const fileName = file.name.replace(/\.pdf$/i, ''); // Remove .pdf extension if present
      const isDefaultName = !currentName || currentName === fileName || currentName.endsWith('.pdf');

      if (isDefaultName) {
        setDocumentName(fileName);
        console.log('Auto-set document name to:', fileName);
      } else {
        console.log('Keeping user-defined name:', currentName);
      }

      console.log('State set - selectedFile:', file);
      console.log('State set - documentName:', documentName);
      console.log('File selection successful - button should now be enabled');
    } else {
      console.log('No file found, clearing state...');
      setSelectedFile(null);
      setDocumentName("");
      console.log('File selection cleared - button should now be disabled');
    }
  };

  // Debug: Track selectedFile state changes
  React.useEffect(() => {
    console.log('=== SELECTED FILE STATE CHANGE ===');
    console.log('selectedFile changed to:', selectedFile);
    if (selectedFile) {
      console.log('File details:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        lastModified: selectedFile.lastModified
      });
    }
  }, [selectedFile]);

  // Force update state when selectedFile changes
  React.useEffect(() => {
    console.log('=== FORCE UPDATE EFFECT ===');
    console.log('selectedFile changed:', selectedFile);
    console.log('documentName:', documentName);
    console.log('Button should be enabled:', !!(documentName.trim() && selectedFile));
  }, [selectedFile]);

  // Debug: Track state changes
  React.useEffect(() => {
    console.log('=== STATE CHANGE DEBUG ===');
    console.log('documentName:', documentName);
    console.log('selectedFile:', selectedFile);
    console.log('Button should be enabled:', !!(documentName.trim() && selectedFile));
  }, [documentName, selectedFile]);

  const getFileExtension = (filename: string): string => {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot + 1).toLowerCase() : '';
  };

  const isBinaryFile = (file: File): boolean => {
    const binaryExtensions = [
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico',
      'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv',
      'mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac',
      'zip', 'rar', '7z', 'tar', 'gz'
    ];

    const extension = getFileExtension(file.name);
    return binaryExtensions.includes(extension);
  };

  const handleCreatePdf = async () => {
    console.log('=== handleCreatePdf called ===');

    setCreationError(null);
    setCreationSuccess(null);

    // Validation
    if (!documentName.trim()) {
      setCreationError("Veuillez entrer un nom pour le PDF.");
      return;
    }

    if (!selectedFile) {
      setCreationError("Veuillez sélectionner un fichier PDF.");
      return;
    }

    // Check if it's actually a PDF file
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setCreationError("Veuillez sélectionner un fichier PDF valide.");
      return;
    }

    try {
      // Get destination path
      let finalParentPath = parentPath;
      if (parentId) {
        // First try to find in root level
        let parentFolder = existingFolders.find(f => f.id === parentId);

        // If not found in root level, search in the tree structure
        if (!parentFolder && existingFolders.length > 0 && (existingFolders[0] as any).children) {
          const findInTree = (nodes: any[]): any => {
            for (const node of nodes) {
              if (node.path === parentId || node.id === parentId) {
                return node;
              }
              if (node.children) {
                const found = findInTree(node.children);
                if (found) return found;
              }
            }
            return null;
          };

          parentFolder = findInTree((existingFolders[0] as any).children || []);
        }

        finalParentPath = parentFolder?.path || parentPath;
        console.log('=== DESTINATION PATH DEBUG ===');
        console.log('parentId:', parentId);
        console.log('parentFolder found:', parentFolder);
        console.log('finalParentPath:', finalParentPath);
        console.log('original parentPath:', parentPath);
      }

      // Read PDF file as binary
      console.log('Reading PDF file:', selectedFile.name);
      const fileContent = await selectedFile.arrayBuffer();

      // Create new filename with provided name + .pdf extension
      const finalName = documentName.trim().endsWith('.pdf')
        ? documentName.trim()
        : `${documentName.trim()}.pdf`;

      console.log('Creating PDF with name:', finalName);

      // Upload PDF file
      const result = await (window.electronAPI as any).documentCreate({
        name: finalName,
        parentPath: finalParentPath,
        tags,
        content: fileContent,
        type: 'application/pdf',
        isBinary: true,
      });

      if (!result.success) {
        setCreationError(result.error || "Erreur lors de l'upload du PDF.");
        return;
      }

      const newDocument: DocumentMeta = {
        id: Date.now().toString(),
        name: finalName,
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
      };

      // For PDF files, we'll use a simple approach for now
      // In the future, we could extend the API to support file metadata storage
      console.log('✅ PDF file uploaded successfully with metadata:', {
        id: newDocument.id,
        name: newDocument.name,
        path: result.path,
        parentPath: newDocument.parentPath,
        createdAt: newDocument.createdAt,
        tags: newDocument.tags
      });

      setCreationSuccess(`PDF "${finalName}" uploadé avec succès !`);
      if (onDocumentCreated) onDocumentCreated(newDocument);
      if (onRefreshTree) onRefreshTree();

      // Reset form after success
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
      console.error('Error uploading PDF:', error);
      setCreationError("Erreur lors de l'upload du PDF.");
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
      label: 'Nom du fichier',
      type: 'text',
      placeholder: 'Ex: document.pdf, rapport.docx, notes.txt...',
      required: false, // Disable GenericModal's validation
      value: documentName,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        console.log('Name input changed:', e.target.value);
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
      label: 'Sélectionner un PDF',
      type: 'custom',
      required: false,
      content: (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Sélectionner un PDF</Label>
          <Input
            id="pdf-file-input"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="transition-all duration-200 focus:ring-2 focus:ring-opacity-50"
          />
          {selectedFile && (
            <div className="text-sm text-green-600 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Fichier sélectionné: {selectedFile.name}
            </div>
          )}
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
  const buttons: ModalButton[] = React.useMemo(() => [
    {
      label: 'Add PDF',
      variant: 'default',
      onClick: handleCreatePdf,
      disabled: !selectedFile // Only require a selected file, name will be auto-filled
    }
  ], [selectedFile, handleCreatePdf]);

  // Debug: Track button state
  React.useEffect(() => {
    console.log('=== BUTTON STATE DEBUG ===');
    console.log('selectedFile:', selectedFile);
    console.log('Button disabled state:', !selectedFile);
  }, [selectedFile]);

  return (
    <>
      <GenericModal
        open={open}
        onOpenChange={onOpenChange}
        title="Ajouter un PDF"
        icon={<Upload className="h-6 w-6" />}
        description="Sélectionnez un fichier PDF depuis votre ordinateur et choisissez son emplacement"
        colorTheme="blue"
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

      {/* Folder Selection Modal */}
      <FolderSelectionModal
        open={showFolderModal}
        onOpenChange={setShowFolderModal}
        folders={folderNodes}
        selectedFolderId={parentId}
        onFolderSelect={handleFolderSelect}
        title="Sélectionner le dossier parent"
        description="Choisissez le dossier dans lequel créer le nouveau document"
      />
    </>
  );
}
