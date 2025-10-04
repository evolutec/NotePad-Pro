import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCw, Download, X } from "lucide-react";

export interface ImageViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imagePath: string;
  imageName: string;
  imageType: string;
}

export function ImageViewer({ open, onOpenChange, imagePath, imageName, imageType }: ImageViewerProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && imagePath) {
      loadImage();
    }
  }, [open, imagePath]);

  const loadImage = async () => {
    try {
      setError(null);
      console.log('Loading image:', imagePath, 'Type:', imageType);

      // Always use Electron API to read the file
      if (window.electronAPI?.readFile) {
        console.log('Using Electron readFile API...');
        const result = await window.electronAPI.readFile(imagePath);
        console.log('readFile result:', result);

        if (result.success && result.data) {
          console.log('Data type:', typeof result.data, 'Length:', result.data.length);

          if (typeof result.data === 'string') {
            // Check if it's base64 data from Electron API
            if (result.data.startsWith('data:') || result.data.startsWith('http')) {
              console.log('Using data URL directly');
              setImageSrc(result.data);
            } else {
              // Assume it's base64 data from Electron API
              console.log('Converting base64 string to data URL');
              try {
                const mimeType = getMimeType(imageType);
                const dataUrl = `data:${mimeType};base64,${result.data}`;
                console.log('Created data URL from base64:', dataUrl.substring(0, 50) + '...');
                setImageSrc(dataUrl);
              } catch (conversionError) {
                console.error('Error creating data URL from base64:', conversionError);
                setError("Erreur lors de la conversion de l'image");
              }
            }
          } else {
            // For binary data, create a blob
            console.log('Creating blob from binary data');
            try {
              const mimeType = getMimeType(imageType);
              console.log('Creating blob with MIME type:', mimeType);

              // Ensure result.data is treated as binary data
              let binaryData: ArrayBuffer;
              if (result.data && typeof result.data === 'object' && (result.data as any) instanceof ArrayBuffer) {
                binaryData = result.data as ArrayBuffer;
              } else if (result.data && typeof result.data === 'object' && 'buffer' in result.data) {
                // Handle Uint8Array-like objects
                const uint8Array = result.data as Uint8Array;
                binaryData = uint8Array.buffer.slice(uint8Array.byteOffset, uint8Array.byteOffset + uint8Array.byteLength) as ArrayBuffer;
              } else {
                // Convert other formats to ArrayBuffer
                const uint8Array = new Uint8Array(result.data as any);
                binaryData = uint8Array.buffer as ArrayBuffer;
              }

              const blob = new Blob([binaryData], { type: mimeType });
              const blobUrl = URL.createObjectURL(blob);
              console.log('Created blob URL:', blobUrl);
              setImageSrc(blobUrl);
            } catch (blobError) {
              console.error('Error creating blob:', blobError);
              setError("Erreur lors de la création du blob");
            }
          }
        } else {
          console.error('readFile failed:', result.error);
          setError(result.error || "Erreur lors du chargement de l'image");
        }
      } else {
        console.error('Electron API not available - cannot load local images');
        setError("API Electron non disponible. Lancez l'application avec 'npm run electron'");
      }
    } catch (err) {
      console.error('Error loading image:', err);
      setError("Erreur lors du chargement de l'image");
    }
  };

  const getMimeType = (type: string): string => {
    const mimeTypes: { [key: string]: string } = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'ico': 'image/x-icon',
      'pdf': 'application/pdf'
    };
    return mimeTypes[type.toLowerCase()] || 'image/png';
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = async () => {
    try {
      // For now, just copy the image path to clipboard or show a message
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(imagePath);
        alert('Chemin de l\'image copié dans le presse-papiers');
      } else {
        alert('Téléchargement non disponible. Chemin: ' + imagePath);
      }
    } catch (err) {
      console.error('Error with download:', err);
      alert('Erreur lors du téléchargement');
    }
  };

  const resetView = () => {
    setZoom(1);
    setRotation(0);
  };

  if (!open) return null;

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header with controls */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <span className="text-lg">📷</span>
          <h2 className="text-lg font-semibold">{imageName}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut} title="Zoom arrière">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-mono min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn} title="Zoom avant">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleRotate} title="Rotation 90°">
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} title="Télécharger">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetView} title="Réinitialiser">
            <span className="text-xs">↻</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} title="Fermer">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image container - takes all available space */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg overflow-hidden">
          {error ? (
            <div className="flex items-center justify-center h-full text-red-500">
              <div className="text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-lg font-semibold">Erreur de chargement</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {error || "Impossible de charger l'image"}
                </p>
              </div>
            </div>
          ) : imageSrc ? (
            <img
              src={imageSrc}
              alt={imageName}
              onError={() => {
                console.error('Image failed to load:', imageSrc);
                setError("Impossible de charger l'image");
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', imageSrc);
              }}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                transition: 'transform 0.2s ease-in-out'
              }}
              className="rounded"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl mb-4 animate-spin">⏳</div>
                <p className="text-lg">Chargement de l'image...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer with image info */}
      <div className="p-4 border-t bg-card">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Type: {imageType.toUpperCase()}</span>
          <span>Rotation: {rotation}°</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
