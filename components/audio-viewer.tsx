import React, { useRef, useEffect, useState } from "react";
import WaveSurfer from "wavesurfer.js";

interface AudioViewerProps {
  src: string;
  themeColor?: string;
  className?: string;
}

export const AudioViewer: React.FC<AudioViewerProps> = ({ src, themeColor = "#2563eb", className }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (waveformRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#e5e7eb",
        progressColor: themeColor,
        barWidth: 3,
        height: 80,
        responsive: true,
        cursorColor: themeColor,
      });
      wavesurferRef.current.load(src);
      wavesurferRef.current.on("play", () => setIsPlaying(true));
      wavesurferRef.current.on("pause", () => setIsPlaying(false));
    }
    return () => {
      wavesurferRef.current?.destroy();
    };
  }, [src, themeColor]);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  return (
    <div className={`audio-viewer-container ${className || ""}`} style={{ background: "#18181b", borderRadius: 8, padding: 8 }}>
      {/* Barre outils personnalisée en haut */}
      <div style={{ background: themeColor, color: "#fff", padding: "8px 16px", borderRadius: 6, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 600 }}>Lecteur audio</span>
        <button onClick={handlePlayPause} style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}>
          {isPlaying ? "⏸" : "▶"}
        </button>
      </div>
      <div ref={waveformRef} style={{ width: "100%", minHeight: 80 }} />
    </div>
  );
};
