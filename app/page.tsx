"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { ModernSidebar } from "@/components/ui/sidebar-modern"
import { DrawingCanvas } from "@/components/drawing-canvas"
import { NoteEditor } from "@/components/note-editor"
import { FileManager } from "@/components/file-manager"
import { SettingsDialog } from "@/components/settings-dialog"
import { toast } from "@/components/ui/use-toast"
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button"
import { PenTool, FileText, Upload, Menu, Settings } from "lucide-react"
import type { EnhancedFolderNode } from "@/components/ui/FolderTree-modern"
import { AddFolderDialog } from "@/components/add-folder_dialog"
import { AddNoteDialog } from "@/components/add-note_dialog"
import { AddDrawDialog } from "@/components/add-draw_dialog"
import { AddDocumentDialog } from "@/components/add-document_dialog"
import { AddAudioDialog } from "@/components/add-audio_dialog"
import { AddImageDialog } from "@/components/add-image_dialog"
import { AddVideoDialog } from "@/components/add-video_dialog"
import { AddCodeDialog } from "@/components/add-code_dialog"
import { RenameDialog } from "@/components/rename-dialog"
import { ImageViewer } from "@/components/image-viewer"
import { VideoViewer } from "@/components/video-viewer"
import { LandingPage } from "@/components/landing-page"

const PdfViewer = dynamic(() => import('@/components/pdf-viewer').then(mod => mod.PdfViewer), {
  ssr: false,
});

export default function NoteTakingApp() {
  const [activeView, setActiveView] = useState<"canvas" | "editor" | "files" | "pdf_viewer" | "image_viewer" | "video_viewer" | "landing">("landing")
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
  const [isAddAudioOpen, setIsAddAudioOpen] = useState(false);
  const [isAddImageOpen, setIsAddImageOpen] = useState(false);
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const [isAddCodeOpen, setIsAddCodeOpen] = useState(false);
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [renameNode, setRenameNode] = useState<any>(null)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [imageViewerPath, setImageViewerPath] = useState("")
  const [imageViewerName, setImageViewerName] = useState("")
  const [imageViewerType, setImageViewerType] = useState("")
  const [videoViewerOpen, setVideoViewerOpen] = useState(false)
  const [videoViewerPath, setVideoViewerPath] = useState("")
  const [videoViewerName, setVideoViewerName] = useState("")
  const [videoViewerType, setVideoViewerType] = useState("")
  const isMobile = useIsMobile()

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

      // Set video viewer FIRST to prevent any other logic from overriding
      setActiveView('video_viewer');
      setVideoViewerPath(notePath);
      setVideoViewerName(notePath.split('\\').pop() || 'Video');
      setVideoViewerType(fileExtension || 'mp4');

      toast({
        title: "Video loaded successfully!",
        variant: "default",
      });
      console.log('Video viewer set successfully');
    } else if (fileExtension === 'pdf') {
      console.log('PDF file detected, loading PDF viewer...');

      // Set PDF viewer FIRST to prevent any other logic from overriding
      setActiveView('pdf_viewer');
      setSelectedNote(notePath);

      // Check if we're in Electron mode with proper API detection
      const isElectronMode = !!(window.electronAPI || window.require);
      console.log('Electron mode check:', isElectronMode, 'electronAPI:', !!window.electronAPI, 'require:', !!window.require);

      if (isElectronMode && window.electronAPI?.readPdfFile) {
        try {
          console.log('Attempting to read PDF with Electron API:', notePath);
          const result = await window.electronAPI.readPdfFile(notePath);
          console.log('PDF read result:', result);

          if (result.success && result.data) {
            console.log('PDF data received, type:', typeof result.data, 'length:', result.data.length);

            // Ensure we have proper binary data
            let pdfData;
            if (result.data instanceof Buffer) {
              pdfData = result.data;
            } else if (typeof result.data === 'string') {
              // If it's a base64 string, convert it
              pdfData = Buffer.from(result.data, 'base64');
            } else {
              // Assume it's already a buffer or buffer-like
              pdfData = result.data;
            }

            const blob = new Blob([pdfData], { type: 'application/pdf' });
            const pdfUrl = URL.createObjectURL(blob);
            console.log('PDF blob created, URL:', pdfUrl);
            setPdfContent(pdfUrl);
            toast({
              title: "PDF loaded successfully!",
              variant: "default",
            });
            console.log('PDF viewer set successfully');
          } else {
            console.error('Failed to read PDF file:', result.error);
            setPdfContent(null);
            setActiveView("editor");
            toast({
              title: "Failed to read PDF file",
              description: result.error || 'Unknown error',
              variant: "destructive",
            });
          }
        } catch (error: any) {
          console.error('Error reading PDF file:', error);
          setPdfContent(null);
          setActiveView("editor");
          toast({
            title: "Error reading PDF file",
            description: error?.message || 'Unknown error',
            variant: "destructive",
          });
        }
      } else {
        console.warn('Electron API not available or readPdfFile method missing. Current mode:', isElectronMode ? 'Electron (API issue)' : 'Browser');

        // In browser mode, we can't load local files directly due to CORS
        // Show a helpful message to the user
        setPdfContent(null);
        setActiveView("pdf_viewer"); // Keep PDF viewer active but show message

        toast({
          title: "PDF Viewer - Mode Info",
          description: isElectronMode
            ? "PDF loading issue detected. Please check Electron API configuration."
            : "PDF files require Electron mode to view. Please run the app with 'npm run electron' to view PDFs.",
          variant: "default",
        });
        console.log('PDF viewer activated - showing mode-specific message');
      }
    } else if (fileExtension === 'draw') {
      setSelectedNote(notePath);
      setActiveView("canvas");
    } else {
      setSelectedNote(notePath);
      setActiveView("editor");
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
            setActiveView('image_viewer');
            setImageViewerPath(path);
            setImageViewerName(name);
            setImageViewerType(type);
          }}
          onVideoSelect={(path, name, type) => {
            // Only run on client side
            if (typeof window === 'undefined') return;
            console.log('Video selected from sidebar:', path, name, type);
            setActiveView('video_viewer');
            setVideoViewerPath(path);
            setVideoViewerName(name);
            setVideoViewerType(type);
          }}
          selectedFolder={selectedFolder}
          selectedNote={selectedNote}
          tree={folderTree}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onDelete={async (node) => {
            console.log('Delete:', node.path, 'type:', node.type);

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
              setIsAddDocumentOpen(true)
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
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-card-foreground">NotePad Pro</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={activeView === "canvas" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("canvas")}
            >
              <PenTool className="h-4 w-4 mr-2" />
              Dessin
            </Button>
            <Button
              variant={activeView === "editor" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("editor")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Éditeur
            </Button>
            <Button
              variant={activeView === "files" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("files")}
            >
              <Upload className="h-4 w-4 mr-2" />
              Fichiers
            </Button>
            <Button
              variant={activeView === "pdf_viewer" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("pdf_viewer")}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF Viewer
            </Button>
            <Button
              variant={activeView === "image_viewer" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("image_viewer")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Image Viewer
            </Button>
            <Button
              variant={activeView === "video_viewer" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("video_viewer")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Video Viewer
            </Button>
            <SettingsDialog>
              <Button variant="ghost" size="sm">
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
          {activeView === "editor" && <NoteEditor selectedNote={selectedNote} selectedFolder={selectedFolder} />}
          {activeView === "pdf_viewer" && pdfContent && <PdfViewer file={pdfContent} />}
          {activeView === "image_viewer" && (
            <ImageViewer
              open={activeView === "image_viewer"}
              onOpenChange={(open) => !open && setActiveView("files")}
              imagePath={imageViewerPath}
              imageName={imageViewerName}
              imageType={imageViewerType}
            />
          )}
          {activeView === "video_viewer" && (
            <VideoViewer
              open={activeView === "video_viewer"}
              onOpenChange={(open) => !open && setActiveView("files")}
              videoPath={videoViewerPath}
              videoName={videoViewerName}
              videoType={videoViewerType}
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
      <AddDocumentDialog
        open={isAddDocumentOpen}
        onOpenChange={setIsAddDocumentOpen}
        parentPath={selectedFolder || ''}
        onDocumentCreated={async (newDocument) => {
          console.log('Document created:', newDocument)
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
    </div>
  )
}
