"use client";
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  File,
  FileCode,
  FileImage,
  FileAudio,
  FileVideo,
  FileArchive,
  MoreVertical,
  Plus,
  Tag,
  Clock,
  Star,
  Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu';

// CSS import - side-effect import for styles
// @ts-ignore - Suppress TypeScript error for CSS import
import './tree-styles.css';

// Custom PDF icon component
const FileIconPdf = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <text x="7" y="16" fontSize="3" fill="currentColor" fontWeight="bold">PDF</text>
  </svg>
)

// Enhanced type definitions
export type FileType = 'folder' | 'note' | 'draw' | 'document' | 'image' | 'video' | 'audio' | 'code' | 'archive' | 'link' | 'file';

export type EnhancedFolderNode = {
  id?: string;
  name: string;
  path: string;
  type: FileType;
  color?: string;
  icon?: string;
  description?: string;
  tags?: string[];
  parent?: string;
  children?: EnhancedFolderNode[];
  fullPath?: string;
  isDirectory?: boolean;
  size?: number;
  modifiedAt?: Date;
  createdAt?: Date;
  isStarred?: boolean;
  isShared?: boolean;
  metadata?: Record<string, any>;
};

// File type detection and icon mapping
const getFileType = (node: EnhancedFolderNode): FileType => {
  if (node.type === 'folder') return 'folder';
  if (node.name.endsWith('.md') || node.name.endsWith('.txt')) return 'note';
  if (node.name.endsWith('.draw')) return 'draw';

  // Check for PDF first (most specific)
  if (node.name.endsWith('.pdf')) {
    console.log('PDF file detected in getFileType:', node.name);
    return 'document'; // Using 'document' type but will use custom PDF icon
  }

  if (node.name.match(/\.(doc|docx|odt)$/i)) return 'document';
  if (node.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) return 'image';
  if (node.name.match(/\.(mp4|webm|ogg|avi|mov|mkv|wmv|flv|3gp)$/i)) return 'video';
  if (node.name.match(/\.(mp3|wav|flac|aac)$/i)) return 'audio';
  if (node.name.match(/\.(js|ts|jsx|tsx|py|java|cpp|cs|html|css|json)$/i)) return 'code';
  if (node.name.match(/\.(zip|rar|7z|tar|gz)$/i)) return 'archive';
  return 'file';
};

const getFileIcon = (type: FileType, isExpanded: boolean = false, nodeName?: string) => {
  const iconClass = "w-4 h-4";

  // Special case for PDF files - use custom PDF icon
  if (nodeName && nodeName.toLowerCase().endsWith('.pdf')) {
    console.log('PDF file detected in getFileIcon:', nodeName);
    return <FileIconPdf className={iconClass} />;
  }

  switch (type) {
    case 'folder':
      return isExpanded ? <FolderOpen className={iconClass} /> : <Folder className={iconClass} />;
    case 'note':
      return <FileText className={iconClass} />;
    case 'draw':
      return <Palette className={iconClass} />;
    case 'document':
      // Check if it's actually a PDF file
      if (nodeName && nodeName.toLowerCase().endsWith('.pdf')) {
        console.log('PDF file detected in document case:', nodeName);
        return <FileIconPdf className={iconClass} />;
      }
      return <FileText className={iconClass} />;
    case 'image':
      return <FileImage className={iconClass} />;
    case 'video':
      return <FileVideo className={iconClass} />;
    case 'audio':
      return <FileAudio className={iconClass} />;
    case 'code':
      return <FileCode className={iconClass} />;
    case 'archive':
      return <FileArchive className={iconClass} />;
    default:
      return <File className={iconClass} />;
  }
};

const getFileColor = (type: FileType) => {
  switch (type) {
    case 'folder':
      return 'text-yellow-500';
    case 'note':
      return 'text-blue-600 dark:text-blue-400';
    case 'draw':
      return 'text-purple-600 dark:text-purple-400';
    case 'document':
      return 'text-red-500';
    case 'image':
      return 'text-red-500';
    case 'video':
      return 'text-blue-500';
    case 'audio':
      return 'text-purple-500';
    case 'code':
      return 'text-orange-500';
    case 'archive':
      return 'text-gray-500';
    case 'link':
      return 'text-cyan-600';
    default:
      return 'text-gray-600';
  }
};

// Modern Tree Item Component
const TreeItem = React.memo(({
  node,
  depth = 0,
  isSelected,
  isNoteSelected,
  onSelect,
  onToggle,
  isExpanded,
  hasChildren,
  onDelete,
  onRename,
  onDuplicate,
  onNewFolder,
  onNewFile,
}: {
  node: EnhancedFolderNode;
  depth?: number;
  isSelected: boolean;
  isNoteSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  isExpanded: boolean;
  hasChildren: boolean;
  onDelete: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onNewFolder: () => void;
  onNewFile: () => void;
}) => {
  const fileType = getFileType(node);
  const isNoteFile = fileType === 'note' || fileType === 'draw';
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;
    return date.toLocaleDateString('fr-FR');
  };

  const formatSize = (size?: number) => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: depth * 0.05 }}
          className={cn(
            "group relative flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200",
            "hover:bg-accent hover:shadow-sm",
            isSelected && "bg-primary/10 ring-2 ring-primary/20 shadow-sm",
            isNoteSelected && "bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-200 dark:ring-blue-800 shadow-sm",
            "border border-transparent hover:border-border/50"
          )}
          style={{
            marginLeft: depth * 16,
            pointerEvents: 'auto',
            zIndex: 10,
            position: 'relative'
          }}
          onClick={(e) => {
            console.log('=== TREEITEM CLICK DETECTED ===');
            console.log('Event:', e);
            console.log('Node:', node.name, node.path);
            onSelect();
          }}
          onMouseDown={(e) => {
            console.log('=== TREEITEM MOUSEDOWN ===');
            e.stopPropagation();
          }}
        >
          {/* Connection lines */}
          {depth > 0 && (
            <div className="absolute left-0 top-0 bottom-0 w-4 flex items-center pointer-events-none">
              <div className="w-px bg-border/50 h-full mx-auto" />
            </div>
          )}

          {/* Expand/Collapse button */}
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </Button>
          ) : (
            // Spacer to keep alignment for items without children
            <div className="h-6 w-6" aria-hidden />
          )}

          {/* Icon or Avatar */}
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-md bg-background border border-border/50",
            fileType === 'folder' && "bg-yellow-100 dark:bg-yellow-900 border-orange-200 dark:border-orange-800",
            fileType === 'note' && "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
            fileType === 'draw' && "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800"
          )}>
            {node.icon ? (
              <span className="text-lg">{node.icon}</span>
            ) : (
              <div className={cn(getFileColor(fileType))}>
                {getFileIcon(fileType, isExpanded, node.name)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-medium text-sm truncate",
                isSelected ? "text-primary" : 
                isNoteSelected ? "text-blue-600 dark:text-blue-400" :
                fileType === 'note' ? "text-blue-600 dark:text-blue-400" :
                fileType === 'draw' ? "text-purple-600 dark:text-purple-400" :
                "text-foreground"
              )}>
                {node.name}
              </span>
              
              {node.isStarred && (
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              )}
              
              {node.tags && node.tags.length > 0 && (
                <div className="flex gap-1">
                  {node.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {(node.description || node.modifiedAt) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {node.description && (
                  <span className="truncate">{node.description}</span>
                )}
                {node.modifiedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(node.modifiedAt)}</span>
                  </div>
                )}
                {node.size && fileType !== 'folder' && (
                  <span>{formatSize(node.size)}</span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-6 w-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onRename}>
                  Renommer
                </DropdownMenuItem>
                {fileType !== 'folder' && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    Dupliquer
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive"
                >
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
      </ContextMenuTrigger>
      
      <ContextMenuContent>
        <ContextMenuItem onClick={onRename}>Renommer</ContextMenuItem>
        {fileType !== 'folder' && (
          <ContextMenuItem onClick={onDuplicate}>Dupliquer</ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          Supprimer
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

TreeItem.displayName = 'TreeItem';

// Main Modern Folder Tree Component
export function ModernFolderTree({
  tree,
  onFolderSelect,
  selectedFolder,
  onNoteSelect,
  selectedNote,
  onImageSelect,
  onVideoSelect,
  onDelete,
  onRename,
  onDuplicate,
  onNewFolder,
  onNewFile,
  initialExpandedPaths = [],
}: {
  tree: EnhancedFolderNode | null;
  onFolderSelect?: (path: string) => void;
  selectedFolder?: string | null;
  onNoteSelect?: (path: string) => void;
  selectedNote?: string | null;
  onImageSelect?: (path: string, name: string, type: string) => void;
  onVideoSelect?: (path: string, name: string, type: string) => void;
  onDelete?: (node: EnhancedFolderNode) => void;
  onRename?: (node: EnhancedFolderNode) => void;
  onDuplicate?: (node: EnhancedFolderNode) => void;
  onNewFolder?: (parentPath: string) => void;
  onNewFile?: (parentPath: string) => void;
  initialExpandedPaths?: string[];
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(initialExpandedPaths));
  const [treeVersion, setTreeVersion] = useState(0);

  // Update tree version when tree changes (but don't clear expanded paths)
  React.useEffect(() => {
    if (tree) {
      console.log('Tree updated, incrementing version...');
      setTreeVersion(prev => prev + 1);
    }
  }, [tree]);

  // Auto-expand path to selectedFolder
  React.useEffect(() => {
    if (selectedFolder && tree) {
      console.log('Auto-expanding path to selectedFolder:', selectedFolder);

      // Function to collect all ancestor paths of selectedFolder
      const collectAncestorPaths = (targetPath: string, tree: EnhancedFolderNode): string[] => {
        const paths: string[] = [];

        const findAncestors = (node: EnhancedFolderNode, currentPath: string = ''): boolean => {
          const nodePath = node.path;
          if (nodePath === targetPath) {
            paths.push(nodePath);
            return true;
          }

          if (node.children) {
            for (const child of node.children) {
              const childPath = child.path;
              if (findAncestors(child, childPath)) {
                paths.push(nodePath);
                return true;
              }
            }
          }
          return false;
        };

        findAncestors(tree);
        return paths;
      };

      const pathsToExpand = collectAncestorPaths(selectedFolder, tree);
      console.log('Paths to expand:', pathsToExpand);

      // Expand all ancestor paths
      setExpanded(prev => {
        const newExpanded = new Set(prev);
        pathsToExpand.forEach(path => {
          newExpanded.add(path);
        });
        return newExpanded;
      });
    }
  }, [selectedFolder, tree]);

  const toggleExpand = useCallback((path: string) => {
    setExpanded(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  const handleSelect = useCallback((node: EnhancedFolderNode) => {
    console.log('=== FOLDERTREE CLICK DEBUG ===');
    console.log('handleSelect called with node:', node.path, 'type:', node.type);
    console.log('Node details:', node);
    console.log('Available handlers:', { onFolderSelect, onNoteSelect, onImageSelect, onVideoSelect });

    // Check if it's a PDF file specifically - this should take priority
    if (node.name.toLowerCase().endsWith('.pdf')) {
      console.log('PDF file detected, calling onNoteSelect with path:', node.path);
      onNoteSelect?.(node.path);
      return;
    }

    // For other files, use the normal file type logic
    const fileType = getFileType(node);
    console.log('File type detected:', fileType, 'for file:', node.name);

    if (fileType === 'video' && onVideoSelect) {
      console.log('Video file detected, calling onVideoSelect with path:', node.path, 'name:', node.name, 'type:', fileType);
      onVideoSelect(node.path, node.name, fileType);
    } else if (fileType === 'image' && onImageSelect) {
      console.log('Image file detected, calling onImageSelect with path:', node.path, 'name:', node.name, 'type:', fileType);
      onImageSelect(node.path, node.name, fileType);
    } else if ((fileType === 'note' || fileType === 'draw' || fileType === 'document') && onNoteSelect) {
      console.log('Calling onNoteSelect with path:', node.path);
      onNoteSelect(node.path);
    } else if (onFolderSelect) {
      console.log('Calling onFolderSelect with path:', node.path);
      onFolderSelect(node.path);
    } else {
      console.log('No handler available for this node type');
    }
    console.log('=== FOLDERTREE CLICK END ===');
  }, [onFolderSelect, onNoteSelect, onImageSelect, onVideoSelect]);

  const renderTree = (node: EnhancedFolderNode | null, depth = 0): React.ReactNode => {
    if (!node) return null;
    
    const hasChildren = !!(node.children && node.children.length > 0);
    const isExpanded = expanded.has(node.path);
    const isSelected = selectedFolder === node.path;
    const isNoteSelected = selectedNote === node.path;
    
    console.log('Node:', node.path, 'selectedFolder:', selectedFolder, 'isSelected:', isSelected);
    console.log('Node:', node.path, 'selectedNote:', selectedNote, 'isNoteSelected:', isNoteSelected);

    return (
      <div key={`${node.id || node.path}-${node.name}-${node.type}`}>
        <TreeItem
          node={node}
          depth={depth}
          isSelected={isSelected}
          isNoteSelected={isNoteSelected}
          onSelect={() => handleSelect(node)}
          onToggle={() => toggleExpand(node.path)}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          onDelete={() => onDelete?.(node)}
          onRename={() => onRename?.(node)}
          onDuplicate={() => onDuplicate?.(node)}
          onNewFolder={() => onNewFolder?.(node.path)}
          onNewFile={() => onNewFile?.(node.path)}
        />
        
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {node.children!.map((child) => renderTree(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (!tree) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Folder className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm font-medium">Aucun dossier trouvé</p>
        <p className="text-xs mt-1">Commencez par créer un dossier</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-1 p-2" key={treeVersion}>
        {renderTree(tree)}
      </div>
    </TooltipProvider>
  );
}

export default ModernFolderTree;
