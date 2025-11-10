import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react";
import { OnlyOfficeLikeToolbar } from "./ui/onlyoffice-like-toolbar";
import { OnlyOfficeFileMenu } from "./ui/onlyoffice-file-menu";
import { ImageHomeToolbar } from "./image-home-toolbar";
import { ImageAdjustmentToolbar } from "./image-adjustment-toolbar";
import { ImageViewToolbar } from "./image-view-toolbar";

export interface ImageViewerProps {
  imagePath: string;
  imageName: string;
  imageType: string;
  onRename?: () => void;
}

export function ImageViewer({ imagePath, imageName, imageType, onRename }: ImageViewerProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Accueil");
  
  // Adjustment states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [currentFilter, setCurrentFilter] = useState("none");
  
  // View states
  const [showGrid, setShowGrid] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [viewTheme, setViewTheme] = useState("auto");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  useEffect(() => {
    if (imagePath) {
      loadImage();
    }
  }, [imagePath]);

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

  const handleRotateCounterClockwise = () => {
    setRotation(prev => (prev - 90 + 360) % 360);
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

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setCurrentFilter("none");
  };

  const getImageStyle = () => {
    const filters = [];
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
    if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
    if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
    
    // Apply selected filter
    if (currentFilter !== "none") {
      switch (currentFilter) {
        case "grayscale":
          filters.push("grayscale(100%)");
          break;
        case "sepia":
          filters.push("sepia(100%)");
          break;
        case "vintage":
          filters.push("sepia(50%) contrast(120%) brightness(90%)");
          break;
        case "vivid":
          filters.push("saturate(150%) contrast(110%)");
          break;
        case "cool":
          filters.push("hue-rotate(180deg) saturate(120%)");
          break;
        case "warm":
          filters.push("hue-rotate(-20deg) saturate(120%)");
          break;
      }
    }

    return {
      transform: `scale(${zoom}) rotate(${rotation}deg)`,
      transformOrigin: 'center',
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain' as const,
      transition: 'transform 0.2s ease-in-out, filter 0.2s ease-in-out',
      filter: filters.length > 0 ? filters.join(' ') : 'none'
    };
  };

  return (
    <div className="w-full h-full flex flex-col bg-background relative">
      <OnlyOfficeLikeToolbar
        key={`toolbar-${imagePath}`}
        tabs={[
          { label: "Fichier" },
          { label: "Accueil" },
          { label: "Ajustements" },
          { label: "Affichage" },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
        }}
      />

      {/* File Menu */}
      {activeTab === "Fichier" && (
        <OnlyOfficeFileMenu
          key={`file-menu-${imagePath}`}
          onClose={() => setActiveTab("Accueil")}
          type="image"
          onExport={(format) => {
            console.log('Exporting image as:', format);
            // TODO: Implement image export
          }}
          onRename={onRename}
        />
      )}

      {/* Conditional Toolbars */}
      {activeTab === "Accueil" && (
        <ImageHomeToolbar
          key={`home-toolbar-${imagePath}`}
          zoom={zoom}
          rotation={rotation}
          onZoomIn={() => setZoom(prev => Math.min(prev + 0.25, 3))}
          onZoomOut={() => setZoom(prev => Math.max(prev - 0.25, 0.25))}
          onZoomReset={resetView}
          onRotateClockwise={handleRotate}
          onRotateCounterClockwise={handleRotateCounterClockwise}
          onDownload={handleDownload}
        />
      )}

      {activeTab === "Ajustements" && (
        <ImageAdjustmentToolbar
          key={`adjustment-toolbar-${imagePath}`}
          brightness={brightness}
          contrast={contrast}
          saturation={saturation}
          onBrightnessChange={setBrightness}
          onContrastChange={setContrast}
          onSaturationChange={setSaturation}
          onFilterApply={setCurrentFilter}
          onReset={resetAdjustments}
        />
      )}

      {activeTab === "Affichage" && (
        <ImageViewToolbar
          key={`view-toolbar-${imagePath}`}
          zoom={zoom}
          onZoomIn={() => setZoom(prev => Math.min(prev + 0.25, 3))}
          onZoomOut={() => setZoom(prev => Math.max(prev - 0.25, 0.25))}
          onZoomReset={resetView}
          showGrid={showGrid}
          onGridToggle={() => setShowGrid(!showGrid)}
          showRuler={showRuler}
          onRulerToggle={() => setShowRuler(!showRuler)}
          theme={viewTheme}
          onThemeChange={setViewTheme}
          backgroundColor={backgroundColor}
          onBackgroundColorChange={setBackgroundColor}
        />
      )}

      {/* Image container - takes all available space */}
      <div className="flex-1 overflow-hidden" style={{ backgroundColor }}>
        <div className="flex items-center justify-center h-full w-full relative">
          {/* Grid overlay */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(128,128,128,0.2) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(128,128,128,0.2) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px'
              }}
            />
          )}
          
          {/* Ruler overlays */}
          {showRuler && (
            <>
              <div className="absolute top-0 left-0 right-0 h-6 bg-muted border-b flex items-center text-xs text-muted-foreground">
                <div className="w-full h-full relative">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-l border-muted-foreground/30"
                      style={{ left: `${i * 5}%` }}
                    >
                      <span className="absolute top-0 left-1 text-[10px]">{i * 5}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-muted border-r flex flex-col items-center text-xs text-muted-foreground">
                <div className="h-full w-full relative">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0 border-t border-muted-foreground/30"
                      style={{ top: `${i * 5}%` }}
                    >
                      <span className="absolute left-0 top-1 text-[10px] -rotate-90 origin-top-left">{i * 5}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
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
              style={getImageStyle()}
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
    </div>
  );
}
