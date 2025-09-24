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

const PdfViewer = dynamic(() => import('@/components/pdf-viewer').then(mod => mod.PdfViewer), {
  ssr: false,
});

export default function NoteTakingApp() {
  const [activeView, setActiveView] = useState<"canvas" | "editor" | "files" | "pdf_viewer" | "image_viewer" | "video_viewer">("canvas")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [isResizing, setIsResizing] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [folderTree, setFolderTree] = useState<EnhancedFolderNode | null>(null)
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
      {/* Sidebar moderne, responsive */}
      <ModernSidebar
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
        onDelete={async (node) => {
          console.log('Delete:', node.path);
          // ...existing code...
        }}
        onRename={async (node) => {
          console.log('Rename:', node.path);
          setRenameNode(node);
          setIsRenameOpen(true);
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
          // ...existing code...
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
