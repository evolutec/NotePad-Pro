"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { X, ExternalLink } from 'lucide-react';

// Déclaration TypeScript pour l'API OnlyOffice globale
declare global {
  interface Window {
    DocsAPI?: any;
    DocEditor?: any;
  }
}

interface OnlyOfficeViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string;
  fileName: string;
  fileType: 'word' | 'cell' | 'slide';
}

export function OnlyOfficeViewer({ open, onOpenChange, filePath, fileName, fileType }: OnlyOfficeViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  // Convertir le chemin local en URL HTTP pour le serveur de fichiers Electron
  const getFileUrl = () => {
    return `http://host.docker.internal:38274/?file=${encodeURIComponent(filePath)}`;
  };

  // Déterminer le type de document pour OnlyOffice
  const getDocumentType = () => {
    switch (fileType) {
      case 'word':
        return 'word';
      case 'cell':
        return 'cell';
      case 'slide':
        return 'slide';
      default:
        return 'word';
    }
  };

  useEffect(() => {
    if (!open) return;

    const loadOnlyOffice = async () => {
      try {
        console.log('[OnlyOffice] Loading editor...');
        
        // Charger le script OnlyOffice si nécessaire
        if (!window.DocsAPI) {
          const script = document.createElement('script');
          script.src = 'http://localhost/web-apps/apps/api/documents/api.js';
          script.async = true;
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
          
          console.log('[OnlyOffice] API loaded');
        }

        // Attendre que le conteneur soit prêt
        if (!containerRef.current) {
          console.error('[OnlyOffice] Container not ready');
          return;
        }

        const fileUrl = getFileUrl();
        const editorId = `onlyoffice-container-${Date.now()}`;
        containerRef.current.id = editorId;

        console.log('[OnlyOffice] Creating editor');
        console.log('[OnlyOffice] File URL:', fileUrl);
        console.log('[OnlyOffice] File Type:', fileType);
        console.log('[OnlyOffice] Document Type:', getDocumentType());

        // Configuration OnlyOffice
        const config = {
          document: {
            fileType: fileName.split('.').pop()?.toLowerCase() || 'docx',
            key: `${Date.now()}`, // Clé simple sans caractères spéciaux
            title: fileName,
            url: fileUrl,
            permissions: {
              chat: false,
              download: true,
              edit: false,
              print: true,
              review: false,
            },
          },
          documentType: getDocumentType(),
          editorConfig: {
            mode: 'view',
            lang: 'fr-FR',
            customization: {
              autosave: false,
              comments: false,
              help: false,
              hideRightMenu: true,
              compactToolbar: true,
            },
          },
          events: {
            onDocumentReady: () => {
              console.log('[OnlyOffice] ✅ Document is ready!');
              setIsLoading(false);
            },
            onError: (event: any) => {
              console.error('[OnlyOffice] ❌ Error event:', event);
              console.error('[OnlyOffice] ❌ Error data:', event?.data);
              console.error('[OnlyOffice] ❌ Error stringified:', JSON.stringify(event, null, 2));
              setError(`Erreur: ${JSON.stringify(event?.data || event)}`);
              setIsLoading(false);
            },
            onWarning: (event: any) => {
              console.warn('[OnlyOffice] ⚠️ Warning:', event);
            },
            onInfo: (event: any) => {
              console.log('[OnlyOffice] ℹ️ Info:', event);
            },
          },
          height: '100%',
          width: '100%',
          token: '',
        };

        console.log('[OnlyOffice] Config:', config);

        // Créer l'éditeur avec l'API native
        editorRef.current = new window.DocsAPI.DocEditor(editorId, config);
        
        console.log('[OnlyOffice] Editor instance created:', editorRef.current);

      } catch (err) {
        console.error('[OnlyOffice] Load error:', err);
        setError(`Erreur de chargement: ${err}`);
        setIsLoading(false);
      }
    };

    loadOnlyOffice();

    // Cleanup
    return () => {
      if (editorRef.current) {
        try {
          console.log('[OnlyOffice] Destroying editor');
          editorRef.current.destroyEditor();
          editorRef.current = null;
        } catch (err) {
          console.error('[OnlyOffice] Destroy error:', err);
        }
      }
    };
  }, [open, filePath, fileName, fileType]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-background rounded-lg shadow-lg w-[95vw] h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">{fileName}</h2>
            <p className="text-sm text-muted-foreground">OnlyOffice - Éditeur de documents</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Editor Container */}
        <div className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-900">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-10">
              <div className="text-red-600 text-center p-4 max-w-2xl">
                <h3 className="text-lg font-semibold mb-2">OnlyOffice non disponible</h3>
                <p className="mb-4">{error}</p>
                <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg mb-4">
                  <p className="font-semibold mb-2">Note :</p>
                  <p>OnlyOffice nécessite un Document Server configuré.</p>
                  <p className="mt-2">Solutions alternatives :</p>
                  <ul className="list-disc list-inside mt-1 text-left">
                    <li>Utiliser les visionneuses intégrées (DocxViewer, ExcelViewer, PowerPointViewer)</li>
                    <li>Ouvrir le document avec l'application externe par défaut</li>
                    <li>Installer OnlyOffice Document Server localement</li>
                  </ul>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => {
                      if (window.electronAPI?.openFileExternal) {
                        window.electronAPI.openFileExternal(filePath);
                      }
                    }}
                    variant="default"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir avec l'application externe
                  </Button>
                  <Button
                    onClick={() => onOpenChange(false)}
                    variant="outline"
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              ref={containerRef}
              className="h-full w-full relative"
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">Chargement du document...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-2 border-t bg-muted/50 text-xs text-center text-muted-foreground">
          Propulsé par OnlyOffice | 
          <a
            href="https://www.onlyoffice.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 underline hover:text-primary"
          >
            En savoir plus
          </a>
        </div>
      </div>
    </div>
  );
}
