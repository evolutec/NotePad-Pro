import React, { useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';

interface PowerPointViewerProps {
  filePath: string;
  fileName: string;
}

interface SlideInfo {
  id: number;
  title: string;
  content: string;
  hasContent: boolean;
  imageUrl?: string; // URL de l'image de la slide
  thumbnailUrl?: string; // URL de la miniature
}

export const PowerPointViewer: React.FC<PowerPointViewerProps> = ({ filePath, fileName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presentationInfo, setPresentationInfo] = useState<any>(null);
  const [slides, setSlides] = useState<SlideInfo[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'slideshow'>('grid'); // grid or slideshow

  useEffect(() => {
    const loadPowerPointFile = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[PowerPointViewer] Starting to load PowerPoint file:', filePath);

        // Load the file via Electron API
        if (typeof window === 'undefined' || !window.electronAPI?.readFile) {
          console.error('[PowerPointViewer] Electron API not available');
          setError('Mode Electron requis');
          setLoading(false);
          return;
        }

        console.log('[PowerPointViewer] Calling electronAPI.readFile...');
        const result = await window.electronAPI.readFile(filePath);
        console.log('[PowerPointViewer] File read result:', result);

        if (!result.success || !result.data) {
          console.error('[PowerPointViewer] Failed to read file:', result.error);
          setError(result.error || 'Erreur lors de la lecture du fichier');
          setLoading(false);
          return;
        }

        const data = result.data as any;
        console.log('[PowerPointViewer] File data type:', typeof data);

        // Convert to ArrayBuffer if needed
        let arrayBuffer: ArrayBuffer;

        if (data && typeof data === 'object' && 'buffer' in data && data.buffer instanceof ArrayBuffer) {
          console.log('[PowerPointViewer] Using data.buffer as ArrayBuffer');
          arrayBuffer = data.buffer as ArrayBuffer;
        } else if (typeof data === 'string') {
          console.log('[PowerPointViewer] Converting base64 string to ArrayBuffer');
          const base64String = data.includes('base64,') ? data.split('base64,')[1] : data;
          const binaryString = atob(base64String);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          arrayBuffer = bytes.buffer as ArrayBuffer;
        } else {
          console.error('[PowerPointViewer] Unsupported data format:', data);
          throw new Error('Format de données non supporté');
        }

        console.log('[PowerPointViewer] ArrayBuffer created, size:', arrayBuffer.byteLength);

        // Check if this is a .ppt or .pptx file
        const isPptx = fileName.toLowerCase().endsWith('.pptx');
        const isPpt = fileName.toLowerCase().endsWith('.ppt');

        if (isPpt) {
          // Handle older .ppt format (binary format, not supported for content extraction)
          const basicInfo = {
            fileName: fileName,
            fileSize: arrayBuffer.byteLength,
            fileType: 'PowerPoint Presentation (Format ancien)',
            slideCount: 'Non determiné',
            title: fileName.replace(/\.ppt$/, ''),
            createdDate: new Date().toLocaleDateString(),
            isOldFormat: true
          };

          setPresentationInfo(basicInfo);
          setSlides([]);
          setLoading(false);
          return;
        }

        // Extract PowerPoint content using JSZip (.pptx files)
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(arrayBuffer);

        console.log('[PowerPointViewer] ZIP contents:', Object.keys(zipContent.files));

        // Extract presentation structure
        const presentationXml = zipContent.file('ppt/presentation.xml');
        const slideMatches = [];

        if (presentationXml) {
          const presentationContent = await presentationXml.async('text');
          console.log('[PowerPointViewer] Presentation XML content preview:', presentationContent.substring(0, 500));

          // Extract slide information from presentation.xml
          const slideRegex = /<p:sldId[^>]*r:id="([^"]+)"/g;
          let match;
          while ((match = slideRegex.exec(presentationContent)) !== null) {
            slideMatches.push(match[1]);
          }
        }

        console.log('[PowerPointViewer] Found slide references:', slideMatches);

        // Extract all images from ppt/media/ folder
        const mediaImages: string[] = [];
        
        // Scan the media folder for all images
        const mediaFiles = Object.keys(zipContent.files).filter(
          filename => filename.startsWith('ppt/media/') && 
          (filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.jpeg') || filename.endsWith('.emf') || filename.endsWith('.wmf'))
        );
        
        console.log('[PowerPointViewer] Found media files:', mediaFiles);
        
        // Extract all media images
        for (const mediaFile of mediaFiles) {
          try {
            const file = zipContent.file(mediaFile);
            if (file) {
              const imageData = await file.async('base64');
              const ext = mediaFile.split('.').pop()?.toLowerCase();
              let mimeType = 'image/png';
              if (ext === 'jpg' || ext === 'jpeg') {
                mimeType = 'image/jpeg';
              } else if (ext === 'emf' || ext === 'wmf') {
                // Skip Windows Metafiles as they're not supported in browsers
                continue;
              }
              mediaImages.push(`data:${mimeType};base64,${imageData}`);
              console.log(`[PowerPointViewer] Extracted media image: ${mediaFile}`);
            }
          } catch (err) {
            console.warn(`[PowerPointViewer] Error extracting ${mediaFile}:`, err);
          }
        }

        console.log(`[PowerPointViewer] Total media images extracted: ${mediaImages.length}`);

        // Extract slide content and images
        const slideContents: SlideInfo[] = [];
        let slideNumber = 1;

        // Process ALL slides (no limit)
        for (const slideRef of slideMatches) {
          const slideFileName = `ppt/slides/slide${slideNumber}.xml`;
          const slideFile = zipContent.file(slideFileName);

          if (slideFile) {
            try {
              const slideContent = await slideFile.async('text');
              console.log(`[PowerPointViewer] Slide ${slideNumber} content preview:`, slideContent.substring(0, 300));

              // Extract title and content from slide - improved extraction
              let title = `Diapositive ${slideNumber}`;

              // Try multiple patterns to find meaningful titles
              const titlePatterns = [
                /<a:t>([^<]{3,50})<\/a:t>/,  // Title text (3-50 chars)
                /<p:txBody[^>]*>.*?<a:t>([^<]+)<\/a:t>/,  // Text body content
                /<p:title>([^<]+)<\/p:title>/,  // Explicit title field
              ];

              for (const pattern of titlePatterns) {
                const match = slideContent.match(pattern);
                if (match && match[1] && match[1].trim().length > 0) {
                  const extractedTitle = match[1].trim();
                  // Filter out generic placeholder titles
                  if (!/^(Title|Subtitle|Click to|Titre|Clic|Presentation|Graph|Chart|List|Content|Text)/i.test(extractedTitle)) {
                    title = extractedTitle.length > 30 ? extractedTitle.substring(0, 30) + '...' : extractedTitle;
                    break;
                  }
                }
              }

              // Check if slide has meaningful content
              const hasContent = slideContent.length > 200; // Basic heuristic

              slideContents.push({
                id: slideNumber,
                title: title,
                content: slideContent,
                hasContent: hasContent,
                imageUrl: mediaImages[slideNumber - 1] || mediaImages[0] // Use slide's image or first available
              });
            } catch (slideErr) {
              console.warn(`[PowerPointViewer] Error reading slide ${slideNumber}:`, slideErr);
            }
          }
          slideNumber++;
        }

        console.log('[PowerPointViewer] Extracted slides:', slideContents.length);

        // Extract presentation properties for metadata
        let presentationTitle = fileName.replace(/\.pptx?$/, '');
        const propsFile = zipContent.file('docProps/app.xml');
        if (propsFile) {
          try {
            const propsContent = await propsFile.async('text');
            const titleMatch = propsContent.match(/<Title>([^<]+)<\/Title>/);
            if (titleMatch) {
              presentationTitle = titleMatch[1];
            }
          } catch (propsErr) {
            console.warn('[PowerPointViewer] Error reading presentation properties:', propsErr);
          }
        }

        const basicInfo = {
          fileName: fileName,
          fileSize: arrayBuffer.byteLength,
          fileType: 'PowerPoint Presentation',
          slideCount: slideContents.length.toString(),
          title: presentationTitle,
          createdDate: new Date().toLocaleDateString()
        };

        setPresentationInfo(basicInfo);
        setSlides(slideContents);
        setLoading(false);
      } catch (err) {
        console.error('[PowerPointViewer] Error loading PowerPoint file:', err);
        setError(`Erreur lors du chargement du fichier: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        setLoading(false);
      }
    };

    loadPowerPointFile();
  }, [filePath, fileName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de la présentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center max-w-md p-8">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!presentationInfo) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p className="text-muted-foreground">Aucune présentation chargée</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Presentation Header */}
      <div className="p-6 border-b bg-card">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 010 2h-1v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 010-2h4z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{presentationInfo.title}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>Présentation PowerPoint</span>
              <span>•</span>
              <span>{(presentationInfo.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              <span>•</span>
              <span>{presentationInfo.slideCount} diapositives</span>
            </div>
          </div>
        </div>
      </div>

      {/* Presentation Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* View Mode Toggle */}
          {!presentationInfo.isOldFormat && slides.length > 0 && (
            <div className="flex justify-center gap-2 mb-6">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Grille
              </button>
              <button
                onClick={() => setViewMode('slideshow')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'slideshow'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Diaporama
              </button>
            </div>
          )}

          {/* Slideshow Mode */}
          {viewMode === 'slideshow' && !presentationInfo.isOldFormat && slides.length > 0 && (
            <div className="bg-black rounded-xl overflow-hidden shadow-2xl">
              {/* Current Slide Display */}
              <div className="relative aspect-video bg-gray-900">
                {slides[activeSlide]?.imageUrl ? (
                  <img
                    src={slides[activeSlide].imageUrl}
                    alt={`Slide ${activeSlide + 1}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white">
                    <svg className="w-20 h-20 mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-2xl font-bold mb-2">{slides[activeSlide]?.title}</h3>
                    <p className="text-gray-400">Image de la diapositive non disponible</p>
                  </div>
                )}

                {/* Navigation Arrows */}
                {activeSlide > 0 && (
                  <button
                    onClick={() => setActiveSlide(activeSlide - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-3 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                {activeSlide < slides.length - 1 && (
                  <button
                    onClick={() => setActiveSlide(activeSlide + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-3 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                
                {/* Slide Counter */}
                <div className="absolute bottom-4 right-4 bg-black/75 text-white px-4 py-2 rounded-lg">
                  {activeSlide + 1} / {slides.length}
                </div>
              </div>

              {/* Slide Title */}
              <div className="bg-gray-900 p-4 border-t border-gray-800">
                <h3 className="text-white text-lg font-semibold">{slides[activeSlide]?.title}</h3>
              </div>

              {/* Thumbnail Navigation */}
              <div className="bg-gray-900 p-4 border-t border-gray-800">
                <div className="flex gap-2 overflow-x-auto">
                  {slides.map((slide, index) => (
                    <button
                      key={slide.id}
                      onClick={() => setActiveSlide(index)}
                      className={`flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        index === activeSlide
                          ? 'border-orange-500 ring-2 ring-orange-500/50'
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      {slide.imageUrl ? (
                        <img
                          src={slide.imageUrl}
                          alt={`Slide ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
                          Slide {index + 1}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Grid Mode */}
          {viewMode === 'grid' && (
            <>
              {/* Presentation Preview Card */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 rounded-xl p-8 mb-6 border border-orange-200 dark:border-orange-800">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500 rounded-full mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 010 2h-1v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 010-2h4z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-2">
                Aperçu de présentation
              </h3>
              <p className="text-orange-700 dark:text-orange-300 mb-6">
                Cette présentation contient des diapositives avec du contenu multimédia.
                Ouvrez-la avec PowerPoint pour voir le contenu complet.
              </p>

              {/* Handle old .ppt format */}
              {presentationInfo.isOldFormat ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <svg className="w-10 h-10 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Format PowerPoint ancien détecté
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Ce fichier utilise l'ancien format PowerPoint (.ppt) qui n'est pas supporté pour l'extraction de contenu.
                    Ouvrez le fichier avec PowerPoint pour voir son contenu.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 <strong>Conseil:</strong> Enregistrez ce fichier au format .pptx pour bénéficier de l'aperçu avancé.
                    </p>
                  </div>
                </div>
              ) : (
                /* Slide Previews for .pptx files */
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {slides.slice(0, 6).map((slide) => (
                    <div key={slide.id} className="aspect-video bg-white dark:bg-gray-800 rounded-lg border-2 border-orange-200 dark:border-orange-700 p-3 flex flex-col">
                      <div className="text-center text-orange-600 dark:text-orange-400 mb-2">
                        <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Slide {slide.id}</span>
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                          {slide.title}
                        </h4>
                        {slide.hasContent && (
                          <div className="w-full bg-orange-100 dark:bg-orange-900/30 rounded h-2">
                            <div className="bg-orange-400 h-2 rounded" style={{ width: '60%' }}></div>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {slide.hasContent ? 'Contenu détecté' : 'Diapositive vide'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {slides.length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 010 2h-1v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 010-2h4z" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400">Aucun contenu de diapositive trouvé</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Presentation Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Informations du fichier
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nom du fichier:</span>
                  <span className="font-medium">{presentationInfo.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taille:</span>
                  <span className="font-medium">{(presentationInfo.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{presentationInfo.fileType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date de création:</span>
                  <span className="font-medium">{presentationInfo.createdDate}</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Contenu de la présentation
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombre de diapositives:</span>
                  <span className="font-medium">{presentationInfo.slideCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Titre:</span>
                  <span className="font-medium">{presentationInfo.title}</span>
                </div>
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 Pour voir le contenu complet de cette présentation, ouvrez le fichier avec Microsoft PowerPoint ou un autre lecteur de présentations compatible.
                  </p>
                </div>
              </div>
            </div>
          </div>
          </>
          )}

        </div>
      </div>
    </div>
  );
};
