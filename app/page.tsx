"use client"

import React, { useState, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { ModernSidebar } from "@/components/ui/sidebar-modern"
import { DrawingCanvas } from "@/components/drawing-canvas"
import { NoteEditor } from "@/components/note-editor"
import { FileManager } from "@/components/file-manager"
import { SettingsDialog } from "@/components/settings-dialog"
import { Button } from "@/components/ui/button"
import { PenTool, FileText, Upload, Menu, Settings } from "lucide-react"
import type { EnhancedFolderNode } from "@/components/ui/FolderTree-modern"
import { AddFolderDialog } from "@/components/add-folder_dialog"
import { AddNoteDialog } from "@/components/add-note_dialog"

export default function NoteTakingApp() {
  const [activeView, setActiveView] = useState<"canvas" | "editor" | "files">("canvas")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [isResizing, setIsResizing] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [folderTree, setFolderTree] = useState<EnhancedFolderNode | null>(null)
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false)
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)
  const isMobile = useIsMobile()

  // Sélection dossier : switch auto sur fichiers
  function handleFolderSelect(path: string) {
    setSelectedFolder(path)
    setActiveView("files")
  }

  // Sélection note : switch auto sur éditeur
  function handleNoteSelect(path: string) {
    setSelectedNote(path)
    setActiveView("editor")
  }

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

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar moderne, déjà avec <aside> interne */}
      <ModernSidebar
        onFolderSelect={handleFolderSelect}
        onNoteSelect={handleNoteSelect}
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
              const result = await window.electronAPI.foldersScan();
              if (result && result.length > 0) {
                setFolderTree(result[0]);
              }
            }
            
          } catch (error) {
            console.error('Error during deletion:', error);
          }
        }}
        onRename={async (node) => {
          console.log('Rename:', node.path);
          
          try {
            const newName = prompt('Nouveau nom:', node.name);
            if (!newName || newName === node.name) return;
            
            // Check if it's a note or folder based on the node type
            const isNote = node.type === 'note';
            
            if (isNote) {
              // Rename note file
              if (window.electronAPI?.fileRename) {
                const result = await window.electronAPI.fileRename(node.path, newName);
                if (result.success) {
                  console.log('Note renamed:', result.newPath);
                  
                  // Update note in notes.json
                  if (window.electronAPI?.notesLoad && window.electronAPI?.notesSave) {
                    const notes = await window.electronAPI.notesLoad();
                    const updatedNotes = notes.map((note: any) => 
                      note.path === node.path 
                        ? { ...note, name: newName, path: result.newPath }
                        : note
                    );
                    await window.electronAPI.notesSave(updatedNotes);
                    console.log('Note updated in notes.json');
                  }
                } else {
                  console.error('Failed to rename note:', result.error);
                }
              }
            } else {
              // Rename folder
              if (window.electronAPI?.fileRename) {
                const result = await window.electronAPI.fileRename(node.path, newName);
                if (result.success) {
                  console.log('Folder renamed:', result.newPath);
                  
                  // Update folder in folders.json
                  if (window.electronAPI?.foldersLoad && window.electronAPI?.foldersSave) {
                    const folders = await window.electronAPI.foldersLoad();
                    const updatedFolders = folders.map((folder: any) => 
                      folder.path === node.path 
                        ? { ...folder, name: newName, path: result.newPath }
                        : folder
                    );
                    await window.electronAPI.foldersSave(updatedFolders);
                    console.log('Folder updated in folders.json');
                  }
                } else {
                  console.error('Failed to rename folder:', result.error);
                }
              }
            }
            
            // Reload the folder tree to reflect changes
            if (window.electronAPI?.foldersScan) {
              const result = await window.electronAPI.foldersScan();
              if (result && result.length > 0) {
                setFolderTree(result[0]);
              }
            }
            
          } catch (error) {
            console.error('Error during rename:', error);
          }
        }}
        onDuplicate={(node) => console.log('Duplicate:', node.path)}
        onNewFolder={(parentPath) => {
          console.log('New folder:', parentPath)
          setIsAddFolderOpen(true)
        }}
        onNewFile={(parentPath) => {
          console.log('New file:', parentPath)
          setIsAddNoteOpen(true)
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
          {activeView === "files" && (
            <FileManager selectedFolder={selectedFolder} folderTree={folderTree} onFolderSelect={handleFolderSelect} />
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
    </div>
  )
}
