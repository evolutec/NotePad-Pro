import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  file: string; // Base64 encoded string or URL
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ file }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const goToPrevPage = () =>
    setPageNumber((prevPageNumber) => Math.max(prevPageNumber - 1, 1));
  const goToNextPage = () =>
    setPageNumber((prevPageNumber) => Math.min(prevPageNumber + 1, numPages || 1));

  return (
    <div className="flex flex-col items-center p-4">
      <div className="mb-4 flex space-x-2">
        <button
          onClick={goToPrevPage}
          disabled={pageNumber <= 1}
          className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
        >
          Previous
        </button>
        <span className="self-center">
          Page {pageNumber} of {numPages || "--"}
        </span>
        <button
          onClick={goToNextPage}
          disabled={pageNumber >= (numPages || 1)}
          className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="w-full max-w-3xl border border-gray-300 shadow-lg overflow-auto">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => console.error("Error loading PDF document:", error)}
        >
          <Page pageNumber={pageNumber} width={Math.min(window.innerWidth * 0.7, 800)} />
        </Document>
      </div>
    </div>
  );
};