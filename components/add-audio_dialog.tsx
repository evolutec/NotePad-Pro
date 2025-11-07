import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Music as MusicIcon, Mic, Square, Upload, Folder, Home } from "lucide-react";
import { GenericModal, ModalTab, ModalField, ModalButton } from "@/components/ui/generic-modal";
import { FolderSelectionModal, type FolderNode } from "@/components/ui/folder-selection-modal";

export interface AudioMeta {
  id: string;
  name: string;
  type: string; // e.g., "mp3", "wav", "ogg"
  parentPath: string;
  createdAt: string;
  tags?: string[];
}

export interface AddAudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onAudioCreated: (audio: AudioMeta) => void;
  onRefreshTree?: () => void;
}

export function AddAudioDialog({ open, onOpenChange, parentPath, onAudioCreated, onRefreshTree }: AddAudioDialogProps) {
  // State management
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');

  // Upload tab state
  const [audioName, setAudioName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Record tab state
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string | undefined>(undefined);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  // Common state
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [existingFolders, setExistingFolders] = useState<any[]>([]);
  const [showFolderModal, setShowFolderModal] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Device enumeration
  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      // Reset all form fields
      setAudioName("");
      setTags([]);
      setCurrentTag("");
      setSelectedFile(null);
      setMicrophones([]);
      setSelectedMicrophoneId(undefined);
      setStream(null);
      setIsRecording(false);
      setRecordingTime(0);
      setMediaRecorder(null);
      setRecordedChunks([]);
      setCreationError(null);
      setCreationSuccess(null);
      // Don't reset parentId - keep the folder selection across modal opens
      // setParentId(undefined);

      // Initialize microphone devices
      navigator.mediaDevices?.enumerateDevices().then(devices => {
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        setMicrophones(audioInputs);

        if (audioInputs.length > 0 && !selectedMicrophoneId) {
          setSelectedMicrophoneId(audioInputs[0].deviceId);
        }
      });
    }
  }, [open]);

  useEffect(() => {
    if (window.electronAPI?.foldersScan) {
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

  const handleCreateAudio = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!audioName.trim()) return;

    let finalParentPath = parentPath;
    if (parentId) {
      // parentId is now actually the full path
      finalParentPath = parentId;
    }

    if (window.electronAPI?.audioCreate) {
      const result = await window.electronAPI.audioCreate({
        name: audioName.trim(),
        type: 'mp3', // Default for manual creation
        parentPath: finalParentPath,
        tags,
      });

      if (!result.success) {
        setCreationError(result.error || "Erreur lors de la création de l'audio.");
        return;
      }

      const newAudio: AudioMeta = {
        id: Date.now().toString(),
        name: audioName.trim(),
        type: 'mp3',
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
      };

      setCreationSuccess("Audio créé avec succès !");
      if (onAudioCreated) onAudioCreated(newAudio);
      // Trigger tree refresh
      if (onRefreshTree) {
        onRefreshTree();
      }
      setTimeout(() => {
        setAudioName("");
        setTags([]);
        setCurrentTag("");
        setCreationSuccess(null);
        setCreationError(null);
        if (onOpenChange) onOpenChange(false);
      }, 1000);
    }
  };

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

  // Import audio functionality
  const importAudio = async () => {
    if (!selectedFile || !audioName.trim()) {
      setCreationError("Veuillez sélectionner un fichier audio et entrer un nom.");
      return;
    }

    try {
      // Read the selected file as binary data
      const fileData = await selectedFile.arrayBuffer();

      // Auto-detect file extension from the selected file
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || 'mp3';

      let finalParentPath = parentPath;
      if (parentId) {
        // parentId is now actually the full path
        finalParentPath = parentId;
      }

      console.log('[Import Audio] parentId:', parentId);
      console.log('[Import Audio] parentPath:', parentPath);
      console.log('[Import Audio] finalParentPath:', finalParentPath);

      // Use the user-provided name directly, add extension if missing
      let fileName = audioName.trim();
      if (!fileName.includes('.')) {
        // If no extension, add the original file extension
        fileName = `${fileName}.${fileExtension}`;
      }

      console.log('[Import Audio] fileName:', fileName);

      // Create audio file using Electron API
      if (window.electronAPI?.audioCreate) {
        const result = await window.electronAPI.audioCreate({
          name: fileName,
          type: fileExtension,
          parentPath: finalParentPath,
          tags: tags,
          content: fileData,
          isBinary: true,
        });

        if (result.success) {
          setCreationSuccess("Audio importé avec succès !");
          // Trigger tree refresh
          if (onRefreshTree) {
            onRefreshTree();
          }
          setTimeout(() => {
            setCreationSuccess(null);
            onOpenChange(false);
          }, 2000);
        } else {
          setCreationError(result.error || "Erreur lors de l'importation de l'audio.");
        }
      }
    } catch (error) {
      console.error('Error importing audio:', error);
      setCreationError("Erreur lors de l'importation de l'audio.");
    }
  };

  // Audio context for waveform visualization
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);
  const [animationId, setAnimationId] = useState<number | null>(null);

  // Refs for canvas and animation
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize audio context for visualization
  useEffect(() => {
    if (stream && isRecording) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyserNode = ctx.createAnalyser();
        const source = ctx.createMediaStreamSource(stream);

        analyserNode.fftSize = 256;
        source.connect(analyserNode);

        const bufferLength = analyserNode.frequencyBinCount;
        const data = new Uint8Array(bufferLength);

        setAudioContext(ctx);
        setAnalyser(analyserNode);
        setDataArray(data);

        // Start visualization
        const draw = () => {
          if (analyserNode && data && waveformCanvasRef.current) {
            analyserNode.getByteFrequencyData(data);

            const canvas = waveformCanvasRef.current;
            const canvasCtx = canvas.getContext('2d');
            if (canvasCtx) {
              const width = canvas.width;
              const height = canvas.height;

              canvasCtx.clearRect(0, 0, width, height);

              const barWidth = (width / bufferLength) * 2.5;
              let barHeight;
              let x = 0;

              // Create gradient for the waveform
              const gradient = canvasCtx.createLinearGradient(0, 0, width, 0);
              gradient.addColorStop(0, '#ff006e');
              gradient.addColorStop(0.2, '#8338ec');
              gradient.addColorStop(0.4, '#3a86ff');
              gradient.addColorStop(0.6, '#06ffa5');
              gradient.addColorStop(0.8, '#ffbe0b');
              gradient.addColorStop(1, '#ff006e');

              for (let i = 0; i < bufferLength; i++) {
                barHeight = (data[i] / 255) * height * 0.8;

                canvasCtx.fillStyle = gradient;
                canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
              }
            }
          }

          if (isRecording) {
            requestAnimationFrame(draw);
          }
        };

        const id = requestAnimationFrame(draw);
        setAnimationId(id);
      } catch (error) {
        console.error('Error setting up audio visualization:', error);
      }
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        setAnimationId(null);
      }
      if (audioContext) {
        audioContext.close();
        setAudioContext(null);
      }
      setAnalyser(null);
      setDataArray(null);
    };
  }, [stream, isRecording]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  // Start/Stop recording functionality
  const toggleRecording = async () => {
    if (!audioName.trim()) {
      setCreationError("Veuillez entrer un nom pour l'enregistrement.");
      return;
    }

    if (isRecording) {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        // Don't set isRecording to false here - let onstop callback handle it
        // This ensures proper sequencing of stop -> save -> state reset
      }
    } else {
      // Start recording
      try {
        // Get microphone access
        const audioConstraints: MediaStreamConstraints = selectedMicrophoneId
          ? { audio: { deviceId: { exact: selectedMicrophoneId } } }
          : { audio: true };

        const mediaStream = await navigator.mediaDevices.getUserMedia(audioConstraints);
        setStream(mediaStream);

        // Start MediaRecorder
        const recorder = new MediaRecorder(mediaStream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        const chunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onstop = async () => {
          try {
            // Combine all chunks and save
            const blob = new Blob(chunks, { type: 'audio/webm' });

            let finalParentPath = parentPath;
            if (parentId) {
              // parentId is now actually the full path
              finalParentPath = parentId;
            }

            console.log('[Record Audio] parentId:', parentId);
            console.log('[Record Audio] parentPath:', parentPath);
            console.log('[Record Audio] finalParentPath:', finalParentPath);
            console.log('[Record Audio] Blob size:', blob.size);
            console.log('[Record Audio] Chunks count:', chunks.length);

            // Use the user-provided name directly without any timestamp, add .oga extension for audio
            let audioFileName = audioName.trim();
            if (!audioFileName.includes('.')) {
              audioFileName = `${audioFileName}.oga`; // Use .oga for WebM audio to avoid confusion with video
            }

            console.log('[Record Audio] audioFileName:', audioFileName);

            if (window.electronAPI?.audioCreate) {
              const arrayBuffer = await blob.arrayBuffer();
              console.log('[Record Audio] ArrayBuffer size:', arrayBuffer.byteLength);

              const result = await window.electronAPI.audioCreate({
                name: audioFileName,
                type: 'oga',
                parentPath: finalParentPath,
                tags: tags,
                content: arrayBuffer,
                isBinary: true,
              });

              if (result.success) {
                setCreationSuccess("Enregistrement audio sauvegardé avec succès !");
                // Trigger tree refresh
                if (onRefreshTree) {
                  onRefreshTree();
                }
                // Don't close modal immediately - let user see success message
                setTimeout(() => {
                  setCreationSuccess(null);
                  // Only close if user wants to, or keep modal open for another recording
                }, 3000);
              } else {
                setCreationError(result.error || "Erreur lors de la sauvegarde de l'enregistrement.");
              }
            }
          } catch (error) {
            console.error('Error saving recording:', error);
            setCreationError("Erreur lors de la sauvegarde de l'enregistrement.");
          }

          // Reset state but keep modal open
          setRecordedChunks([]);
          setRecordingTime(0);
          setIsRecording(false);

          // Stop all tracks after saving
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
          }
        };

        setMediaRecorder(recorder);
        recorder.start(100); // Collect data more frequently for better visualization
        setIsRecording(true);
        setRecordingTime(0);

        // Start recording timer
        const timer = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);

        // Store timer for cleanup
        (recorder as any)._timer = timer;

      } catch (error) {
        console.error('Error starting recording:', error);
        setCreationError("Erreur lors du démarrage de l'enregistrement. Vérifiez les permissions du microphone.");
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
            <Label htmlFor="audio-name">Nom de l'audio</Label>
            <Input
              id="audio-name"
              placeholder="Ex: Chanson, Podcast, Enregistrement..."
              value={audioName}
              onChange={(e) => setAudioName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Fichier audio</Label>
            <Input
              id="file-upload"
              type="file"
              accept="audio/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              ref={fileInputRef}
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground mt-1">
                Type détecté : {selectedFile.name.split('.').pop()?.toUpperCase() || 'Inconnu'}
              </p>
            )}
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
      icon: <Mic className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          {/* Device Selection */}
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

          <div className="space-y-2">
            <Label htmlFor="record-name">Nom de l'enregistrement</Label>
            <Input
              id="record-name"
              placeholder="Ex: Enregistrement vocal..."
              value={audioName}
              onChange={(e) => setAudioName(e.target.value)}
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

          {/* Recording Interface - Centered */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
              Interface d'enregistrement
            </Label>
            <div className="flex justify-center">
              <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-xl p-8 border-2 border-gray-300 shadow-2xl" style={{ width: '400px', height: '280px' }}>
                <div className="flex flex-col items-center justify-center h-full text-white">
                  {isRecording ? (
                    <>
                      {/* Animated Waveform Visualization */}
                      <div className="w-full mb-4">
                        <canvas
                          ref={waveformCanvasRef}
                          width={320}
                          height={120}
                          className="w-full h-32 rounded-lg bg-black/30"
                          style={{ background: 'linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 100%)' }}
                        />
                      </div>

                      <div className="text-center mb-4">
                        <p className="text-lg font-medium mb-2">Enregistrement en cours</p>
                        <p className="text-sm opacity-75">
                          {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Waveform Visualization - Always visible */}
                      <div className="w-full mb-4">
                        <canvas
                          ref={waveformCanvasRef}
                          width={320}
                          height={120}
                          className="w-full h-32 rounded-lg bg-black/30"
                          style={{ background: 'linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 100%)' }}
                        />
                      </div>
                      
                      <p className="text-lg font-medium mb-2">Prêt à enregistrer</p>
                      <p className="text-sm opacity-75 text-center">
                        {selectedMicrophoneId ? 'Cliquez sur "Démarrer l\'enregistrement" ci-dessous' : 'Sélectionnez un microphone ci-dessus'}
                      </p>
                    </>
                  )}
                </div>
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

  // Define buttons for the GenericModal - context-aware based on active tab
  const buttons: ModalButton[] = React.useMemo(() => {
    if (activeTab === 'upload') {
      return [
        {
          label: 'Importer l\'audio',
          variant: 'default',
          onClick: importAudio,
          disabled: !audioName.trim() || !selectedFile
        }
      ];
    } else if (activeTab === 'record') {
      // Add recording button in footer for record mode
      return [
        {
          label: isRecording ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement',
          variant: 'default',
          onClick: toggleRecording,
          disabled: !audioName.trim() || !selectedMicrophoneId,
          icon: isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />,
          className: isRecording 
            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white' 
            : 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white'
        }
      ];
    }
    return [];
  }, [activeTab, audioName, selectedFile, isRecording, selectedMicrophoneId]);

  return (
    <>
      <GenericModal
        open={open}
        onOpenChange={onOpenChange}
        title="Créer un nouvel audio"
        icon={<MusicIcon className="h-6 w-6" />}
        description="Importez un fichier audio existant ou enregistrez un nouvel audio avec votre microphone"
        colorTheme="pink"
        fileType="audio"
        size="lg"
        tabs={tabs}
        onTabChange={(tabId) => setActiveTab(tabId as 'upload' | 'record')}
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
        description="Choisissez le dossier dans lequel créer le nouvel audio"
      />
    </>
  );
}
