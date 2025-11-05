
"use client"
import { OnlyOfficeEditor } from "@/components/onlyoffice-editor"

import React, { useState, useEffect, useCallback } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { ModernSidebar } from "@/components/ui/sidebar-modern"
import { DrawingCanvas } from "@/components/drawing-canvas"
// import { NoteEditor } from "@/components/note-editor"
import { FileManager } from "@/components/file-manager"
import { SettingsDialog } from "@/components/settings-dialog"
import { toast } from "@/components/ui/use-toast"
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button"
import { Settings, X, ExternalLink } from "lucide-react"
import type { EnhancedFolderNode } from "@/components/ui/FolderTree-modern"
import { AddFolderDialog } from "@/components/add-folder_dialog"
import { AddNoteDialog } from "@/components/add-note_dialog"
import { AddDrawDialog } from "@/components/add-draw_dialog"
import { AddPdfDocumentDialog } from "@/components/add-pdf-document_dialog"
import { AddAudioDialog } from "@/components/add-audio_dialog"
import { AddImageDialog } from "@/components/add-image_dialog"
import { AddVideoDialog } from "@/components/add-video_dialog"
import { AddCodeDialog } from "@/components/add-code_dialog"
import { AddDocumentDialog } from "@/components/add-document_dialog"
// import { DocumentViewer } from "@/components/document-viewer" // supprimé
import { RenameDialog } from "@/components/rename-dialog"
import { ImageViewer } from "@/components/image-viewer"
import { VideoViewer } from "@/components/video-viewer"
import { LandingPage } from "@/components/landing-page"


export default function NoteTakingApp() {
  const [activeView, setActiveView] = useState<"canvas" | "editor" | "files" | "pdf_viewer" | "image_viewer" | "video_viewer" | "document_viewer" | "landing">("landing")
  const [sidebarOpen, setSidebarOpen] = useState(false) // Start with collapsed sidebar for landing page
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // Track sidebar collapse state - collapsed by default
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

          // Convert Uint8Array to string if needed
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
      // Read current folders.json
      console.log('Reading folders.json...');
      const folders = await readJsonFile('folders.json');
      console.log('Current folders in JSON:', folders.length, 'folders');
      folders.forEach((f: any, index: number) => {
        console.log(`  ${index}: ID=${f.id}, Name=${f.name}, Path=${f.path}`);
      });

      // Find the folder to delete
      const folderToDelete = folders.find((f: any) => f.id === folderId);
      console.log('Folder to delete:', folderToDelete);

      if (!folderToDelete) {
        console.warn(`Folder with ID ${folderId} not found in folders.json`);
        console.log('=== CLEANUP FOLDER DEBUG END (NOT FOUND) ===');
        return;
      }

      // Filter out the folder
      console.log('Filtering out folder...');
      const filteredFolders = folders.filter((f: any) => f.id !== folderId);
      console.log('Folders after filtering:', filteredFolders.length, 'folders');

      // Write back to file
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
      // Read current folders.json
      console.log('Reading folders.json...');
      const folders = await readJsonFile('folders.json');
      console.log('Current folders in JSON:', folders.length, 'folders');
      folders.forEach((f: any, index: number) => {
        console.log(`  ${index}: ID=${f.id}, Name=${f.name}, Path=${f.path}`);
      });

      // Find the folder to delete by path
      const folderToDelete = folders.find((f: any) => f.path === folderPath);
      console.log('Folder to delete by path:', folderToDelete);

      if (!folderToDelete) {
        console.warn(`Folder with path ${folderPath} not found in folders.json`);
        console.log('=== CLEANUP FOLDER BY PATH DEBUG END (NOT FOUND) ===');
        return;
      }

      // Filter out the folder
      console.log('Filtering out folder by path...');
      const filteredFolders = folders.filter((f: any) => f.path !== folderPath);
      console.log('Folders after filtering:', filteredFolders.length, 'folders');

      // Write back to file
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
      // Remove from notes.json
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
      // Remove from draws.json
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
      // Remove from pdfs.json
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

  // Initialize folder tree from config.json on component mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const initializeFolderTree = async () => {
      try {
        // Check if we're in Electron mode
        const isElectronMode = !!(window.electronAPI || window.require);

        if (isElectronMode && window.electronAPI?.foldersScan) {
          console.log('Initializing folder tree from config.json...');

          // Scan folders to get the tree structure
          const result = await window.electronAPI.foldersScan();
          if (result && result.length > 0) {
            console.log('Folder tree initialized successfully:', result[0]);
            setFolderTree(result[0]);
          } else {
            console.warn('No folder tree data received from foldersScan');
          }
        } else {
          console.warn('Electron API not available or foldersScan method missing. Cannot initialize folder tree.');
        }
      } catch (error) {
        console.error('Error initializing folder tree:', error);
      }
    };

    initializeFolderTree();
  }, []);

  // Listen for file move events and refresh UI immediately
  useEffect(() => {
    const handleFileMoved = (event: CustomEvent) => {
      console.log('📱 File moved event received in main page:', event.detail);

      // Force immediate refresh of all components
      setTreeVersion(prev => prev + 1);

      // Refresh folder tree from main process
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
      console.log('📱 Folder tree refresh event received');
      setTreeVersion(prev => prev + 1);

      // Also refresh the actual tree data
      if (window.electronAPI?.foldersScan) {
        window.electronAPI.foldersScan().then(result => {
          if (result && result.length > 0) {
            setFolderTree(result[0]);
          }
        });
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

  // Sélection dossier : switch auto sur fichiers
  function handleFolderSelect(path: string) {
    setSelectedFolder(path)
    setActiveView("files")
  }

  // Sélection note : switch auto sur éditeur ou canvas selon le type
  const handleNoteSelect = useCallback(async (notePath: string) => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    console.log('handleNoteSelect called with:', notePath);
    console.log('Full path:', notePath);

    // Extract file extension more reliably
    const pathParts = notePath.split('.');
    const fileExtension = pathParts.length > 1 ? pathParts.pop()?.toLowerCase() : '';
    console.log('Detected file extension:', fileExtension);

    // Check for video files first (most specific)
    const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'wmv', 'flv', '3gp'];
    if (videoExtensions.includes(fileExtension || '')) {
      console.log('Video file detected, loading video viewer...');

      const fileName = notePath.split('\\').pop() || notePath.split('/').pop() || 'Video';
      const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      
      // Set video viewer FIRST to prevent any other logic from overriding
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
      
      // Set selected note for sidebar highlighting
      setSelectedNote(notePath);
      
      // Use document viewer for PDFs (displays in iframe via HTTP server)
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
      // Check for document files that should use the document viewer
  const documentExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'odt', 'ods', 'odp', 'txt', 'csv', 'tsv', 'md'];
      if (documentExtensions.includes(fileExtension || '')) {
        console.log('Document file detected, loading document viewer...');

        const fileName = notePath.split('\\').pop() || notePath.split('/').pop() || 'Document';
        const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        
        // Set selected note for sidebar highlighting
        setSelectedNote(notePath);
        
        // Set document viewer
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
      {/* Sidebar moderne, responsive - Hidden on landing page */}
      {activeView !== "landing" && (
        <ModernSidebar
          key={`sidebar-${treeVersion}`} // Force re-render when tree version changes
          onFolderSelect={handleFolderSelect}
          onNoteSelect={handleNoteSelect}
          onImageSelect={async (path, name, type) => {
            // Only run on client side
            if (typeof window === 'undefined') return;
            console.log('Image selected from sidebar:', path, name, type);
            const fileNameWithoutExt = name.replace(/\.[^/.]+$/, '');
            setActiveView('image_viewer');
            setImageViewerPath(path);
            setImageViewerName(name);
            setImageViewerType(type);
            setCurrentDocumentTitle(fileNameWithoutExt);
            setCurrentDocumentPath(path);
          }}
          onVideoSelect={(path, name, type) => {
            // Only run on client side
            if (typeof window === 'undefined') return;
            console.log('Video selected from sidebar:', path, name, type);
            const fileNameWithoutExt = name.replace(/\.[^/.]+$/, '');
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
              // Check if Electron API is available
              if (!window.electronAPI?.fileDelete) {
                console.error('Electron API fileDelete not available');
                return;
              }

              // Determine the path to delete
              const deletePath = node.path || node.id;
              if (!deletePath) {
                console.error('No path available for deletion');
                return;
              }

              console.log('Attempting to delete:', deletePath);

              // Call Electron API to delete the file/folder
              const result = await window.electronAPI.fileDelete(deletePath);

              if (result.success) {
                console.log(`Successfully deleted: ${deletePath}`);

                // Clean up metadata from JSON files based on item type
                console.log('=== CLEANUP CONDITIONS DEBUG ===');
                console.log('node.type:', node.type);
                console.log('node.id:', node.id);
                console.log('node.name:', node.name);
                console.log('Condition node.type === folder:', node.type === 'folder');
                console.log('Condition node.id exists:', !!node.id);
                console.log('Combined condition:', node.type === 'folder' && node.id);

                if (node.type === 'folder') {
                  console.log('✅ Folder cleanup condition met, calling cleanupFolderFromJson');
                  // Clean up folder from folders.json - use path to find the folder since node.id might be undefined
                  await cleanupFolderFromJsonByPath(node.path);
                } else if (node.id) {
                  console.log('✅ File cleanup condition met, determining file type');
                  // Clean up file from appropriate JSON file based on extension
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

                // Force complete refresh from root path after delete (same as working delete method)
                try {
                  console.log('🔄 Forcing complete refresh from root path after delete...');

                  // Clear current tree first to force complete reload
                  setFolderTree(null);
                  setTreeVersion(prev => prev + 1);

                  // Small delay to ensure state is cleared
                  await new Promise(resolve => setTimeout(resolve, 50));

                  if (window.electronAPI?.foldersScan) {
                    console.log('📁 Scanning root path for fresh tree data after delete...');

                    const scanResult = await window.electronAPI.foldersScan();
                    console.log('📊 Fresh scan result received after delete:', scanResult);

                    if (scanResult && scanResult.length > 0) {
                      const newTree = scanResult[0];
                      console.log('🌳 Fresh tree structure after delete:', newTree?.name, newTree?.children?.length || 0, 'items');

                      // Set the fresh tree data
                      setFolderTree(newTree);
                      setTreeVersion(prev => prev + 1); // Force re-render
                      console.log('✅ Fresh folder tree loaded successfully after delete');
                      console.log('🔄 Tree version incremented to:', treeVersion + 2);

                      // Multiple forced updates to ensure navigation works
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
                      // Restore previous tree if scan fails
                      setFolderTree(folderTree);
                    }
                  } else {
                    console.warn('⚠️ Electron API foldersScan not available for refresh after delete');
                    console.warn('🔌 Available APIs:', Object.keys(window.electronAPI || {}));
                    // Restore previous tree if API not available
                    setFolderTree(folderTree);
                  }
                } catch (refreshError) {
                  console.error('❌ Error during complete refresh after delete:', refreshError);
                  console.error('🔍 Error details:', refreshError instanceof Error ? refreshError.message : refreshError, refreshError instanceof Error ? refreshError.stack : '');
                  // Restore previous tree on error
                  setFolderTree(folderTree);
                }

                // If the deleted item was selected, clear the selection
                if (selectedFolder === deletePath) {
                  setSelectedFolder(null);
                  setActiveView("files");
                }
                if (selectedNote === deletePath) {
                  setSelectedNote(null);
                  setActiveView("canvas");
                }

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
              // Check if Electron API is available
              if (!window.electronAPI) {
                console.error('Electron API not available at all');
                return;
              }

              // Check what rename methods are available
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

              // Set the node for the rename dialog
              // Extract just the filename from the path for the dialog
              const lastSeparatorIndex = Math.max(node.path.lastIndexOf('\\'), node.path.lastIndexOf('/'));
              const fileName = lastSeparatorIndex >= 0 ? node.path.substring(lastSeparatorIndex + 1) : node.path;

              console.log('=== FILENAME EXTRACTION DEBUG ===');
              console.log('Original node path:', node.path);
              console.log('Last separator index:', lastSeparatorIndex);
              console.log('Extracted filename:', fileName);
              console.log('Node.name before:', node.name);

              const renameNodeForDialog = {
                ...node,
                name: fileName, // Use just the filename, not the full path
                originalPath: node.path // Keep the original path for reference
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
              // Check if Electron API is available
              if (!window.electronAPI?.noteLoad) {
                console.error('Electron API not available for note loading');
                return;
              }

              // Load original note content
              const loadResult = await window.electronAPI.noteLoad(node.path);
              if (!loadResult.success || !loadResult.data) {
                console.error('Failed to load note content:', loadResult.error);
                return;
              }

              const originalContent = loadResult.data.content;
              const originalTitle = loadResult.data.title;

              // Generate new name
              const baseName = node.name.replace(/\.(md|txt)$/i, '');
              const ext = node.name.match(/\.(md|txt)$/i)?.[0] || '.md';
              let counter = 1;
              let newName = `${baseName}_copie${ext}`;

              // Check if name exists and find unique name
              const parentDir = node.path.substring(0, node.path.lastIndexOf('\\'));
              const checkPath = `${parentDir}\\${newName}`;

              if (window.electronAPI?.fileRename) {
                // Use fileRename to check if path exists (it will fail if exists)
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

              // Create duplicate note
              const parentPath = node.path.substring(0, node.path.lastIndexOf('\\'));
              if (window.electronAPI?.noteCreate) {
                const createResult = await window.electronAPI.noteCreate({
                  name: newName.replace(/\.(md|txt)$/i, ''),
                  type: ext === '.md' ? 'markdown' : 'txt',
                  parentPath: parentPath,
                  tags: node.tags || []
                });

                if (createResult.success) {
                  // Write the duplicated content
                  if (window.electronAPI?.noteSave) {
                    const saveResult = await window.electronAPI.noteSave({
                      path: createResult.path,
                      content: originalContent
                    });

                    if (saveResult.success) {
                      // Add to notes.json
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

                      // Reload folder tree
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
              setIsAddDocumentOpen(true) // This opens the PDF dialog
            } else if (type === 'generic') {
              setIsAddGenericDocumentOpen(true) // This opens the generic document dialog
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
      {/* Main Content flexible */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Unified toolbar for ALL viewers */}
        <header className="h-14 border-b border-border bg-card flex items-center px-4">
          {/* Left: Application name */}
          <div className="flex items-center min-w-[120px]">
            <h1 className="text-lg font-semibold text-card-foreground">FUSION</h1>
          </div>

          {/* Center: Document title */}
          <div className="flex-1 flex items-center justify-center px-4">
            {currentDocumentTitle && (
              <h2 className="text-base font-medium text-foreground truncate max-w-[600px]">
                {currentDocumentTitle}
              </h2>
            )}
          </div>

          {/* Right: Action buttons (icons only) */}
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
        <main className="flex-1 overflow-auto px-2 py-2 min-w-0">
          {activeView === "landing" && (
            <LandingPage
              onNavigateToFiles={() => {
                // Set selectedFolder to root folder and switch to files view
                if (folderTree) {
                  setSelectedFolder(folderTree.path);
                }
                setActiveView("files");
              }}
              onNavigateToEditor={(filePath) => {
                setSelectedNote(filePath);
                setActiveView("editor");
              }}
              onCreateNew={(type) => {
                // Handle creating new files from landing page
                console.log('Creating new file of type:', type);
                // You can add logic here to open the appropriate dialog
              }}
              folderTree={folderTree}
              recentFiles={[]} // You can populate this with actual recent files
            />
          )}
          {activeView === "canvas" && <DrawingCanvas selectedNote={selectedNote} selectedFolder={selectedFolder} />}
          {/* Suppression de NoteEditor : tout passe par DocumentViewer (OnlyOffice) */}
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
          {activeView === "document_viewer" && documentViewerPath && (
            <OnlyOfficeEditor
              filePath={documentViewerPath}
              fileName={documentViewerName}
              fileType={(() => {
                const ext = documentViewerName.split('.').pop()?.toLowerCase();
                // Pour .md, forcer docx pour OnlyOffice
                if (ext === 'md') return 'docx';
                return ext;
              })()}
              mode="edit"
            />
          )}
          {activeView === "files" && (
            <FileManager
              key={`filemanager-${treeVersion}`} // Force re-render when tree version changes
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
      {/* Dialogs */}
      <AddFolderDialog
        open={isAddFolderOpen}
        onOpenChange={setIsAddFolderOpen}
        folders={[]}
        onFolderAdded={async (newFolder) => {
          console.log('Folder added:', newFolder)
          // Reload the folder tree to reflect changes
          if (window.electronAPI?.foldersScan) {
            const result = await window.electronAPI.foldersScan()
            if (result && result.length > 0) {
              setFolderTree(result[0])
            }
          }
        }}
      />
      <AddNoteDialog
        open={isAddNoteOpen}
        onOpenChange={setIsAddNoteOpen}
        parentPath={selectedFolder || ''}
        onNoteCreated={async (newNote) => {
          console.log('Note created:', newNote)
          // Reload the folder tree to reflect changes
          if (window.electronAPI?.foldersScan) {
            const result = await window.electronAPI.foldersScan()
            if (result && result.length > 0) {
              setFolderTree(result[0])
            }
          }
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
            // Check if Electron API is available
            if (!window.electronAPI?.fileRename) {
              console.error('Electron API fileRename not available');
              return;
            }

            const oldPath = renameNode.path;
            console.log('Original path:', oldPath);

            // Call Electron API to rename the file/folder
            // The API expects (oldPath, newName) where newName is just the filename
            const result = await window.electronAPI.fileRename(oldPath, newName);

            if (result.success) {
              console.log(`Successfully renamed: ${oldPath} -> ${result.newPath || newName}`);

              // Extract the parent directory from old path to construct new path
              const parentDir = oldPath.substring(0, oldPath.lastIndexOf('\\'));
              const correctNewPath = `${parentDir}\\${newName}`;
              console.log('Correct new path:', correctNewPath);

              // Refresh the folder tree
              if (window.electronAPI?.foldersScan) {
                const scanResult = await window.electronAPI.foldersScan();
                if (scanResult && scanResult.length > 0) {
                  const newTree = scanResult[0];
                  console.log('Fresh tree loaded after rename');

                  // Update tree and force re-render
                  setFolderTree(newTree);
                  setTreeVersion(prev => prev + 1);

                  // CRITICAL: After rename, switch to files view and show parent folder content
                  console.log('Switching to files view after rename, old activeView:', activeView);

                  // Extract parent directory of the renamed item
                  const parentDir = oldPath.substring(0, oldPath.lastIndexOf('\\'));
                  console.log('Parent directory of renamed item:', parentDir);

                  // Set selectedFolder to the parent directory to show its contents
                  setSelectedFolder(parentDir);
                  console.log('Set selectedFolder to parent directory:', parentDir);

                  // Switch to files view to show the file manager with parent folder content
                  setActiveView("files");
                  console.log('Switched activeView to files after rename');

                  // Update selections if they match the renamed item
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
          console.log('Draw created:', newDraw)
          // Reload the folder tree to reflect changes
          if (window.electronAPI?.foldersScan) {
            const result = await window.electronAPI.foldersScan()
            if (result && result.length > 0) {
              setFolderTree(result[0])
            }
          }
        }}
      />
      <AddPdfDocumentDialog
        open={isAddDocumentOpen}
        onOpenChange={setIsAddDocumentOpen}
        parentPath={selectedFolder || ''}
        onDocumentCreated={async (newDocument) => {
          console.log('PDF Document created:', newDocument)
          // Reload the folder tree to reflect changes
          if (window.electronAPI?.foldersScan) {
            const result = await window.electronAPI.foldersScan()
            if (result && result.length > 0) {
              setFolderTree(result[0])
            }
          }
        }}
      />
      <AddAudioDialog
        open={isAddAudioOpen}
        onOpenChange={setIsAddAudioOpen}
        parentPath={selectedFolder || ''}
        onAudioCreated={async (newAudio) => {
          console.log('Audio created:', newAudio)
          // Reload the folder tree to reflect changes
          if (window.electronAPI?.foldersScan) {
            const result = await window.electronAPI.foldersScan()
            if (result && result.length > 0) {
              setFolderTree(result[0])
            }
          }
        }}
      />
      <AddImageDialog
        open={isAddImageOpen}
        onOpenChange={setIsAddImageOpen}
        parentPath={selectedFolder || ''}
        onImageCreated={async (newImage) => {
          console.log('Image created:', newImage)
          // Reload the folder tree to reflect changes
          if (window.electronAPI?.foldersScan) {
            const result = await window.electronAPI.foldersScan()
            if (result && result.length > 0) {
              setFolderTree(result[0])
            }
          }
        }}
        onRefreshTree={() => {
          if (window.electronAPI?.foldersScan) {
            window.electronAPI.foldersScan().then(result => {
              if (result && result.length > 0) {
                setFolderTree(result[0])
              }
            })
          }
        }}
      />
      <AddVideoDialog
        open={isAddVideoOpen}
        onOpenChange={setIsAddVideoOpen}
        parentPath={selectedFolder || ''}
        onVideoCreated={async (newVideo) => {
          console.log('Video created:', newVideo)
          // Reload the folder tree to reflect changes
          if (window.electronAPI?.foldersScan) {
            const result = await window.electronAPI.foldersScan()
            if (result && result.length > 0) {
              setFolderTree(result[0])
            }
          }
        }}
        onRefreshTree={() => {
          if (window.electronAPI?.foldersScan) {
            window.electronAPI.foldersScan().then(result => {
              if (result && result.length > 0) {
                setFolderTree(result[0])
              }
            })
          }
        }}
      />
      <AddCodeDialog
        open={isAddCodeOpen}
        onOpenChange={setIsAddCodeOpen}
        parentPath={selectedFolder || ''}
        onCodeCreated={async (newCode) => {
          console.log('Code created:', newCode)
          // Reload the folder tree to reflect changes
          if (window.electronAPI?.foldersScan) {
            const result = await window.electronAPI.foldersScan()
            if (result && result.length > 0) {
              setFolderTree(result[0])
            }
          }
        }}
      />
      <AddDocumentDialog
        open={isAddGenericDocumentOpen}
        onOpenChange={setIsAddGenericDocumentOpen}
        parentPath={selectedFolder || ''}
        onDocumentCreated={async (newDocument) => {
          console.log('Generic document created:', newDocument)
          // Reload the folder tree to reflect changes
          if (window.electronAPI?.foldersScan) {
            const result = await window.electronAPI.foldersScan()
            if (result && result.length > 0) {
              setFolderTree(result[0])
            }
          }
        }}
      />
    </div>
  )
}
