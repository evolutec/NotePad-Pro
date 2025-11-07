'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Save, Download, FileText } from 'lucide-react';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';

interface OfficeWordEditorProps {
  filePath: string;
  fileName: string;
  onSave?: () => void;
}

export function OfficeWordEditor({ filePath, fileName, onSave }: OfficeWordEditorProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDocument();
  }, [filePath]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[WordEditor] Loading document:', filePath);

      // Get file URL from local server
      const fileUrl = `http://localhost:38274?file=${encodeURIComponent(filePath)}`;
      
      // Fetch the file
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }

      const arrayBuffer = await response.arrayBuffer();

      // Convert DOCX to HTML using mammoth
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      console.log('[WordEditor] Document loaded, HTML length:', result.value.length);
      setContent(result.value);
      
      if (editorRef.current) {
        editorRef.current.innerHTML = result.value;
      }

      setLoading(false);
    } catch (err) {
      console.error('[WordEditor] Error loading document:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document');
      setLoading(false);
    }
  };

  const saveDocument = async () => {
    try {
      setSaving(true);
      console.log('[WordEditor] Saving document...');

      if (!editorRef.current) {
        throw new Error('Editor not ready');
      }

      // Get HTML content from editor
      const htmlContent = editorRef.current.innerHTML;

      // Convert HTML back to DOCX (simplified version)
      // For a more robust solution, you'd parse the HTML properly
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun(editorRef.current.innerText)
              ]
            })
          ]
        }]
      });

      // Generate DOCX file
      const blob = await Packer.toBlob(doc);
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Save using Electron API
      if (window.electronAPI?.documentCreate) {
        const result = await window.electronAPI.documentCreate({
          name: fileName,
          parentPath: filePath.substring(0, filePath.lastIndexOf('\\')),
          content: buffer.toString('base64'),
          isBinary: true,
          type: 'docx'
        });

        if (result.success) {
          console.log('[WordEditor] Document saved successfully');
          onSave?.();
        } else {
          throw new Error(result.error || 'Save failed');
        }
      }

      setSaving(false);
    } catch (err) {
      console.error('[WordEditor] Error saving document:', err);
      setError(err instanceof Error ? err.message : 'Failed to save document');
      setSaving(false);
    }
  };

  const downloadDocument = async () => {
    try {
      console.log('[WordEditor] Downloading document...');

      if (!editorRef.current) {
        throw new Error('Editor not ready');
      }

      // Create DOCX from current content
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun(editorRef.current.innerText)
              ]
            })
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('[WordEditor] Document downloaded');
    } catch (err) {
      console.error('[WordEditor] Error downloading document:', err);
      setError(err instanceof Error ? err.message : 'Failed to download document');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-lg">Chargement du document...</p>
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
          <Button onClick={loadDocument} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b p-2 flex items-center gap-2 bg-gray-50 dark:bg-gray-900">
        <Button
          onClick={saveDocument}
          disabled={saving}
          size="sm"
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
        <Button
          onClick={downloadDocument}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Télécharger
        </Button>
        <div className="ml-auto text-sm text-gray-500">
          {fileName}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <div
          ref={editorRef}
          contentEditable
          className="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 min-h-full outline-none prose dark:prose-invert"
          style={{
            fontSize: '12pt',
            lineHeight: '1.6',
            fontFamily: 'Calibri, Arial, sans-serif'
          }}
          onInput={(e) => {
            setContent(e.currentTarget.innerHTML);
          }}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
}
