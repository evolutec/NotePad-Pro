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

export interface AddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onDocumentCreated: (document: DocumentMeta) => void;
  onRefreshTree?: () => void;
}

export function AddDocumentDialog({ open, onOpenChange, parentPath, onDocumentCreated, onRefreshTree }: AddDocumentDialogProps) {
  const [documentName, setDocumentName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [existingFolders, setExistingFolders] = useState<any[]>([]);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const modalRef = React.useRef<any>(null);

  // Supported document file types
  const supportedExtensions = [
    '.txt', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.rtf', '.odt', '.ods', '.odp', '.csv', '.tsv'
  ];

  // Legacy formats that need external applications
  const legacyExtensions = ['.doc', '.xls', '.ppt'];

  const supportedMimeTypes = [
    'text/plain', 'text/csv', 'text/tab-separated-values',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/rtf',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation'
  ];

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
      // Validate file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidType = supportedExtensions.includes(fileExtension) ||
                         supportedMimeTypes.includes(file.type);

      if (!isValidType) {
        setCreationError(`Type de fichier non supporté. Extensions supportées: ${supportedExtensions.join(', ')}`);
        return;
      }

      console.log('File found, setting state...');
      setSelectedFile(file);
      setCreationError(null); // Clear any previous errors

      // Auto-set the name if the current name is empty or matches a previous file name pattern
      const currentName = documentName;
      const fileName = file.name;
      const isDefaultName = !currentName || currentName === fileName;

      if (isDefaultName) {
        setDocumentName(fileName);
        console.log('Auto-set document name to:', fileName, 'with full name:', file.name);
        console.log('File name details:', {
          originalName: file.name,
          nameWithoutExtension: file.name.replace(/\.[^/.]+$/, ''),
          extension: file.name.split('.').pop(),
          fullName: fileName,
          fileNameLength: file.name.length,
          fileNameParts: file.name.split('.')
        });
      } else {
        console.log('Keeping user-defined name:', currentName, 'original file name:', file.name);
      }

      // Force refresh the document name state to ensure it has the full filename
      setDocumentName(fileName);
      console.log('Document name state after setting:', documentName);

      // Additional logging to track the issue
      console.log('=== FILE NAME DEBUG ===');
      console.log('File object name:', file.name);
      console.log('File name length:', file.name.length);
      console.log('File name parts:', file.name.split('.'));
      console.log('Last part (extension):', file.name.split('.').pop());
      console.log('Document name state:', documentName);

      // Check if the file name is being truncated somewhere
      if (file.name.includes('.')) {
        console.log('File has extension, should be preserved');
      } else {
        console.log('WARNING: File name has no extension!');
      }

      // Additional check: ensure the document name state is properly set
      console.log('Current documentName state value:', documentName);
      console.log('Setting documentName to:', fileName);

      // Force a React state update to ensure the name is properly set
      React.startTransition(() => {
        setDocumentName(fileName);
      });

      // Additional safety: use a timeout to ensure the state is set
      setTimeout(() => {
        console.log('Timeout check - documentName state:', documentName);
        console.log('Timeout check - selectedFile name:', selectedFile?.name);
      }, 100);

      // Additional safety: use a longer timeout to ensure the state is set
      setTimeout(() => {
        console.log('Longer timeout check - documentName state:', documentName);
        console.log('Longer timeout check - selectedFile name:', selectedFile?.name);
        console.log('Longer timeout check - documentName length:', documentName.length);
        console.log('Longer timeout check - selectedFile name length:', selectedFile?.name.length);
      }, 500);

      // Additional safety: use a much longer timeout to ensure the state is set
      setTimeout(() => {
        console.log('Much longer timeout check - documentName state:', documentName);
        console.log('Much longer timeout check - selectedFile name:', selectedFile?.name);
        console.log('Much longer timeout check - documentName length:', documentName.length);
        console.log('Much longer timeout check - selectedFile name length:', selectedFile?.name.length);
        console.log('Much longer timeout check - documentName includes dot:', documentName.includes('.'));
        console.log('Much longer timeout check - selectedFile name includes dot:', selectedFile?.name.includes('.'));
      }, 1000);

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

  const getFileExtension = (filename: string): string => {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot + 1).toLowerCase() : '';
  };

  const isBinaryFile = (file: File): boolean => {
    const binaryExtensions = [
      'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      'pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico',
      'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv',
      'mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac',
      'zip', 'rar', '7z', 'tar', 'gz'
    ];

    const extension = getFileExtension(file.name);
    return binaryExtensions.includes(extension);
  };

  const handleCreateDocument = async () => {
    console.log('=== handleCreateDocument called ===');

    setCreationError(null);
    setCreationSuccess(null);

    // Validation
    if (!documentName.trim()) {
      setCreationError("Veuillez entrer un nom pour le document.");
      return;
    }

    if (!selectedFile) {
      setCreationError("Veuillez sélectionner un fichier.");
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

      // Determine if file is binary or text
      const isBinary = isBinaryFile(selectedFile);
      let fileContent;

      if (isBinary) {
        // Read binary file as ArrayBuffer
        console.log('Reading binary file:', selectedFile.name);
        fileContent = await selectedFile.arrayBuffer();
      } else {
        // Read text file as text
        console.log('Reading text file:', selectedFile.name);
        fileContent = await selectedFile.text();
      }

      // Create new filename (keep original name with extension)
      const finalName = documentName.trim();

      console.log('Creating document with name:', finalName);
      console.log('Selected file name:', selectedFile.name);
      console.log('Document name state:', documentName);
      console.log('Final name to create:', finalName);

      // Ensure the filename has the correct extension
      let finalNameWithExtension = finalName;
      if (!finalName.includes('.')) {
        // If no extension, add the original file extension
        const originalExtension = selectedFile.name.split('.').pop();
        if (originalExtension) {
          finalNameWithExtension = `${finalName}.${originalExtension}`;
          console.log('Added extension to filename:', finalName, '->', finalNameWithExtension);
        }
      }

      console.log('Final name with extension:', finalNameWithExtension);
      console.log('Original selected file name:', selectedFile.name);
      console.log('Document name state before API call:', documentName);

      // Additional check: if the final name still doesn't have an extension, use the original filename
      if (!finalNameWithExtension.includes('.')) {
        finalNameWithExtension = selectedFile.name;
        console.log('Using original filename as fallback:', finalNameWithExtension);
      }

      // Final safety check: ensure we have a proper filename with extension
      if (!finalNameWithExtension.includes('.')) {
        console.error('CRITICAL: Final filename has no extension!', finalNameWithExtension);
        // Force add extension if missing
        const fallbackExtension = selectedFile.name.split('.').pop() || 'txt';
        finalNameWithExtension = `${finalNameWithExtension}.${fallbackExtension}`;
        console.log('CRITICAL FIX: Added fallback extension:', finalNameWithExtension);
      }

      // ULTIMATE CHECK: Make absolutely sure we have the full filename with extension
      if (finalNameWithExtension.split('.').length < 2) {
        console.error('ULTIMATE CRITICAL: Still no extension after all checks!');
        finalNameWithExtension = selectedFile.name; // Use original filename as last resort
        console.log('ULTIMATE FIX: Using original filename:', finalNameWithExtension);
      }

      // Ensure the final name for metadata includes the extension
      const finalNameForMetadata = finalNameWithExtension;

      // Upload document file
      const result = await (window.electronAPI as any).documentCreate({
        name: finalNameWithExtension,
        parentPath: finalParentPath,
        tags,
        content: fileContent,
        type: selectedFile.type,
        isBinary: isBinary,
      });

      console.log('=== DOCUMENT CREATE API CALL DEBUG ===');
      console.log('API call parameters:', {
        name: finalNameWithExtension,
        parentPath: finalParentPath,
        tags,
        contentLength: fileContent ? (typeof fileContent === 'string' ? fileContent.length : fileContent.byteLength) : 0,
        type: selectedFile.type,
        isBinary: isBinary,
      });

      console.log('=== DOCUMENT CREATE RESULT DEBUG ===');
      console.log('API call result:', result);
      console.log('Final name used:', finalNameWithExtension);
      console.log('Selected file name:', selectedFile.name);
      console.log('Document name state:', documentName);
      console.log('Result path:', result.path);

      console.log('=== DOCUMENT CREATE API CALL DEBUG ===');
      console.log('API call parameters:', {
        name: finalNameWithExtension,
        parentPath: finalParentPath,
        tags,
        contentLength: fileContent ? (typeof fileContent === 'string' ? fileContent.length : fileContent.byteLength) : 0,
        type: selectedFile.type,
        isBinary: isBinary,
      });

      console.log('=== DOCUMENT CREATE RESULT DEBUG ===');
      console.log('API call result:', result);
      console.log('Final name used:', finalNameWithExtension);
      console.log('Selected file name:', selectedFile.name);
      console.log('Document name state:', documentName);
      console.log('Result path:', result.path);

      if (!result.success) {
        setCreationError(result.error || "Erreur lors de l'upload du document.");
        return;
      }

      const newDocument: DocumentMeta = {
        id: Date.now().toString(),
        name: finalNameForMetadata,
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
        type: selectedFile.type,
      };

      console.log('✅ Document file uploaded successfully with metadata:', {
        id: newDocument.id,
        name: newDocument.name,
        path: result.path,
        parentPath: newDocument.parentPath,
        createdAt: newDocument.createdAt,
        tags: newDocument.tags,
        type: newDocument.type
      });

      setCreationSuccess(`Document "${finalNameForMetadata}" uploadé avec succès !`);
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
      console.error('Error uploading document:', error);
      setCreationError("Erreur lors de l'upload du document.");
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

  // Create accept string for file input
  const acceptString = supportedExtensions.join(',');

  // Define fields for the GenericModal
  const fields: ModalField[] = [
    {
      id: 'name',
      label: 'Nom du fichier',
      type: 'text',
      placeholder: 'Ex: document.txt, rapport.docx, notes.txt...',
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
      label: 'Sélectionner un document',
      type: 'custom',
      required: false,
      content: (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Sélectionner un document</Label>
          <Input
            id="document-file-input"
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
            <div className="text-green-600">Formats avec prévisualisation: PDF, HTML, images (JPG, PNG)</div>
            <div className="text-orange-600">Formats nécessitant une application externe: DOC, DOCX, XLS, XLSX, PPT, PPTX, RTF, ODT, ODS, ODP, TXT, CSV</div>
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

  // Define buttons for the GenericModal
  const buttons: ModalButton[] = React.useMemo(() => [
    {
      label: 'Ajouter le document',
      variant: 'default',
      onClick: handleCreateDocument,
      disabled: !selectedFile // Only require a selected file, name will be auto-filled
    }
  ], [selectedFile, handleCreateDocument]);

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
        title="Ajouter un document"
        icon={<Upload className="h-6 w-6" />}
        description="Sélectionnez un fichier document depuis votre ordinateur et choisissez son emplacement"
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
