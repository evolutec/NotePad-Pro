import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, FilePlus, Crop as CropIcon, RotateCw, ZoomIn, ZoomOut, Plus, Minus, Folder, Home } from "lucide-react";
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop';
import { GenericModal, ModalField, ModalButton } from "@/components/ui/generic-modal";
import { FolderSelectionModal, type FolderNode } from "@/components/ui/folder-selection-modal";

export interface ImageMeta {
  id: string;
  name: string;
  type: string; // e.g., "png", "jpg", "svg"
  parentPath: string;
  createdAt: string;
  tags?: string[];
}

export interface AddImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onImageCreated: (image: ImageMeta) => void;
  onRefreshTree?: () => void;
}

export function AddImageDialog({ open, onOpenChange, parentPath, onImageCreated, onRefreshTree }: AddImageDialogProps) {
  const [imageName, setImageName] = useState("");
  const [imageType, setImageType] = useState<string>("png"); // Default to png image
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [existingFolders, setExistingFolders] = useState<any[]>([]);
  const [showFolderModal, setShowFolderModal] = useState(false);

  // Image preview and cropping states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [completedCrop, setCompletedCrop] = useState<Area | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageScale, setImageScale] = useState(1);

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (window.electronAPI?.foldersScan) {
      window.electronAPI.foldersScan().then((scannedFolders: any[]) => {
        setExistingFolders(scannedFolders);
      });
    }
  }, [open]);

  // Convert folders to FolderNode format for the tree selector
  const folderNodes: FolderNode[] = React.useMemo(() => {
    // Handle the tree structure returned by foldersScan
    const convertTreeToNodes = (treeNode: any, parentId?: string): FolderNode[] => {
      if (!treeNode || typeof treeNode !== 'object') return [];

      const nodes: FolderNode[] = [];

      // Add the current node if it's a directory
      if (treeNode.isDirectory) {
        nodes.push({
          id: treeNode.path || `${parentId}-${treeNode.name}`,
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
        .map(child => ({
          id: child.path || `${parentPath}-${child.name}`,
          name: child.name,
          path: child.path,
          children: child.children ? convertTreeToNodesFromArray(child.children, child.path) : [],
          parent: parentPath
        }));
    };

    // Handle both flat array of folders (from foldersLoad) and tree structure (from foldersScan)
    if (existingFolders.length > 0 && (existingFolders[0] as any).children) {
      // Tree structure from foldersScan
      return convertTreeToNodesFromArray((existingFolders[0] as any).children || []);
    } else {
      // Flat array structure from foldersLoad
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

  // Handle folder selection
  const handleFolderSelect = (folderId: string | null, folderPath: string) => {
    setParentId(folderId || undefined);
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

  // Reset states when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setCompletedCrop(null);
      setShowCrop(false);
      setImageRotation(0);
      setImageScale(1);
    }
  }, [open]);

  // Reset cropping when new file is selected
  useEffect(() => {
    if (selectedFile) {
      setCrop({ x: 0, y: 0 });
      setCompletedCrop(null);
      setImageRotation(0);
      setImageScale(1);
    }
  }, [selectedFile]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const event = e as React.ChangeEvent<HTMLInputElement>;
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      console.log('File selected:', file.name, 'Type:', file.type, 'Size:', file.size);

      setSelectedFile(file);

      // Auto-detect image type from file extension
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const extensionToType: { [key: string]: string } = {
        'png': 'png',
        'jpg': 'jpg',
        'jpeg': 'jpg',
        'svg': 'svg'
      };

      const detectedType = extensionToType[fileExtension || ''] || 'png';
      setImageType(detectedType);

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log('FileReader loaded, data URL length:', result?.length || 0);
        setImageSrc(result);
        setShowCrop(true);
        console.log('showCrop set to true, imageSrc set');
      };
      reader.onerror = (e) => {
        console.error('FileReader error:', e);
      };
      reader.readAsDataURL(file);
    } else {
      console.log('No valid image file selected');
    }
  };

  // Handle crop completion
  const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setCompletedCrop(croppedAreaPixels);
  };

  // Handle crop change
  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  // Rotate image
  const rotateImage = () => {
    setImageRotation((prev) => (prev + 90) % 360);
  };

  // Zoom image
  const zoomIn = () => {
    setImageScale((prev) => Math.min(prev + 0.1, 2));
  };

  const zoomOut = () => {
    setImageScale((prev) => Math.max(prev - 0.1, 0.5));
  };





  const handleCreateImage = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!imageName.trim()) return;

    try {
      let imageData: string | ArrayBuffer | null = null;

      // If we have a selected file, process it
      if (selectedFile) {
        try {
          // Read the original file as binary data
          imageData = await selectedFile.arrayBuffer();

          // If cropping is applied, process the cropped version
          if (completedCrop && selectedFile) {
            try {
              // Create an image element to load the original file
              const img = new Image();
              const imageUrl = URL.createObjectURL(selectedFile);

              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imageUrl;
              });

              // Create canvas with the cropped dimensions
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');

              if (ctx && completedCrop.width && completedCrop.height) {
                // Set canvas size to the cropped area dimensions
                canvas.width = Math.round(completedCrop.width);
                canvas.height = Math.round(completedCrop.height);

                console.log('Cropping image with react-easy-crop:', {
                  originalSize: `${img.naturalWidth}x${img.naturalHeight}`,
                  cropArea: `${completedCrop.x}, ${completedCrop.y}, ${completedCrop.width}, ${completedCrop.height}`,
                  canvasSize: `${canvas.width}x${canvas.height}`
                });

                // Clear canvas with transparent background
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw the cropped portion of the image
                // react-easy-crop provides pixel coordinates directly
                ctx.drawImage(
                  img,
                  completedCrop.x,     // Source X (pixel coordinate)
                  completedCrop.y,     // Source Y (pixel coordinate)
                  completedCrop.width,  // Source width (pixel size)
                  completedCrop.height, // Source height (pixel size)
                  0,                    // Destination X
                  0,                    // Destination Y
                  canvas.width,         // Destination width
                  canvas.height         // Destination height
                );

                // Convert canvas to blob and then to array buffer
                const blob = await new Promise<Blob>((resolve, reject) => {
                  canvas.toBlob((blob) => {
                    if (blob) {
                      resolve(blob);
                    } else {
                      reject(new Error('Failed to create blob from cropped image'));
                    }
                  }, 'image/png', 1.0);
                });

                imageData = await blob.arrayBuffer();
                console.log('Cropped image created successfully, size:', imageData.byteLength, 'bytes');
              }

              // Clean up object URL
              URL.revokeObjectURL(imageUrl);
            } catch (processingError) {
              console.error('Image processing error:', processingError);
              setCreationError("Erreur lors du traitement de l'image.");
              return;
            }
          }
        } catch (processingError) {
          console.error('Image processing error:', processingError);
          setCreationError("Erreur lors du traitement de l'image.");
          return;
        }
      }

      let finalParentPath = parentPath;
      if (parentId) {
        const parentFolder = existingFolders.find(f => f.id === parentId);
        finalParentPath = parentFolder?.path || parentPath;
      }

      if (window.electronAPI?.imageCreate) {
        console.log('Sending image data to Electron API:', {
          name: imageName.trim(),
          type: imageType,
          parentPath: finalParentPath,
          hasContent: !!imageData,
          contentType: typeof imageData,
          contentLength: imageData ? (imageData instanceof ArrayBuffer ? imageData.byteLength : 0) : 0,
          isBinary: true
        });

        const result = await window.electronAPI.imageCreate({
          name: imageName.trim(),
          type: imageType,
          parentPath: finalParentPath,
          tags,
          content: imageData, // Use binary data instead of base64
          isBinary: true,
        });

        console.log('Electron API response:', result);

        if (!result.success) {
          setCreationError(result.error || "Erreur lors de la création de l'image.");
          return;
        }

        const newImage: ImageMeta = {
          id: Date.now().toString(),
          name: imageName.trim(),
          type: imageType,
          parentPath: finalParentPath,
          createdAt: new Date().toISOString(),
          tags,
        };

        setCreationSuccess("Image créée avec succès !");
        if (onImageCreated) onImageCreated(newImage);
        // Trigger tree refresh
        if (onRefreshTree) {
          onRefreshTree();
        }
        setTimeout(() => {
          setImageName("");
          setImageType("png");
          setTags([]);
          setCurrentTag("");
          setCreationSuccess(null);
          setCreationError(null);
          if (onOpenChange) onOpenChange(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Error creating image:', error);
      setCreationError("Erreur lors de la création de l'image.");
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
      label: 'Nom de l\'image',
      type: 'text',
      placeholder: 'Ex: Photo de vacances, Logo, Icône...',
      required: true
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
      label: 'Importer une image',
      type: 'file',
      accept: 'image/*',
      required: false,
      onChange: handleFileChange
    },
    {
      id: 'type',
      label: 'Type d\'image',
      type: 'select',
      placeholder: 'Sélectionner le type d\'image...',
      required: true,
      options: [
        { label: 'PNG', value: 'png' },
        { label: 'JPG', value: 'jpg' },
        { label: 'SVG', value: 'svg' }
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

  // Debug info
  const debugInfo = (
    <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
      <div>Debug Info:</div>
      <div>showCrop: {showCrop.toString()}</div>
      <div>imageSrc: {imageSrc ? 'loaded' : 'null'}</div>
      <div>selectedFile: {selectedFile ? selectedFile.name : 'null'}</div>
      <div>imageName: "{imageName}"</div>
      <div>Button disabled: {!imageName.trim() || !selectedFile ? 'YES' : 'NO'}</div>
    </div>
  );

  // Custom content for image preview and cropping
  const customContent = showCrop && imageSrc ? (
    <div className="space-y-4 mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Aperçu et recadrage
        </Label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            title="Zoom avant"
            disabled={imageScale >= 2}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            title="Zoom arrière"
            disabled={imageScale <= 0.5}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={rotateImage}
            title="Rotation 90°"
            className="h-8 w-8 p-0"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowCrop(false);
              setCrop({ x: 0, y: 0 });
              setCompletedCrop(null);
              setImageRotation(0);
              setImageScale(1);
            }}
            title="Annuler le recadrage"
            className="h-8 w-8 p-0"
          >
            <CropIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="relative bg-black rounded-lg overflow-hidden border-2 border-gray-300 shadow-lg" style={{ width: '500px', height: '400px' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            rotation={imageRotation}
            zoom={imageScale}
            aspect={undefined}
            onCropChange={onCropChange}
            onCropComplete={onCropComplete}
            onZoomChange={setImageScale}
            onRotationChange={setImageRotation}
            cropShape="rect"
            showGrid={true}
            style={{
              containerStyle: {
                width: '100%',
                height: '100%',
                background: '#1a1a1a',
              },
              mediaStyle: {
                opacity: 1,
                objectFit: 'contain',
              },
              cropAreaStyle: {
                border: '2px solid #ffffff',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              },
            }}
          />
        </div>
      </div>

      {completedCrop && (
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Zone sélectionnée: {Math.round(completedCrop.width || 0)} x {Math.round(completedCrop.height || 0)} pixels
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Astuce:</strong> Utilisez la souris pour déplacer et redimensionner la zone de recadrage.
          Utilisez les boutons pour zoomer, faire pivoter ou annuler le recadrage.
        </p>
      </div>
    </div>
  ) : selectedFile ? (
    <div className="space-y-4 mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <div className="text-center">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          ⏳ Chargement de l'image en cours...
        </p>
        <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
          Fichier: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
        </p>
      </div>
    </div>
  ) : null;

  // Define buttons for the GenericModal
  const buttons: ModalButton[] = [
    {
      label: 'Créer l\'image',
      variant: 'default',
      onClick: handleCreateImage,
      disabled: !imageName.trim() || !selectedFile
    }
  ];

  return (
    <>
      <GenericModal
        open={open}
        onOpenChange={onOpenChange}
        title="Créer une nouvelle image"
        icon={<ImageIcon className="h-6 w-6" />}
        description="Importez et modifiez une image depuis votre ordinateur"
        colorTheme="green"
        fileType="image"
        size="xl"
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

      {/* Folder Selection Modal */}
      <FolderSelectionModal
        open={showFolderModal}
        onOpenChange={setShowFolderModal}
        folders={folderNodes}
        selectedFolderId={parentId}
        onFolderSelect={handleFolderSelect}
        title="Sélectionner le dossier parent"
        description="Choisissez le dossier dans lequel créer la nouvelle image"
      />
    </>
  );
}
