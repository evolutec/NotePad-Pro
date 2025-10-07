import React, { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

interface ExcelViewerProps {
  filePath: string;
  fileName: string;
}

export const ExcelViewer: React.FC<ExcelViewerProps> = ({ filePath, fileName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    const loadExcelFile = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[ExcelViewer] Starting to load Excel file:', filePath);

        // Load the file via Electron API
        if (typeof window === 'undefined' || !window.electronAPI?.readFile) {
          console.error('[ExcelViewer] Electron API not available');
          setError('Mode Electron requis');
          setLoading(false);
          return;
        }

        console.log('[ExcelViewer] Calling electronAPI.readFile...');
        const result = await window.electronAPI.readFile(filePath);
        console.log('[ExcelViewer] File read result:', result);

        if (!result.success || !result.data) {
          console.error('[ExcelViewer] Failed to read file:', result.error);
          setError(result.error || 'Erreur lors de la lecture du fichier');
          setLoading(false);
          return;
        }

        const data = result.data as any;
        console.log('[ExcelViewer] File data type:', typeof data);

        // Convert to ArrayBuffer if needed
        let arrayBuffer: ArrayBuffer;
        
        if (data && typeof data === 'object' && 'buffer' in data && data.buffer instanceof ArrayBuffer) {
          console.log('[ExcelViewer] Using data.buffer as ArrayBuffer');
          arrayBuffer = data.buffer as ArrayBuffer;
        } else if (typeof data === 'string') {
          console.log('[ExcelViewer] Converting base64 string to ArrayBuffer');
          const base64String = data.includes('base64,') ? data.split('base64,')[1] : data;
          const binaryString = atob(base64String);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          arrayBuffer = bytes.buffer as ArrayBuffer;
        } else {
          console.error('[ExcelViewer] Unsupported data format:', data);
          throw new Error('Format de données non supporté');
        }

        console.log('[ExcelViewer] ArrayBuffer created, size:', arrayBuffer.byteLength);

        // Read the workbook
        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        console.log('[ExcelViewer] Workbook loaded, sheets:', wb.SheetNames);
        
        setWorkbook(wb);
        setLoading(false);
      } catch (err) {
        console.error('[ExcelViewer] Error loading Excel file:', err);
        setError(`Erreur lors du chargement du fichier: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        setLoading(false);
      }
    };

    loadExcelFile();
  }, [filePath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du fichier Excel...</p>
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

  if (!workbook) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p className="text-muted-foreground">Aucun classeur chargé</p>
      </div>
    );
  }

  const currentSheet = workbook.Sheets[workbook.SheetNames[activeSheet]];
  const htmlTable = XLSX.utils.sheet_to_html(currentSheet, { 
    id: 'excel-table',
    editable: false 
  });

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Sheet tabs */}
      {workbook.SheetNames.length > 1 && (
        <div className="flex items-center gap-1 p-2 border-b bg-card overflow-x-auto">
          {workbook.SheetNames.map((sheetName, index) => (
            <button
              key={index}
              onClick={() => setActiveSheet(index)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeSheet === index
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {sheetName}
            </button>
          ))}
        </div>
      )}

      {/* Spreadsheet content */}
      <div className="flex-1 overflow-auto p-4">
        <div 
          dangerouslySetInnerHTML={{ __html: htmlTable }}
          className="excel-content"
        />
      </div>

      <style jsx global>{`
        .excel-content table {
          border-collapse: collapse;
          width: 100%;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .excel-content td, .excel-content th {
          border: 1px solid #d0d0d0;
          padding: 8px 12px;
          text-align: left;
          font-size: 14px;
        }
        .excel-content th {
          background: #f0f0f0;
          font-weight: 600;
        }
        .excel-content tr:hover {
          background: #f8f8f8;
        }
        .dark .excel-content table {
          background: #1f1f1f;
        }
        .dark .excel-content td, .dark .excel-content th {
          border-color: #404040;
          color: #e0e0e0;
        }
        .dark .excel-content th {
          background: #2a2a2a;
        }
        .dark .excel-content tr:hover {
          background: #252525;
        }
      `}</style>
    </div>
  );
};
