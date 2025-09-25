import * as React from "react";
import { useState, useCallback } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FolderNode {
  id: string;
  name: string;
  path: string;
  children?: FolderNode[];
  parent?: string;
  isExpanded?: boolean;
}

export interface FolderTreeSelectorProps {
  folders: FolderNode[];
  selectedFolderId?: string;
  onFolderSelect: (folderId: string | null, folderPath: string) => void;
  placeholder?: string;
  className?: string;
  showRootOption?: boolean;
  rootLabel?: string;
}

export function FolderTreeSelector({
  folders,
  selectedFolderId,
  onFolderSelect,
  placeholder = "Sélectionner un dossier parent...",
  className,
  showRootOption = true,
  rootLabel = "Racine"
}: FolderTreeSelectorProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);

  const toggleExpanded = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  const handleFolderSelect = useCallback((folder: FolderNode) => {
    onFolderSelect(folder.id, folder.path);
    setIsOpen(false);
  }, [onFolderSelect]);

  const handleRootSelect = useCallback(() => {
    onFolderSelect(null, "");
    setIsOpen(false);
  }, [onFolderSelect]);

  const getSelectedFolderName = useCallback(() => {
    if (!selectedFolderId) return rootLabel;

    const findFolder = (nodes: FolderNode[]): FolderNode | null => {
      for (const node of nodes) {
        if (node.id === selectedFolderId) return node;
        if (node.children) {
          const found = findFolder(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const selectedFolder = findFolder(folders);
    return selectedFolder?.name || placeholder;
  }, [selectedFolderId, folders, rootLabel, placeholder]);

  const renderFolderTree = useCallback((nodes: FolderNode[], depth = 0): React.ReactNode => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.id);
      const hasChildren = node.children && node.children.length > 0;

      return (
        <div key={node.id}>
          <div
            className={cn(
              "flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200",
              "hover:bg-accent hover:shadow-sm",
              selectedFolderId === node.id && "bg-primary/10 ring-2 ring-primary/20 shadow-sm",
              "border border-transparent hover:border-border/50"
            )}
            style={{ marginLeft: depth * 16 }}
            onClick={() => handleFolderSelect(node)}
          >
            {/* Expand/Collapse button */}
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-6 w-6 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(node.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            ) : (
              <div className="h-6 w-6" aria-hidden />
            )}

            {/* Folder icon */}
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background border border-border/50">
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-yellow-500" />
                ) : (
                  <Folder className="w-4 h-4 text-yellow-500" />
                )
              ) : (
                <Folder className="w-4 h-4 text-yellow-500" />
              )}
            </div>

            {/* Folder name */}
            <span className={cn(
              "font-medium text-sm truncate flex-1",
              selectedFolderId === node.id ? "text-primary" : "text-foreground"
            )}>
              {node.name}
            </span>
          </div>

          {/* Children */}
          {hasChildren && isExpanded && (
            <div className="ml-4">
              {renderFolderTree(node.children!, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  }, [expandedFolders, selectedFolderId, handleFolderSelect, toggleExpanded]);

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        className={cn(
          "w-full justify-between text-left font-normal",
          !selectedFolderId && "text-muted-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 truncate">
          <Home className="w-4 h-4" />
          <span className="truncate">{getSelectedFolderName()}</span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </Button>

      {isOpen && (
        <div className={cn(
          "absolute top-full left-0 right-0 z-50 mt-1",
          "bg-popover border border-border rounded-md shadow-lg",
          "max-h-64 overflow-y-auto"
        )}>
          <div className="p-2">
            {/* Root option */}
            {showRootOption && (
              <div
                className={cn(
                  "flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200",
                  "hover:bg-accent hover:shadow-sm",
                  !selectedFolderId && "bg-primary/10 ring-2 ring-primary/20 shadow-sm",
                  "border border-transparent hover:border-border/50"
                )}
                onClick={handleRootSelect}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background border border-border/50">
                  <Home className="w-4 h-4 text-blue-500" />
                </div>
                <span className={cn(
                  "font-medium text-sm truncate flex-1",
                  !selectedFolderId ? "text-primary" : "text-foreground"
                )}>
                  {rootLabel}
                </span>
              </div>
            )}

            {/* Folder tree */}
            <div className="mt-2">
              {renderFolderTree(folders)}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default FolderTreeSelector;
