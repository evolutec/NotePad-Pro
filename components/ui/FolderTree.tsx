"use client";
import React, { useState } from "react"
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookOpen, Folder, FileText, Star, Settings, MoreHorizontal, FolderPlus, Calendar, Tag, Archive } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const lucideIcons: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-4 h-4 mr-1 align-middle" />,
  Folder: <Folder className="w-4 h-4 mr-1 align-middle" />,
  FileText: <FileText className="w-4 h-4 mr-1 align-middle" />,
  Star: <Star className="w-4 h-4 mr-1 align-middle" />,
  Settings: <Settings className="w-4 h-4 mr-1 align-middle" />,
  FolderPlus: <FolderPlus className="w-4 h-4 mr-1 align-middle" />,
  Calendar: <Calendar className="w-4 h-4 mr-1 align-middle" />,
  Tag: <Tag className="w-4 h-4 mr-1 align-middle" />,
  Archive: <Archive className="w-4 h-4 mr-1 align-middle" />,
};

// Type pour un nœud de dossier/fichier décoré
export type FolderNode = {
  name: string;
  path: string;
  type: string; // "folder" ou "file"
  color?: string;
  icon?: string;
  description?: string;
  tags?: string[];
  parent?: string;
  children?: FolderNode[];
  fullPath?: string;
  isDirectory?: boolean;
};

/**
 * Affiche récursivement la hiérarchie de dossiers/fichiers décorée avec les métadonnées
 * Props :
 * - tree : objet racine du FS décoré (mergeFsWithMeta)
 */
export function FolderTree({ tree, onFolderSelect, selectedFolder }: { tree: FolderNode | null, onFolderSelect?: (folderPath: string) => void, selectedFolder?: string | null }) {
  // Gestion de l'expansion par dossier (clé = path)
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({})

  function toggleExpand(path: string) {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }))
  }

  function renderTree(node: FolderNode | null, depth = 0): React.ReactNode {
    if (!node) return null;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded[node.path];
    const isSelected = selectedFolder === node.path;
    return (
      <div
        key={node.path}
        className={cn(
          "relative transition-all",
          hasChildren ? "hover:bg-muted/40" : "hover:bg-muted/20",
          isSelected ? "ring-2 ring-primary/60 bg-primary/10" : ""
        )}
        style={{ marginLeft: depth * 24 }}
      >
        {/* Ligne verticale hiérarchique */}
        <div className="absolute left-0 top-0 bottom-0 w-4 flex items-stretch pointer-events-none">
          <div className="w-px bg-border h-full mx-auto" />
        </div>
        <div className="flex items-center gap-1 py-0.5 pl-3 min-h-[28px]">
          {/* Chevron si dossier parent */}
          {hasChildren ? (
            <button
              type="button"
              className="p-0.5 rounded hover:bg-primary/20 transition"
              onClick={() => toggleExpand(node.path)}
              aria-label={isExpanded ? "Réduire" : "Déplier"}
            >
              {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : null}
          <span
            className="flex items-center gap-1 cursor-pointer text-xs font-medium text-card-foreground"
            onClick={() => onFolderSelect?.(node.path)}
          >
            {/* Icône réduite */}
            <span title={node.icon ? `Icône: ${node.icon}` : "Icône dossier"} className="mr-1">
              {node.icon
                ? (lucideIcons[node.icon]
                    ? React.cloneElement(lucideIcons[node.icon] as React.ReactElement, { className: "w-4 h-4 align-middle" })
                    : <span className="inline-block align-middle text-base">{node.icon}</span>)
                : React.cloneElement(lucideIcons["Folder"] as React.ReactElement, { className: "w-4 h-4 align-middle" })}
            </span>
            <span className={cn("ml-1", isSelected ? "font-bold text-primary" : "font-medium text-card-foreground")}>{node.name}</span>
            {/* Badge couleur à la fin, plus petit */}
            {(() => {
              const tailwindToHex: Record<string, string> = {
                "bg-blue-500": "#3B82F6",
                "bg-green-500": "#22C55E",
                "bg-red-500": "#EF4444",
                // Ajoute d'autres couleurs si besoin
              };
              let badgeColor = "#D1D5DB"; // gris par défaut
              if (node.color) {
                if (node.color.startsWith("bg-")) {
                  badgeColor = tailwindToHex[node.color] || "#D1D5DB";
                } else if (node.color.startsWith("#")) {
                  badgeColor = node.color;
                }
              }
              return (
                <span
                  className="inline-block w-3 h-3 rounded-full border border-white shadow-sm ml-2"
                  style={{ backgroundColor: badgeColor }}
                  title={node.color ? `Couleur: ${node.color}` : "Couleur par défaut"}
                />
              );
            })()}
          </span>
          {/* Kebab menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded hover:bg-muted/30 ml-1" aria-label="Actions dossier/fichier">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Déplacer</DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  console.log("[Sidebar] Suppression dossier:", node.path);
                  if (typeof window !== "undefined" && window.electronAPI && window.electronAPI.deleteFolder && window.electronAPI.foldersSave && window.electronAPI.foldersLoad) {
                    const res = await window.electronAPI.deleteFolder(node.path);
                    if (res && res.success) {
                      // Charger folders.json, retirer le dossier, sauvegarder
                      const folders = await window.electronAPI.foldersLoad();
                      if (folders && Array.isArray(folders)) {
                        const updatedFolders = folders.filter((f: any) => f.path !== node.path);
                        await window.electronAPI.foldersSave(updatedFolders);
                        console.log("[Sidebar] Dossier supprimé du disque et de folders.json:", node.path);
                        window.location.reload();
                      }
                    } else {
                      console.error("[Sidebar] Erreur suppression dossier:", res?.error);
                    }
                  } else {
                    console.warn("[Sidebar] API Electron deleteFolder/foldersSave/foldersLoad non disponible");
                  }
                }}
              >Supprimer</DropdownMenuItem>
              <DropdownMenuItem>Couper</DropdownMenuItem>
              <DropdownMenuItem>Copier</DropdownMenuItem>
              <DropdownMenuItem>Renommer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Affichage enfants si expand */}
        {hasChildren && isExpanded && (
          <div>
            {(node.children ?? []).map((child: FolderNode) => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }
  return tree ? renderTree(tree, 0) : null;
}
