"use client"

import React, { useState, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import Sidebar from "@/components/ui/sidebar"
import { DrawingCanvas } from "@/components/drawing-canvas"
import { NoteEditor } from "@/components/note-editor"
import { FileManager } from "@/components/file-manager"
import { SettingsDialog } from "@/components/settings-dialog"
import { Button } from "@/components/ui/button"
import { PenTool, FileText, Upload, Menu, Settings } from "lucide-react"
import type { FolderNode } from "@/components/ui/FolderTree"

export default function NoteTakingApp() {
  const [activeView, setActiveView] = useState<"canvas" | "editor" | "files">("canvas")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [isResizing, setIsResizing] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [folderTree, setFolderTree] = useState<FolderNode | null>(null)
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

  useEffect(() => {
    async function fetchTreeAndMeta() {
      let fsTree = null;
      if (window.electronAPI?.foldersScan) {
        const result = await window.electronAPI.foldersScan();
        if (Array.isArray(result) && result.length > 0) {
          fsTree = result[0];
        } else {
          fsTree = null;
        }
      }
  let metaList: FolderNode[] = [];
      if (window.electronAPI?.foldersLoad) {
        metaList = await window.electronAPI.foldersLoad();
      }
      // Fonction de fusion : injecte color/icon/tags dans chaque dossier
      function mergeMeta(node: FolderNode): FolderNode {
        if (!node) return node;
        // Cherche la métadonnée par chemin (normalisé)
        const meta = metaList.find((m: FolderNode) => m.path.replace(/\\/g, "/") === node.path.replace(/\\/g, "/"));
        const merged: FolderNode = meta ? { ...node, ...meta } : node;
        if (merged.children && merged.children.length > 0) {
          merged.children = merged.children.map((child: FolderNode) => mergeMeta(child));
        }
        return merged;
      }
      if (fsTree) {
        setFolderTree(mergeMeta(fsTree));
      }
    }
    fetchTreeAndMeta();
  }, []);

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
      <Sidebar
        onFolderSelect={handleFolderSelect}
        onNoteSelect={handleNoteSelect}
        selectedFolder={selectedFolder}
        selectedNote={selectedNote}
        folderTree={folderTree}
        open={sidebarOpen}
        sidebarWidth={sidebarWidth}
        onSidebarResize={handleMouseDown}
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
    </div>
  )
}
