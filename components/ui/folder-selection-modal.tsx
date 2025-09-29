import * as React from "react";
import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Home, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FolderNode {
  id: string;
  name: string;
  path: string;
  children?: FolderNode[];
  parent?: string;
  isExpanded?: boolean;
}

export interface FolderSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: FolderNode[];
  selectedFolderId?: string;
  onFolderSelect: (folderId: string | null, folderPath: string) => void;
  title?: string;
  description?: string;
  showSearch?: boolean;
}

export function FolderSelectionModal({
  open,
  onOpenChange,
  folders,
  selectedFolderId,
  onFolderSelect,
  title = "Sélectionner un dossier parent",
  description = "Choisissez le dossier dans lequel créer le nouvel élément",
  showSearch = true
}: FolderSelectionModalProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<{id: string | null, path: string} | null>(null);

  // Initialize selectedDestination when modal opens or selectedFolderId changes
  React.useEffect(() => {
    if (open && selectedFolderId !== undefined) {
      console.log('=== Initializing selectedDestination ===');
      console.log('open:', open);
      console.log('selectedFolderId:', selectedFolderId);
      setSelectedDestination({id: selectedFolderId, path: ""});
    }
  }, [open, selectedFolderId]);

  // Debug: Track selectedDestination changes
  React.useEffect(() => {
    console.log('=== selectedDestination changed ===');
    console.log('selectedDestination:', selectedDestination);
  }, [selectedDestination]);

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
    console.log('=== handleFolderSelect called ===');
    console.log('folder:', folder);
    console.log('Setting selectedDestination to:', {id: folder.id, path: folder.path});
    setSelectedDestination({id: folder.id, path: folder.path});
  }, []);

  const handleRootSelect = useCallback(() => {
    console.log('=== handleRootSelect called ===');
    console.log('Setting selectedDestination to:', {id: null, path: ""});
    setSelectedDestination({id: null, path: ""});
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedDestination) {
      onFolderSelect(selectedDestination.id, selectedDestination.path);
    }
    onOpenChange(false);
  }, [selectedDestination, onFolderSelect, onOpenChange]);

  const getSelectedFolderName = useCallback(() => {
    if (!selectedFolderId) return "Racine";

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
    return selectedFolder?.name || "Racine";
  }, [selectedFolderId, folders]);

  const filterFolders = useCallback((nodes: FolderNode[], term: string): FolderNode[] => {
    if (!term) return nodes;

    return nodes.filter(node => {
      const matchesName = node.name.toLowerCase().includes(term.toLowerCase());
      const matchesChildren = node.children ? filterFolders(node.children, term).length > 0 : false;

      if (matchesName || matchesChildren) {
        return {
          ...node,
          children: node.children ? filterFolders(node.children, term) : undefined
        };
      }
      return null;
    }).filter(Boolean) as FolderNode[];
  }, []);

  const filteredFolders = React.useMemo(() => {
    return filterFolders(folders, searchTerm);
  }, [folders, searchTerm, filterFolders]);

  const renderFolderTree = useCallback((nodes: FolderNode[], depth = 0): React.ReactNode => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.id);
      const hasChildren = node.children && node.children.length > 0;

      return (
        <div key={node.id}>
          <div
            className={cn(
              "flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all duration-300 relative group",
              "hover:bg-accent/50 hover:shadow-sm",
              "border border-transparent hover:border-border/50"
            )}
            style={{
              marginLeft: depth * 16,
              background: (selectedDestination?.id === node.id)
                ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 197, 253, 0.1) 100%)"
                : undefined,
              border: (selectedDestination?.id === node.id)
                ? "1px solid rgba(59, 130, 246, 0.3)"
                : undefined,
              borderLeft: (selectedDestination?.id === node.id)
                ? "4px solid #3b82f6"
                : undefined,
              boxShadow: (selectedDestination?.id === node.id)
                ? "0 4px 12px rgba(59, 130, 246, 0.15)"
                : undefined,
              transform: (selectedDestination?.id === node.id)
                ? "scale(1.02)"
                : undefined
            }}
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
  }, [expandedFolders, selectedDestination, handleFolderSelect, toggleExpanded]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-yellow-500" />
            {title}
          </DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">
              {description}
            </p>
          )}
        </DialogHeader>

        {/* Search - Only show if showSearch is true */}
        {showSearch && (
          <div className="space-y-2 pb-4">
            <Label htmlFor="folder-search" className="text-sm font-medium">
              Rechercher un dossier
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="folder-search"
                placeholder="Tapez pour rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Folder Tree */}
        <div className="flex-1 overflow-y-auto min-h-0 max-h-[75vh]">
          <div className="space-y-2 pr-2">
            {/* Root option */}
            <div
              className={cn(
                "flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all duration-300 relative group",
                "hover:bg-accent/50 hover:shadow-sm",
                "border border-transparent hover:border-border/50"
              )}
              style={{
                background: (selectedDestination?.id === null)
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 197, 253, 0.1) 100%)"
                  : undefined,
                border: (selectedDestination?.id === null)
                  ? "1px solid rgba(59, 130, 246, 0.3)"
                  : undefined,
                borderLeft: (selectedDestination?.id === null)
                  ? "4px solid #3b82f6"
                  : undefined,
                boxShadow: (selectedDestination?.id === null)
                  ? "0 4px 12px rgba(59, 130, 246, 0.15)"
                  : undefined,
                transform: (selectedDestination?.id === null)
                  ? "scale(1.02)"
                  : undefined
              }}
              onClick={handleRootSelect}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background border border-border/50">
                <Home className="w-4 h-4 text-blue-500" />
              </div>
              <span className={cn(
                "font-medium text-sm truncate flex-1",
                !selectedFolderId ? "text-primary" : "text-foreground"
              )}>
                Racine
              </span>
            </div>

            {/* Folder tree */}
            <div className="space-y-1">
              {renderFolderTree(filteredFolders)}
            </div>

            {filteredFolders.length === 0 && searchTerm && (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun dossier trouvé pour "{searchTerm}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedDestination ? (
              <>
                Destination: <span className="font-medium text-foreground">
                  {selectedDestination.id === null ? "Racine" : selectedDestination.path.split('\\').pop()}
                </span>
              </>
            ) : (
              "Aucune destination sélectionnée"
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedDestination}
            >
              Confirmer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FolderSelectionModal;
