import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { NoteEditor } from './note-editor';
import { DocxViewer } from './docx-viewer';
import { ExcelViewer } from './excel-viewer';
import { PowerPointViewer } from './powerpoint-viewer';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { FileText, Download, ExternalLink, AlertCircle } from 'lucide-react';

// Dynamically import DocViewer to avoid SSR issues
const DocViewer = dynamic(() => import('react-doc-viewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

interface DocumentViewerProps {
  filePath: string;
  fileName: string;
  fileType?: string;
  onClose?: () => void;
}

export function DocumentViewer({ filePath, fileName, fileType, onClose }: DocumentViewerProps) {
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTextFile, setIsTextFile] = useState(false);

  // Check if file is a text-based format that should use the note editor
  const textExtensions = ['.txt', '.csv', '.tsv', '.md'];
  // All supported document formats - react-doc-viewer supports many formats
  const documentExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.rtf', '.odt', '.ods', '.odp'];
  // Image formats
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.gif', '.svg', '.webp'];

  // Debug logging
  console.log('DocumentViewer Debug:', {
    filePath,
    fileName,
    fileType,
    fileExtension: '.' + fileName.split('.').pop()?.toLowerCase(),
    isTextFile: textExtensions.includes('.' + fileName.split('.').pop()?.toLowerCase()),
    isDocumentFile: documentExtensions.includes('.' + fileName.split('.').pop()?.toLowerCase()),
    isImageFile: imageExtensions.includes('.' + fileName.split('.').pop()?.toLowerCase())
  });

  // No useEffect needed - we render directly based on file type

  const getMimeType = (extension: string): string => {
    const ext = extension.toLowerCase().replace('.', '');
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'rtf': 'application/rtf',
      'odt': 'application/vnd.oasis.opendocument.text',
      'ods': 'application/vnd.oasis.opendocument.spreadsheet',
      'odp': 'application/vnd.oasis.opendocument.presentation',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml',
      'webp': 'image/webp'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  };

  const getFileExtension = (filename: string): string => {
    return '.' + filename.split('.').pop()?.toLowerCase();
  };

  const getDocumentType = (filename: string): string => {
    const ext = getFileExtension(filename);
    const textExtensions = ['.txt', '.csv', '.tsv', '.md'];
    const documentExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.rtf', '.odt', '.ods', '.odp'];
    
    if (textExtensions.includes(ext)) return 'text';
    if (documentExtensions.includes(ext)) return 'office';
    return 'unknown';
  };

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

  // Prepare documents array for DocViewer
  const fileExtension = getFileExtension(fileName);

  // Use local HTTP server to serve files (running on port 38274)
  // This allows react-doc-viewer to access local files without CORS issues
  // Encode the full path properly as a query parameter to avoid issues with : and \
  const fileUrl = `http://localhost:38274/?file=${encodeURIComponent(filePath)}`;
  
  const docs = [{
    uri: fileUrl,
    fileType: fileType || fileExtension.substring(1),
    fileName: fileName,
  }];

  console.log('DocViewer docs:', docs);
  console.log('File path for DocViewer:', filePath);
  console.log('File URL for DocViewer:', fileUrl);
  console.log('File extension:', fileExtension);
  console.log('File type being used:', fileType || fileExtension.substring(1));

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header with file info and actions */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">{fileName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">
                {getFileExtension(fileName).toUpperCase()}
              </Badge>
              <Badge variant="outline">
                {getDocumentType(fileName) === 'text' ? 'Fichier texte' :
                 getDocumentType(fileName) === 'office' ? 'Document Office' : 'Document'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
          <Button onClick={handleOpenExternal} variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ouvrir externe
          </Button>
          {onClose && (
            <Button onClick={onClose} variant="outline" size="sm">
              Fermer
            </Button>
          )}
        </div>
      </div>

      {/* Document content - takes all available space */}
      <div className="flex-1 overflow-hidden">
        {(() => {
          console.log('[DocumentViewer] Rendering content for:', fileName, 'isTextFile:', isTextFile, 'fileExtension:', fileExtension);
          return isTextFile ? (
            // Use NoteEditor for text files
            <div className="h-full w-full">
              <NoteEditor
                selectedNote={filePath}
                selectedFolder={''}
              />
            </div>
          ) : (
            // Use appropriate viewer based on file type
            <div className="h-full w-full overflow-hidden bg-background">
              {(() => {
                console.log('[DocumentViewer] Checking file type:', fileExtension);
                
                // Word documents (.doc, .docx)
                if (fileExtension === '.docx' || fileExtension === '.doc') {
                  console.log('[DocumentViewer] Rendering DocxViewer for:', fileName);
                  return <DocxViewer filePath={filePath} fileName={fileName} />;
                }
                
                // Excel spreadsheets (.xls, .xlsx)
                else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
                  console.log('[DocumentViewer] Rendering ExcelViewer for:', fileName);
                  return <ExcelViewer filePath={filePath} fileName={fileName} />;
                }

                // PowerPoint presentations (.ppt, .pptx)
                else if (fileExtension === '.pptx' || fileExtension === '.ppt') {
                  console.log('[DocumentViewer] Rendering PowerPointViewer for:', fileName);
                  return <PowerPointViewer filePath={filePath} fileName={fileName} />;
                }

                // PDF files
                else if (fileExtension === '.pdf') {
                  console.log('[DocumentViewer] Rendering PDF iframe');
                  return (
                    <iframe
                      src={fileUrl}
                      className="w-full h-full border-0"
                      title={fileName}
                    />
                  );
                }
                
                // PowerPoint and other Office documents (.ppt, .pptx)
                else {
                  console.log('[DocumentViewer] Rendering download card for:', fileExtension);
                  return (
              // For other Office documents (.xlsx, .pptx), show download option
              <div className="h-full w-full flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <Card className="max-w-2xl w-full shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <FileText className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xl font-bold">{fileName}</div>
                        <div className="text-sm font-normal text-muted-foreground mt-1 flex items-center gap-2">
                          <Badge variant="secondary">{fileExtension.toUpperCase()}</Badge>
                          <span>•</span>
                          <span>Document Office</span>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Document Info */}
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2.5 border border-muted">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-semibold">
                          {fileExtension === '.pptx' || fileExtension === '.ppt' ? 'Présentation PowerPoint' :
                           'Document Office'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start text-sm pt-1">
                        <span className="text-muted-foreground">Emplacement:</span>
                        <span className="font-mono text-xs text-right max-w-xs truncate" title={filePath}>
                          {filePath.split('\\').slice(-3).join('\\')}
                        </span>
                      </div>
                    </div>

                    {/* Info Message */}
                    <div className="border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-r space-y-2">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        <span>💡</span>
                        <span>Aperçu non disponible</span>
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                        L'aperçu des fichiers {
                          fileExtension === '.xlsx' || fileExtension === '.xls' ? 'Excel' :
                          fileExtension === '.pptx' || fileExtension === '.ppt' ? 'PowerPoint' :
                          'Office'
                        } n'est pas encore disponible. Ouvrez le fichier avec l'application appropriée.
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3">
                      <Button 
                        onClick={handleOpenExternal} 
                        className="w-full h-12 text-base font-semibold"
                        size="lg"
                      >
                        <ExternalLink className="h-5 w-5 mr-3" />
                        Ouvrir avec {
                          fileExtension === '.pptx' || fileExtension === '.ppt' ? 'PowerPoint' :
                          'l\'application'
                        }
                      </Button>
                      
                      <Button 
                        onClick={handleDownload} 
                        variant="outline" 
                        className="w-full h-12 text-base font-semibold"
                        size="lg"
                      >
                        <Download className="h-5 w-5 mr-3" />
                        Télécharger une copie
                      </Button>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Fichier chargé</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
                }
              })()}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
