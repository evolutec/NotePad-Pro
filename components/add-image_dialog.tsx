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
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, width: 50, height: 50, unit: '%' });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageScale, setImageScale] = useState(1);

  // Drag and drop states for manual crop manipulation
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<{ x: number; y: number; width?: number; height?: number }>({ x: 0, y: 0 });

  // Resize states
  const [resizeWidth, setResizeWidth] = useState<string>("");
  const [resizeHeight, setResizeHeight] = useState<string>("");
  const [aspectRatioLocked, setAspectRatioLocked] = useState(true);
  const [originalImageDimensions, setOriginalImageDimensions] = useState<{width: number, height: number} | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (window.electronAPI?.foldersScan) {
      window.electronAPI.foldersScan().then((scannedFolders: any[]) => {
        setExistingFolders(scannedFolders);
      });
    }
  }, [open]);

  // Global mouse event handlers for resize operations
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && showCrop && completedCrop) {
        console.log('🖱️ Global mouse move - Processing resize, clientX:', e.clientX, 'clientY:', e.clientY);
        handleCropResizeMove(e);
      } else if (isDragging) {
        console.log('🖱️ Global mouse move - Missing conditions:', {
          isDragging,
          showCrop,
          completedCrop: completedCrop ? 'exists' : 'null'
        });
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        console.log('🖱️ Global mouse up - Stopped dragging at:', e.clientX, e.clientY);
        setIsDragging(false);
      }
    };

    if (isDragging) {
      console.log('🖱️ Adding global mouse listeners for resize operation');
      console.log('🖱️ Current state:', {
        isDragging,
        showCrop,
        completedCrop: completedCrop ? 'exists' : 'null'
      });

      // Try multiple approaches to ensure event listeners work
      try {
        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);
        document.body.style.userSelect = 'none';
        console.log('✅ Global event listeners added successfully');
      } catch (error) {
        console.error('❌ Failed to add global event listeners:', error);
      }
    } else {
      document.body.style.userSelect = 'auto';
    }

    return () => {
      console.log('🖱️ Removing global mouse listeners');
      try {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.body.style.userSelect = 'auto';
        console.log('✅ Global event listeners removed successfully');
      } catch (error) {
        console.error('❌ Failed to remove global event listeners:', error);
      }
    };
  }, [isDragging, showCrop, completedCrop]);

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
      setCrop({ x: 0, y: 0, width: 50, height: 50, unit: '%' });
      setCompletedCrop(null);
      setShowCrop(false);
      setImageRotation(0);
      setImageScale(1);
      setResizeWidth("");
      setResizeHeight("");
      setAspectRatioLocked(true);
      setOriginalImageDimensions(null);
    }
  }, [open]);

  // Reset cropping when new file is selected
  useEffect(() => {
    if (selectedFile) {
      setCrop({ x: 0, y: 0, width: 50, height: 50, unit: '%' });
      setCompletedCrop(null);
      setImageRotation(0);
      setImageScale(1);
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
            setShowCrop(true);
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
  const resetZoom = () => {
    console.log('🔍 ZOOM RESET BUTTON CLICKED - Current scale:', imageScale);
    setImageScale(1);
    console.log('🔍 Zoom reset to 1x');
  };

  // Mouse event handlers for crop rectangle
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!showCrop) return;

    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x: startX, y: startY });
    setCropStart({ x: crop.x, y: crop.y });
    console.log('🖱️ Mouse down - Start dragging crop rectangle at:', { x: startX, y: startY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !showCrop) return;

    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Calculate delta based on mouse movement
    const deltaX = (currentX - dragStart.x);
    const deltaY = (currentY - dragStart.y);

    // Apply delta to crop position
    const newX = Math.max(0, Math.min(cropStart.x + deltaX, 500 - (completedCrop?.width || 200)));
    const newY = Math.max(0, Math.min(cropStart.y + deltaY, 350 - (completedCrop?.height || 150)));

    setCrop({ ...crop, x: newX, y: newY });

    if (completedCrop) {
      setCompletedCrop({
        ...completedCrop,
        x: newX,
        y: newY
      });
    }

    console.log('🖱️ Mouse move - Delta:', { x: deltaX, y: deltaY }, 'New position:', { x: Math.round(newX), y: Math.round(newY) });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDragging) {
      setIsDragging(false);
      console.log('🖱️ Mouse up - Stopped dragging');
    }
  };

  // Handle crop rectangle resizing
  const handleCropResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    if (!completedCrop || !showCrop) return;

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setCropStart({
      x: completedCrop.x,
      y: completedCrop.y,
      width: completedCrop.width,
      height: completedCrop.height
    });
    (setDragStart as any).currentDirection = direction;
    console.log('🔧 Resize start - Direction:', direction);
  };

  const handleCropResizeMove = (e: MouseEvent) => {
    if (!isDragging || !completedCrop || !showCrop) return;

    const target = e.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const direction = (dragStart as any).currentDirection;

    if (!direction || !cropStart.width || !cropStart.height) return;

    // Calculate mouse movement relative to preview container
    const deltaX = currentX - dragStart.x;
    const deltaY = currentY - dragStart.y;

    let newWidth = completedCrop.width;
    let newHeight = completedCrop.height;
    let newX = completedCrop.x;
    let newY = completedCrop.y;

    switch (direction) {
      case 'top-left':
        newWidth = Math.max(50, cropStart.width - deltaX);
        newHeight = Math.max(50, cropStart.height - deltaY);
        newX = cropStart.x + (cropStart.width - newWidth);
        newY = cropStart.y + (cropStart.height - newHeight);
        break;
      case 'top-right':
        newWidth = Math.max(50, cropStart.width + deltaX);
        newHeight = Math.max(50, cropStart.height - deltaY);
        newY = cropStart.y + (cropStart.height - newHeight);
        break;
      case 'bottom-left':
        newWidth = Math.max(50, cropStart.width - deltaX);
        newHeight = Math.max(50, cropStart.height + deltaY);
        newX = cropStart.x + (cropStart.width - newWidth);
        break;
      case 'bottom-right':
        newWidth = Math.max(50, cropStart.width + deltaX);
        newHeight = Math.max(50, cropStart.height + deltaY);
        break;
    }

    // Ensure crop stays within bounds
    newX = Math.max(0, Math.min(newX, 500 - newWidth));
    newY = Math.max(0, Math.min(newY, 350 - newHeight));

    setCrop({ ...crop, x: newX, y: newY, width: newWidth, height: newHeight });
    setCompletedCrop({ x: newX, y: newY, width: newWidth, height: newHeight, unit: 'px' });

    console.log('📏 Crop resize - Direction:', direction, 'Mouse position:', { x: currentX, y: currentY }, 'Delta:', { x: deltaX, y: deltaY }, 'New dimensions:', {
      x: Math.round(newX),
      y: Math.round(newY),
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    });
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
      id: 'type',
      label: 'Type d\'image',
      type: 'custom',
      content: (
        <div className="grid grid-cols-3 gap-2">
          {/* PNG Card */}
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              imageType === 'png'
                ? 'ring-2 ring-green-500 bg-green-50 border-green-200'
                : 'hover:bg-gray-50 border-gray-200'
            }`}
            onClick={() => setImageType('png')}
          >
            <CardContent className="p-3 text-center">
              <div className="flex flex-col items-center gap-1">
                <FileImage className={`w-4 h-4 ${imageType === 'png' ? 'text-green-600' : 'text-gray-600'}`} />
                <div>
                  <div className={`font-medium text-sm ${imageType === 'png' ? 'text-green-900' : 'text-gray-900'}`}>
                    PNG
                  </div>
                  <div className={`text-xs ${imageType === 'png' ? 'text-green-700' : 'text-gray-600'}`}>
                    Qualité maximale
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* JPEG Card */}
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              imageType === 'jpg'
                ? 'ring-2 ring-green-500 bg-green-50 border-green-200'
                : 'hover:bg-gray-50 border-gray-200'
            }`}
            onClick={() => setImageType('jpg')}
          >
            <CardContent className="p-3 text-center">
              <div className="flex flex-col items-center gap-1">
                <Image className={`w-4 h-4 ${imageType === 'jpg' ? 'text-green-600' : 'text-gray-600'}`} />
                <div>
                  <div className={`font-medium text-sm ${imageType === 'jpg' ? 'text-green-900' : 'text-gray-900'}`}>
                    JPEG
                  </div>
                  <div className={`text-xs ${imageType === 'jpg' ? 'text-green-700' : 'text-gray-600'}`}>
                    Taille réduite
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SVG Card */}
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              imageType === 'svg'
                ? 'ring-2 ring-green-500 bg-green-50 border-green-200'
                : 'hover:bg-gray-50 border-gray-200'
            }`}
            onClick={() => setImageType('svg')}
          >
            <CardContent className="p-3 text-center">
              <div className="flex flex-col items-center gap-1">
                <Palette className={`w-4 h-4 ${imageType === 'svg' ? 'text-green-600' : 'text-gray-600'}`} />
                <div>
                  <div className={`font-medium text-sm ${imageType === 'svg' ? 'text-green-900' : 'text-gray-900'}`}>
                    SVG
                  </div>
                  <div className={`text-xs ${imageType === 'svg' ? 'text-green-700' : 'text-gray-600'}`}>
                    Vectoriel
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
      <div>isDragging: {isDragging ? '🖱️ true' : '❌ false'}</div>
    </div>
  ) : null;

  // Custom content for image preview and cropping - Show placeholder before file selection
  const customContent = (
    <div className="space-y-4 mt-6">
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
          {debugInfo}
        </div>
      )}

      {/* Image Preview Section - Show immediately after file selection */}
      {selectedFile && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Aperçu et modification de l'image
            </Label>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </div>
          </div>

          {/* React Easy Crop Component */}
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-gray-300 shadow-lg" style={{ width: '500px', height: '350px' }}>
              {imageSrc ? (
                <ReactCrop
                  crop={crop}
                  onChange={(pixelCrop, percentCrop) => {
                    console.log('📐 Crop changed - Pixel:', pixelCrop, 'Percent:', percentCrop);
                    setCrop(pixelCrop);
                  }}
                  onComplete={(pixelCrop, percentCrop) => {
                    console.log('✅ Crop completed - Pixel:', pixelCrop, 'Percent:', percentCrop);
                    setCompletedCrop(pixelCrop);
                  }}
                  minWidth={50}
                  minHeight={50}
                  keepSelection={true}
                  ruleOfThirds={true}
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Crop"
                    className="max-w-full max-h-full object-contain"
                    style={{
                      transform: `rotate(${imageRotation}deg) scale(${imageScale})`,
                    }}
                  />
                </ReactCrop>
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

          {/* Crop Controls */}
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Outils de recadrage
            </Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🔧 Toggle crop button clicked, current showCrop:', showCrop);
                  setShowCrop(!showCrop);
                }}
                title={showCrop ? "Désactiver le recadrage" : "Activer le recadrage"}
                className="h-8 px-2"
              >
                <CropIcon className="h-4 w-4 mr-1" />
                {showCrop ? 'Désactiver' : 'Activer'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🎯 Center button clicked');
                  setCrop({ x: 25, y: 25, width: 50, height: 50, unit: '%' });
                  setCompletedCrop({ x: 25, y: 25, width: 50, height: 50, unit: '%' });
                }}
                title="Sélectionner la zone centrale"
                className="h-8 px-2"
              >
                Centrer
              </Button>
            </div>
          </div>

          {/* Zoom Controls - Always visible when file is selected */}
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Outils de zoom
            </Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🔍 Zoom IN button clicked, current scale:', imageScale);
                  zoomIn();
                }}
                title="Zoomer (Ctrl++)"
                className="h-8 px-2"
              >
                <ZoomIn className="h-4 w-4 mr-1" />
                Zoom +
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🔍 Zoom OUT button clicked, current scale:', imageScale);
                  zoomOut();
                }}
                title="Dézoomer (Ctrl+-)"
                className="h-8 px-2"
              >
                <ZoomOut className="h-4 w-4 mr-1" />
                Zoom -
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🔍 Zoom RESET button clicked, current scale:', imageScale);
                  resetZoom();
                }}
                title="Réinitialiser le zoom à 100%"
                className="h-8 px-2"
              >
                🔍 1:1
              </Button>
            </div>
          </div>

          {/* Crop Dimensions Display */}
          {completedCrop && (
            <div className="text-sm text-gray-600 dark:text-gray-400 text-center mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
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
        </div>
      )}

      {/* Resize Controls - Show immediately after file selection */}
      {selectedFile && originalImageDimensions && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-3">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Redimensionner l'image
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setResizeWidth(originalImageDimensions.width.toString());
                setResizeHeight(originalImageDimensions.height.toString());
              }}
              title="Taille originale"
              className="h-6 px-2 text-xs"
            >
              {originalImageDimensions.width} × {originalImageDimensions.height}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="resize-width" className="text-xs text-gray-600 dark:text-gray-400 w-12">
                Largeur:
              </Label>
              <Input
                id="resize-width"
                type="number"
                value={resizeWidth}
                onChange={(e) => {
                  setResizeWidth(e.target.value);
                  if (aspectRatioLocked && originalImageDimensions) {
                    const newWidth = parseInt(e.target.value) || originalImageDimensions.width;
                    const aspectRatio = originalImageDimensions.width / originalImageDimensions.height;
                    const newHeight = Math.round(newWidth / aspectRatio);
                    setResizeHeight(newHeight.toString());
                  }
                }}
                className="w-20 h-8 text-sm"
                placeholder={originalImageDimensions.width.toString()}
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="resize-height" className="text-xs text-gray-600 dark:text-gray-400 w-12">
                Hauteur:
              </Label>
              <Input
                id="resize-height"
                type="number"
                value={resizeHeight}
                onChange={(e) => {
                  setResizeHeight(e.target.value);
                  if (aspectRatioLocked && originalImageDimensions) {
                    const newHeight = parseInt(e.target.value) || originalImageDimensions.height;
                    const aspectRatio = originalImageDimensions.height / originalImageDimensions.width;
                    const newWidth = Math.round(newHeight / aspectRatio);
                    setResizeWidth(newWidth.toString());
                  }
                }}
                className="w-20 h-8 text-sm"
                placeholder={originalImageDimensions.height.toString()}
              />
            </div>

            <Button
              variant={aspectRatioLocked ? "default" : "outline"}
              size="sm"
              onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
              title={aspectRatioLocked ? "Déverrouiller les proportions" : "Verrouiller les proportions"}
              className="h-8 px-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                {aspectRatioLocked ? (
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                )}
              </svg>
            </Button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Original: {originalImageDimensions.width} × {originalImageDimensions.height} pixels
          </div>
        </div>
      )}



      {/* Help Section - Show when file is selected */}
      {selectedFile && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Astuce:</strong> Utilisez les contrôles de redimensionnement pour définir la taille finale.
            Utilisez les outils de recadrage pour sélectionner la zone souhaitée.
            Tous les changements sont appliqués lors de la création de l'image.
          </p>
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
