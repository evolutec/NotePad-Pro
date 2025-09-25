import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, FilePlus, Crop as CropIcon, RotateCw, ZoomIn, ZoomOut, Plus, Minus } from "lucide-react";
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop';
import { GenericModal, ModalField, ModalButton } from "@/components/ui/generic-modal";
import { FolderTreeSelector, type FolderNode } from "@/components/ui/folder-tree-selector";

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

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
        setShowCrop(true);
      };
      reader.readAsDataURL(file);
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
      id: 'file',
      label: 'Importer une image',
      type: 'file',
      accept: 'image/*',
      required: false
    },
    {
      id: 'name',
      label: 'Nom de l\'image',
      type: 'text',
      placeholder: 'Ex: Photo de vacances, Logo, Icône...',
      required: true
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

  // Define buttons for the GenericModal
  const buttons: ModalButton[] = [
    {
      label: 'Créer l\'image',
      variant: 'default',
      onClick: handleCreateImage,
      disabled: !imageName.trim() || (!selectedFile && !imageSrc)
    }
  ];

  // Custom content for folder tree selector and image preview
  const customContent = (
    <div className="space-y-4">
      {/* Folder Tree Selector */}
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

      {/* Image Preview and Cropping */}
      {showCrop && imageSrc && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Aperçu et recadrage</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={zoomIn} title="Zoom avant">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={zoomOut} title="Zoom arrière">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={rotateImage} title="Rotation 90°">
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowCrop(false)} title="Fermer le recadrage">
                <CropIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-muted/50 relative" style={{ height: '400px' }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              rotation={imageRotation}
              zoom={imageScale}
              aspect={undefined}
              onCropChange={setCrop}
              onCropComplete={(_, croppedAreaPixels) => {
                setCompletedCrop(croppedAreaPixels);
              }}
              onZoomChange={setImageScale}
              onRotationChange={setImageRotation}
              cropShape="rect"
              showGrid={true}
              style={{
                containerStyle: {
                  width: '100%',
                  height: '100%',
                  background: '#333',
                },
              }}
            />
          </div>

          {completedCrop && (
            <div className="text-sm text-muted-foreground">
              Zone sélectionnée: {Math.round(completedCrop.width || 0)} x {Math.round(completedCrop.height || 0)} pixels
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
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
  );
}
