import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Video as VideoIcon, Camera, Square, Upload, Image, Mic, FolderOpen, Folder, Home } from "lucide-react";
import { GenericModal, ModalTab, ModalField, ModalButton } from "@/components/ui/generic-modal";
import { FolderSelectionModal, type FolderNode } from "@/components/ui/folder-selection-modal";
import RecordRTC, { RecordRTCPromisesHandler } from 'recordrtc';

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
  // Reset all fields when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab('upload');
      setVideoName("");
      setVideoType("mp4");
      setTags([]);
      setCurrentTag("");
      setSelectedFile(null);
      // Don't reset cameras/microphones IDs - let device enumeration handle them
      // setCameras([]);
      // setMicrophones([]);
      // setSelectedCameraId(undefined);
      // setSelectedMicrophoneId(undefined);
      setStream(null);
      setIsRecording(false);
      setRecordingTime(0);
      setRecorder(null);
      setCreationError(null);
      setCreationSuccess(null);
      setCurrentVideoFile(null);
      setParentId(undefined);
      setExistingFolders([]);
      setShowFolderModal(false);
    }
    
    // Cleanup timer on unmount or close
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
  }, [open]);
  // ...hooks et logique...

  // ...hooks et logique...

  // (Définition des boutons déplacée tout en bas, juste avant le return)
  // State management
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');

  // Pour forcer le useEffect caméra lors du changement d'onglet
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as 'upload' | 'record');
  };

  // Upload tab state
  const [videoName, setVideoName] = useState("");
  const [videoType, setVideoType] = useState<string>("mp4"); // Changed to mp4 as target format
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
  const [recorder, setRecorder] = useState<RecordRTCPromisesHandler | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [currentVideoFile, setCurrentVideoFile] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [existingFolders, setExistingFolders] = useState<any[]>([]);
  const [showFolderModal, setShowFolderModal] = useState(false);

  // Refs
  const videoPreviewRef = useRef<HTMLCanvasElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (open && window.electronAPI?.foldersScan) {
      window.electronAPI.foldersScan().then((scannedFolders: any[]) => {
        setExistingFolders(scannedFolders);
      });
    }
  }, [open]);

  // Convert folders to FolderNode format for the tree selector
  const folderNodes: FolderNode[] = React.useMemo(() => {
    // Handle the tree structure returned by foldersScan
    const convertTreeToNodes = (treeNode: any, parentId?: string): FolderNode[] => {
      if (!treeNode || typeof treeNode !== 'object') return [];

      const nodes: FolderNode[] = [];

      // Add the current node if it's a directory
      if (treeNode.isDirectory) {
        nodes.push({
          id: treeNode.path || `${parentId}-${treeNode.name}`,
          name: treeNode.name,
          path: treeNode.path,
          children: treeNode.children ? convertTreeToNodesFromArray(treeNode.children, treeNode.path) : [],
          parent: parentId
        });
      }

      return nodes;
    };

    const convertTreeToNodesFromArray = (children: any[], parentPath?: string): FolderNode[] => {
      if (!Array.isArray(children)) return [];

      return children
        .filter(child => child && child.isDirectory)
        .map(child => ({
          id: child.path || `${parentPath}-${child.name}`,
          name: child.name,
          path: child.path,
          children: child.children ? convertTreeToNodesFromArray(child.children, child.path) : [],
          parent: parentPath
        }));
    };

    // Handle both flat array of folders (from foldersLoad) and tree structure (from foldersScan)
    if (existingFolders.length > 0 && (existingFolders[0] as any).children) {
      // Tree structure from foldersScan
      return convertTreeToNodesFromArray((existingFolders[0] as any).children || []);
    } else {
      // Flat array structure from foldersLoad
      const buildTree = (folders: any[], parentId?: string): FolderNode[] => {
        return folders
          .filter(folder => folder.parentId === parentId)
          .map(folder => ({
            id: folder.id,
            name: folder.name,
            path: folder.path || folder.name,
            children: buildTree(folders, folder.id),
            parent: parentId
          }));
      };
      return buildTree(existingFolders);
    }
  }, [existingFolders]);

  // Handle folder selection
  const handleFolderSelect = (folderId: string | null, folderPath: string) => {
    // Use folderPath instead of folderId because we need the actual path for file creation
    setParentId(folderPath || undefined);
  };

  // Get selected folder name for display
  const getSelectedFolderName = React.useMemo(() => {
    console.log('=== getSelectedFolderName called ===');
    console.log('parentId:', parentId);
    console.log('existingFolders:', existingFolders);

    if (!parentId) {
      console.log('No parentId, returning Racine');
      return "Racine";
    }

    // First try to find in existingFolders (from foldersScan)
    const folder = existingFolders.find(f => {
      console.log('Checking folder:', f.id, f.name, 'against parentId:', parentId);
      return f.id === parentId;
    });

    if (folder?.name) {
      console.log('Found folder with name:', folder.name);
      return folder.name;
    }

    // If not found in root level, try to search in the tree structure
    if (existingFolders.length > 0 && (existingFolders[0] as any).children) {
      const findInTree = (nodes: any[]): any => {
        for (const node of nodes) {
          if (node.path === parentId || node.id === parentId) {
            console.log('Found in tree:', node.name);
            return node;
          }
          if (node.children) {
            const found = findInTree(node.children);
            if (found) return found;
          }
        }
        return null;
      };

      const foundFolder = findInTree((existingFolders[0] as any).children || []);
      if (foundFolder?.name) {
        console.log('Found folder in tree with name:', foundFolder.name);
        return foundFolder.name;
      }
    }

    // If not found, try to extract from the path
    if (typeof parentId === 'string' && parentId.includes('/')) {
      const pathParts = parentId.split('/');
      const folderName = pathParts[pathParts.length - 1] || "Racine";
      console.log('Extracted from path:', folderName);
      return folderName;
    }

    console.log('Using default: Racine');
    return "Racine";
  }, [parentId, existingFolders]);

  // Camera preview effect
  useEffect(() => {
    let animationFrameId: number;
    let video: HTMLVideoElement | null = null;
    let isMounted = true;

    const cleanupStream = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    };

    // Only start camera when on record tab, modal open, and camera is selected
    if (activeTab === 'record' && open && selectedCameraId) {
      cleanupStream(); // Stoppe l'ancien stream avant d'en créer un nouveau
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCreationError("La caméra n'est pas disponible sur ce système.");
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
      const videoConstraints: MediaStreamConstraints = {
        video: { deviceId: { exact: selectedCameraId } }
      };
      navigator.mediaDevices.getUserMedia(videoConstraints)
        .then(mediaStream => {
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
              video?.play();
              const draw = () => {
                if (!isMounted || activeTab !== 'record') return;
                if (video && video.readyState >= 2) {
                  if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    ctx.save();
                    ctx.strokeStyle = '#00ff00';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(10, 10, canvas.width-20, canvas.height-20);
                    ctx.restore();
                  }
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
                }
                animationFrameId = requestAnimationFrame(draw);
              };
              draw();
            };
          }
        })
        .catch((err) => {
          setCreationError("Impossible d'accéder à la caméra.");
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
    return () => {
      isMounted = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      cleanupStream();
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

      // Get final parent path from parentId
      let finalParentPath = parentPath;
      if (parentId) {
        const parentFolder = existingFolders.find(f => f.id === parentId || f.path === parentId);
        finalParentPath = parentFolder?.path || parentId;
      }

      // Crée le nom de fichier sans double extension
      let baseName = videoName.trim();
      if (baseName.toLowerCase().endsWith(`.${videoType}`)) {
        baseName = baseName.slice(0, -(videoType.length + 1));
      }
      const fileName = `${baseName}.${videoType}`;

      // Create video file using Electron API
      if (window.electronAPI?.videoCreate) {
        const result = await window.electronAPI.videoCreate({
          name: fileName,
          type: videoType,
          parentPath: finalParentPath,
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

      // Get final parent path from parentId
      let finalParentPath = parentPath;
      if (parentId) {
        const parentFolder = existingFolders.find(f => f.id === parentId || f.path === parentId);
        finalParentPath = parentFolder?.path || parentId;
      }

      // Create image from canvas
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setCreationError("Impossible de créer l'image depuis le canvas.");
          return;
        }

        // Convert blob to buffer
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Use only the title provided, no timestamp
        // Remove any existing extension to avoid duplication
        let cleanPhotoName = videoName.trim();
        cleanPhotoName = cleanPhotoName.replace(/\.(png|jpg|jpeg|gif|webp)$/i, '');

        // Create photo file using Electron API
        if (window.electronAPI?.imageCreate) {
          const result = await window.electronAPI.imageCreate({
            name: cleanPhotoName,  // Just the name, no extension
            type: 'png',           // Extension will be added by Electron
            parentPath: finalParentPath,
            tags: tags,
            content: buffer,
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

  // Start/Stop recording functionality with RecordRTC
  const toggleRecording = async () => {
    if (!stream || !videoName.trim()) {
      setCreationError("Veuillez entrer un nom pour la vidéo et vous assurer que la caméra est active.");
      return;
    }

    if (isRecording) {
      // Stop recording
      if (recorder) {
        try {
          console.log('🛑 Arrêt de l\'enregistrement...');
          
          // Clear timer first
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
          
          setIsRecording(false);

          // Stop the recorder
          await recorder.stopRecording();

          // Get the blob
          const blob = await recorder.getBlob();
          console.log('✅ Blob obtenu:', blob.size, 'bytes, type:', blob.type);

          if (!blob || blob.size === 0) {
            throw new Error('Fichier enregistré vide');
          }

          // Get final parent path
          let finalParentPath = parentPath;
          if (parentId) {
            const parentFolder = existingFolders.find(f => f.id === parentId || f.path === parentId);
            finalParentPath = parentFolder?.path || parentId;
          }

          // Convert to Buffer
          const arrayBuffer = await blob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Clean video name
          let cleanVideoName = videoName.trim() || 'video';
          cleanVideoName = cleanVideoName.replace(/\.(mp4|webm|avi|mov|mkv)$/i, '');

          // Determine type from blob
          const fileType = blob.type.includes('mp4') ? 'mp4' : 'webm';

          // Save file
          if (window.electronAPI?.videoCreate) {
            console.log('💾 Sauvegarde:', cleanVideoName + '.' + fileType);
            const result = await window.electronAPI.videoCreate({
              name: cleanVideoName,
              type: fileType,
              parentPath: finalParentPath,
              tags: tags,
              content: buffer,
              isBinary: true,
            });

            if (result.success) {
              console.log('✅ Vidéo sauvegardée:', result.path);
              setCreationSuccess(`Vidéo enregistrée avec succès en ${fileType.toUpperCase()} !`);
              setCurrentVideoFile(result.path || null);

              // Refresh tree
              if (onRefreshTree) {
                onRefreshTree();
              }

              setTimeout(() => {
                setCreationSuccess(null);
              }, 3000);
            } else {
              throw new Error(result.error || "Erreur lors de la sauvegarde");
            }
          }

          // Cleanup
          recorder.destroy();
          setRecorder(null);
          setRecordingTime(0);

        } catch (error: any) {
          console.error('❌ Erreur d\'arrêt:', error);
          setCreationError(`Erreur: ${error.message}`);
        }
      }
    } else {
      // Start recording
      try {
        console.log('🎥 Démarrage enregistrement avec RecordRTC...');

        // Create RecordRTC instance
        const recorderInstance = new RecordRTCPromisesHandler(stream, {
          type: 'video',
          mimeType: 'video/webm;codecs=vp8', // WebM with VP8 (most compatible)
          videoBitsPerSecond: 2500000, // 2.5 Mbps
        });

        await recorderInstance.startRecording();
        console.log('🔴 Enregistrement démarré');

        setRecorder(recorderInstance);
        setIsRecording(true);
        setRecordingTime(0);

        // Timer - save to ref so we can clear it
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);

      } catch (error: any) {
        console.error('❌ Erreur de démarrage:', error);
        setCreationError(`Erreur de démarrage: ${error.message}`);
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
            <Label>Dossier parent</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between text-left font-normal"
              onClick={() => setShowFolderModal(true)}
            >
              <div className="flex items-center gap-2 truncate">
                <Home className="w-4 h-4" />
            <span className="truncate">{getSelectedFolderName}</span>
              </div>
              <Folder className="w-4 h-4 opacity-50" />
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
            <Label htmlFor="record-name">Nom de la vidéo</Label>
            <Input
              id="record-name"
              placeholder="Ex: Enregistrement caméra..."
              value={videoName}
              onChange={(e) => setVideoName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Dossier parent</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between text-left font-normal"
              onClick={() => setShowFolderModal(true)}
            >
              <div className="flex items-center gap-2 truncate">
                <Home className="w-4 h-4" />
                <span className="truncate">{getSelectedFolderName}</span>
              </div>
              <Folder className="w-4 h-4 opacity-50" />
            </Button>
          </div>

          {/* Live Preview - Centered Square */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
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
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
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



  // Définir dynamiquement les boutons du footer selon l'onglet actif (juste avant le return)
  let buttons: ModalButton[] = [];
  if (activeTab === 'upload') {
    buttons = [
      {
        label: 'Importer la vidéo',
        variant: 'default',
        onClick: importVideo,
        disabled: !videoName.trim() || !selectedFile
      }
    ];
  } else if (activeTab === 'record') {
    buttons = [
      {
        label: 'Prendre une photo',
        variant: 'outline',
        onClick: takePhoto,
        disabled: !stream,
        icon: <Image className="h-5 w-5" />
      },
      {
        label: isRecording ? `Arrêter (${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')})` : 'Enregistrer',
        variant: 'default',
        onClick: toggleRecording,
        disabled: !stream,
        icon: isRecording ? <Square className="h-5 w-5" /> : <Camera className="h-5 w-5" />
      }
    ];
  }

  return (
    <>
      <GenericModal
        open={open}
        onOpenChange={onOpenChange}
        title="Créer une nouvelle vidéo"
        icon={<VideoIcon className="h-6 w-6" />}
        description="Importez un fichier vidéo existant ou enregistrez une nouvelle vidéo avec votre caméra"
        colorTheme="gray"
        fileType="video"
        size="xl"
        tabs={tabs}
        onTabChange={handleTabChange}
        buttons={buttons}
        showCancelButton={true}
        cancelLabel="Annuler"
        error={creationError}
        success={creationSuccess}
        showCloseButton={true}
        closeButtonPosition="top-right"
        showFooter={true}
      />

      {/* Folder Selection Modal */}
      <FolderSelectionModal
        open={showFolderModal}
        onOpenChange={setShowFolderModal}
        folders={folderNodes}
        selectedFolderId={parentId}
        onFolderSelect={handleFolderSelect}
        title="Sélectionner le dossier parent"
        description="Choisissez le dossier dans lequel créer la nouvelle vidéo"
      />
    </>
  );
}
