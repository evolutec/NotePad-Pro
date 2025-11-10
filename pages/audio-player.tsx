import { useEffect, useState } from "react";
import { AudioViewer } from "@/components/audio-viewer";

export default function AudioPlayerPage() {
  const [audioPath, setAudioPath] = useState<string>("");

  useEffect(() => {
    // Get audio path from URL params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const path = params.get('audioPath');
      if (path) {
        setAudioPath(decodeURIComponent(path));
      }
    }
  }, []);

  if (!audioPath) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        background: '#18181b',
        color: '#a3a3a3' 
      }}>
        Chargement du lecteur audio...
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100vh', 
      background: '#18181b',
      padding: 16,
      overflow: 'auto'
    }}>
      <AudioViewer src={audioPath} themeColor="#ec4899" />
    </div>
  );
}
