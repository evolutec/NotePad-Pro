import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { createPresentation } from '../lib/pptxgen-loader';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Plus, Save, Download, Trash2, ChevronLeft, ChevronRight, 
  Image as ImageIcon, Type, Layout, AlertCircle 
} from 'lucide-react';

interface OfficePowerPointEditorProps {
  filePath: string;
  fileName: string;
  onSave?: () => void;
}

interface Slide {
  id: number;
  title: string;
  content: string;
  layout: 'title' | 'content' | 'titleOnly' | 'blank';
  backgroundColor?: string;
}

export const OfficePowerPointEditor: React.FC<OfficePowerPointEditorProps> = ({
  filePath,
  fileName,
  onSave
}) => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [presentationTitle, setPresentationTitle] = useState('');

  // Load existing presentation
  useEffect(() => {
    loadPresentation();
  }, [filePath]);

  const loadPresentation = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[PowerPointEditor] Loading presentation:', filePath);

      // Check if we have a valid file
      if (!window.electronAPI?.readFile) {
        throw new Error('Electron API not available');
      }

      const result = await window.electronAPI.readFile(filePath);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to read file');
      }

      const data = result.data as any;
      let arrayBuffer: ArrayBuffer;

      // Convert to ArrayBuffer
      if (data && typeof data === 'object' && 'buffer' in data && data.buffer instanceof ArrayBuffer) {
        arrayBuffer = data.buffer as ArrayBuffer;
      } else if (typeof data === 'string') {
        const base64String = data.includes('base64,') ? data.split('base64,')[1] : data;
        const binaryString = atob(base64String);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer as ArrayBuffer;
      } else {
        throw new Error('Unsupported data format');
      }

      // Extract slides from existing presentation
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(arrayBuffer);

      console.log('[PowerPointEditor] ZIP loaded, extracting slides...');

      // Extract presentation title
      const propsFile = zipContent.file('docProps/core.xml');
      if (propsFile) {
        const propsContent = await propsFile.async('text');
        const titleMatch = propsContent.match(/<dc:title>([^<]+)<\/dc:title>/);
        if (titleMatch) {
          setPresentationTitle(titleMatch[1]);
        } else {
          setPresentationTitle(fileName.replace(/\.pptx?$/, ''));
        }
      } else {
        setPresentationTitle(fileName.replace(/\.pptx?$/, ''));
      }

      // Extract slides content
      const extractedSlides: Slide[] = [];
      let slideNumber = 1;

      // Find all slide files
      const slideFiles = Object.keys(zipContent.files)
        .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
        .sort();

      console.log('[PowerPointEditor] Found slide files:', slideFiles);

      for (const slideFile of slideFiles) {
        try {
          const file = zipContent.file(slideFile);
          if (!file) continue;

          const slideContent = await file.async('text');
          
          // Extract text content from slide
          const textMatches = slideContent.matchAll(/<a:t>([^<]+)<\/a:t>/g);
          const texts = Array.from(textMatches).map(match => match[1]);

          let title = `Slide ${slideNumber}`;
          let content = '';

          if (texts.length > 0) {
            title = texts[0];
            content = texts.slice(1).join('\n');
          }

          extractedSlides.push({
            id: slideNumber,
            title: title,
            content: content,
            layout: 'content',
            backgroundColor: '#ffffff'
          });

          slideNumber++;
        } catch (err) {
          console.warn(`[PowerPointEditor] Error extracting slide ${slideNumber}:`, err);
        }
      }

      if (extractedSlides.length === 0) {
        // Create a default slide if none found
        extractedSlides.push({
          id: 1,
          title: 'Nouvelle présentation',
          content: 'Commencez à créer votre présentation ici...',
          layout: 'title',
          backgroundColor: '#ffffff'
        });
      }

      setSlides(extractedSlides);
      setActiveSlideIndex(0);
      setLoading(false);
    } catch (err) {
      console.error('[PowerPointEditor] Error loading presentation:', err);
      setError(`Erreur de chargement: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      
      // Create a new blank presentation
      setSlides([{
        id: 1,
        title: 'Nouvelle présentation',
        content: 'Commencez à créer votre présentation ici...',
        layout: 'title',
        backgroundColor: '#ffffff'
      }]);
      setPresentationTitle(fileName.replace(/\.pptx?$/, ''));
      setActiveSlideIndex(0);
      setLoading(false);
    }
  };

  const addSlide = () => {
    const newSlide: Slide = {
      id: slides.length + 1,
      title: `Slide ${slides.length + 1}`,
      content: '',
      layout: 'content',
      backgroundColor: '#ffffff'
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  const deleteSlide = (index: number) => {
    if (slides.length === 1) {
      alert('Impossible de supprimer la dernière diapositive');
      return;
    }
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    if (activeSlideIndex >= newSlides.length) {
      setActiveSlideIndex(newSlides.length - 1);
    }
  };

  const updateSlide = (index: number, updates: Partial<Slide>) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], ...updates };
    setSlides(newSlides);
  };

  const savePresentation = async () => {
    try {
      setSaving(true);
      console.log('[PowerPointEditor] Saving presentation...');

      // Create new PowerPoint presentation
      const pptx = await createPresentation();
      
      // Set presentation properties
      pptx.author = 'NotePad Pro';
      pptx.company = 'NotePad Pro';
      pptx.title = presentationTitle;

      // Add each slide
      slides.forEach((slide) => {
        const pptxSlide = pptx.addSlide();

        // Set background color
        if (slide.backgroundColor) {
          pptxSlide.background = { color: slide.backgroundColor };
        }

        // Add content based on layout
        if (slide.layout === 'title' || slide.layout === 'titleOnly') {
          // Title slide
          pptxSlide.addText(slide.title, {
            x: 0.5,
            y: 1.5,
            w: '90%',
            h: 1.5,
            fontSize: 44,
            bold: true,
            color: '363636',
            align: 'center',
            valign: 'middle'
          });

          if (slide.layout === 'title' && slide.content) {
            pptxSlide.addText(slide.content, {
              x: 0.5,
              y: 3.5,
              w: '90%',
              h: 1.5,
              fontSize: 28,
              color: '666666',
              align: 'center',
              valign: 'middle'
            });
          }
        } else if (slide.layout === 'content') {
          // Content slide with title and body
          pptxSlide.addText(slide.title, {
            x: 0.5,
            y: 0.5,
            w: '90%',
            h: 0.75,
            fontSize: 32,
            bold: true,
            color: '363636'
          });

          if (slide.content) {
            pptxSlide.addText(slide.content, {
              x: 0.5,
              y: 1.5,
              w: '90%',
              h: 4.5,
              fontSize: 18,
              color: '666666',
              valign: 'top'
            });
          }
        } else {
          // Blank slide
          if (slide.title) {
            pptxSlide.addText(slide.title, {
              x: 0.5,
              y: 0.5,
              w: '90%',
              h: 0.75,
              fontSize: 28,
              bold: true,
              color: '363636'
            });
          }
        }
      });

      // Generate the PowerPoint file
      const pptxData = await pptx.write({ outputType: 'arraybuffer' }) as ArrayBuffer;

      // Save via Electron API
      if (!window.electronAPI?.documentCreate) {
        throw new Error('Electron API not available');
      }

      const result = await window.electronAPI.documentCreate({
        fileName: fileName,
        content: Array.from(new Uint8Array(pptxData)),
        type: 'powerpoint'
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save presentation');
      }

      console.log('[PowerPointEditor] Presentation saved successfully');
      setSaving(false);
      
      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('[PowerPointEditor] Error saving presentation:', err);
      setError(`Erreur de sauvegarde: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      setSaving(false);
    }
  };

  const downloadPresentation = async () => {
    try {
      console.log('[PowerPointEditor] Downloading presentation...');
      
      // Create new PowerPoint presentation
      const pptx = await createPresentation();
      pptx.author = 'NotePad Pro';
      pptx.title = presentationTitle;

      // Add each slide
      slides.forEach((slide) => {
        const pptxSlide = pptx.addSlide();
        if (slide.backgroundColor) {
          pptxSlide.background = { color: slide.backgroundColor };
        }

        if (slide.layout === 'title' || slide.layout === 'titleOnly') {
          pptxSlide.addText(slide.title, {
            x: 0.5, y: 1.5, w: '90%', h: 1.5,
            fontSize: 44, bold: true, color: '363636',
            align: 'center', valign: 'middle'
          });
          if (slide.layout === 'title' && slide.content) {
            pptxSlide.addText(slide.content, {
              x: 0.5, y: 3.5, w: '90%', h: 1.5,
              fontSize: 28, color: '666666',
              align: 'center', valign: 'middle'
            });
          }
        } else if (slide.layout === 'content') {
          pptxSlide.addText(slide.title, {
            x: 0.5, y: 0.5, w: '90%', h: 0.75,
            fontSize: 32, bold: true, color: '363636'
          });
          if (slide.content) {
            pptxSlide.addText(slide.content, {
              x: 0.5, y: 1.5, w: '90%', h: 4.5,
              fontSize: 18, color: '666666', valign: 'top'
            });
          }
        }
      });

      // Download the file
      await pptx.writeFile({ fileName: fileName || 'presentation.pptx' });
      console.log('[PowerPointEditor] Presentation downloaded');
    } catch (err) {
      console.error('[PowerPointEditor] Error downloading presentation:', err);
      alert(`Erreur de téléchargement: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

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

  const activeSlide = slides[activeSlideIndex];

  return (
    <div className="relative h-full w-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 010 2h-1v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 010-2h4z" />
              </svg>
            </div>
            <div>
              <Input
                value={presentationTitle}
                onChange={(e) => setPresentationTitle(e.target.value)}
                className="font-bold text-lg border-none shadow-none focus-visible:ring-0 px-0"
                placeholder="Titre de la présentation"
              />
              <p className="text-xs text-muted-foreground">
                {slides.length} diapositive{slides.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={savePresentation} disabled={saving} variant="default">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </Button>
            <Button onClick={downloadPresentation} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800 p-3">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Slide Thumbnails Sidebar */}
        <div className="w-64 border-r bg-muted/30 overflow-y-auto">
          <div className="p-4 space-y-2">
            <Button onClick={addSlide} className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle diapositive
            </Button>

            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`group relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  index === activeSlideIndex
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:border-muted-foreground/20 bg-card'
                }`}
                onClick={() => setActiveSlideIndex(index)}
              >
                <div className="flex items-start gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {index + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{slide.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {slide.content ? slide.content.substring(0, 30) + '...' : 'Diapositive vide'}
                    </p>
                  </div>
                </div>
                
                {slides.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSlide(index);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {/* Slide Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button
                onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
                disabled={activeSlideIndex === 0}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Précédent
              </Button>

              <span className="text-sm text-muted-foreground">
                Diapositive {activeSlideIndex + 1} / {slides.length}
              </span>

              <Button
                onClick={() => setActiveSlideIndex(Math.min(slides.length - 1, activeSlideIndex + 1))}
                disabled={activeSlideIndex === slides.length - 1}
                variant="outline"
                size="sm"
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Slide Preview */}
            <Card className="mb-6">
              <CardContent className="p-8 aspect-video bg-white dark:bg-gray-900 flex flex-col justify-center items-center rounded-lg border-2"
                style={{ backgroundColor: activeSlide?.backgroundColor || '#ffffff' }}
              >
                <div className="w-full text-center">
                  <h2 className="text-4xl font-bold mb-4 text-gray-900">
                    {activeSlide?.title || 'Titre'}
                  </h2>
                  {activeSlide?.content && (
                    <p className="text-xl text-gray-700 whitespace-pre-wrap">
                      {activeSlide.content}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Slide Editor */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Titre de la diapositive</label>
                <Input
                  value={activeSlide?.title || ''}
                  onChange={(e) => updateSlide(activeSlideIndex, { title: e.target.value })}
                  placeholder="Entrez le titre..."
                  className="text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Contenu</label>
                <Textarea
                  value={activeSlide?.content || ''}
                  onChange={(e) => updateSlide(activeSlideIndex, { content: e.target.value })}
                  placeholder="Entrez le contenu de la diapositive..."
                  rows={8}
                  className="font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Mise en page</label>
                  <select
                    value={activeSlide?.layout || 'content'}
                    onChange={(e) => updateSlide(activeSlideIndex, { layout: e.target.value as any })}
                    className="w-full p-2 border rounded-lg bg-background"
                  >
                    <option value="title">Titre</option>
                    <option value="content">Titre et contenu</option>
                    <option value="titleOnly">Titre seulement</option>
                    <option value="blank">Vide</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Couleur de fond</label>
                  <Input
                    type="color"
                    value={activeSlide?.backgroundColor || '#ffffff'}
                    onChange={(e) => updateSlide(activeSlideIndex, { backgroundColor: e.target.value })}
                    className="h-10 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
