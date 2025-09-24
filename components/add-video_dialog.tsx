import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Video as VideoIcon, Camera, Square, Upload, Image, Mic, FolderOpen } from "lucide-react";
import { GenericModal, ModalTab, ModalField, ModalButton } from "@/components/ui/generic-modal";

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
  onRefreshTree?: () => void;
}

export function AddVideoDialog({ open, onOpenChange, parentPath, onVideoCreated, onRefreshTree }: AddVideoDialogProps) {
  // State management
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');
  const [selectedPath, setSelectedPath] = useState<string>(parentPath);

  // Upload tab state
  const [videoName, setVideoName] = useState("");
  const [videoType, setVideoType] = useState<string>("mp4");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Record tab state
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>(undefined);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string | undefined>(undefined);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [currentVideoFile, setCurrentVideoFile] = useState<string | null>(null);

  // Refs
  const videoPreviewRef = useRef<HTMLCanvasElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Device enumeration
  useEffect(() => {
    if (open) {
      navigator.mediaDevices?.enumerateDevices().then(devices => {
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        const audioInputs = devices.filter(d => d.kind === 'audioinput');

        setCameras(videoInputs);
        setMicrophones(audioInputs);

        if (videoInputs.length > 0 && !selectedCameraId) {
          setSelectedCameraId(videoInputs[0].deviceId);
        }
        if (audioInputs.length > 0 && !selectedMicrophoneId) {
          setSelectedMicrophoneId(audioInputs[0].deviceId);
        }
      });
    }
  }, [open]);

  // Camera preview effect
  useEffect(() => {
    let animationFrameId: number;
    let video: HTMLVideoElement | null = null;
    let isMounted = true;

    if (activeTab === 'record' && open) {
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
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Aucun flux vidéo disponible', canvas.width / 2, canvas.height / 2);
          }
        }
        return;
      }
      console.log('[DEBUG] getUserMedia disponible, tentative d\'accès au flux vidéo...');
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
              video?.play();
              const draw = () => {
                if (!isMounted || activeTab !== 'record') return;
                if (video && video.readyState >= 2) {
                  if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    // Rectangle de debug vert
                    ctx.save();
                    ctx.strokeStyle = '#00ff00';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(10, 10, canvas.width-20, canvas.height-20);
                    ctx.restore();
                  }
                  console.log('[DEBUG] Frame vidéo dessinée sur le canvas');
                } else {
                  if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '18px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Chargement du flux vidéo...', canvas.width / 2, canvas.height / 2);
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
              ctx.fillStyle = '#1a1a1a';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = '#ff6b6b';
              ctx.font = '18px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('Erreur d\'accès caméra', canvas.width / 2, canvas.height / 2);
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
  }, [activeTab, open, selectedCameraId]);

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

  // Import video functionality
  const importVideo = async () => {
    if (!selectedFile || !videoName.trim()) {
      setCreationError("Veuillez sélectionner un fichier vidéo et entrer un nom.");
      return;
    }

    try {
      // Read the selected file as binary data
      const fileData = await selectedFile.arrayBuffer();

      // Create file name with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${videoName.trim()}_${timestamp}.${videoType}`;
      const filePath = selectedPath ? `${selectedPath}/${fileName}` : fileName;

      // Create video file using Electron API
      if (window.electronAPI?.videoCreate) {
        const result = await window.electronAPI.videoCreate({
          name: fileName,
          type: videoType,
          parentPath: selectedPath,
          tags: tags,
          content: fileData,
          isBinary: true,
        });

        if (result.success) {
          setCreationSuccess("Vidéo importée avec succès !");
          // Trigger tree refresh
          if (onRefreshTree) {
            onRefreshTree();
          }
          setTimeout(() => {
            setCreationSuccess(null);
            onOpenChange(false);
          }, 2000);
        } else {
          setCreationError(result.error || "Erreur lors de l'importation de la vidéo.");
        }
      }
    } catch (error) {
      console.error('Error importing video:', error);
      setCreationError("Erreur lors de l'importation de la vidéo.");
    }
  };

  // Take photo functionality
  const takePhoto = async () => {
    if (!videoPreviewRef.current || !videoName.trim()) {
      setCreationError("Veuillez entrer un nom pour la photo.");
      return;
    }

    try {
      const canvas = videoPreviewRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setCreationError("Impossible d'accéder au contexte du canvas.");
        return;
      }

      // Create image from canvas
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setCreationError("Impossible de créer l'image depuis le canvas.");
          return;
        }

        // Create file name for photo
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const photoName = `${videoName.trim()}_${timestamp}.png`;
        const photoPath = selectedPath ? `${selectedPath}/${photoName}` : photoName;

        // Create photo file using Electron API
        if (window.electronAPI?.imageCreate) {
          const result = await window.electronAPI.imageCreate({
            name: photoName,
            type: 'png',
            parentPath: selectedPath,
            tags: tags,
            content: blob,
            isBinary: true,
          });

          if (result.success) {
            setCreationSuccess("Photo capturée avec succès !");
            // Trigger tree refresh
            if (onRefreshTree) {
              onRefreshTree();
            }
            setTimeout(() => {
              setCreationSuccess(null);
            }, 2000);
          } else {
            setCreationError(result.error || "Erreur lors de la création de la photo.");
          }
        }
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Error taking photo:', error);
      setCreationError("Erreur lors de la capture de la photo.");
    }
  };

  // Start/Stop recording functionality
  const toggleRecording = async () => {
    if (!stream || !videoName.trim()) {
      setCreationError("Veuillez entrer un nom pour la vidéo et vous assurer que la caméra est active.");
      return;
    }

    if (isRecording) {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        setIsRecording(false);

        // Save the recorded video
        mediaRecorder.ondataavailable = async (event) => {
          if (event.data && event.data.size > 0) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const videoFileName = `${videoName.trim()}_${timestamp}.webm`;
            const videoPath = selectedPath ? `${selectedPath}/${videoFileName}` : videoFileName;

            if (window.electronAPI?.videoCreate) {
              const result = await window.electronAPI.videoCreate({
                name: videoFileName,
                type: 'webm',
                parentPath: selectedPath,
                tags: tags,
                content: event.data,
                isBinary: true,
              });

              if (result.success) {
                setCreationSuccess("Vidéo enregistrée avec succès !");
                setCurrentVideoFile(result.path || null);
                // Trigger tree refresh
                if (onRefreshTree) {
                  onRefreshTree();
                }
                setTimeout(() => {
                  setCreationSuccess(null);
                }, 2000);
              } else {
                setCreationError(result.error || "Erreur lors de la sauvegarde de la vidéo.");
              }
            }
          }
        };
      }
    } else {
      // Start recording
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const videoFileName = `${videoName.trim()}_${timestamp}.webm`;
        const videoPath = selectedPath ? `${selectedPath}/${videoFileName}` : videoFileName;

        // Create initial video file
        if (window.electronAPI?.videoCreate) {
          const result = await window.electronAPI.videoCreate({
            name: videoFileName,
            type: 'webm',
            parentPath: selectedPath,
            tags: tags,
            content: '',
            isBinary: true,
          });

              if (result.success) {
                setCurrentVideoFile(result.path || null);
              }
        }

        // Start MediaRecorder
        const recorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9,opus'
        });

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            setRecordedChunks(prev => [...prev, event.data]);
          }
        };

        recorder.onstop = async () => {
          // Combine all chunks and save
          if (recordedChunks.length > 0) {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });

            if (window.electronAPI?.videoCreate && currentVideoFile) {
              const result = await window.electronAPI.videoCreate({
                name: videoFileName,
                type: 'webm',
                parentPath: selectedPath,
                tags: tags,
                content: blob,
                isBinary: true,
              });

              if (result.success) {
                setCreationSuccess("Vidéo enregistrée avec succès !");
                setTimeout(() => {
                  setCreationSuccess(null);
                }, 2000);
              } else {
                setCreationError(result.error || "Erreur lors de la sauvegarde de la vidéo.");
              }
            }
          }
        };

        setMediaRecorder(recorder);
        setRecordedChunks([]);
        recorder.start(1000); // Collect data every second
        setIsRecording(true);

        // Start recording timer
        const timer = setInterval(() => {
          setRecordingTime(prev => {
            if (recorder && recorder.state === 'recording') {
              return prev + 1;
            } else {
              clearInterval(timer);
              return prev;
            }
          });
        }, 1000);

      } catch (error) {
        console.error('Error starting recording:', error);
        setCreationError("Erreur lors du démarrage de l'enregistrement.");
      }
    }
  };

  // Define tabs for the GenericModal
  const tabs: ModalTab[] = [
    {
      id: 'upload',
      label: 'Importer',
      icon: <Upload className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="upload-path">Dossier de destination</Label>
            <div className="flex gap-2">
              <Input
                id="upload-path"
                value={selectedPath}
                onChange={(e) => setSelectedPath(e.target.value)}
                placeholder="Sélectionner le dossier..."
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (window.electronAPI?.selectFolder) {
                    const result = await window.electronAPI.selectFolder();
                    if (result && typeof result === 'object' && 'filePaths' in result && result.filePaths && result.filePaths.length > 0) {
                      setSelectedPath(result.filePaths[0]);
                    }
                  }
                }}
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-name">Nom de la vidéo</Label>
            <Input
              id="video-name"
              placeholder="Ex: Conférence, Vlog, Tutoriel..."
              value={videoName}
              onChange={(e) => setVideoName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Fichier vidéo</Label>
            <Input
              id="file-upload"
              type="file"
              accept="video/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              ref={fileInputRef}
            />
          </div>

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
        </div>
      )
    },
    {
      id: 'record',
      label: 'Enregistrer',
      icon: <Camera className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          {/* Device Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="camera-select">Caméra</Label>
              <select
                id="camera-select"
                className="w-full border rounded p-2 bg-zinc-900 text-white shadow-sm"
                value={selectedCameraId}
                onChange={e => setSelectedCameraId(e.target.value)}
              >
                {cameras.map(cam => (
                  <option key={cam.deviceId} value={cam.deviceId}>
                    {cam.label || `Caméra ${cam.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="microphone-select">Microphone</Label>
              <select
                id="microphone-select"
                className="w-full border rounded p-2 bg-zinc-900 text-white shadow-sm"
                value={selectedMicrophoneId}
                onChange={e => setSelectedMicrophoneId(e.target.value)}
              >
                {microphones.map(mic => (
                  <option key={mic.deviceId} value={mic.deviceId}>
                    {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="record-path">Dossier de destination</Label>
            <div className="flex gap-2">
              <Input
                id="record-path"
                value={selectedPath}
                onChange={(e) => setSelectedPath(e.target.value)}
                placeholder="Sélectionner le dossier..."
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (window.electronAPI?.selectFolder) {
                    const result = await window.electronAPI.selectFolder();
                    if (result && typeof result === 'object' && 'filePaths' in result && result.filePaths && result.filePaths.length > 0) {
                      setSelectedPath(result.filePaths[0]);
                    }
                  }
                }}
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="record-name">Nom de la vidéo</Label>
            <Input
              id="record-name"
              placeholder="Ex: Enregistrement caméra..."
              value={videoName}
              onChange={(e) => setVideoName(e.target.value)}
            />
          </div>

          {/* Live Preview - Centered Square */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Aperçu en direct
            </Label>
            <div className="flex justify-center">
              <div className="relative bg-black rounded-xl overflow-hidden border-2 border-gray-300 shadow-2xl" style={{ width: '400px', height: '400px' }}>
                <canvas
                  ref={videoPreviewRef}
                  width={400}
                  height={400}
                  style={{
                    display: 'block',
                    width: '400px',
                    height: '400px',
                    backgroundColor: '#000000',
                    opacity: 1,
                    position: 'relative',
                    border: '3px solid #00ff00',
                    borderRadius: '12px',
                  }}
                />

                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center text-white bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl">
                    <div className="text-center p-8">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                        <Camera className="h-10 w-10 opacity-50" />
                      </div>
                      <p className="text-lg font-medium mb-2">Aperçu de la caméra</p>
                      <p className="text-sm opacity-75">Sélectionnez une caméra pour voir l'aperçu</p>
                    </div>
                  </div>
                )}

                {stream && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg animate-pulse">
                    ● En direct
                  </div>
                )}

                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                    🔴 Enregistrement
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border">
            <Button
              variant="outline"
              className="flex-1 h-12 text-base font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!stream}
              onClick={takePhoto}
            >
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3">
                <Image className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Prendre une photo</div>
                <div className="text-xs opacity-75">Capture instantanée</div>
              </div>
            </Button>
            <Button
              disabled={!stream || isRecording}
              className="flex-1 h-12 text-base font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              onClick={toggleRecording}
            >
              {isRecording ? (
                <>
                  <div className="p-2 rounded-full bg-red-100 mr-3">
                    <Square className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Arrêter</div>
                    <div className="text-xs opacity-90">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2 rounded-full bg-green-100 mr-3">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Enregistrer</div>
                    <div className="text-xs opacity-90">Démarrer la vidéo</div>
                  </div>
                </>
              )}
            </Button>
          </div>

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
        </div>
      )
    }
  ];

  // Define buttons for the GenericModal
  const buttons: ModalButton[] = [
    {
      label: 'Importer la vidéo',
      variant: 'default',
      onClick: importVideo,
      disabled: !videoName.trim() || !selectedFile
    }
  ];

  return (
    <GenericModal
      open={open}
      onOpenChange={onOpenChange}
      title="Créer une nouvelle vidéo"
      icon={<VideoIcon className="h-6 w-6" />}
      description="Importez un fichier vidéo existant ou enregistrez une nouvelle vidéo avec votre caméra"
      colorTheme="purple"
      fileType="video"
      size="xl"
      tabs={tabs}
      buttons={buttons}
      showCancelButton={true}
      cancelLabel="Annuler"
      error={creationError}
      success={creationSuccess}
      showCloseButton={true}
      closeButtonPosition="top-right"
      showFooter={true}
    />
  );
}
