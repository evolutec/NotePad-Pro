'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Save, Download, Table, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';
import Handsontable from 'handsontable';

interface OfficeExcelEditorProps {
  filePath: string;
  fileName: string;
  onSave?: () => void;
}

export function OfficeExcelEditor({ filePath, fileName, onSave }: OfficeExcelEditorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hotInstance = useRef<Handsontable | null>(null);

  useEffect(() => {
    loadSpreadsheet();
    
    return () => {
      // Cleanup Handsontable on unmount
      if (hotInstance.current) {
        hotInstance.current.destroy();
      }
    };
  }, [filePath]);

  useEffect(() => {
    // Reload Handsontable when active sheet changes
    if (workbook && containerRef.current) {
      initializeHandsontable();
    }
  }, [activeSheet, workbook]);

  const loadSpreadsheet = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[ExcelEditor] Loading spreadsheet:', filePath);

      // Get file URL from local server
      const fileUrl = `http://localhost:38274?file=${encodeURIComponent(filePath)}`;
      
      // Fetch the file
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch spreadsheet');
      }

      const arrayBuffer = await response.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      
      console.log('[ExcelEditor] Workbook loaded, sheets:', wb.SheetNames);
      setWorkbook(wb);
      setActiveSheet(0);

      setLoading(false);
    } catch (err) {
      console.error('[ExcelEditor] Error loading spreadsheet:', err);
      setError(err instanceof Error ? err.message : 'Failed to load spreadsheet');
      setLoading(false);
    }
  };

  const initializeHandsontable = () => {
    if (!workbook || !containerRef.current) return;

    // Destroy previous instance
    if (hotInstance.current) {
      hotInstance.current.destroy();
    }

    const sheetName = workbook.SheetNames[activeSheet];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert worksheet to array of arrays
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
    
    console.log('[ExcelEditor] Initializing Handsontable with', data.length, 'rows');

    try {
      // Initialize Handsontable
      hotInstance.current = new Handsontable(containerRef.current, {
        data: data.length > 0 ? data : [[]],
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        width: '100%',
        height: '100%',
        licenseKey: 'non-commercial-and-evaluation',
        minRows: 50,
        minCols: 26,
        manualColumnResize: true,
        manualRowResize: true,
        filters: true,
        dropdownMenu: true,
        columnSorting: true,
        autoWrapRow: true,
        autoWrapCol: true,
        stretchH: 'all',
        afterChange: (changes, source) => {
          if (source !== 'loadData') {
            console.log('[ExcelEditor] Data changed');
          }
        }
      });

      console.log('[ExcelEditor] Handsontable initialized successfully');
    } catch (err) {
      console.error('[ExcelEditor] Error initializing Handsontable:', err);
      setError('Failed to initialize spreadsheet editor');
    }
  };

  const saveSpreadsheet = async () => {
    try {
      setSaving(true);
      console.log('[ExcelEditor] Saving spreadsheet...');

      if (!hotInstance.current || !workbook) {
        throw new Error('Editor not ready');
      }

      // Get data from Handsontable
      const data = hotInstance.current.getData();
      
      // Update the active worksheet
      const sheetName = workbook.SheetNames[activeSheet];
      const newWorksheet = XLSX.utils.aoa_to_sheet(data);
      workbook.Sheets[sheetName] = newWorksheet;

      // Generate XLSX file
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const buffer = Buffer.from(wbout);

      // Save using Electron API
      if (window.electronAPI?.documentCreate) {
        const parentPath = filePath.substring(0, Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/')));
        
        const result = await window.electronAPI.documentCreate({
          name: fileName,
          parentPath: parentPath,
          content: buffer.toString('base64'),
          isBinary: true,
          type: 'xlsx'
        });

        if (result.success) {
          console.log('[ExcelEditor] Spreadsheet saved successfully');
          onSave?.();
        } else {
          throw new Error(result.error || 'Save failed');
        }
      }

      setSaving(false);
    } catch (err) {
      console.error('[ExcelEditor] Error saving spreadsheet:', err);
      setError(err instanceof Error ? err.message : 'Failed to save spreadsheet');
      setSaving(false);
    }
  };

  const downloadSpreadsheet = () => {
    if (!workbook) return;

    XLSX.writeFile(workbook, fileName);
    console.log('[ExcelEditor] Spreadsheet downloaded');
  };

  const addSheet = () => {
    if (!workbook) return;

    const newSheetName = `Feuille${workbook.SheetNames.length + 1}`;
    const newWorksheet = XLSX.utils.aoa_to_sheet([[]]);
    
    XLSX.utils.book_append_sheet(workbook, newWorksheet, newSheetName);
    setWorkbook({ ...workbook });
    setActiveSheet(workbook.SheetNames.length - 1);
    
    console.log('[ExcelEditor] New sheet added:', newSheetName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Table className="w-16 h-16 mx-auto mb-4 text-green-500 animate-pulse" />
          <p className="text-lg">Chargement du tableur...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-500">
          <p className="text-lg font-semibold">Erreur</p>
          <p>{error}</p>
          <Button onClick={loadSpreadsheet} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b p-2 flex items-center gap-2 bg-gray-50 dark:bg-gray-900">
        <Button
          onClick={saveSpreadsheet}
          disabled={saving}
          size="sm"
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
        <Button
          onClick={downloadSpreadsheet}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Télécharger
        </Button>
        <Button
          onClick={addSheet}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle feuille
        </Button>
        <div className="ml-auto text-sm text-gray-500">
          {fileName}
        </div>
      </div>

      {/* Sheet tabs */}
      {workbook && workbook.SheetNames.length > 1 && (
        <div className="border-b p-2 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 overflow-x-auto">
          {workbook.SheetNames.map((sheetName, index) => (
            <Button
              key={index}
              onClick={() => setActiveSheet(index)}
              size="sm"
              variant={activeSheet === index ? "default" : "outline"}
              className="whitespace-nowrap"
            >
              {sheetName}
            </Button>
          ))}
        </div>
      )}

      {/* Handsontable Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-white dark:bg-gray-900"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
