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

const PdfViewer = dynamic(() => import('@/components/pdf-viewer').then(mod => mod.PdfViewer), {
  ssr: false,
});

export default function NoteTakingApp() {
  const [activeView, setActiveView] = useState<"canvas" | "editor" | "files" | "pdf_viewer" | "image_viewer">("canvas")
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
  const isMobile = useIsMobile()

  // Sélection dossier : switch auto sur fichiers
  function handleFolderSelect(path: string) {
    setSelectedFolder(path)
    setActiveView("files")
  }

  // Sélection note : switch auto sur éditeur ou canvas selon le type
  useEffect(() => {
    console.log("App: selectedNote updated", selectedNote)
  }, [selectedNote])

  // Debug activeView changes
  useEffect(() => {
    console.log("App: activeView changed to", activeView)
  }, [activeView])

  // Function to load real data from config.json root path
  const loadRealData = async () => {
    try {
      console.log('Are we in Electron?', !!(window.require || window.electronAPI));
      
      // Try to use Electron API to get config and scan folders
      if (window.electronAPI?.loadSettings) {
        console.log('Using Electron API to load settings...');
        const config = await window.electronAPI.loadSettings();
        console.log('Config from Electron:', config);
        
        if (!config || !config.files?.rootPath) {
          console.log('No rootPath found in config');
          return;
        }
        
        const rootPath = config.files.rootPath;
        console.log('Root path from Electron config:', rootPath);
        
        // Now scan folders using Electron API
        if (window.electronAPI?.foldersScan) {
          console.log('Using Electron API to scan folders...');
          const result = await window.electronAPI.foldersScan();
          console.log('Electron scan result:', result);
          
          if (result && result.length > 0) {
            console.log('Successfully loaded real data from Electron API');
            console.log('Full tree structure:', JSON.stringify(result, null, 2));
            return result[0];
          } else {
            console.log('Electron API returned empty result');
          }
        } else {
          console.log('foldersScan API not available');
        }
      } else {
        console.log('loadSettings API not available, trying foldersScan directly...');
        
        // Try direct foldersScan if loadSettings is not available
        if (window.electronAPI?.foldersScan) {
          console.log('Using Electron API to scan folders directly...');
          const result = await window.electronAPI.foldersScan();
          console.log('Direct Electron scan result:', result);
          
          if (result && result.length > 0) {
            console.log('Successfully loaded real data from Electron API');
            console.log('Full tree structure:', JSON.stringify(result, null, 2));
            return result[0];
          }
        } else {
          console.log('Electron API not available - running in browser mode');
        }
      }
    } catch (error) {
      console.error('Error loading real data:', error);
    }
    return null;
  };

  useEffect(() => {
    const loadData = async () => {
      console.log('Loading data...');
      
      // Try to load real data first
      const realData = await loadRealData();
      if (realData) {
        console.log('Setting folder tree with real data:', realData);
        console.log('Real data name:', realData.name);
        console.log('Real data path:', realData.path);
        console.log('Real data children count:', realData.children?.length);
        setFolderTree(realData);
      } else {
        console.log('No real data received from Electron');
      }
    };

    loadData();
  }, []); // Remove loadRealData from dependencies to avoid infinite loop

  // Gestion du drag pour resize
  function handleMouseDown(e: React.MouseEvent) {
    setIsResizing(true);
    document.body.style.cursor = "col-resize";
  }
  React.useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (isResizing) {
        setSidebarWidth(Math.max(160, Math.min(480, e.clientX)));
      }
    }
    function handleMouseUp() {
      if (isResizing) {
        setIsResizing(false);
        document.body.style.cursor = "";
      }
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleNoteSelect = useCallback(async (notePath: string) => {
    console.log('handleNoteSelect called with:', notePath);
    console.log('Full path:', notePath);

    // Extract file extension more reliably
    const pathParts = notePath.split('.');
    const fileExtension = pathParts.length > 1 ? pathParts.pop()?.toLowerCase() : '';
    console.log('Detected file extension:', fileExtension);

    // Check for image files first (most common case)
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'];
    if (imageExtensions.includes(fileExtension || '')) {
      console.log('Image file detected, loading image viewer...');

      // Set image viewer FIRST to prevent any other logic from overriding
      setActiveView('image_viewer');
      setImageViewerPath(notePath);
      setImageViewerName(notePath.split('\\').pop() || 'Image');
      setImageViewerType(fileExtension || 'png');

      toast({
        title: "Image loaded successfully!",
        variant: "default",
      });
      console.log('Image viewer set successfully');
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
              // Assume it's already a buffer-like object
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
        onImageSelect={(path, name, type) => {
          console.log('Image selected from sidebar:', path, name, type);
          setActiveView('image_viewer');
          setImageViewerPath(path);
          setImageViewerName(name);
          setImageViewerType(type);
        }}
        selectedFolder={selectedFolder}
        selectedNote={selectedNote}
        tree={folderTree}
        onDelete={async (node) => {
          console.log('Delete:', node.path);
          
          try {
            // Use fileDelete for both files and folders since it handles both
            if (window.electronAPI?.fileDelete) {
              const result = await window.electronAPI.fileDelete(node.path);
              if (result.success) {
                console.log('Item deleted from filesystem:', node.path);
                
                // Check if it's a note or folder based on the node type
                const isNote = node.type === 'note';
                
                if (isNote) {
                  // Remove note from notes.json
                  if (window.electronAPI?.notesLoad && window.electronAPI?.notesSave) {
                    const notes = await window.electronAPI.notesLoad();
                    const updatedNotes = notes.filter((note: any) => note.path !== node.path);
                    await window.electronAPI.notesSave(updatedNotes);
                    console.log('Note removed from notes.json');
                  }
                } else {
                  // Remove folder from folders.json
                  if (window.electronAPI?.foldersLoad && window.electronAPI?.foldersSave) {
                    const folders = await window.electronAPI.foldersLoad();
                    const updatedFolders = folders.filter((folder: any) => folder.path !== node.path);
                    await window.electronAPI.foldersSave(updatedFolders);
                    console.log('Folder removed from folders.json');
                  }
                }
              } else {
                console.error('Failed to delete item:', result.error);
              }
            } else {
              console.error('fileDelete method not available');
            }
            
            // Reload the folder tree to reflect changes
            if (window.electronAPI?.foldersScan) {
              const scanResult = await window.electronAPI.foldersScan();
              if (scanResult && scanResult.length > 0) {
                setFolderTree(scanResult[0]);
                
                // Clear selected paths if they were deleted
                const isNote = node.type === 'note';
                if (isNote) {
                  if (selectedNote === node.path) {
                    setSelectedNote('');
                  }
                } else {
                  if (selectedFolder === node.path) {
                    setSelectedFolder('');
                  }
                }
              }
            }
            
          } catch (error) {
            console.error('Error during deletion:', error);
          }
        }}
        onRename={async (node) => {
          console.log('Rename:', node.path);
          setRenameNode(node);
          setIsRenameOpen(true);
        }}
        onDuplicate={async (node) => {
          console.log('Duplicate:', node.path);
          
          try {
            // Only allow duplication for notes (not folders)
            if (node.type !== 'note' && !node.name.match(/\.(md|txt)$/i)) {
              console.log('Duplication only supported for notes');
              return;
            }
            
            // Get current note content
            if (window.electronAPI?.noteLoad) {
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
            }
          } catch (error) {
            console.error('Error during duplication:', error);
          }
        }}
        onNewFolder={(parentPath) => {
          console.log('New folder:', parentPath)
          setIsAddFolderOpen(true)
        }}
        onNewFile={(parentPath, type) => {
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
        onNewDraw={() => {
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
          {activeView === "files" && (
            <FileManager selectedFolder={selectedFolder} folderTree={folderTree} onFolderSelect={handleFolderSelect} onNoteSelect={handleNoteSelect} selectedNote={selectedNote} />
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
          
          try {
            const node = renameNode;
            const isNote = node.type === 'note';
            let renameResult: { success: boolean; newPath?: string; error?: string } | undefined;

            if (isNote) {
              // Rename note file
              if (window.electronAPI?.fileRename) {
                renameResult = await window.electronAPI.fileRename(node.path, newName);
                if (renameResult?.success) {
                  console.log('Note renamed:', renameResult.newPath);

                  // Update note in notes.json
                  if (window.electronAPI?.notesLoad && window.electronAPI?.notesSave) {
                    const notes = await window.electronAPI.notesLoad();
                    const updatedNotes = notes.map((note: any) =>
                      note.path === node.path
                        ? { ...note, name: newName, path: renameResult?.newPath }
                        : note
                    );
                    await window.electronAPI.notesSave(updatedNotes);
                    console.log('Note updated in notes.json');
                  }
                } else {
                  console.error('Failed to rename note:', renameResult?.error);
                  throw new Error(renameResult?.error || 'Failed to rename note');
                }
              }
            } else {
              // Rename folder
              if (window.electronAPI?.fileRename) {
                renameResult = await window.electronAPI.fileRename(node.path, newName);
                if (renameResult?.success) {
                  console.log('Folder renamed:', renameResult.newPath);

                  // Update folder in folders.json
                  if (window.electronAPI?.foldersLoad && window.electronAPI?.foldersSave) {
                    const folders = await window.electronAPI.foldersLoad();
                    const updatedFolders = folders.map((folder: any) =>
                      folder.path === node.path
                        ? { ...folder, name: newName, path: renameResult?.newPath }
                        : folder
                    );
                    await window.electronAPI.foldersSave(updatedFolders);
                    console.log('Folder updated in folders.json');
                  }
                } else {
                  console.error('Failed to rename folder:', renameResult?.error);
                  throw new Error(renameResult?.error || 'Failed to rename folder');
                }
              }
            }
            
            // Update selected paths first, before reloading the tree
            if (isNote && renameResult?.success) {
              if (selectedNote === node.path) {
                console.log('Updating selectedNote from', node.path, 'to', renameResult.newPath);
                setSelectedNote(renameResult.newPath || null);
              }
            } else if (!isNote && renameResult?.success) {
              if (selectedFolder === node.path) {
                console.log('Updating selectedFolder from', node.path, 'to', renameResult.newPath);
                setSelectedFolder(renameResult.newPath || null);
              }
            }
            
            // Reload the folder tree to reflect changes
            if (window.electronAPI?.foldersScan) {
              const scanResult = await window.electronAPI.foldersScan();
              if (scanResult && scanResult.length > 0) {
                console.log('Folder tree reloaded after rename');
                setFolderTree(scanResult[0]);
              }
            }
            
          } catch (error) {
            console.error('Error during rename:', error);
            throw error;
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
