import React from "react";
import {
  FileText,
  ArrowLeft,
  Printer,
  Shield,
  Info,
  Settings,
  Download,
} from "lucide-react";

// Types de tuiles export dynamiques
const EXPORT_FORMATS: Record<string, Array<{ label: string; ext: string; color: string; icon?: React.ReactNode }>> = {
  document: [
    { label: "DOCX", ext: "docx", color: "#2563eb" },
    { label: "PDF", ext: "pdf", color: "#dc2626" },
    { label: "ODT", ext: "odt", color: "#0891b2" },
    { label: "TXT", ext: "txt", color: "#6b7280" },
    { label: "RTF", ext: "rtf", color: "#a78bfa" },
    { label: "HTML", ext: "html", color: "#65a30d" },
    { label: "EPUB", ext: "epub", color: "#38bdf8" },
    { label: "FB2", ext: "fb2", color: "#fbbf24" },
    { label: "JPG", ext: "jpg", color: "#818cf8" },
    { label: "PNG", ext: "png", color: "#f472b6" },
  ],
  image: [
    { label: "JPG", ext: "jpg", color: "#818cf8" },
    { label: "PNG", ext: "png", color: "#f472b6" },
    { label: "PDF", ext: "pdf", color: "#dc2626" },
  ],
  video: [
    { label: "MP4", ext: "mp4", color: "#2563eb" },
    { label: "AVI", ext: "avi", color: "#a78bfa" },
    { label: "MOV", ext: "mov", color: "#0891b2" },
    { label: "WEBM", ext: "webm", color: "#65a30d" },
  ],
  audio: [
    { label: "MP3", ext: "mp3", color: "#2563eb" },
    { label: "WAV", ext: "wav", color: "#a78bfa" },
    { label: "OGG", ext: "ogg", color: "#0891b2" },
  ],
  draw: [
    { label: "PNG", ext: "png", color: "#f472b6" },
    { label: "JPG", ext: "jpg", color: "#818cf8" },
    { label: "PDF", ext: "pdf", color: "#dc2626" },
  ],
};

export interface OnlyOfficeFileMenuProps {
  type: "document" | "image" | "video" | "audio" | "draw";
  onClose: () => void;
  onExport: (format: string) => void;
}

export const OnlyOfficeFileMenu: React.FC<OnlyOfficeFileMenuProps> = ({ type, onClose, onExport }) => {
  const formats = EXPORT_FORMATS[type] || [];
  return (
    <div className="absolute inset-0 flex z-50" style={{ top: '40px' }}>
      <div className="w-80 bg-[#23272b] text-white flex flex-col border-r border-neutral-800">
        <button className="flex items-center gap-2 px-4 py-3 hover:bg-neutral-700" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" /> Retour
        </button>
        <div className="flex flex-col gap-1 mt-2">
          <button className="flex items-center gap-2 px-4 py-2 font-semibold bg-[#23272b] border-l-4 border-blue-500">
            <FileText className="h-5 w-5" /> Télécharger comme
          </button>
          <button className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-700">
            <Printer className="h-5 w-5" /> Imprimer
          </button>
          <button className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-700">
            <Shield className="h-5 w-5" /> Protéger
          </button>
          <button className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-700">
            <Info className="h-5 w-5" /> Info
          </button>
        </div>
        <div className="flex-1" />
        <button className="flex items-center gap-2 px-4 py-3 text-xs text-neutral-400 hover:bg-neutral-700">
          <Settings className="h-4 w-4" /> Paramètres avancés
        </button>
      </div>
      <div className="flex-1 bg-[#181a1b] flex flex-col items-center justify-center">
        <div className="grid grid-cols-4 gap-6">
          {formats.map((f) => (
            <button
              key={f.ext}
              className="flex flex-col items-center justify-center gap-2 w-28 h-28 rounded-lg shadow bg-[#23272b] hover:scale-105 transition-transform border-b-4"
              style={{ borderColor: f.color }}
              onClick={() => onExport(f.ext)}
            >
              <Download className="h-8 w-8" style={{ color: f.color }} />
              <span className="font-bold text-lg" style={{ color: f.color }}>{f.label}</span>
              <span className="text-xs text-neutral-400">.{f.ext}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
