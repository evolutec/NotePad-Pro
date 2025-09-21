"use client";
import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { FolderPlus, FilePlus, Pencil } from "lucide-react";
import { FolderTree } from "./FolderTree";
import { AddFolderDialog } from "@/components/add-folder_dialog";

import { AddNoteDialog } from "@/components/add-note_dialog";

// Fonction utilitaire pour filtrer l'arborescence selon la recherche
import type { FolderNode } from "./FolderTree";
function filterTree(node: FolderNode, query: string): FolderNode | null {
  if (!query.trim()) return node;
  const lower = query.trim().toLowerCase();
  const matches = node.name.toLowerCase().includes(lower) || (node.tags && node.tags.some(tag => tag.toLowerCase().includes(lower)));
  let filteredChildren: FolderNode[] = [];
  if (node.children && node.children.length > 0) {
    filteredChildren = node.children
      .map(child => filterTree(child, query))
      .filter((child): child is FolderNode => !!child);
  }
  if (matches || filteredChildren.length > 0) {
    return { ...node, children: filteredChildren };
  }
  return null;
}

function SidebarToggleButton({ open, toggleSidebar }: { open: boolean, toggleSidebar: () => void }) {
  return (
    <button
      className="p-2 rounded bg-muted text-muted-foreground hover:bg-primary/20 transition"
      title={open ? "Replier la sidebar" : "Déplier la sidebar"}
      onClick={toggleSidebar}
      style={{ marginRight: 4 }}
    >
      {open ? <span>&#x25C0;</span> : <span>&#x25B6;</span>}
    </button>
  );
}

// Ce composant évite le warning d’hydratation en ne rendant le bouton qu’en client
function ClientOnlyButton() {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  if (!isClient) return null;
  if (!(window.electronAPI?.selectFolder)) return null;
  return (
    <button
      className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/80 transition"
      onClick={async () => {
        if (window.electronAPI?.selectFolder) {
          const folderPath = await window.electronAPI.selectFolder();
          if (folderPath) {
            window.location.reload();
          }
        }
      }}
    >
      Choisir un dossier racine
    </button>
  );
}

// Note: ElectronAPI type is defined in global.d.ts, no need to redeclare here


export interface SidebarProps {
  onFolderSelect?: (folderPath: string) => void;
  onNoteSelect?: (notePath: string) => void;
  open?: boolean;
  selectedFolder?: string | null;
  selectedNote?: string | null;
  folderTree?: any;
  sidebarWidth?: number;
  onSidebarResize?: (e: React.MouseEvent) => void;
}

export default function Sidebar({ onFolderSelect, onNoteSelect, open = true, selectedFolder, selectedNote, folderTree, sidebarWidth = 320, onSidebarResize }: SidebarProps) {
  // DEBUG : log l'arbre pour vérifier la présence de color et icon
  React.useEffect(() => {
    if (folderTree) {
      console.log("[Sidebar] folderTree:", folderTree);
    }
  }, [folderTree]);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  // Pour la démo, toggleSidebar est un stub
  const toggleSidebar = () => {};

  return (
    <aside
      className={cn(
        "sidebar-root h-full border-r border-border bg-card flex-shrink-0 relative",
        open ? "sidebar-open w-80 min-w-[20rem] max-w-[30rem]" : "sidebar-collapsed w-16 min-w-[4rem] max-w-[30rem]"
      )}
      style={{ width: sidebarWidth, minWidth: 64, maxWidth: 480 }}
    >
      <div className="sidebar-content h-full flex flex-col bg-card border-r border-border transition-all duration-300 shadow-lg w-full">
        {/* Header : barre de recherche + boutons */}
        <div className="sidebar-header p-4 border-b border-border bg-background">
          <div className="sidebar-actions flex items-center gap-2 mb-4">
            <SidebarToggleButton open={open} toggleSidebar={toggleSidebar} />
            <Input
              placeholder="Rechercher dossiers et notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="sidebar-search pl-10 bg-background rounded-lg border border-border"
            />
          </div>
          <div className="sidebar-buttons flex items-center gap-2 mb-2 justify-center">
            <button
              className="sidebar-btn-folder p-2 rounded bg-primary text-primary-foreground hover:bg-primary/80 transition"
              title="Ajouter un dossier"
              onClick={() => setShowDialog(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder-plus w-5 h-5"><path d="M12 10v6"></path><path d="M9 13h6"></path><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path></svg>
            </button>
            <button
              className="sidebar-btn-note p-2 rounded bg-primary text-primary-foreground hover:bg-primary/80 transition"
              title="Ajouter une note"
              onClick={() => setShowNoteDialog(true)}
            >
              <FilePlus className="w-5 h-5" />
            </button>
            <button
              className="sidebar-btn-draw p-2 rounded bg-primary text-primary-foreground hover:bg-primary/80 transition"
              title="Ajouter un dessin"
              onClick={() => alert('Fonction Ajouter un dessin à implémenter')}
            >
              <Pencil className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Arborescence hiérarchique moderne */}
        <nav className="sidebar-tree flex-1 overflow-auto px-2 py-4">
          {folderTree ? (
            <FolderTree
              tree={filterTree(folderTree, search)}
              onFolderSelect={onFolderSelect}
              selectedFolder={selectedFolder}
              onNoteSelect={onNoteSelect}
              selectedNote={selectedNote}
            />
          ) : (
            <div className="sidebar-empty flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="sidebar-empty-title text-lg font-semibold mb-2 text-destructive">Aucun dossier trouvé</div>
              <div className="sidebar-empty-desc text-sm text-muted-foreground mb-4">Impossible d'afficher l'arborescence des dossiers. Vérifiez le dossier racine ou choisissez-en un nouveau.</div>
              <ClientOnlyButton />
            </div>
          )}
        </nav>
        {/* Dialog création dossier (à compléter selon ta logique) */}
        {showDialog && (
          <AddFolderDialog
            folders={folderTree?.children || []}
            onFolderAdded={() => setShowDialog(false)}
            open={showDialog}
            onOpenChange={setShowDialog}
          />
        )}
        {showNoteDialog && (
          <AddNoteDialog
            open={showNoteDialog}
            onOpenChange={setShowNoteDialog}
            parentPath={selectedFolder || folderTree?.path || ""}
            onNoteCreated={note => {
              setShowNoteDialog(false);
            }}
          />
        )}
      </div>
      {/* Séparateur draggable */}
      <div
        className="sidebar-separator absolute top-0 right-0 h-full w-2 cursor-col-resize flex items-center"
        style={{ zIndex: 50 }}
        onMouseDown={onSidebarResize}
      >
        <div className="sidebar-separator-bar w-1 h-3/4 mx-auto bg-white/70 rounded-full shadow"></div>
      </div>
    </aside>
  );
}