import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Video as VideoIcon, Camera, Square, Upload } from "lucide-react";

export interface VideoMeta {
  id: string;
  name: string;
  type: string;
  parentPath: string;
  createdAt: string;
  tags?: string[];
}

export interface AddVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onVideoCreated: (video: VideoMeta) => void;
}

export function AddVideoDialog({ open, onOpenChange, parentPath, onVideoCreated }: AddVideoDialogProps) {
  // Liste des caméras disponibles
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>(undefined);

  // Détection des caméras à l'ouverture du modal
  useEffect(() => {
    if (open) {
      navigator.mediaDevices?.enumerateDevices().then(devices => {
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoInputs);
        if (videoInputs.length > 0 && !selectedCameraId) {
          setSelectedCameraId(videoInputs[0].deviceId);
        }
      });
    }
  }, [open]);
  const [videoName, setVideoName] = useState("");
  const [videoType, setVideoType] = useState<string>("mp4");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [recordingMode, setRecordingMode] = useState<'upload' | 'record'>('upload');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLCanvasElement>(null);

  // Preview caméra live optimisé
  useEffect(() => {
    let animationFrameId: number;
    let video: HTMLVideoElement | null = null;
    let isMounted = true;

    if (recordingMode === 'record' && open) {
      setCreationError(null);
      console.log('[DEBUG] Test accès caméra...');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('[DEBUG] navigator.mediaDevices ou getUserMedia non disponible');
        setCreationError("La caméra n'est pas disponible sur ce système.");
        // ...canvas fallback...
        const canvas = videoPreviewRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#222';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = '20px sans-serif';
            ctx.fillText('Aucun flux vidéo', 40, 120);
          }
        }
        return;
      }
      console.log('[DEBUG] getUserMedia disponible, tentative d’accès au flux vidéo...');
      const videoConstraints: MediaStreamConstraints = selectedCameraId
        ? { video: { deviceId: { exact: selectedCameraId } } }
        : { video: true };
      navigator.mediaDevices.getUserMedia(videoConstraints)
        .then(mediaStream => {
          console.log('[DEBUG] Flux vidéo obtenu:', mediaStream);
          setStream(mediaStream);
          const canvas = videoPreviewRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            video = document.createElement('video');
            video.srcObject = mediaStream;
            video.autoplay = true;
            video.muted = true;
            video.playsInline = true;
            video.onloadedmetadata = () => {
              console.log('[DEBUG] Métadonnées vidéo chargées, démarrage du rendu...');
              video.play();
              const draw = () => {
                if (!isMounted || recordingMode !== 'record') return;
                if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
                  if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    // Rectangle de debug vert
                    ctx.save();
                    ctx.strokeStyle = 'lime';
                    ctx.lineWidth = 6;
                    ctx.strokeRect(10, 10, canvas.width-20, canvas.height-20);
                    ctx.restore();
                  }
                  console.log('[DEBUG] Frame vidéo dessinée sur le canvas');
                } else {
                  if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#222';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#fff';
                    ctx.font = '20px sans-serif';
                    ctx.fillText('Aucun flux vidéo', 40, 120);
                  }
                  console.log('[DEBUG] Aucun flux vidéo à dessiner');
                }
                animationFrameId = requestAnimationFrame(draw);
              };
              draw();
            };
          }
        })
        .catch((err) => {
          console.log('[DEBUG] Erreur accès caméra:', err);
          setCreationError("Impossible d'accéder à la caméra.");
          // Affiche un message dans le canvas
          const canvas = videoPreviewRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = '#222';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = '#fff';
              ctx.font = '20px sans-serif';
              ctx.fillText('Aucun flux vidéo', 40, 120);
            }
          }
        });
    }
    // Nettoyage du stream et arrêt du rendu à la fermeture
    return () => {
      isMounted = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      video = null;
    };
  }, [recordingMode, open]);

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  // ...logique création vidéo à compléter selon ton backend...

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <VideoIcon className="h-5 w-5" />
            Créer une nouvelle vidéo
          </DialogTitle>
          <div className="h-1 w-full bg-blue-500 mt-2" />
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            {/* Sélection de la caméra */}
            {cameras.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="camera-select">Sélectionner la caméra</Label>
                <select
                  id="camera-select"
                  className="w-full border rounded p-2 bg-zinc-900 text-white shadow-sm"
                  value={selectedCameraId}
                  onChange={e => setSelectedCameraId(e.target.value)}
                >
                  {cameras.map(cam => (
                    <option key={cam.deviceId} value={cam.deviceId}>{cam.label || `Caméra ${cam.deviceId}`}</option>
                  ))}
                </select>
              </div>
            )}
            <Label htmlFor="video-name">Nom de la vidéo</Label>
            <Input
              id="video-name"
              placeholder="Ex: Conférence, Vlog, Tutoriel..."
              value={videoName}
              onChange={(e) => setVideoName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Mode de création</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={recordingMode === "upload" ? "default" : "outline"}
                onClick={() => setRecordingMode("upload")}
                className="h-12"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importer
              </Button>
              <Button
                variant={recordingMode === "record" ? "default" : "outline"}
                onClick={() => setRecordingMode("record")}
                className="h-12"
              >
                <Camera className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </div>
          {recordingMode === 'record' && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden border-2 border-gray-300" style={{ zIndex: 1, minHeight: '256px' }}>
                <canvas
                  ref={videoPreviewRef}
                  width={640}
                  height={480}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '256px',
                    backgroundColor: '#222',
                    opacity: 1,
                    zIndex: 100,
                    position: 'relative',
                    border: '4px solid lime',
                  }}
                />
                {/* DEBUG: Affichage natif du flux vidéo */}
                {stream && (
                  <video
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: 10,
                      width: '200px',
                      height: '150px',
                      border: '2px solid orange',
                      zIndex: 200,
                      background: '#000',
                    }}
                    autoPlay
                    muted
                    playsInline
                    ref={el => { if (el && stream) el.srcObject = stream; }}
                  />
                )}
                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900" style={{ zIndex: 3 }}>
                    <div className="text-center">
                      <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Cliquez sur "Enregistrer" pour accéder à la caméra</p>
                    </div>
                  </div>
                )}
                {stream && (
                  <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs" style={{ zIndex: 4 }}>
                    ● En direct
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Étiquettes</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une étiquette..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button type="button" onClick={addTag} size="sm" variant="outline">
                Ajouter
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span key={tag} className="bg-muted px-2 py-1 rounded text-xs cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </span>
              ))}
            </div>
          </div>
          {creationError && (
            <div className="text-sm text-red-500 mb-2">{creationError}</div>
          )}
          {creationSuccess && (
            <div className="text-sm text-green-600 mb-2">{creationSuccess}</div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuler
            </Button>
            <Button disabled={!videoName.trim()} className="flex-1">
              Créer la vidéo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}