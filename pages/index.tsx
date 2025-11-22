import { OnlyOfficeEditor } from "@/components/onlyoffice-editor"

import React, { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import { useIsMobile } from "@/hooks/use-mobile"
import { ModernSidebar } from "@/components/ui/sidebar-modern"
import DrawingCanvas from "@/components/drawing-canvas"
import { FileManager } from "@/components/file-manager"
import { SettingsDialog } from "@/components/settings-dialog"
import { FirstRunSetup } from "@/components/first-run-setup"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Settings, X, ExternalLink, List, LayoutGrid, Home, Wrench } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { BrightnessControl } from "@/components/brightness-control"
import type { EnhancedFolderNode } from "@/components/ui/FolderTree-modern"
import { AddFolderDialog } from "@/components/add-folder_dialog"
import { AddNoteDialog } from "@/components/add-note_dialog"
import { AddDrawDialog } from "@/components/add-draw_dialog"
import { AddPdfDocumentDialog } from "@/components/add-pdf-document_dialog"
import { AddImageDialog } from "@/components/add-image_dialog"
import { AddCodeDialog } from "@/components/add-code_dialog"
import { AddDocumentDialog } from "@/components/add-document_dialog"
import { RenameDialog } from "@/components/rename-dialog"
import { ImageViewer } from "@/components/image-viewer"
import { VideoViewer } from "@/components/video-viewer"
import { LandingPage } from "@/components/landing-page"
import { AudioViewer } from "@/components/audio-viewer"
import { BackgroundConfigModal } from "@/components/background-config-modal"
import { IconsSettings } from "@/components/icons-settings"

// Charger dynamiquement les composants qui utilisent RecordRTC et navigator.mediaDevices
const AddAudioDialog = dynamic(() => import("@/components/add-audio_dialog").then(m => ({ default: m.AddAudioDialog })), { ssr: false })
const AddVideoDialog = dynamic(() => import("@/components/add-video_dialog").then(m => ({ default: m.AddVideoDialog })), { ssr: false })

// Import GPU Fluid Background
import { GPUFluidBackground } from "@/components/gpu-fluid-background"

export default function NoteTakingApp() {
  const [editMode, setEditMode] = useState(false);
  const [showFirstRunSetup, setShowFirstRunSetup] = useState(false)
  const [activeView, setActiveView] = useState<"canvas" | "editor" | "files" | "pdf_viewer" | "image_viewer" | "video_viewer" | "document_viewer" | "audio_viewer" | "landing">("landing")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Try to load from config.json synchronously if available
    try {
      if (typeof window !== 'undefined' && window.electronAPI?.loadSettings) {
        // This is async, so we'll set it later in useEffect
        return true; // Default value
      }
      return true; // Default value
    } catch {
      return true; // Default value
    }
  })
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [isResizing, setIsResizing] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [folderTree, setFolderTree] = useState<EnhancedFolderNode | null>(null)
  const [treeVersion, setTreeVersion] = useState(0)
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false)
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)
  const [isAddDrawOpen, setIsAddDrawOpen] = useState(false)
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [isAddGenericDocumentOpen, setIsAddGenericDocumentOpen] = useState(false);
  const [isAddAudioOpen, setIsAddAudioOpen] = useState(false);
  const [isAddImageOpen, setIsAddImageOpen] = useState(false);
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const [isAddCodeOpen, setIsAddCodeOpen] = useState(false);
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [renameNode, setRenameNode] = useState<any>(null)
  const [imageViewerPath, setImageViewerPath] = useState("")
  const [imageViewerName, setImageViewerName] = useState("")
  const [imageViewerType, setImageViewerType] = useState("")
  const [videoViewerPath, setVideoViewerPath] = useState("")
  const [videoViewerName, setVideoViewerName] = useState("")
  const [videoViewerType, setVideoViewerType] = useState("")
  const [audioViewerPath, setAudioViewerPath] = useState("")
  const [audioViewerName, setAudioViewerName] = useState("")
  const [audioViewerType, setAudioViewerType] = useState("")
  const [documentViewerPath, setDocumentViewerPath] = useState("")
  const [documentViewerName, setDocumentViewerName] = useState("")
  const [documentViewerType, setDocumentViewerType] = useState("")
  const [currentDocumentTitle, setCurrentDocumentTitle] = useState<string>("")
  const [currentDocumentPath, setCurrentDocumentPath] = useState<string>("")
  const [fileManagerViewMode, setFileManagerViewMode] = useState<"grid" | "list">("grid")
  const [isGPUFluidBackground, setIsGPUFluidBackground] = useState(false)
  const [gpuBackgroundParams, setGpuBackgroundParams] = useState<{ speed?: number; scale?: number; tint?: string; opacity?: number } | null>(null)
  const [isFixedBackground, setIsFixedBackground] = useState(false)
  const [fixedBackgroundParams, setFixedBackgroundParams] = useState<{ brightness?: number; contrast?: number; saturation?: number; hue?: number; blur?: number; gradientEnabled?: boolean; gradientColor1?: string; gradientColor2?: string; gradientDirection?: string; backgroundImage?: string; backgroundColor?: string } | null>(null)
  const [backgroundModalOpen, setBackgroundModalOpen] = useState(false)
  const [backgroundModalContext, setBackgroundModalContext] = useState<string>('landing')
  const [iconSettingsModalOpen, setIconSettingsModalOpen] = useState(false)
  const [iconSettingsModalContext, setIconSettingsModalContext] = useState<string>('landing')
  const handleAudioRename = useCallback(() => {
    if (audioViewerPath && audioViewerName) {
      const renameNodeForDialog = {
        name: audioViewerName,
        path: audioViewerPath,
        type: 'audio',
        isDirectory: false
      };
      setRenameNode(renameNodeForDialog);
      setIsRenameOpen(true);
    }
  }, [audioViewerPath, audioViewerName]);

  const handleVideoRename = useCallback(() => {
    if (videoViewerPath && videoViewerName) {
      const renameNodeForDialog = {
        name: videoViewerName,
        path: videoViewerPath,
        type: 'video',
        isDirectory: false
      };
      setRenameNode(renameNodeForDialog);
      setIsRenameOpen(true);
    }
  }, [videoViewerPath, videoViewerName]);

  const handleImageRename = useCallback(() => {
    if (imageViewerPath && imageViewerName) {
      const renameNodeForDialog = {
        name: imageViewerName,
        path: imageViewerPath,
        type: 'image',
        isDirectory: false
      };
      setRenameNode(renameNodeForDialog);
      setIsRenameOpen(true);
    }
  }, [imageViewerPath, imageViewerName]);

  // JSON file management functions
  const readJsonFile = async (filename: string): Promise<any[]> => {
    console.log(`=== READ JSON DEBUG: ${filename} ===`);
    try {
      if (window.electronAPI?.readFile) {
        console.log(`Calling electronAPI.readFile for ${filename}...`);
        const result = await window.electronAPI.readFile(filename);
        console.log(`Read result for ${filename}:`, result);

        if (result.success) {
          console.log(`Parsing JSON data for ${filename}...`);
          console.log(`Raw data type:`, typeof result.data);
          console.log(`Raw data length:`, result.data?.length || 'undefined');

          let jsonString: string;
          if (result.data && result.data.constructor && result.data.constructor.name === 'Uint8Array') {
            console.log('Converting Uint8Array to string...');
            jsonString = new TextDecoder('utf-8').decode(result.data as unknown as Uint8Array);
          } else if (typeof result.data === 'string') {
            jsonString = result.data;
          } else {
            console.error('Unexpected data type:', typeof result.data);
            return [];
          }

          console.log(`JSON string preview:`, jsonString.substring(0, 100));

          const parsed = JSON.parse(jsonString);
          console.log(`✅ Successfully parsed ${filename}:`, parsed.length, 'items');
          return parsed;
        } else {
          console.error(`❌ Read failed for ${filename}:`, result.error);
        }
      } else {
        console.error(`❌ Electron API readFile not available for ${filename}`);
      }
    } catch (error) {
      console.error(`❌ Error reading ${filename}:`, error);
      console.error(`Error details:`, error instanceof Error ? error.message : error);
    }
    console.log(`=== READ JSON DEBUG END: ${filename} ===`);
    return [];
  };

  const cleanupFolderFromJson = async (folderId: string): Promise<void> => {
    console.log('=== CLEANUP FOLDER DEBUG START ===');
    console.log('cleanupFolderFromJson called with folderId:', folderId);

    try {
      console.log('Reading folders.json...');
      const folders = await readJsonFile('folders.json');
      console.log('Current folders in JSON:', folders.length, 'folders');
      folders.forEach((f: any, index: number) => {
        console.log(`  ${index}: ID=${f.id}, Name=${f.name}, Path=${f.path}`);
      });

      const folderToDelete = folders.find((f: any) => f.id === folderId);
      console.log('Folder to delete:', folderToDelete);

      if (!folderToDelete) {
        console.warn(`Folder with ID ${folderId} not found in folders.json`);
        console.log('=== CLEANUP FOLDER DEBUG END (NOT FOUND) ===');
        return;
      }

      console.log('Filtering out folder...');
      const filteredFolders = folders.filter((f: any) => f.id !== folderId);
      console.log('Folders after filtering:', filteredFolders.length, 'folders');

      console.log('Writing updated folders.json...');
      const writeResult = await (window.electronAPI as any).writeFile('folders.json', JSON.stringify(filteredFolders, null, 2));
      console.log('Write result:', writeResult);

      if (writeResult?.success) {
        console.log(`✅ Successfully cleaned up folder ${folderId} from folders.json`);
        console.log(`📊 Folders before: ${folders.length}, after: ${filteredFolders.length}`);
      } else {
        console.error(`❌ Failed to write folders.json:`, writeResult?.error);
      }
    } catch (error) {
      console.error(`❌ Error cleaning up folder ${folderId} from JSON:`, error);
    }
    console.log('=== CLEANUP FOLDER DEBUG END ===');
  };

  const cleanupFolderFromJsonByPath = async (folderPath: string): Promise<void> => {
    console.log('=== CLEANUP FOLDER BY PATH DEBUG START ===');
    console.log('cleanupFolderFromJsonByPath called with folderPath:', folderPath);

    try {
      console.log('Reading folders.json...');
      const folders = await readJsonFile('folders.json');
      console.log('Current folders in JSON:', folders.length, 'folders');
      folders.forEach((f: any, index: number) => {
        console.log(`  ${index}: ID=${f.id}, Name=${f.name}, Path=${f.path}`);
      });

      const folderToDelete = folders.find((f: any) => f.path === folderPath);
      console.log('Folder to delete by path:', folderToDelete);

      if (!folderToDelete) {
        console.warn(`Folder with path ${folderPath} not found in folders.json`);
        console.log('=== CLEANUP FOLDER BY PATH DEBUG END (NOT FOUND) ===');
        return;
      }

      console.log('Filtering out folder by path...');
      const filteredFolders = folders.filter((f: any) => f.path !== folderPath);
      console.log('Folders after filtering:', filteredFolders.length, 'folders');

      console.log('Writing updated folders.json...');
      const writeResult = await (window.electronAPI as any).writeFile('folders.json', JSON.stringify(filteredFolders, null, 2));
      console.log('Write result:', writeResult);

      if (writeResult?.success) {
        console.log(`✅ Successfully cleaned up folder ${folderPath} from folders.json`);
        console.log(`📊 Folders before: ${folders.length}, after: ${filteredFolders.length}`);
      } else {
        console.error(`❌ Failed to write folders.json:`, writeResult?.error);
      }
    } catch (error) {
      console.error(`❌ Error cleaning up folder ${folderPath} from JSON:`, error);
    }
    console.log('=== CLEANUP FOLDER BY PATH DEBUG END ===');
  };

  const cleanupNoteFromJson = async (noteId: string): Promise<void> => {
    try {
      const notes = await readJsonFile('notes.json');
      const filteredNotes = notes.filter((n: any) => n.id !== noteId);
      const writeResult = await (window.electronAPI as any).writeFile('notes.json', JSON.stringify(filteredNotes, null, 2));
      if (writeResult?.success) {
        console.log(`Cleaned up note ${noteId} from notes.json`);
      }
    } catch (error) {
      console.error(`Error cleaning up note ${noteId} from JSON:`, error);
    }
  };

  const cleanupDrawFromJson = async (drawId: string): Promise<void> => {
    try {
      const draws = await readJsonFile('draws.json');
      const filteredDraws = draws.filter((d: any) => d.id !== drawId);
      const writeResult = await (window.electronAPI as any).writeFile('draws.json', JSON.stringify(filteredDraws, null, 2));
      if (writeResult?.success) {
        console.log(`Cleaned up draw ${drawId} from draws.json`);
      }
    } catch (error) {
      console.error(`Error cleaning up draw ${drawId} from JSON:`, error);
    }
  };

  const cleanupPdfFromJson = async (pdfId: string): Promise<void> => {
    try {
      const pdfs = await readJsonFile('pdfs.json');
      const filteredPdfs = pdfs.filter((p: any) => p.id !== pdfId);
      const writeResult = await (window.electronAPI as any).writeFile('pdfs.json', JSON.stringify(filteredPdfs, null, 2));
      if (writeResult?.success) {
        console.log(`Cleaned up PDF ${pdfId} from pdfs.json`);
      }
    } catch (error) {
      console.error(`Error cleaning up PDF ${pdfId} from JSON:`, error);
    }
  };

  const refreshTreeAndOpenFile = useCallback(async (filePath?: string, fileType?: string) => {
    console.log('refreshTreeAndOpenFile called with:', filePath, fileType);
    
    if (window.electronAPI?.foldersScan) {
      const result = await window.electronAPI.foldersScan();
      if (result && result.length > 0) {
        setFolderTree(result[0]);
        setTreeVersion(prev => prev + 1);
        console.log('✅ Folder tree refreshed');
      }
    }

    if (filePath) {
      setSelectedNote(filePath);
      
      const ext = filePath.split('.').pop()?.toLowerCase() || '';
      const fileName = filePath.split('\\').pop() || filePath.split('/').pop() || '';
      const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      
      if (fileType === 'draw' || ext === 'draw') {
        setActiveView('canvas');
        setCurrentDocumentTitle(fileNameWithoutExt);
        setCurrentDocumentPath(filePath);
      } else if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
        setActiveView("image_viewer");
        setImageViewerPath(filePath);
        setImageViewerName(fileName);
        setImageViewerType(ext);
        setCurrentDocumentTitle(fileNameWithoutExt);
        setCurrentDocumentPath(filePath);
      } else if (["mp4", "webm", "ogg", "avi", "mov", "mkv", "wmv", "flv", "3gp"].includes(ext)) {
        setActiveView("video_viewer");
        setVideoViewerPath(filePath);
        setVideoViewerName(fileName);
        setVideoViewerType(ext);
        setCurrentDocumentTitle(fileNameWithoutExt);
        setCurrentDocumentPath(filePath);
      } else if (["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext)) {
        setActiveView("audio_viewer");
        setAudioViewerPath(filePath);
        setAudioViewerName(fileName);
        setAudioViewerType(ext);
        setCurrentDocumentTitle(fileNameWithoutExt);
        setCurrentDocumentPath(filePath);
      } else if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "rtf", "odt", "txt", "md"].includes(ext)) {
        setActiveView("document_viewer");
        setDocumentViewerPath(filePath);
        setDocumentViewerName(fileName);
        setDocumentViewerType(ext);
        setCurrentDocumentTitle(fileNameWithoutExt);
        setCurrentDocumentPath(filePath);
      } else {
        setActiveView("files");
      }
      
      console.log(`✅ File auto-opened: ${filePath} in ${activeView} view`);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkConfigAndInitialize = async () => {
      try {
        const isElectronMode = !!(window.electronAPI || window.require);

        if (isElectronMode && window.electronAPI?.loadSettings) {
          console.log('Checking for existing configuration...');
          
          const config = await window.electronAPI.loadSettings();

          // If design settings specify the GPU fluid background, enable it on startup
          try {
            const design = config && config.design ? config.design : null;
            if (design && design.backgroundImage === "__gpu_fluid_background__") {
              console.log('📱 Detected GPU fluid background in config, enabling on startup');
              setIsGPUFluidBackground(true);
              setIsFixedBackground(false);
              setFixedBackgroundParams(null);
              if (design.backgroundParams) {
                setGpuBackgroundParams(design.backgroundParams)
              }
            } else if (design && design.backgroundImage && design.backgroundImage !== "__gpu_fluid_background__") {
              // uploaded background image (base64 or url)
              console.log('📱 Detected uploaded background image in config, enabling on startup');
              setIsGPUFluidBackground(false);
              setIsFixedBackground(true);
              setFixedBackgroundParams(design.backgroundParams || { backgroundImage: design.backgroundImage });
            } else if (design && design.fixedImage) {
              // built-in color or path stored in fixedImage
              console.log('📱 Detected fixedImage in config, enabling fixed background on startup');
              setIsGPUFluidBackground(false);
              setIsFixedBackground(true);
              setFixedBackgroundParams(Object.assign({}, design.backgroundParams || {}, { backgroundColor: design.fixedImage }));
            } else {
              console.log('📱 No background in config, disabling all backgrounds');
              setIsGPUFluidBackground(false);
              setIsFixedBackground(false);
              setGpuBackgroundParams(null);
              setFixedBackgroundParams(null);
            }
            // Notify renderer components about loaded design so they can apply it
            try {
              if (typeof window !== 'undefined' && design) {
                window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { design } }));
              }
            } catch (e) {
              console.warn('Could not dispatch settingsUpdated on startup (checkConfigAndInitialize):', e);
            }
          } catch (err) {
            console.warn('Error checking design background in config', err);
          }

          if (!config || !config.files || !config.files.rootPath) {
            console.log('No configuration found, showing first-run setup');
            setShowFirstRunSetup(true);
            return;
          }
          
          console.log('Configuration loaded successfully:', config);
          
          // Set sidebar collapsed state from config
          if (config.app?.sidebarCollapsed !== undefined) {
            console.log('Setting sidebar collapsed from config:', config.app.sidebarCollapsed);
            setSidebarCollapsed(config.app.sidebarCollapsed);
          }
          
          if (window.electronAPI?.foldersScan) {
            console.log('Initializing folder tree from config.json...');

            const result = await window.electronAPI.foldersScan();
            if (result && result.length > 0) {
              console.log('Folder tree initialized successfully:', result[0]);
              setFolderTree(result[0]);
            } else {
              console.warn('No folder tree data received from foldersScan');
            }
          }
        } else {
          console.warn('Electron API not available. Cannot check configuration.');
        }
      } catch (error) {
        console.error('Error checking configuration:', error);
      }
    };

    checkConfigAndInitialize();
  }, []);

  useEffect(() => {
    const loadInitialConfig = async () => {
      console.log('📱 Loading initial configuration...');
      
      try {
        if (window.electronAPI?.readFile) {
          const configResult = await window.electronAPI.readFile('config.json');
          if (configResult.success) {
            // Convert data to string if needed (handle Uint8Array)
            let configString: string;
            if (configResult.data && configResult.data.constructor && configResult.data.constructor.name === 'Uint8Array') {
              console.log('📱 Converting Uint8Array to string...');
              configString = new TextDecoder('utf-8').decode(configResult.data as unknown as Uint8Array);
            } else if (typeof configResult.data === 'string') {
              configString = configResult.data;
            } else {
              console.error('📱 Unexpected data type:', typeof configResult.data);
              setShowFirstRunSetup(true);
              return;
            }

            const config = JSON.parse(configString);
            try {
              const design = config && config.design ? config.design : null;
              if (design && design.backgroundImage === "__gpu_fluid_background__") {
                console.log('📱 Detected GPU fluid background in config.json, enabling on startup');
                setIsGPUFluidBackground(true);
                setIsFixedBackground(false);
                setFixedBackgroundParams(null);
                if (design.backgroundParams) setGpuBackgroundParams(design.backgroundParams)
              } else if (design && design.backgroundImage && design.backgroundImage !== "__gpu_fluid_background__") {
                console.log('📱 Detected uploaded background image in config.json, enabling on startup');
                setIsGPUFluidBackground(false);
                setIsFixedBackground(true);
                setFixedBackgroundParams(design.backgroundParams || { backgroundImage: design.backgroundImage });
              } else if (design && design.fixedImage) {
                console.log('📱 Detected fixedImage in config.json, enabling fixed background on startup');
                setIsGPUFluidBackground(false);
                setIsFixedBackground(true);
                setFixedBackgroundParams(Object.assign({}, design.backgroundParams || {}, { backgroundColor: design.fixedImage }));
              } else {
                console.log('📱 No background in config.json, disabling all backgrounds');
                setIsGPUFluidBackground(false);
                setIsFixedBackground(false);
                setGpuBackgroundParams(null);
                setFixedBackgroundParams(null);
              }
              // Dispatch settingsUpdated so components like LandingPage update their local design state
              try {
                if (typeof window !== 'undefined' && design) {
                  window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { design } }));
                }
              } catch (e) {
                console.warn('Could not dispatch settingsUpdated on startup (loadInitialConfig):', e);
              }
            } catch (err) {
              console.warn('Error checking design background in config.json', err);
            }
            console.log('📱 Config loaded:', config);
            
            // Set sidebar collapsed state from config
            if (config.app?.sidebarCollapsed !== undefined) {
              console.log('📱 Setting sidebar collapsed from config.json:', config.app.sidebarCollapsed);
              setSidebarCollapsed(config.app.sidebarCollapsed);
            }
            
            // Set selectedFolder to the root path from config
            if (config.files?.rootPath) {
              console.log('📱 Setting selectedFolder to root path:', config.files.rootPath);
              setSelectedFolder(config.files.rootPath);
            }
            
            // Check if first run setup is needed
            if (!config.files?.rootPath) {
              console.log('📱 No root path configured, showing first run setup');
              setShowFirstRunSetup(true);
            } else {
              console.log('📱 Root path configured, loading folder tree');
              // Load initial folder tree
              if (window.electronAPI?.foldersScan) {
                const result = await window.electronAPI.foldersScan();
                if (result && result.length > 0) {
                  console.log('📱 Initial folder tree loaded:', result[0]);
                  setFolderTree(result[0]);
                }
              }
            }
          } else {
            console.log('📱 Config file not found or error, showing first run setup');
            setShowFirstRunSetup(true);
          }
        } else {
          console.log('📱 Electron API not available, showing first run setup');
          setShowFirstRunSetup(true);
        }
      } catch (error) {
        console.error('📱 Error loading initial config:', error);
        setShowFirstRunSetup(true);
      }
    };

    loadInitialConfig();
  }, []);

  const handleFirstRunComplete = async (rootPath: string) => {
    console.log('First-run setup completed with rootPath:', rootPath);
    setShowFirstRunSetup(false);
    
    try {
      if (window.electronAPI?.foldersScan) {
        const result = await window.electronAPI.foldersScan();
        if (result && result.length > 0) {
          console.log('Folder tree refreshed after first-run setup');
          setFolderTree(result[0]);
        }
      }
    } catch (error) {
      console.error('Error refreshing folder tree after setup:', error);
    }
    
    toast({
      title: "Configuration terminée",
      description: "Votre espace de travail est prêt !",
    });
  };

  useEffect(() => {
    const handleOpenBackgroundModal = (event: CustomEvent) => {
      const context = event.detail?.context || 'landing';
      console.log('Opening background modal with context:', context);
      // Close any open Radix menus/popovers before opening the modal
      if (typeof document !== 'undefined') {
        try {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        } catch (err) {
          console.debug('Failed to dispatch Escape before opening modal', err);
        }
      }
      setBackgroundModalContext(context);
      setBackgroundModalOpen(true)
    }

    const handleOpenIconSettingsModal = (event: CustomEvent) => {
      const context = event.detail?.context || 'landing';
      console.log('Opening icon settings modal with context:', context);
      // Close any open Radix menus/popovers before opening the modal
      if (typeof document !== 'undefined') {
        try {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        } catch (err) {
          console.debug('Failed to dispatch Escape before opening modal', err);
        }
      }
      setIconSettingsModalContext(context);
      setIconSettingsModalOpen(true)
    }

    const handleFileMoved = (event: CustomEvent) => {
      console.log('📱 File moved event received in main page:', event.detail);

      setTreeVersion(prev => prev + 1);

      if (window.electronAPI?.foldersScan) {
        window.electronAPI.foldersScan().then(result => {
          if (result && result.length > 0) {
            console.log('📱 Refreshing folder tree after move event');
            setFolderTree(result[0]);
            setTreeVersion(prev => prev + 1);
          }
        }).catch(error => {
          console.error('📱 Error refreshing tree after move event:', error);
        });
      }
    };

    const handleFolderTreeRefresh = () => {
      console.log('📱 Folder tree refresh event received - starting refresh');
      setTreeVersion(prev => prev + 1);

      if (window.electronAPI?.foldersScan) {
        console.log('📱 Calling foldersScan for tree refresh');
        window.electronAPI.foldersScan().then(result => {
          console.log('📱 FoldersScan result received:', result);
          if (result && result.length > 0) {
            console.log('📱 Setting new folder tree');
            setFolderTree(result[0]);
          } else {
            console.log('📱 No folder tree data received');
          }
        }).catch(error => {
          console.error('📱 Error refreshing tree:', error);
        });
      } else {
        console.log('📱 foldersScan API not available');
      }
    };

    const handleFileManagerRefresh = () => {
      console.log('📱 File manager refresh event received');
      setTreeVersion(prev => prev + 1);
    };

    const handleSettingsUpdate = (event: CustomEvent) => {
      console.log('📱 Settings update event received:', event.detail);
      const { design } = event.detail;
      if (!design) {
        console.log('📱 settingsUpdated received with no design payload');
        return;
      }
      if (design.backgroundImage === "__gpu_fluid_background__") {
        console.log('📱 GPU fluid background detected, enabling GPU fluid background');
        setIsGPUFluidBackground(true);
        setIsFixedBackground(false);
        setFixedBackgroundParams(null);
        if (design.backgroundParams) setGpuBackgroundParams(design.backgroundParams)
      } else if (design.backgroundImage && design.backgroundImage !== "__gpu_fluid_background__") {
        console.log('📱 Uploaded background detected, enabling fixed background');
        setIsGPUFluidBackground(false);
        setIsFixedBackground(true);
        setFixedBackgroundParams(design.backgroundParams || { backgroundImage: design.backgroundImage });
      } else if (design.fixedImage) {
        console.log('📱 Detected fixedImage in settings update, enabling fixed background');
        setIsGPUFluidBackground(false);
        setIsFixedBackground(true);
        setFixedBackgroundParams(Object.assign({}, design.backgroundParams || {}, { backgroundColor: design.fixedImage }));
      } else {
        console.log('📱 No background detected, disabling all backgrounds');
        setIsGPUFluidBackground(false);
        setIsFixedBackground(false);
        setGpuBackgroundParams(null);
        setFixedBackgroundParams(null);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('fileMoved', handleFileMoved as EventListener);
      window.addEventListener('folderTreeRefresh', handleFolderTreeRefresh as EventListener);
      window.addEventListener('fileManagerRefresh', handleFileManagerRefresh as EventListener);
      window.addEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
      window.addEventListener('openBackgroundConfigModal', handleOpenBackgroundModal as EventListener);
      window.addEventListener('openIconSettingsModal', handleOpenIconSettingsModal as EventListener);

      return () => {
        window.removeEventListener('fileMoved', handleFileMoved as EventListener);
        window.removeEventListener('folderTreeRefresh', handleFolderTreeRefresh as EventListener);
        window.removeEventListener('fileManagerRefresh', handleFileManagerRefresh as EventListener);
        window.removeEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
        window.removeEventListener('openBackgroundConfigModal', handleOpenBackgroundModal as EventListener);
        window.removeEventListener('openIconSettingsModal', handleOpenIconSettingsModal as EventListener);
      };
    }
  }, []);

  function handleFolderSelect(path: string) {
    setSelectedFolder(path)
    setActiveView("files")
  }

  const handleNoteSelect = useCallback(async (notePath: string) => {
    if (typeof window === 'undefined') return;

    console.log('handleNoteSelect called with:', notePath);
    console.log('Full path:', notePath);

    const pathParts = notePath.split('.');
    const fileExtension = pathParts.length > 1 ? pathParts.pop()?.toLowerCase() : '';
    console.log('Detected file extension:', fileExtension);

    const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'wmv', 'flv', '3gp'];
    if (videoExtensions.includes(fileExtension || '')) {
      console.log('Video file detected, loading video viewer...');

      const fileName = notePath.split('\\').pop() || notePath.split('/').pop() || 'Video';
      const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      
      setActiveView('video_viewer');
      setVideoViewerPath(notePath);
      setVideoViewerName(fileName);
      setVideoViewerType(fileExtension || 'mp4');
      setCurrentDocumentTitle(fileNameWithoutExt);
      setCurrentDocumentPath(notePath);

      toast({
        title: "Video loaded successfully!",
        variant: "default",
      });
      console.log('Video viewer set successfully');
    } else if (fileExtension === 'pdf') {
      console.log('PDF file detected, loading document viewer...');
      
      const fileName = notePath.split('\\').pop() || notePath.split('/').pop() || 'document.pdf';
      const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      
      setSelectedNote(notePath);
      
      setActiveView('document_viewer');
      setDocumentViewerPath(notePath);
      setDocumentViewerName(fileName);
      setDocumentViewerType('pdf');
      setCurrentDocumentTitle(fileNameWithoutExt);
      setCurrentDocumentPath(notePath);
      
      toast({
        title: "PDF loaded successfully!",
        variant: "default",
      });
      console.log('Document viewer set for PDF successfully');
    } else if (fileExtension === 'draw') {
      const fileName = notePath.split('\\').pop() || notePath.split('/').pop() || 'Dessin';
      const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      
      setSelectedNote(notePath);
      setActiveView("canvas");
      setCurrentDocumentTitle(fileNameWithoutExt);
      setCurrentDocumentPath(notePath);
    } else {
      const audioExtensions = ['mp3', 'wav', 'wave', 'ogg', 'oga', 'opus', 'flac', 'aac', 'm4a', 'm4b', 'm4p', 'wma', 'webm', 'aiff', 'aif', 'ape', 'mka', 'wv', 'tta', 'tak', 'mp2', 'mp1', 'mpa', 'ac3', 'dts', 'amr', '3gp', 'ra', 'ram'];
      if (audioExtensions.includes(fileExtension || '')) {
        console.log('Audio file detected, loading audio viewer...');
        
        const fileName = notePath.split('\\').pop() || notePath.split('/').pop() || 'Audio';
        const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        
        setSelectedNote(notePath);
        setActiveView('audio_viewer');
        setAudioViewerPath(notePath);
        setAudioViewerName(fileName);
        setAudioViewerType(fileExtension || 'mp3');
        setCurrentDocumentTitle(fileNameWithoutExt);
        setCurrentDocumentPath(notePath);
        
        toast({
          title: "Audio loaded successfully!",
          variant: "default",
        });
        console.log('Audio viewer set successfully');
        return;
      }
      
      const documentExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'odt', 'ods', 'odp', 'txt', 'csv', 'tsv', 'md'];
      if (documentExtensions.includes(fileExtension || '')) {
        console.log('Document file detected, loading document viewer...');

        const fileName = notePath.split('\\').pop() || notePath.split('/').pop() || 'Document';
        const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        
        setSelectedNote(notePath);
        
        setActiveView('document_viewer');
        setDocumentViewerPath(notePath);
        setDocumentViewerName(fileName);
        setDocumentViewerType(fileExtension || '');
        setCurrentDocumentTitle(fileNameWithoutExt);
        setCurrentDocumentPath(notePath);

        toast({
          title: "Document loaded successfully!",
          variant: "default",
        });
        console.log('Document viewer set successfully');
      } else {
        const fileName = notePath.split('\\').pop() || notePath.split('/').pop() || 'Note';
        const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        
        setSelectedNote(notePath);
        setActiveView("editor");
        setCurrentDocumentTitle(fileNameWithoutExt);
        setCurrentDocumentPath(notePath);
      }
    }
  }, []);
  
  return (
    <div className="flex h-screen bg-background">
      {isGPUFluidBackground && activeView === "landing" && (
        <GPUFluidBackground
          fullscreen
          speed={gpuBackgroundParams?.speed ?? 1.0}
          scale={gpuBackgroundParams?.scale ?? 1.0}
          tint={gpuBackgroundParams?.tint ?? '#2463ff'}
          opacity={gpuBackgroundParams?.opacity ?? 0.8}
        />
      )}
      {isFixedBackground && activeView === "landing" && fixedBackgroundParams && (
        <div
          className="fixed inset-0 z-0"
          style={{
            background: fixedBackgroundParams.backgroundImage
              ? `url(${fixedBackgroundParams.backgroundImage}) center/cover no-repeat`
              : (fixedBackgroundParams.gradientEnabled
                ? `linear-gradient(${fixedBackgroundParams.gradientDirection || 'to bottom'}, ${fixedBackgroundParams.gradientColor1 || '#ffffff'}, ${fixedBackgroundParams.gradientColor2 || '#000000'})`
                : (fixedBackgroundParams.backgroundColor || '#ffffff')),
            filter: `brightness(${fixedBackgroundParams.brightness ?? 100}%) contrast(${fixedBackgroundParams.contrast ?? 100}%) saturate(${fixedBackgroundParams.saturation ?? 100}%) hue-rotate(${fixedBackgroundParams.hue ?? 0}deg) blur(${fixedBackgroundParams.blur ?? 0}px)`
          }}
        />
      )}
      {activeView !== "landing" && (
        <ModernSidebar
          key={`sidebar-${treeVersion}`}
          onFolderSelect={handleFolderSelect}
          onNoteSelect={handleNoteSelect}
          onImageSelect={async (path, name, type) => {
            if (typeof window === 'undefined') return;
            console.log('Image selected from sidebar:', path, name, type);
            const fileNameWithoutExt = name.replace(/\.[^/.]+$/, '');
            
            setSelectedNote(path);
            
            setActiveView('image_viewer');
            setImageViewerPath(path);
            setImageViewerName(name);
            setImageViewerType(type);
            setCurrentDocumentTitle(fileNameWithoutExt);
            setCurrentDocumentPath(path);
          }}
          onVideoSelect={(path, name, type) => {
            if (typeof window === 'undefined') return;
            console.log('Video selected from sidebar:', path, name, type);
            const fileNameWithoutExt = name.replace(/\.[^/.]+$/, '');
            
            setSelectedNote(path);
            
            setActiveView('video_viewer');
            setVideoViewerPath(path);
            setVideoViewerName(name);
            setVideoViewerType(type);
            setCurrentDocumentTitle(fileNameWithoutExt);
            setCurrentDocumentPath(path);
          }}
          selectedFolder={selectedFolder}
          selectedNote={selectedNote}
          tree={folderTree}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          editMode={editMode}
          onDelete={async (node) => {
            console.log('=== DELETE DEBUG START ===');
            console.log('Delete node object:', node);
            console.log('Delete:', node.path, 'type:', node.type, 'id:', node.id, 'name:', node.name);

            try {
              if (!window.electronAPI?.fileDelete) {
                console.error('Electron API fileDelete not available');
                return;
              }

              const deletePath = node.path || node.id;
              if (!deletePath) {
                console.error('No path available for deletion');
                return;
              }

              console.log('Attempting to delete:', deletePath);

              const result = await window.electronAPI.fileDelete(deletePath);

              if (result.success) {
                console.log(`Successfully deleted: ${deletePath}`);

                console.log('=== CLEANUP CONDITIONS DEBUG ===');
                console.log('node.type:', node.type);
                console.log('node.id:', node.id);
                console.log('node.name:', node.name);
                console.log('Condition node.type === folder:', node.type === 'folder');
                console.log('Condition node.id exists:', !!node.id);
                console.log('Combined condition:', node.type === 'folder' && node.id);

                if (node.type === 'folder') {
                  console.log('✅ Folder cleanup condition met, calling cleanupFolderFromJson');
                  await cleanupFolderFromJsonByPath(node.path);
                } else if (node.id) {
                  console.log('✅ File cleanup condition met, determining file type');
                  const fileExtension = node.name.split('.').pop()?.toLowerCase();
                  console.log('File extension:', fileExtension);
                  if (fileExtension === 'pdf') {
                    await cleanupPdfFromJson(node.id);
                  } else if (fileExtension === 'md') {
                    await cleanupNoteFromJson(node.id);
                  } else if (fileExtension === 'draw') {
                    await cleanupDrawFromJson(node.id);
                  }
                } else {
                  console.log('❌ No cleanup conditions met');
                  console.log('node.type:', node.type, 'node.id:', node.id);
                }

                try {
                  console.log('🔄 Forcing complete refresh from root path after delete...');

                  setFolderTree(null);
                  setTreeVersion(prev => prev + 1);

                  await new Promise(resolve => setTimeout(resolve, 50));

                  if (window.electronAPI?.foldersScan) {
                    console.log('📁 Scanning root path for fresh tree data after delete...');

                    const scanResult = await window.electronAPI.foldersScan();
                    console.log('📊 Fresh scan result received after delete:', scanResult);

                    if (scanResult && scanResult.length > 0) {
                      const newTree = scanResult[0];
                      console.log('🌳 Fresh tree structure after delete:', newTree?.name, newTree?.children?.length || 0, 'items');

                      setFolderTree(newTree);
                      setTreeVersion(prev => prev + 1);
                      console.log('✅ Fresh folder tree loaded successfully after delete');
                      console.log('🔄 Tree version incremented to:', treeVersion + 2);

                      setTimeout(() => {
                        console.log('🔄 Triggering navigation refresh after delete...');
                        setTreeVersion(prev => prev + 1);
                      }, 100);

                      setTimeout(() => {
                        console.log('🔄 Final navigation check after delete...');
                        setTreeVersion(prev => prev + 1);
                      }, 300);

                    } else {
                      console.warn('⚠️ No fresh folder tree data received from foldersScan after delete');
                      console.warn('📋 Scan result:', scanResult);
                      setFolderTree(folderTree);
                    }
                  } else {
                    console.warn('⚠️ Electron API foldersScan not available for refresh after delete');
                    console.warn('🔌 Available APIs:', Object.keys(window.electronAPI || {}));
                    setFolderTree(folderTree);
                  }
                } catch (refreshError) {
                  console.error('❌ Error during complete refresh after delete:', refreshError);
                  console.error('🔍 Error details:', refreshError instanceof Error ? refreshError.message : refreshError, refreshError instanceof Error ? refreshError.stack : '');
                  setFolderTree(folderTree);
                }

                const parentPath = deletePath.substring(0, deletePath.lastIndexOf('\\'));
                console.log('Parent path after delete:', parentPath);

                if (parentPath) {
                  setSelectedFolder(parentPath);
                  setSelectedNote(parentPath);
                } else {
                  if (folderTree?.path) {
                    setSelectedFolder(folderTree.path);
                    setSelectedNote(folderTree.path);
                  }
                }
                setActiveView("files");

              } else {
                console.error(`Failed to delete ${deletePath}:`, result.error);
              }
            } catch (error) {
              console.error('Error during deletion:', error);
            }
          }}
          onRename={async (node) => {
            console.log('Rename:', node.path, 'type:', node.type);
            console.log('Available Electron APIs:', Object.keys(window.electronAPI || {}));

            try {
              if (!window.electronAPI) {
                console.error('Electron API not available at all');
                return;
              }

              if (window.electronAPI.fileRename) {
                console.log('fileRename method available');
              } else if ((window.electronAPI as any).renameFile) {
                console.log('renameFile method available');
              } else if ((window.electronAPI as any).fs && (window.electronAPI as any).fs.rename) {
                console.log('fs.rename method available');
              } else {
                console.error('No rename method available in Electron API');
                console.log('Available methods:', Object.keys(window.electronAPI));
                return;
              }

              const lastSeparatorIndex = Math.max(node.path.lastIndexOf('\\'), node.path.lastIndexOf('/'));
              const fileName = lastSeparatorIndex >= 0 ? node.path.substring(lastSeparatorIndex + 1) : node.path;

              console.log('=== FILENAME EXTRACTION DEBUG ===');
              console.log('Original node path:', node.path);
              console.log('Last separator index:', lastSeparatorIndex);
              console.log('Extracted filename:', fileName);
              console.log('Node.name before:', node.name);

              const renameNodeForDialog = {
                ...node,
                name: fileName,
                originalPath: node.path
              };

              console.log('RenameNodeForDialog.name:', renameNodeForDialog.name);
              console.log('RenameNodeForDialog.path:', renameNodeForDialog.path);
              console.log('Full renameNodeForDialog:', renameNodeForDialog);

              setRenameNode(renameNodeForDialog);
              setIsRenameOpen(true);

              console.log('Rename dialog opened for:', fileName);
              console.log('=== FILENAME EXTRACTION END ===');
            } catch (error) {
              console.error('Error opening rename dialog:', error);
            }
          }}
          onDuplicate={async (node) => {
            console.log('Duplicate:', node.path);

            try {
              if (!window.electronAPI?.noteLoad) {
                console.error('Electron API not available for note loading');
                return;
              }

              const loadResult = await window.electronAPI.noteLoad(node.path);
              if (!loadResult.success || !loadResult.data) {
                console.error('Failed to load note content:', loadResult.error);
                return;
              }

              const originalContent = loadResult.data.content;
              const originalTitle = loadResult.data.title;

              const baseName = node.name.replace(/\.(md|txt)$/i, '');
              const ext = node.name.match(/\.(md|txt)$/i)?.[0] || '.md';
              let counter = 1;
              let newName = `${baseName}_copie${ext}`;

              const parentDir = node.path.substring(0, node.path.lastIndexOf('\\'));
              const checkPath = `${parentDir}\\${newName}`;

              if (window.electronAPI?.fileRename) {
                let exists = true;
                while (exists) {
                  const testResult = await window.electronAPI.fileRename(checkPath, newName);
                  if (testResult.error?.includes('already exists')) {
                    counter++;
                    newName = `${baseName}_copie${counter}${ext}`;
                  } else {
                    exists = false;
                  }
                }
              }

              const parentPath = node.path.substring(0, node.path.lastIndexOf('\\'));
              if (window.electronAPI?.noteCreate) {
                const createResult = await window.electronAPI.noteCreate({
                  name: newName.replace(/\.(md|txt)$/i, ''),
                  type: ext === '.md' ? 'markdown' : 'txt',
                  parentPath: parentPath,
                  tags: node.tags || []
                });

                if (createResult.success) {
                  if (window.electronAPI?.noteSave) {
                    const saveResult = await window.electronAPI.noteSave({
                      path: createResult.path,
                      content: originalContent
                    });

                    if (saveResult.success) {
                      if (window.electronAPI?.notesLoad && window.electronAPI?.notesSave) {
                        const notes = await window.electronAPI.notesLoad();
                        const newNoteMeta = {
                          id: Date.now().toString(),
                          name: newName.replace(/\.(md|txt)$/i, ''),
                          type: ext === '.md' ? 'markdown' : 'txt',
                          parentPath: parentPath,
                          path: createResult.path,
                          createdAt: new Date().toISOString(),
                          tags: node.tags || []
                        };
                        notes.push(newNoteMeta);
                        await window.electronAPI.notesSave(notes);
                      }

                      console.log('Note duplicated successfully:', createResult.path);

                      if (window.electronAPI?.foldersScan) {
                        const result = await window.electronAPI.foldersScan();
                        if (result && result.length > 0) {
                          setFolderTree(result[0]);
                        }
                      }
                    } else {
                      console.error('Failed to save duplicated content:', saveResult.error);
                    }
                  }
                } else {
                  console.error('Failed to create duplicate note:', createResult.error);
                }
              }
            } catch (error) {
              console.error('Error during duplication:', error);
            }
          }}
          onNewFolder={async (parentPath) => {
            console.log('New folder:', parentPath)
            setIsAddFolderOpen(true)
          }}
          onNewFile={async (parentPath, type) => {
            console.log('New file:', parentPath, type)
            if (type === 'document') {
              setIsAddDocumentOpen(true)
            } else if (type === 'generic') {
              setIsAddGenericDocumentOpen(true)
            } else if (type === 'note') {
              setIsAddNoteOpen(true)
            } else if (type === 'audio') {
              setIsAddAudioOpen(true)
            } else if (type === 'image') {
              setIsAddImageOpen(true)
            } else if (type === 'video') {
              setIsAddVideoOpen(true)
            } else if (type === 'code') {
              setIsAddCodeOpen(true)
            }
          }}
          onNewDraw={async () => {
            console.log('New draw requested')
            setIsAddDrawOpen(true)
          }}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="fixed top-0 left-0 right-0 z-[60] h-12 md:h-14 border-b border-border bg-card backdrop-blur-sm flex items-center px-2 md:px-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center min-w-[120px] cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors" onClick={() => setActiveView("landing")}>
            <img src="/icon.ico" alt="Fusion Icon" style={{ width: 28, height: 28, marginRight: 8 }} />
            <h1 className="text-lg font-semibold text-card-foreground">FUSION</h1>
          </div>

          <div className="flex-1 flex items-center justify-center px-4">
            {currentDocumentTitle && (
              <h2 className="text-base font-medium text-foreground truncate max-w-[600px]">
                {currentDocumentTitle}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-1 min-w-[120px] justify-end">
            {activeView === "files" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const newViewMode = fileManagerViewMode === "grid" ? "list" : "grid";
                  setFileManagerViewMode(newViewMode);
                }}
                title={`Switch to ${fileManagerViewMode === "grid" ? "list" : "grid"} view`}
              >
                {fileManagerViewMode === "grid" ? (
                  <List className="h-4 w-4" />
                ) : (
                  <LayoutGrid className="h-4 w-4" />
                )}
              </Button>
            )}
            {currentDocumentPath && activeView !== "landing" && activeView !== "files" && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  title="Ouvrir avec l'application externe"
                  onClick={async () => {
                    if (window.electronAPI?.openFileExternal) {
                      await window.electronAPI.openFileExternal(currentDocumentPath);
                    }
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  title="Fermer le document"
                  onClick={() => {
                    setActiveView("files");
                    setCurrentDocumentTitle("");
                    setCurrentDocumentPath("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant={editMode ? "default" : "ghost"}
              size="icon"
              id="header-wrench-btn"
              className="h-8 w-8"
              title={editMode ? "Quitter le mode édition" : "Activer le mode édition"}
              onClick={() => {
                console.debug('Toolbar Wrench clicked - current editMode:', editMode)
                setEditMode(!editMode)
              }}
            >
              <Wrench className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            <BrightnessControl />
            <SettingsDialog onBackgroundSaved={() => setActiveView("landing") }>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Paramètres">
                <Settings className="h-4 w-4" />
              </Button>
            </SettingsDialog>
          </div>
        </header>
        <main className="flex-1 overflow-hidden px-2 py-2 pt-12 md:pt-14 min-w-0 flex flex-col">
          {activeView === "landing" && (
            <>
              {/* Header landing-page déplacé ici pour être toujours visible */}
              <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-4 px-6 md:py-6 md:px-8 relative z-20"
              >
                <div className="max-w-7xl mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Logo - Colonne gauche */}
                    <motion.div 
                      className="lg:col-span-3 flex justify-center lg:justify-start"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.img 
                        src="/icon-512.png" 
                        alt="Fusion Logo" 
                        className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 drop-shadow-2xl"
                        animate={{ rotate: 360 }}
                        transition={{ 
                          duration: 20, 
                          repeat: Infinity, 
                          ease: "linear" 
                        }}
                        whileHover={{ scale: 1.1 }}
                      />
                    </motion.div>
                    {/* Texte principal - Colonnes centrales et droite */}
                    <div className="lg:col-span-9 space-y-2 md:space-y-3 text-center lg:text-left">
                      <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl md:text-3xl lg:text-4xl font-bold"
                      >
                        Bienvenue dans FUSION
                      </motion.h1>
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-base md:text-lg lg:text-xl text-muted-foreground"
                      >
                        Votre espace de travail créatif vous attend
                      </motion.p>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-1"
                      >
                        <div className="text-sm md:text-base lg:text-lg font-semibold text-primary">
                          FUSION = FOCUS
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Fichiers • Organisation • Création • Utilisation Systémique
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Tous vos fichiers dans une interface cohérente et universelle
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="pt-2 flex justify-center lg:justify-start"
                      >
                        <Button
                          onClick={() => {
                            if (folderTree) {
                              setSelectedFolder(folderTree.path);
                            }
                            setActiveView("files");
                          }}
                          size="lg"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <Home className="w-5 h-5 mr-2" />
                          Explorer mes fichiers
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.header>
              <LandingPage
                onNavigateToFiles={() => {
                  if (folderTree) {
                    setSelectedFolder(folderTree.path);
                  }
                  setActiveView("files");
                }}
                onNavigateToEditor={(filePath) => {
                  setSelectedNote(filePath);
                  setActiveView("editor");
                }}
                onNoteSelect={handleNoteSelect}
                onCreateNew={(type) => {
                  console.log('Creating new file of type:', type);
                  switch(type) {
                    case 'folder':
                      setIsAddFolderOpen(true);
                      break;
                    case 'note':
                      setIsAddNoteOpen(true);
                      break;
                    case 'draw':
                      setIsAddDrawOpen(true);
                      break;
                    case 'pdf':
                    case 'document':
                      setIsAddDocumentOpen(true);
                      break;
                    case 'excel':
                    case 'powerpoint':
                      setIsAddGenericDocumentOpen(true);
                      break;
                    case 'image':
                      setIsAddImageOpen(true);
                      break;
                    case 'video':
                      setIsAddVideoOpen(true);
                      break;
                    case 'audio':
                      setIsAddAudioOpen(true);
                      break;
                    case 'code':
                      setIsAddCodeOpen(true);
                      break;
                    default:
                      console.log('Unknown file type:', type);
                  }
                }}
                folderTree={folderTree}
                editMode={editMode}
                onEditModeChange={setEditMode}
              />
            </>
          )}
          {activeView === "canvas" && <DrawingCanvas selectedNote={selectedNote || null} selectedFolder={selectedFolder} />}
          {activeView === "image_viewer" && (
            <ImageViewer
              key={imageViewerPath}
              imagePath={imageViewerPath}
              imageName={imageViewerName}
              imageType={imageViewerType}
              onRename={handleImageRename}
            />
          )}
          {activeView === "video_viewer" && (
            <VideoViewer
              key={videoViewerPath}
              videoPath={videoViewerPath}
              videoName={videoViewerName}
              videoType={videoViewerType}
              onRename={handleVideoRename}
            />
          )}
          {activeView === "audio_viewer" && audioViewerPath && (
            <AudioViewer 
              key={audioViewerPath} 
              src={audioViewerPath} 
              audioName={audioViewerName}
              audioType={audioViewerType}
              onRename={handleAudioRename}
            />
          )}
          {activeView === "document_viewer" && documentViewerPath && (
            <OnlyOfficeEditor
              key={documentViewerPath}
              filePath={documentViewerPath}
              fileName={documentViewerName}
              fileType={(() => {
                const ext = documentViewerName.split('.').pop()?.toLowerCase();
                if (ext === 'md') return 'docx';
                return ext;
              })()}
              mode="edit"
            />
          )}
          {activeView === "files" && (
            <FileManager
              key={`filemanager-${treeVersion}`}
              selectedFolder={selectedFolder}
              folderTree={folderTree}
              onFolderSelect={handleFolderSelect}
              onNoteSelect={handleNoteSelect}
              onImageSelect={(path, name, type) => {
                console.log('Image selected from file manager:', path, name, type);
                setActiveView('image_viewer');
                setImageViewerPath(path);
                setImageViewerName(name);
                setImageViewerType(type);
              }}
              onVideoSelect={(path, name, type) => {
                console.log('Video selected from file manager:', path, name, type);
                setActiveView('video_viewer');
                setVideoViewerPath(path);
                setVideoViewerName(name);
                setVideoViewerType(type);
              }}
              onDocumentSelect={(path, name, type) => {
                console.log('Document selected from file manager:', path, name, type);
                setActiveView('document_viewer');
                setDocumentViewerPath(path);
                setDocumentViewerName(name);
                setDocumentViewerType(type);
              }}
              selectedNote={selectedNote}
              viewMode={fileManagerViewMode}
              editMode={editMode}
              onOpenIconSettings={() => {
                setIconSettingsModalContext('filemanager');
                setIconSettingsModalOpen(true);
              }}
            />
          )}
        </main>
      </div>
      <AddFolderDialog
        open={isAddFolderOpen}
        onOpenChange={setIsAddFolderOpen}
        folders={[]}
        onFolderAdded={async (newFolder) => {
          console.log('Folder added:', newFolder);
          await refreshTreeAndOpenFile();
          if (newFolder.path) {
            setSelectedFolder(newFolder.path);
            setActiveView('files');
          }
        }}
      />
      <AddNoteDialog
        open={isAddNoteOpen}
        onOpenChange={setIsAddNoteOpen}
        parentPath={selectedFolder || ''}
        onNoteCreated={async (newNote) => {
          console.log('Note created:', newNote);
          const notePath = newNote.parentPath ? `${newNote.parentPath}\\${newNote.name}` : newNote.name;
          await refreshTreeAndOpenFile(notePath, 'note');
        }}
      />
      <RenameDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        currentName={renameNode?.name || ''}
        currentPath={renameNode?.path || ''}
        isFolder={renameNode?.type !== 'note'}
        onRename={async (newName) => {
          if (!renameNode) return;

          console.log('=== RENAME DEBUG START ===');
          console.log('RenameNode path:', renameNode.path);
          console.log('RenameNode name:', renameNode.name);
          console.log('NewName received:', newName);
          console.log('Current activeView before rename:', activeView);

          try {
            if (!window.electronAPI?.fileRename) {
              console.error('Electron API fileRename not available');
              return;
            }

            const oldPath = renameNode.path;
            console.log('Original path:', oldPath);

            const result = await window.electronAPI.fileRename(oldPath, newName);

            if (result.success) {
              console.log(`Successfully renamed: ${oldPath} -> ${result.newPath || newName}`);

              const parentDir = oldPath.substring(0, oldPath.lastIndexOf('\\'));
              const correctNewPath = `${parentDir}\\${newName}`;
              console.log('Correct new path:', correctNewPath);

              // Update state variables based on current view and file type
              const fileExtension = newName.split('.').pop()?.toLowerCase() || '';
              const newFileName = newName.replace(/\.[^/.]+$/, '');

              console.log('=== STATE UPDATE DEBUG ===');
              console.log('activeView:', activeView);
              console.log('oldPath:', oldPath);
              console.log('imageViewerPath:', imageViewerPath);
              console.log('videoViewerPath:', videoViewerPath);
              console.log('audioViewerPath:', audioViewerPath);
              console.log('documentViewerPath:', documentViewerPath);
              console.log('currentDocumentPath:', currentDocumentPath);

              if (activeView === 'image_viewer' && imageViewerPath === oldPath) {
                console.log('Updating image viewer state for renamed file');
                setImageViewerPath(correctNewPath);
                setImageViewerName(newName);
                setImageViewerType(fileExtension);
                setCurrentDocumentTitle(newFileName);
                setCurrentDocumentPath(correctNewPath);
              } else if (activeView === 'video_viewer' && videoViewerPath === oldPath) {
                console.log('Updating video viewer state for renamed file');
                setVideoViewerPath(correctNewPath);
                setVideoViewerName(newName);
                setVideoViewerType(fileExtension);
                setCurrentDocumentTitle(newFileName);
                setCurrentDocumentPath(correctNewPath);
              } else if (activeView === 'audio_viewer' && audioViewerPath === oldPath) {
                console.log('Updating audio viewer state for renamed file');
                setAudioViewerPath(correctNewPath);
                setAudioViewerName(newName);
                setAudioViewerType(fileExtension);
                setCurrentDocumentTitle(newFileName);
                setCurrentDocumentPath(correctNewPath);
              } else if (activeView === 'document_viewer' && documentViewerPath === oldPath) {
                console.log('Updating document viewer state for renamed file');
                setDocumentViewerPath(correctNewPath);
                setDocumentViewerName(newName);
                setDocumentViewerType(fileExtension);
                setCurrentDocumentTitle(newFileName);
                setCurrentDocumentPath(correctNewPath);
              } else if (activeView === 'canvas' && currentDocumentPath === oldPath) {
                console.log('Updating canvas state for renamed file');
                setCurrentDocumentTitle(newFileName);
                setCurrentDocumentPath(correctNewPath);
              } else {
                // Check if the renamed file is currently open in any viewer, regardless of active view
                if (imageViewerPath === oldPath) {
                  console.log('Updating image viewer state for renamed file (context menu rename)');
                  setImageViewerPath(correctNewPath);
                  setImageViewerName(newName);
                  setImageViewerType(fileExtension);
                  setCurrentDocumentTitle(newFileName);
                  setCurrentDocumentPath(correctNewPath);
                } else if (videoViewerPath === oldPath) {
                  console.log('Updating video viewer state for renamed file (context menu rename)');
                  setVideoViewerPath(correctNewPath);
                  setVideoViewerName(newName);
                  setVideoViewerType(fileExtension);
                  setCurrentDocumentTitle(newFileName);
                  setCurrentDocumentPath(correctNewPath);
                } else if (audioViewerPath === oldPath) {
                  console.log('Updating audio viewer state for renamed file (context menu rename)');
                  setAudioViewerPath(correctNewPath);
                  setAudioViewerName(newName);
                  setAudioViewerType(fileExtension);
                  setCurrentDocumentTitle(newFileName);
                  setCurrentDocumentPath(correctNewPath);
                } else if (documentViewerPath === oldPath) {
                  console.log('Updating document viewer state for renamed file (context menu rename)');
                  setDocumentViewerPath(correctNewPath);
                  setDocumentViewerName(newName);
                  setDocumentViewerType(fileExtension);
                  setCurrentDocumentTitle(newFileName);
                  setCurrentDocumentPath(correctNewPath);
                } else {
                  console.log('No viewer state update needed - file not currently open in any viewer');
                }
              }

              if (window.electronAPI?.foldersScan) {
                const scanResult = await window.electronAPI.foldersScan();
                if (scanResult && scanResult.length > 0) {
                  const newTree = scanResult[0];
                  console.log('Fresh tree loaded after rename');

                  setFolderTree(newTree);
                  setTreeVersion(prev => prev + 1);

                  console.log('Keeping current view after rename, activeView:', activeView);

                  if (selectedNote === oldPath) {
                    console.log('Updating selectedNote from', selectedNote, 'to', correctNewPath);
                    setSelectedNote(correctNewPath);
                    console.log('Updated selected note path after rename');
                  } else {
                    console.log('selectedNote', selectedNote, 'does not match oldPath', oldPath, '- not updating');
                  }

                  console.log('✅ Rename operation completed successfully - kept current view with updated paths');
                }
              }
            } else {
              console.error(`❌ Failed to rename ${oldPath}:`, result.error);
            }
          } catch (error) {
            console.error('Error during rename:', error);
          }
        }}
      />
      <AddDrawDialog
        open={isAddDrawOpen}
        onOpenChange={setIsAddDrawOpen}
        parentPath={selectedFolder || ''}
        onDrawCreated={async (newDraw) => {
          console.log('Draw created:', newDraw);
          const drawPath = newDraw.parentPath ? `${newDraw.parentPath}\\${newDraw.name}` : newDraw.name;
          await refreshTreeAndOpenFile(drawPath, 'draw');
        }}
      />
      <AddPdfDocumentDialog
        open={isAddDocumentOpen}
        onOpenChange={setIsAddDocumentOpen}
        parentPath={selectedFolder || ''}
        onDocumentCreated={async (newDocument) => {
          console.log('PDF Document created:', newDocument);
          const pdfPath = newDocument.parentPath ? `${newDocument.parentPath}\\${newDocument.name}` : newDocument.name;
          await refreshTreeAndOpenFile(pdfPath, 'pdf');
        }}
      />
      <AddAudioDialog
        open={isAddAudioOpen}
        onOpenChange={setIsAddAudioOpen}
        parentPath={selectedFolder || ''}
        onAudioCreated={async (newAudio) => {
          console.log('Audio created:', newAudio);
          const audioPath = newAudio.parentPath ? `${newAudio.parentPath}\\${newAudio.name}` : newAudio.name;
          await refreshTreeAndOpenFile(audioPath, 'audio');
        }}
        onRefreshTree={async () => {
          await refreshTreeAndOpenFile();
        }}
      />
      <AddImageDialog
        open={isAddImageOpen}
        onOpenChange={setIsAddImageOpen}
        parentPath={selectedFolder || ''}
        onImageCreated={async (newImage) => {
          console.log('Image created:', newImage);
          const imagePath = newImage.parentPath ? `${newImage.parentPath}\\${newImage.name}` : newImage.name;
          await refreshTreeAndOpenFile(imagePath, 'image');
        }}
        onRefreshTree={async () => {
          await refreshTreeAndOpenFile();
        }}
      />
      <AddVideoDialog
        open={isAddVideoOpen}
        onOpenChange={setIsAddVideoOpen}
        parentPath={selectedFolder || ''}
        onVideoCreated={async (newVideo) => {
          console.log('Video created:', newVideo);
          const videoPath = newVideo.parentPath ? `${newVideo.parentPath}\\${newVideo.name}` : newVideo.name;
          await refreshTreeAndOpenFile(videoPath, 'video');
        }}
        onRefreshTree={async () => {
          await refreshTreeAndOpenFile();
        }}
      />
      <BackgroundConfigModal
        open={backgroundModalOpen}
        onOpenChange={setBackgroundModalOpen}
        currentSettings={(() => {
          // Load card-specific settings if context is not 'landing'
          if (backgroundModalContext !== 'landing') {
            // We need to load from config.json synchronously or use a cached version
            // For now, return default empty settings - the modal will load them
            return {
              backgroundImage: null,
              fixedImage: null,
              animatedIndex: 0,
              backgroundParams: null
            };
          }
          // For landing context, use global settings
          return {
            backgroundImage: isGPUFluidBackground ? "__gpu_fluid_background__" : (fixedBackgroundParams && (fixedBackgroundParams as any).backgroundImage) ? (fixedBackgroundParams as any).backgroundImage : null,
            fixedImage: isFixedBackground ? (fixedBackgroundParams && ((fixedBackgroundParams as any).backgroundColor || (fixedBackgroundParams as any).backgroundImage)) : null,
            animatedIndex: 0,
            backgroundParams: isGPUFluidBackground ? gpuBackgroundParams : fixedBackgroundParams
          };
        })()}
        context={backgroundModalContext}
        onSave={async (settings) => {
          try {
            // Apply to local state first
            if (settings.backgroundImage === "__gpu_fluid_background__") {
              setIsGPUFluidBackground(true)
              setIsFixedBackground(false)
              setFixedBackgroundParams(null)
              setGpuBackgroundParams(settings.backgroundParams || null)
            } else if (settings.backgroundImage) {
              setIsGPUFluidBackground(false)
              setIsFixedBackground(true)
              setFixedBackgroundParams(Object.assign({}, settings.backgroundParams || {}, { backgroundImage: settings.backgroundImage }))
              setGpuBackgroundParams(null)
            } else if (settings.fixedImage) {
              setIsGPUFluidBackground(false)
              setIsFixedBackground(true)
              setFixedBackgroundParams(Object.assign({}, settings.backgroundParams || {}, { backgroundColor: settings.fixedImage }))
              setGpuBackgroundParams(null)
            } else {
              setIsGPUFluidBackground(false)
              setIsFixedBackground(false)
              setGpuBackgroundParams(null)
              setFixedBackgroundParams(null)
            }

            // Persist to config.json via electron API, merging with existing settings and marking context
            if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.loadSettings) {
              try {
                const existing = await window.electronAPI.loadSettings();
                const next = Object.assign({}, existing || {});
                
                // Handle context-specific settings properly
                if (backgroundModalContext !== 'landing' && settings.elements) {
                  // For context-specific settings (like filemanager), merge into design.elements
                  next.design = Object.assign({}, next.design || {});
                  next.design.elements = Object.assign({}, next.design.elements || {}, settings.elements);
                } else {
                  // For landing/global settings, merge directly into design
                  next.design = Object.assign({}, next.design || {}, settings || {});
                }

                if (window.electronAPI.saveSettings) {
                  await window.electronAPI.saveSettings(next);
                  // Broadcast update so other components react (modal already dispatches but keep consistent)
                  try { window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { design: next.design } })) } catch (e) {}
                }
              } catch (err) {
                console.error('Failed to persist background settings to config.json', err);
              }
            }
            // Ensure modal is closed and we exit edit mode after applying background
            try {
              setBackgroundModalOpen(false)
            } catch (e) {}
            try {
              setEditMode(false)
            } catch (e) {}
            // Diagnostic: log any lingering dialog overlay/portal/content elements
            try {
              if (typeof document !== 'undefined') {
                const nodes = Array.from(document.querySelectorAll('[data-slot="dialog-overlay"], [data-slot="dialog-portal"], [data-slot="dialog-content"]'))
                console.debug('Dialog diagnostic - nodes count after save:', nodes.length, nodes)
                nodes.forEach((n) => {
                  try {
                    const cs = window.getComputedStyle(n as Element)
                    console.debug('Dialog node:', n, 'computed styles:', {
                      display: cs.display,
                      visibility: cs.visibility,
                      pointerEvents: cs.pointerEvents,
                      opacity: cs.opacity,
                      zIndex: cs.zIndex,
                    })
                  } catch (e) {
                    console.debug('Could not compute style for node', n, e)
                  }
                })
              }
            } catch (e) {
              console.debug('Dialog diagnostic failed', e)
            }
            
            // Fallback: if any overlay/popover/dialog keeps intercepting events after save,
            // blur focused element, send Escape to close Radix menus, and remove aria-hidden
            // attributes from header ancestors. This is a defensive fix for the toolbar
            // becoming unresponsive in development when portals/overlays linger.
            try {
              if (typeof document !== 'undefined') {
                setTimeout(() => {
                  try { (document.activeElement as HTMLElement)?.blur(); } catch (err) {}
                  try { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); } catch (err) {}

                  // Force pointer-events off on lingering dialog nodes
                  const lingering = Array.from(document.querySelectorAll('[data-slot="dialog-overlay"], [data-slot="dialog-content"]')) as HTMLElement[]
                  lingering.forEach(n => {
                    try { n.style.pointerEvents = 'none'; } catch (err) {}
                  })

                  // Remove aria-hidden on ancestors of header to avoid focus being trapped
                  const headerEl = document.querySelector('header') as HTMLElement | null
                  if (headerEl) {
                    let ancestor = headerEl.parentElement
                    while (ancestor) {
                      try {
                        if (ancestor.getAttribute && ancestor.getAttribute('aria-hidden') === 'true') {
                          ancestor.removeAttribute('aria-hidden')
                          ancestor.removeAttribute('data-aria-hidden')
                        }
                      } catch (err) {}
                      ancestor = ancestor.parentElement
                    }
                  }
                  // Attempt to restore focus to the Wrench button in header or toolbar
                  try {
                    const headerWrench = document.getElementById('header-wrench-btn') as HTMLElement | null
                    const toolbarWrench = document.getElementById('toolbar-wrench-btn') as HTMLElement | null
                    const toFocus = headerWrench || toolbarWrench
                    if (toFocus) {
                      try { toFocus.focus(); } catch (err) {}
                    }
                  } catch (err) {}
                }, 50)
              }
            } catch (err) {
              console.debug('Fallback close failed', err)
            }
          } catch (e) {
            console.error('Error applying background settings from modal', e)
          }
        }}
      />
      <IconsSettings
        open={iconSettingsModalOpen}
        onOpenChange={setIconSettingsModalOpen}
        onSave={async () => {
          try {
            // Exit edit mode after saving
            console.log('Icon settings saved');
            setIconSettingsModalOpen(false);
            setEditMode(false);
          } catch (e) {
            console.error('Error applying icon settings from modal', e);
          }
        }}
        context={iconSettingsModalContext}
      />
      <AddCodeDialog
        open={isAddCodeOpen}
        onOpenChange={setIsAddCodeOpen}
        parentPath={selectedFolder || ''}
        onCodeCreated={async (newCode) => {
          console.log('Code created:', newCode);
          const codePath = newCode.parentPath ? `${newCode.parentPath}\\${newCode.name}` : newCode.name;
          await refreshTreeAndOpenFile(codePath, 'code');
        }}
      />
      <AddDocumentDialog
        open={isAddGenericDocumentOpen}
        onOpenChange={setIsAddGenericDocumentOpen}
        parentPath={selectedFolder || ''}
        onDocumentCreated={async (newDocument) => {
          console.log('Generic document created:', newDocument);
          const docPath = newDocument.parentPath ? `${newDocument.parentPath}\\${newDocument.name}` : newDocument.name;
          await refreshTreeAndOpenFile(docPath, 'document');
        }}
      />
      
      {showFirstRunSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <FirstRunSetup onComplete={handleFirstRunComplete} />
        </div>
      )}
    </div>
  )
}
