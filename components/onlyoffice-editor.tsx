"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { ExternalLink, Download } from 'lucide-react';

// Déclaration TypeScript pour l'API OnlyOffice globale
declare global {
  interface Window {
    DocsAPI?: any;
    DocEditor?: any;
  }
}

interface OnlyOfficeEditorProps {
  filePath: string;
  fileName: string;
  fileType?: string; // Extension du fichier (docx, xlsx, pptx, etc.)
  mode?: 'view' | 'edit'; // Mode d'affichage
  onError?: (error: string) => void;
}

export function OnlyOfficeEditor({ 
  filePath, 
  fileName, 
  fileType, 
  mode = 'view',
  onError 
}: OnlyOfficeEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const editorIdRef = useRef<string>(`onlyoffice-editor-${Date.now()}-${Math.random()}`);
  const isDestroyingRef = useRef<boolean>(false);

  // Convertir le chemin local en URL HTTP pour le serveur de fichiers Electron
  const getFileUrl = () => {
    return `http://host.docker.internal:38274/?file=${encodeURIComponent(filePath)}`;
  };

  // Déterminer le type de document pour OnlyOffice en fonction de l'extension
  const getDocumentType = () => {
    const ext = (fileType || fileName.split('.').pop() || '').toLowerCase();
    
      if (['doc', 'docx', 'rtf', 'txt', 'md', 'odt', 'pdf'].includes(ext)) {
      return 'word';
    } else if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
      return 'cell';
    } else if (['ppt', 'pptx', 'odp'].includes(ext)) {
      return 'slide';
    }
    
    return 'word'; // Default
  };

  useEffect(() => {
    const loadOnlyOffice = async () => {
      try {
        console.log('[OnlyOffice] Loading editor...');
        setIsLoading(true);
        setError(null);
        
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
        const editorId = editorIdRef.current;
        containerRef.current.id = editorId;

        const ext = (fileType || fileName.split('.').pop() || 'docx').toLowerCase();
        const docType = getDocumentType();

        // Créer une clé simple et unique sans caractères problématiques
        const docKey = `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        console.log('[OnlyOffice] Creating editor');
        console.log('[OnlyOffice] Editor ID:', editorId);
        console.log('[OnlyOffice] File URL:', fileUrl);
        console.log('[OnlyOffice] File Type:', ext);
        console.log('[OnlyOffice] Document Type:', docType);
        console.log('[OnlyOffice] Document Key:', docKey);

        // Configuration OnlyOffice
        const config = {
          document: {
            fileType: ext,
            key: docKey, // Clé simple sans caractères spéciaux
            title: fileName,
            url: fileUrl,
            permissions: {
              chat: false,
              download: true,
              edit: mode === 'edit',
              print: true,
              review: mode === 'edit',
              comment: mode === 'edit',
            },
          },
          documentType: docType,
          editorConfig: {
            mode: mode,
            lang: 'fr-FR',
            customization: {
              autosave: true, // Activer l'autosave
              comments: mode === 'edit', // Autoriser les commentaires en mode édition
              help: false, // Masquer l'aide
              hideRightMenu: false, // Afficher le menu de droite en mode édition
              compactToolbar: false, // Toolbar normale
              toolbarNoTabs: false, // Afficher les onglets
              forcesave: true, // Forcer la sauvegarde
              feedback: false, // Désactiver le feedback
              goback: false, // Désactiver le bouton retour
              chat: false, // Désactiver le chat
              toolbar: mode === 'edit', // Afficher la toolbar en mode édition uniquement
              statusBar: true, // Afficher la barre de statut
              autosaveTimeout: 30000, // Autosave toutes les 30 secondes
              logo: {
                image: '', // Pas de logo
                visible: false
              },
              customer: {
                logo: '',
                name: ''
              }
            },
            user: {
              id: 'user-local',
              name: 'Utilisateur local',
            },
            // Utiliser l'IP locale au lieu de host.docker.internal pour une meilleure compatibilité
            callbackUrl: `http://172.27.192.1:38274/callback?file=${encodeURIComponent(filePath)}`,
          },
          events: {
            onDocumentReady: () => {
              console.log('[OnlyOffice] ✅ Document is ready!');
              setIsLoading(false);
            },
            onDocumentStateChange: (event: any) => {
              console.log('[OnlyOffice] 📝 Document state changed:', event);
            },
            onRequestSaveAs: (event: any) => {
              console.log('[OnlyOffice] 💾 Save As requested:', event);
            },
            onRequestRestore: (event: any) => {
              console.log('[OnlyOffice] 🔄 Restore requested:', event);
            },
            onError: (event: any) => {
              console.error('[OnlyOffice] ❌ Error event:', event);
              console.error('[OnlyOffice] ❌ Error data:', event?.data);
              
              // Ignorer les erreurs de connexion WebSocket (normales en mode view)
              const errorCode = event?.data?.errorCode || event?.errorCode;
              if (errorCode === -1) {
                console.log('[OnlyOffice] ℹ️ WebSocket error ignored (normal in view mode)');
                return;
              }
              
              const errorMsg = `Erreur OnlyOffice: ${JSON.stringify(event?.data || event)}`;
              setError(errorMsg);
              setIsLoading(false);
              onError?.(errorMsg);
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
        const errorMsg = `Erreur de chargement: ${err}`;
        setError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
      }
    };

    loadOnlyOffice();

    // Cleanup - CRITIQUE pour éviter les problèmes de rafraîchissement
    return () => {
      console.log('[OnlyOffice] Cleanup starting...');
      isDestroyingRef.current = true;
      
      // Détruire l'éditeur immédiatement
      if (editorRef.current) {
        try {
          console.log('[OnlyOffice] Destroying editor:', editorIdRef.current);
          editorRef.current.destroyEditor();
          editorRef.current = null;
        } catch (err) {
          console.error('[OnlyOffice] Destroy error:', err);
        }
      }
      
      // Nettoyer le DOM de manière sécurisée
      setTimeout(() => {
        // Vérifier si le conteneur existe encore dans le DOM
        if (containerRef.current && containerRef.current.parentNode) {
          try {
            containerRef.current.innerHTML = '';
            console.log('[OnlyOffice] DOM cleaned');
          } catch (err) {
            console.error('[OnlyOffice] DOM cleanup error:', err);
          }
        } else {
          console.log('[OnlyOffice] Container already removed, skipping cleanup');
        }
      }, 100);
    };
  }, [filePath, fileName, fileType, mode]);

  const handleDownload = async () => {
    if (typeof window === 'undefined' || !window.electronAPI?.downloadFile) return;
    try {
      await window.electronAPI.downloadFile(filePath, fileName);
    } catch (err) {
      console.error('Error downloading file:', err);
    }
  };

  const handleOpenExternal = async () => {
    if (typeof window === 'undefined' || !window.electronAPI?.openFileExternal) return;
    try {
      await window.electronAPI.openFileExternal(filePath);
    } catch (err) {
      console.error('Error opening file externally:', err);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-background">
      
      {/* Editor Container */}
      <div className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-900">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-10 p-4">
            <div className="text-red-600 text-center max-w-2xl">
              <h3 className="text-lg font-semibold mb-2">OnlyOffice non disponible</h3>
              <p className="mb-4 text-sm">{error}</p>
              <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg mb-4">
                <p className="font-semibold mb-2">Note :</p>
                <p>OnlyOffice nécessite un Document Server configuré.</p>
                <p className="mt-2">Vérifiez que :</p>
                <ul className="list-disc list-inside mt-1 text-left">
                  <li>Le Document Server est démarré (Docker)</li>
                  <li>Le serveur est accessible sur http://localhost</li>
                  <li>La configuration allowPrivateIPAddress est activée</li>
                </ul>
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={handleOpenExternal}
                  variant="default"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir avec l'application externe
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
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
    </div>
  );
}
