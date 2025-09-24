import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, FilePlus, Crop as CropIcon, RotateCw, ZoomIn, ZoomOut, Plus, Minus } from "lucide-react";
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" /> {/* Image icon */}
            Créer une nouvelle image
          </DialogTitle>
          <div className="h-1 w-full bg-green-500 mt-2" /> {/* Green line for images */}
        </DialogHeader>
        <div className="space-y-6">
          {/* Image Upload and Preview Section */}
          <div className="space-y-4">
            <Label htmlFor="image-file">Importer une image</Label>
            <Input
              id="image-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {selectedFile && (
              <div className="text-sm text-muted-foreground">
                Fichier sélectionné: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
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

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="image-name">Nom de l'image</Label>
              <Input
                id="image-name"
                placeholder="Ex: Photo de vacances, Logo, Icône..."
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Dossier parent <span className="text-xs text-muted-foreground">(optionnel)</span></Label>
              <select
                className="w-full border rounded p-2 bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={parentId || ""}
                onChange={(e) => setParentId(e.target.value || undefined)}
              >
                <option value="">Dossier sélectionné par défaut</option>
                {existingFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type d'image</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={imageType === "png" ? "default" : "outline"}
                onClick={() => setImageType("png")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.png</span> PNG
              </Button>
              <Button
                variant={imageType === "jpg" ? "default" : "outline"}
                onClick={() => setImageType("jpg")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.jpg</span> JPG
              </Button>
              <Button
                variant={imageType === "svg" ? "default" : "outline"}
                onClick={() => setImageType("svg")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.svg</span> SVG
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Étiquettes</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une étiquette..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button type="button" onClick={addTag} size="sm" variant="outline">
                Ajouter
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span key={tag} className="bg-muted px-2 py-1 rounded text-xs cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </span>
              ))}
            </div>
          </div>

          {creationError && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded">{creationError}</div>
          )}
          {creationSuccess && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded">{creationSuccess}</div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={handleCreateImage}
              disabled={!imageName.trim() || (!selectedFile && !imageSrc)}
              className="flex-1"
            >
              Créer l'image
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
