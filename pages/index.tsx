import { OnlyOfficeEditor } from "@/components/onlyoffice-editor"

import React, { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { useIsMobile } from "@/hooks/use-mobile"
import { ModernSidebar } from "@/components/ui/sidebar-modern"
import DrawingCanvas from "@/components/drawing-canvas"
import { FileManager } from "@/components/file-manager"
import { SettingsDialog } from "@/components/settings-dialog"
import { FirstRunSetup } from "@/components/first-run-setup"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Settings, X, ExternalLink } from "lucide-react"
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

// Charger dynamiquement les composants qui utilisent RecordRTC et navigator.mediaDevices
const AddAudioDialog = dynamic(() => import("@/components/add-audio_dialog").then(m => ({ default: m.AddAudioDialog })), { ssr: false })
const AddVideoDialog = dynamic(() => import("@/components/add-video_dialog").then(m => ({ default: m.AddVideoDialog })), { ssr: false })

export default function NoteTakingApp() {
  const [showFirstRunSetup, setShowFirstRunSetup] = useState(false)
  const [activeView, setActiveView] = useState<"canvas" | "editor" | "files" | "pdf_viewer" | "image_viewer" | "video_viewer" | "document_viewer" | "audio_viewer" | "landing">("landing")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
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
  const [documentViewerPath, setDocumentViewerPath] = useState("")
  const [documentViewerName, setDocumentViewerName] = useState("")
  const [documentViewerType, setDocumentViewerType] = useState("")
  const [currentDocumentTitle, setCurrentDocumentTitle] = useState<string>("")
  const [currentDocumentPath, setCurrentDocumentPath] = useState<string>("")
  const isMobile = useIsMobile()

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
          
          if (!config || !config.files || !config.files.rootPath) {
            console.log('No configuration found, showing first-run setup');
            setShowFirstRunSetup(true);
            return;
          }
          
          console.log('Configuration loaded successfully:', config);
          
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

    if (typeof window !== 'undefined') {
      window.addEventListener('fileMoved', handleFileMoved as EventListener);
      window.addEventListener('folderTreeRefresh', handleFolderTreeRefresh as EventListener);
      window.addEventListener('fileManagerRefresh', handleFileManagerRefresh as EventListener);

      return () => {
        window.removeEventListener('fileMoved', handleFileMoved as EventListener);
        window.removeEventListener('folderTreeRefresh', handleFolderTreeRefresh as EventListener);
        window.removeEventListener('fileManagerRefresh', handleFileManagerRefresh as EventListener);
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
        <header className="h-14 border-b border-border bg-card flex items-center px-4">
          <div className="flex items-center min-w-[120px]">
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
            <SettingsDialog>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Paramètres">
                <Settings className="h-4 w-4" />
              </Button>
            </SettingsDialog>
          </div>
        </header>
        <main className="flex-1 overflow-hidden px-2 py-2 min-w-0 flex flex-col">
          {activeView === "landing" && (
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
                // Ouvrir le dialogue approprié selon le type de fichier
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
            />
          )}
          {activeView === "canvas" && <DrawingCanvas selectedNote={selectedNote || null} selectedFolder={selectedFolder} />}
          {activeView === "image_viewer" && (
            <ImageViewer
              imagePath={imageViewerPath}
              imageName={imageViewerName}
              imageType={imageViewerType}
            />
          )}
          {activeView === "video_viewer" && (
            <VideoViewer
              videoPath={videoViewerPath}
              videoName={videoViewerName}
              videoType={videoViewerType}
            />
          )}
          {activeView === "audio_viewer" && currentDocumentPath && (
            <AudioViewer src={currentDocumentPath} />
          )}
          {activeView === "document_viewer" && documentViewerPath && (
            <OnlyOfficeEditor
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

              if (window.electronAPI?.foldersScan) {
                const scanResult = await window.electronAPI.foldersScan();
                if (scanResult && scanResult.length > 0) {
                  const newTree = scanResult[0];
                  console.log('Fresh tree loaded after rename');

                  setFolderTree(newTree);
                  setTreeVersion(prev => prev + 1);

                  console.log('Switching to files view after rename, old activeView:', activeView);

                  const parentDir = oldPath.substring(0, oldPath.lastIndexOf('\\'));
                  console.log('Parent directory of renamed item:', parentDir);

                  setSelectedFolder(parentDir);
                  console.log('Set selectedFolder to parent directory:', parentDir);

                  setActiveView("files");
                  console.log('Switched activeView to files after rename');

                  if (selectedNote === oldPath) {
                    setSelectedNote(correctNewPath);
                    console.log('Updated selected note path after rename');
                  }

                  console.log('✅ Rename operation completed successfully - switched to files view with parent folder content');
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
