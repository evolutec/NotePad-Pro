import React, { useState } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

interface PdfViewerProps {
  file: string; // Base64 string or URL
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ file }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("PdfViewer: file prop received", file ? "yes" : "no", file ? file.substring(0, 50) + "..." : "");
  console.log("PdfViewer: workerSrc", pdfjs.GlobalWorkerOptions.workerSrc);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log("PDF loaded successfully with", numPages, "pages");
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF document:", error);
    setError(`Failed to load PDF: ${error.message}`);
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
    <div className="flex flex-col items-center p-4">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={goToPrevPage}
          disabled={pageNumber <= 1 || loading}
          className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-w-[100px] text-center"
        >
          Précédent
        </button>
        <span className="text-gray-900 dark:text-gray-100 font-medium px-4">
          Page {pageNumber} sur {numPages || "--"}
        </span>
        <button
          onClick={goToNextPage}
          disabled={pageNumber >= (numPages || 1) || loading}
          className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-w-[100px] text-center"
        >
          Suivant
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading PDF...</p>
        </div>
      )}

      <div className="w-full max-w-3xl border border-gray-300 shadow-lg overflow-auto">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2">Loading PDF...</span>
            </div>
          }
        >
          {!loading && <Page pageNumber={pageNumber} width={Math.min(window.innerWidth * 0.7, 800)} />}
        </Document>
      </div>
    </div>
  );
};
