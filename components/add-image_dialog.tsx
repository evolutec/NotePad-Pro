import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon, Folder, Home, FileImage, Image, Palette, Crop as CropIcon, ZoomIn, ZoomOut } from "lucide-react";
import ReactCrop, { type Crop } from "react-image-crop";
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
  const [crop, setCrop] = useState<Crop | undefined>(undefined);
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageScale, setImageScale] = useState(1);

  // Image position and drag states
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imagePositionStart, setImagePositionStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Resize states
  const [resizeWidth, setResizeWidth] = useState<string>("");
  const [resizeHeight, setResizeHeight] = useState<string>("");
  const [aspectRatioLocked, setAspectRatioLocked] = useState(true);
  const [originalImageDimensions, setOriginalImageDimensions] = useState<{width: number, height: number} | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);

  // Handle image dragging
  const handleImageMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging when crop is not active or when clicking outside crop area
    if (showCrop) return;
    
    e.preventDefault();
    setIsDraggingImage(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setImagePositionStart({ x: imagePosition.x, y: imagePosition.y });
  };

  // Global mouse move and up handlers for image dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingImage) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setImagePosition({
        x: imagePositionStart.x + deltaX,
        y: imagePositionStart.y + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDraggingImage(false);
    };

    if (isDraggingImage) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingImage, dragStart, imagePositionStart]);

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
      setImageName("");
      setImageType("png");
      setTags([]);
      setCurrentTag("");
      setSelectedFile(null);
      setImageSrc(null);
      setCrop(undefined);
      setCompletedCrop(null);
      setShowCrop(false);
      setImageRotation(0);
      setImageScale(1);
      setResizeWidth("");
      setResizeHeight("");
      setAspectRatioLocked(true);
      setOriginalImageDimensions(null);
      setCreationError(null);
      setCreationSuccess(null);
      setImagePosition({ x: 0, y: 0 });
      setIsDraggingImage(false);
    }
  }, [open]);

  // Reset cropping when new file is selected
  useEffect(() => {
    if (selectedFile) {
      setCrop(undefined);
      setCompletedCrop(null);
      setImageRotation(0);
      setImageScale(1);
      setShowCrop(false);
      setImagePosition({ x: 0, y: 0 });
    }
  }, [selectedFile]);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    console.log('🔍 FILE INPUT TRIGGERED - Starting file selection process');

    try {
      const event = e as React.ChangeEvent<HTMLInputElement>;
      const fileInput = event.target as HTMLInputElement;
      const file = fileInput.files?.[0];

      console.log('📁 File input details:', {
        filesLength: fileInput.files?.length || 0,
        file: file ? {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified
        } : null
      });

      if (!file) {
        console.log('❌ No file selected');
        setSelectedFile(null);
        setImageSrc(null);
        setOriginalImageDimensions(null);
        setResizeWidth("");
        setResizeHeight("");
        return;
      }

      if (!file.type.startsWith('image/')) {
        console.log('❌ Invalid file type:', file.type);
        setCreationError("Veuillez sélectionner un fichier image valide.");
        setSelectedFile(null);
        setImageSrc(null);
        setOriginalImageDimensions(null);
        return;
      }

      console.log('✅ Valid image file selected:', file.name);

      // Set selectedFile FIRST for immediate UI feedback
      setSelectedFile(file);
      setCreationError(null); // Clear any previous errors
      console.log('✅ selectedFile state updated');

      // Auto-detect image type from file extension
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const extensionToType: { [key: string]: string } = {
        'png': 'png',
        'jpg': 'jpg',
        'jpeg': 'jpg',
        'svg': 'svg',
        'gif': 'gif',
        'webp': 'webp'
      };

      const detectedType = extensionToType[fileExtension || ''] || 'png';
      setImageType(detectedType);
      console.log('✅ Image type detected and set:', detectedType);

      // Use FileReader to create data URL for preview
      console.log('📖 Starting FileReader...');
      const reader = new FileReader();

      reader.onload = (readerEvent) => {
        try {
          const result = readerEvent.target?.result as string;
          console.log('✅ FileReader completed, data URL length:', result?.length || 0);

          if (!result) {
            throw new Error('FileReader returned empty result');
          }

          setImageSrc(result);
          console.log('✅ imageSrc state updated');

          // Get image dimensions for resize controls
          console.log('📏 Getting image dimensions...');
          const imgElement = document.createElement('img');

          imgElement.onload = () => {
            const dimensions = {
              width: imgElement.naturalWidth,
              height: imgElement.naturalHeight
            };
            console.log('✅ Image dimensions loaded:', dimensions);

            setOriginalImageDimensions(dimensions);
            setResizeWidth(dimensions.width.toString());
            setResizeHeight(dimensions.height.toString());
            console.log('✅ All states updated successfully');
          };

          imgElement.onerror = (error) => {
            console.error('❌ Failed to load image for dimensions:', error);
            // Set fallback dimensions
            setOriginalImageDimensions({ width: 800, height: 600 });
            setResizeWidth("800");
            setResizeHeight("600");
            setShowCrop(true);
          };

          imgElement.src = result;
        } catch (error) {
          console.error('❌ Error in FileReader onload:', error);
          setCreationError("Erreur lors du traitement de l'image.");
          setSelectedFile(null);
          setImageSrc(null);
          setOriginalImageDimensions(null);
        }
      };

      reader.onerror = (error) => {
        console.error('❌ FileReader error:', error);
        setCreationError("Erreur lors de la lecture du fichier.");
        setSelectedFile(null);
        setImageSrc(null);
        setOriginalImageDimensions(null);
      };

      reader.readAsDataURL(file);
      console.log('🚀 FileReader started for:', file.name);

    } catch (error) {
      console.error('❌ Unexpected error in handleFileChange:', error);
      setCreationError("Erreur inattendue lors de la sélection du fichier.");
      setSelectedFile(null);
      setImageSrc(null);
      setOriginalImageDimensions(null);
    }
  };

  // Handle crop completion
  const onCropComplete = (crop: Crop) => {
    setCompletedCrop(crop);
  };

  // Rotate image
  const rotateImage = () => {
    setImageRotation((prev) => (prev + 90) % 360);
  };

  // Zoom image (with proper scaling)
  const zoomIn = () => {
    console.log('🔍 ZOOM IN BUTTON CLICKED - Current scale:', imageScale);
    setImageScale(prev => {
      const newScale = Math.min(prev + 0.25, 3);
      console.log('🔍 Zoom in - Previous:', prev, 'New:', newScale);
      return newScale;
    });
  };

  const zoomOut = () => {
    console.log('🔍 ZOOM OUT BUTTON CLICKED - Current scale:', imageScale);
    setImageScale(prev => {
      const newScale = Math.max(prev - 0.25, 0.25);
      console.log('🔍 Zoom out - Previous:', prev, 'New:', newScale);
      return newScale;
    });
  };

  // Reset zoom to 1x
  // Reset zoom to 1x
  const resetZoom = () => {
    console.log('🔍 ZOOM RESET BUTTON CLICKED - Current scale:', imageScale);
    setImageScale(1);
    console.log('🔍 Zoom reset to 1x');
  };

  // Calculate display dimensions for the image
  const getImageDisplayDimensions = () => {
    if (!originalImageDimensions) return { width: 700, height: 450 };

    const containerWidth = 700;
    const containerHeight = 450;
    const imageRatio = originalImageDimensions.width / originalImageDimensions.height;
    const containerRatio = containerWidth / containerHeight;

    let displayWidth, displayHeight;

    if (imageRatio > containerRatio) {
      // Image is wider than container
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageRatio;
    } else {
      // Image is taller than container
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageRatio;
    }

    return { width: displayWidth, height: displayHeight };
  };

  const handleCreateImage = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!imageName.trim()) return;

    try {
      let imageData: string | ArrayBuffer | null = null;

      // If we have a selected file, process it
      if (selectedFile && imgRef.current) {
        try {
          const img = imgRef.current;
          
          // Create canvas for processing
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }

          // Calculate pixel crop values from percent/pixel crop
          const scaleX = img.naturalWidth / img.width;
          const scaleY = img.naturalHeight / img.height;
          
          let pixelCrop = {
            x: 0,
            y: 0,
            width: img.naturalWidth,
            height: img.naturalHeight
          };

          // Apply crop if specified
          if (completedCrop && completedCrop.width && completedCrop.height) {
            if (completedCrop.unit === '%') {
              pixelCrop = {
                x: (completedCrop.x / 100) * img.naturalWidth,
                y: (completedCrop.y / 100) * img.naturalHeight,
                width: (completedCrop.width / 100) * img.naturalWidth,
                height: (completedCrop.height / 100) * img.naturalHeight
              };
            } else {
              pixelCrop = {
                x: completedCrop.x * scaleX,
                y: completedCrop.y * scaleY,
                width: completedCrop.width * scaleX,
                height: completedCrop.height * scaleY
              };
            }
          }

          // Determine final dimensions (resize if specified, otherwise use crop dimensions)
          let finalWidth = Math.round(pixelCrop.width);
          let finalHeight = Math.round(pixelCrop.height);

          if (resizeWidth && resizeHeight) {
            const targetWidth = parseInt(resizeWidth);
            const targetHeight = parseInt(resizeHeight);
            if (targetWidth > 0 && targetHeight > 0) {
              finalWidth = targetWidth;
              finalHeight = targetHeight;
            }
          }

          // Set canvas size to final dimensions
          canvas.width = finalWidth;
          canvas.height = finalHeight;

          console.log('Processing image:', {
            originalSize: `${img.naturalWidth}x${img.naturalHeight}`,
            displaySize: `${img.width}x${img.height}`,
            cropArea: completedCrop,
            pixelCrop: pixelCrop,
            finalSize: `${finalWidth}x${finalHeight}`,
            imageType: imageType
          });

          // Clear canvas with transparent background (important for PNG)
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw the cropped and resized image
          ctx.drawImage(
            img,
            pixelCrop.x,      // Source X
            pixelCrop.y,      // Source Y
            pixelCrop.width,  // Source width
            pixelCrop.height, // Source height
            0,                // Destination X
            0,                // Destination Y
            finalWidth,       // Destination width (resized)
            finalHeight       // Destination height (resized)
          );

          // Determine MIME type and quality based on selected image type
          let mimeType = 'image/png';
          let quality = 1.0;

          switch (imageType) {
            case 'jpg':
            case 'jpeg':
              mimeType = 'image/jpeg';
              quality = 0.92; // High quality JPEG
              break;
            case 'png':
              mimeType = 'image/png';
              quality = 1.0;
              break;
            case 'webp':
              mimeType = 'image/webp';
              quality = 0.92;
              break;
            case 'svg':
              // SVG cannot be processed via canvas, use original file
              imageData = await selectedFile.arrayBuffer();
              console.log('SVG file - using original data');
              // Skip canvas conversion for SVG
              if (window.electronAPI?.imageCreate) {
                const finalParentPath = parentId ? (existingFolders.find(f => f.id === parentId)?.path || parentPath) : parentPath;
                const result = await window.electronAPI.imageCreate({
                  name: imageName.trim(),
                  type: imageType,
                  parentPath: finalParentPath,
                  tags,
                  content: imageData,
                  isBinary: true,
                });

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
                if (onRefreshTree) onRefreshTree();
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
              return;
            default:
              mimeType = 'image/png';
              quality = 1.0;
          }

          // Convert canvas to blob with the selected format
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob from processed image'));
              }
            }, mimeType, quality);
          });

          imageData = await blob.arrayBuffer();
          console.log(`Image processed successfully as ${imageType.toUpperCase()}, size:`, imageData.byteLength, 'bytes');

        } catch (processingError) {
          console.error('Image processing error:', processingError);
          setCreationError("Erreur lors du traitement de l'image.");
          return;
        }
      }

      let finalParentPath = parentPath;
      if (parentId) {
        // Find the folder with the matching parentId
        const findFolderPath = (folders: any[], id: string): string | null => {
          for (const folder of folders) {
            if (folder.id === id || folder.path === id) {
              return folder.path || folder.id;
            }
            if (folder.children) {
              const found = findFolderPath(folder.children, id);
              if (found) return found;
            }
          }
          return null;
        };

        const foundPath = findFolderPath(existingFolders, parentId);
        if (foundPath) {
          finalParentPath = foundPath;
        }
      }

      console.log('Final parent path for image creation:', finalParentPath);

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

        // For images, we'll use a simple approach for now
        // In the future, we could extend the API to support file metadata storage
        console.log('✅ Image file created successfully with metadata:', {
          id: newImage.id,
          name: newImage.name,
          type: newImage.type,
          path: result.path,
          parentPath: newImage.parentPath,
          createdAt: newImage.createdAt,
          tags: newImage.tags
        });

        setCreationSuccess("Image créée avec succès !");
        if (onImageCreated) onImageCreated(newImage);
        // Trigger tree refresh
        if (onRefreshTree) {
          onRefreshTree();
        }
        setTimeout(() => {
          // Clear all fields
          setImageName("");
          setImageType("png");
          setTags([]);
          setCurrentTag("");
          setSelectedFile(null);
          setImageSrc(null);
          setCrop(undefined);
          setCompletedCrop(null);
          setShowCrop(false);
          setResizeWidth("");
          setResizeHeight("");
          setOriginalImageDimensions(null);
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
      required: true,
      value: imageName,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setImageName(e.target.value);
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
      label: 'Importer une image',
      type: 'file',
      accept: 'image/*',
      required: false,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        console.log('🔗 GenericModal file input onChange triggered');
        console.log('Event type:', e.type);
        console.log('Target type:', (e.target as any)?.type);
        console.log('Target files:', (e.target as any)?.files?.length || 0);
        handleFileChange(e);
      }
    },

    {
      id: 'tags',
      label: 'Étiquettes',
      type: 'tags',
      placeholder: 'Ajouter une étiquette...',
      required: false
    }
  ];

  // Debug info - only show in development
  const debugInfo = process.env.NODE_ENV === 'development' ? (
    <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
      <div><strong>🔧 Debug Info:</strong></div>
      <div>selectedFile: {selectedFile ? `✅ ${selectedFile.name}` : '❌ null'}</div>
      <div>imageSrc: {imageSrc ? '✅ loaded' : '❌ null'}</div>
      <div>imageName: "{imageName}" {imageName.trim() ? '✅' : '❌'}</div>
      <div>imageType: {imageType}</div>
      <div>originalImageDimensions: {originalImageDimensions ? `✅ ${originalImageDimensions.width}x${originalImageDimensions.height}` : '❌ null'}</div>
      <div>resizeTarget: {resizeWidth && resizeHeight ? `${resizeWidth}x${resizeHeight}` : 'none'}</div>
      <div>Button enabled: {!imageName.trim() ? '❌ DISABLED' : '✅ ENABLED'}</div>
      <div>showCrop: {showCrop ? '✅ true' : '❌ false'}</div>
      <div>crop: {crop ? `📍 ${Math.round(crop.x)}, ${Math.round(crop.y)}, ${Math.round(crop.width || 0)}x${Math.round(crop.height || 0)}` : '❌ null'}</div>
      <div>completedCrop: {completedCrop ? `📐 ${Math.round(completedCrop.x)}, ${Math.round(completedCrop.y)}, ${Math.round(completedCrop.width)}x${Math.round(completedCrop.height)} (${completedCrop.unit})` : '❌ null'}</div>
      <div>imageScale: 🔍 {imageScale.toFixed(2)}x</div>
      <div>imageRotation: 🔄 {imageRotation}°</div>
      <div>isDraggingImage: {isDraggingImage ? '🖱️ true' : '❌ false'}</div>
      <div>imagePosition: 📍 {imagePosition.x}, {imagePosition.y}</div>
    </div>
  ) : null;

  // Custom content for image preview and cropping - Large preview with controls below
  const customContent = (
    <div className="space-y-4 mt-4">
      {/* Instructions when no file is selected */}
      {!selectedFile && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
          <ImageIcon className="h-12 w-12 text-blue-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Sélectionnez une image pour commencer
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Après avoir sélectionné une image, vous pourrez la redimensionner et la recadrer selon vos besoins.
          </p>
        </div>
      )}

      {/* Large Image Preview - Show immediately after file selection */}
      {selectedFile && (
        <div className="space-y-4">
          {/* Large Preview Area */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Aperçu et modification de l'image
              </Label>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </div>
            </div>

            {/* Large Image Preview */}
            <div className="flex justify-center mb-4">
              <div 
                ref={previewContainerRef}
                className="bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-gray-300 shadow-lg overflow-hidden relative" 
                style={{ width: '700px', height: '450px' }}
              >
                {imageSrc ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: `translate(calc(-50% + ${imagePosition.x}px), calc(-50% + ${imagePosition.y}px))`,
                      cursor: showCrop ? 'default' : (isDraggingImage ? 'grabbing' : 'grab'),
                    }}
                    onMouseDown={handleImageMouseDown}
                  >
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      onComplete={(c) => setCompletedCrop(c)}
                      disabled={!showCrop}
                      style={{ 
                        maxWidth: 'none',
                        maxHeight: 'none',
                        overflow: 'visible'
                      }}
                    >
                      <img
                        ref={imgRef}
                        src={imageSrc}
                        alt="Preview"
                        draggable={false}
                        style={{
                          transform: `rotate(${imageRotation}deg) scale(${imageScale})`,
                          transformOrigin: 'center center',
                          width: `${getImageDisplayDimensions().width}px`,
                          height: `${getImageDisplayDimensions().height}px`,
                          display: 'block',
                          pointerEvents: showCrop ? 'none' : 'auto',
                        }}
                      />
                    </ReactCrop>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
                      <p className="text-sm">Chargement...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Help text */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="text-blue-500 mt-0.5">ℹ️</div>
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p><strong>Déplacer l'image :</strong> Cliquez et faites glisser l'image quand le recadrage est inactif</p>
                <p><strong>Recadrer :</strong> Activez le recadrage, puis déplacez et redimensionnez le rectangle de sélection</p>
                <p><strong>Zoomer :</strong> Utilisez les boutons + et - pour ajuster le zoom de l'image</p>
              </div>
            </div>
          </div>

          {/* All Controls Below Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Crop Controls */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded border">
              <Label className="text-sm font-semibold mb-2 block">Recadrage</Label>
              <div className="space-y-2">
                <Button
                  variant={showCrop ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowCrop(!showCrop)}
                  className="w-full h-8 text-xs"
                >
                  <CropIcon className="h-3 w-3 mr-1" />
                  {showCrop ? 'Actif' : 'Inactif'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCrop({ x: 25, y: 25, width: 50, height: 50, unit: '%' });
                    setCompletedCrop({ x: 25, y: 25, width: 50, height: 50, unit: '%' });
                    setShowCrop(true);
                  }}
                  disabled={!showCrop}
                  className="w-full h-8 text-xs"
                >
                  Centrer
                </Button>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded border">
              <Label className="text-sm font-semibold mb-2 block">Zoom & Position</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={zoomOut} disabled={imageScale <= 0.25} className="h-8 w-8 p-0">
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                  <span className="text-sm flex-1 text-center font-medium">{Math.round(imageScale * 100)}%</span>
                  <Button variant="outline" size="sm" onClick={zoomIn} disabled={imageScale >= 3} className="h-8 w-8 p-0">
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={resetZoom} className="w-full h-8 text-xs">
                  Zoom 1:1
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setImagePosition({ x: 0, y: 0 })} 
                  disabled={imagePosition.x === 0 && imagePosition.y === 0}
                  className="w-full h-8 text-xs"
                >
                  Réinitialiser Position
                </Button>
              </div>
            </div>

            {/* Resize Controls */}
            {originalImageDimensions && (
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <Label className="text-sm font-semibold mb-2 block">Dimensions</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-12">L:</Label>
                    <Input
                      type="number"
                      value={resizeWidth}
                      onChange={(e) => {
                        setResizeWidth(e.target.value);
                        if (aspectRatioLocked && originalImageDimensions) {
                          const newWidth = parseInt(e.target.value) || originalImageDimensions.width;
                          const aspectRatio = originalImageDimensions.width / originalImageDimensions.height;
                          setResizeHeight(Math.round(newWidth / aspectRatio).toString());
                        }
                      }}
                      className="h-8 text-sm"
                      placeholder={originalImageDimensions.width.toString()}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-12">H:</Label>
                    <Input
                      type="number"
                      value={resizeHeight}
                      onChange={(e) => {
                        setResizeHeight(e.target.value);
                        if (aspectRatioLocked && originalImageDimensions) {
                          const newHeight = parseInt(e.target.value) || originalImageDimensions.height;
                          const aspectRatio = originalImageDimensions.height / originalImageDimensions.width;
                          setResizeWidth(Math.round(newHeight / aspectRatio).toString());
                        }
                      }}
                      className="h-8 text-sm"
                      placeholder={originalImageDimensions.height.toString()}
                    />
                  </div>
                  <Button
                    variant={aspectRatioLocked ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
                    className="w-full h-8 text-xs"
                  >
                    {aspectRatioLocked ? '🔒' : '🔓'}
                  </Button>
                </div>
              </div>
            )}

            {/* Image Type Selection */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded border">
              <Label className="text-sm font-semibold mb-2 block">Format</Label>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant={imageType === 'png' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageType('png')}
                  className="h-8 text-xs"
                >
                  <FileImage className="h-3 w-3 mr-1" />
                  PNG
                </Button>
                <Button
                  variant={imageType === 'jpg' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageType('jpg')}
                  className="h-8 text-xs"
                >
                  <Image className="h-3 w-3 mr-1" />
                  JPEG
                </Button>
              </div>
            </div>
          </div>

          {/* Crop Dimensions Display */}
          {completedCrop && completedCrop.width > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400 text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
              Zone sélectionnée: {Math.round(completedCrop.width)} x {Math.round(completedCrop.height)} pixels
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompletedCrop(null)}
                className="ml-2 h-6 px-2 text-xs"
              >
                Effacer
              </Button>
            </div>
          )}

          {/* Help Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Astuce:</strong> Utilisez les contrôles de recadrage pour sélectionner la zone souhaitée.
              Utilisez les contrôles de zoom pour ajuster la vue. Tous les changements sont appliqués lors de la création de l'image.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Define buttons for the GenericModal
  const buttons: ModalButton[] = [
    {
      label: 'Créer l\'image',
      variant: 'default',
      onClick: handleCreateImage,
      disabled: !imageName.trim(),
      loading: false
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
        contentClassName="min-h-0 max-h-[60vh] overflow-y-auto"
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
