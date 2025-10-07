import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';

interface DocxViewerProps {
  filePath: string;
  fileName: string;
}

export const DocxViewer: React.FC<DocxViewerProps> = ({ filePath, fileName }) => {
  console.log('[DocxViewer] Component rendered with:', { filePath, fileName });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('[DocxViewer] Component state:', { loading, error, hasContainer: !!containerRef.current });

  useEffect(() => {
    console.log('[DocxViewer] useEffect triggered, containerRef.current:', !!containerRef.current);
    
    const loadDocument = async () => {
      if (!containerRef.current) {
        console.log('[DocxViewer] Container not ready yet, skipping');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('[DocxViewer] Starting to load document:', filePath);

        // Load the file via Electron API
        if (typeof window === 'undefined' || !window.electronAPI?.readFile) {
          console.error('[DocxViewer] Electron API not available');
          setError('Mode Electron requis');
          setLoading(false);
          return;
        }

        console.log('[DocxViewer] Calling electronAPI.readFile...');
        const result = await window.electronAPI.readFile(filePath);
        console.log('[DocxViewer] File read result:', result);

        if (!result.success || !result.data) {
          console.error('[DocxViewer] Failed to read file:', result.error);
          setError(result.error || 'Erreur lors de la lecture du fichier');
          setLoading(false);
          return;
        }

        const data = result.data as any;
        console.log('[DocxViewer] File data type:', typeof data);
        console.log('[DocxViewer] File data length:', data?.length || data?.byteLength || 'unknown');

        // Convert to ArrayBuffer if needed
        let arrayBuffer: ArrayBuffer;
        
        if (data && typeof data === 'object' && 'buffer' in data && data.buffer instanceof ArrayBuffer) {
          console.log('[DocxViewer] Using data.buffer as ArrayBuffer');
          arrayBuffer = data.buffer as ArrayBuffer;
        } else if (typeof data === 'string') {
          console.log('[DocxViewer] Converting base64 string to ArrayBuffer');
          // Assume it's base64 string
          const base64String = data.includes('base64,') ? data.split('base64,')[1] : data;
          const binaryString = atob(base64String);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          arrayBuffer = bytes.buffer as ArrayBuffer;
        } else {
          console.error('[DocxViewer] Unsupported data format:', data);
          throw new Error('Format de données non supporté');
        }

        console.log('[DocxViewer] ArrayBuffer created, size:', arrayBuffer.byteLength);

        // Clear previous content
        containerRef.current.innerHTML = '';
        console.log('[DocxViewer] Starting renderAsync...');

        // Render the document
        await renderAsync(arrayBuffer, containerRef.current, undefined, {
          className: 'docx-wrapper',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          debug: false,
        });

        console.log('[DocxViewer] Document rendered successfully');
        setLoading(false);
      } catch (err) {
        console.error('[DocxViewer] Error rendering DOCX:', err);
        setError(`Erreur lors du rendu du document: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        setLoading(false);
      }
    };

    loadDocument();
  }, [filePath]);

  return (
    <div className="h-full w-full overflow-auto bg-gray-100 dark:bg-gray-900 p-4 relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement du document Word...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="text-center max-w-md p-8">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-semibold mb-2">Erreur de rendu</h3>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="docx-preview-container mx-auto bg-white dark:bg-gray-800 shadow-lg"
        style={{
          maxWidth: '210mm', // A4 width
          minHeight: '297mm', // A4 height
        }}
      />
      <style jsx global>{`
        .docx-wrapper {
          background: white;
          padding: 20mm;
        }
        .docx-wrapper section.docx {
          margin-bottom: 10mm;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};
