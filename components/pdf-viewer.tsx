import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { ChevronLeft, ChevronRight } from "lucide-react";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
}

interface PdfViewerProps {
  file: string; // Base64 string or URL
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ file }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ensure worker is loaded
    console.log("PdfViewer: workerSrc", pdfjs.GlobalWorkerOptions.workerSrc);
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      console.warn("PDF worker not configured, setting default");
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    }
  }, []);

  console.log("PdfViewer: file prop received", file ? "yes" : "no", file ? file.substring(0, 50) + "..." : "");

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log("PDF loaded successfully with", numPages, "pages");
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF document:", error);
    setError(`Échec du chargement du PDF: ${error.message}`);
    setLoading(false);
  };

  const onPageLoadSuccess = (page: any) => {
    console.log("Page loaded successfully:", page.pageNumber);
  };

  const onPageLoadError = (error: Error, pageNumber: number) => {
    console.error(`Error loading page ${pageNumber}:`, error);
  };

  const goToPrevPage = () =>
    setPageNumber((prevPageNumber) => Math.max(prevPageNumber - 1, 1));
  const goToNextPage = () =>
    setPageNumber((prevPageNumber) => Math.min(prevPageNumber + 1, numPages || 1));

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">PDF Loading Error</h3>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Toolbar - same style as DrawingCanvas */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToPrevPage}
              disabled={pageNumber <= 1 || loading}
              title="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-foreground min-w-[80px] text-center">
              Page {pageNumber} / {numPages || "--"}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNextPage}
              disabled={pageNumber >= (numPages || 1) || loading}
              title="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {numPages ? `${numPages} page${numPages > 1 ? 's' : ''}` : 'Chargement...'}
            </span>
          </div>
        </div>
      </div>

      {/* PDF content - takes all available space */}
      <div className="flex-1 overflow-auto flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-muted-foreground">Chargement du PDF...</p>
          </div>
        )}

        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          options={{
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
          }}
          loading={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2">Chargement du PDF...</span>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-lg font-semibold mb-2">Erreur de chargement PDF</h3>
                <p className="text-sm text-gray-600">Impossible de charger le document PDF</p>
              </div>
            </div>
          }
        >
          {!loading && numPages && <Page 
            pageNumber={pageNumber} 
            width={typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.7, 800) : 800}
            onLoadSuccess={onPageLoadSuccess}
            onLoadError={(error) => onPageLoadError(error, pageNumber)}
          />}
        </Document>
      </div>
    </div>
  );
};
