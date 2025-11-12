"use client";
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FolderPlus,
  BookOpen,
  Calendar,
  Tag,
  Archive,
  FileText,
  File,
  FileCode,
  FileImage,
  FileAudio,
  FileVideo,
  FileArchive,
  MoreVertical,
  Plus,
  Clock,
  Star,
  Palette,
  Home,
  Settings,
  Users,
  Bookmark,
  Trash2,
  Table,
  Presentation
} from 'lucide-react';
import { getFileTypeConfig, type FileType as LibFileType } from '@/lib/file-types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FolderSelectionModal, type FolderNode } from '@/components/ui/folder-selection-modal';
import { FileConflictDialog } from '@/components/file-conflict-dialog';

// Custom PDF icon component
const FileIconPdf = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <text x="7" y="16" fontSize="3" fill="currentColor" fontWeight="bold">PDF</text>
  </svg>
)

// Enhanced type definitions
export type FileType = 'folder' | 'note' | 'draw' | 'document' | 'pdf' | 'excel' | 'powerpoint' | 'image' | 'video' | 'audio' | 'code' | 'archive' | 'link' | 'file';

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

// Icon name to component mapping
const iconNameToComponent = (iconName: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'FolderPlus': FolderPlus,
    'BookOpen': BookOpen,
    'Calendar': Calendar,
    'Tag': Tag,
    'Archive': Archive,
    'FileText': FileText,
    'Folder': Folder,
    'Home': Home,
    'Star': Star,
    'Clock': Clock,
    'Palette': Palette,
    'Settings': Settings,
    'Users': Users,
    'Bookmark': Bookmark,
    'Trash2': Trash2,
    'FolderOpen': FolderOpen,
    'File': File,
    'FileCode': FileCode,
    'FileImage': FileImage,
    'FileAudio': FileAudio,
    'FileVideo': FileVideo,
    'FileArchive': FileArchive,
  };

  return iconMap[iconName] || FolderPlus; // Default to FolderPlus if icon not found
};

// File type detection and icon mapping
const getFileType = (node: EnhancedFolderNode): FileType => {
  if (node.type === 'folder') return 'folder';
  if (node.name.endsWith('.draw')) return 'draw';

  // Check for specific Office formats
  if (node.name.match(/\.pdf$/i)) return 'pdf';
  if (node.name.match(/\.(xlsx|xls)$/i)) return 'excel';
  if (node.name.match(/\.(pptx|ppt)$/i)) return 'powerpoint';
  
  // Text/document formats - all treated as 'note' for blue color
  if (node.name.match(/\.(md|txt|doc|docx|odt)$/i)) return 'note';
  
  // Media files
  if (node.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) return 'image';
  if (node.name.match(/\.(mp4|webm|ogv|avi|mov|mkv|wmv|flv)$/i)) return 'video';
  if (node.name.match(/\.(mp3|wav|wave|ogg|oga|opus|flac|aac|m4a|m4b|m4p|wma|aiff|aif|ape|mka|wv|tta|tak|mp2|mp1|mpa|ac3|dts|amr|3gp|ra|ram|weba)$/i)) return 'audio';
  
  // Development files
  if (node.name.match(/\.(js|ts|jsx|tsx|py|java|cpp|cs|html|css|json)$/i)) return 'code';
  
  // Archives
  if (node.name.match(/\.(zip|rar|7z|tar|gz)$/i)) return 'archive';
  
  return 'file';
};

const getFileIcon = (type: FileType, isExpanded: boolean = false, nodeName?: string) => {
  const iconClass = "w-4 h-4";

  // Special handling for folders
  if (type === 'folder') {
    return isExpanded ? <FolderOpen className={iconClass} /> : <Folder className={iconClass} />;
  }

  // For other types, try to get config from file-types.ts
  const config = getFileTypeConfig(type as LibFileType);
  if (config?.icon) {
    const IconComponent = config.icon;
    return <IconComponent className={iconClass} />;
  }

  // Fallback icons
  switch (type) {
    case 'note':
      return <FileText className={iconClass} />;
    case 'draw':
      return <Palette className={iconClass} />;
    case 'document':
      return <FileText className={iconClass} />;
    case 'pdf':
      return <FileText className={iconClass} />;
    case 'excel':
      return <Table className={iconClass} />;
    case 'powerpoint':
      return <Presentation className={iconClass} />;
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
  // Try to get config from file-types.ts
  const config = getFileTypeConfig(type as LibFileType);
  if (config?.sidebarButton?.text) {
    return config.sidebarButton.text;
  }

  // Fallback colors matching file-types.ts themes
  switch (type) {
    case 'folder':
      return 'text-yellow-500';
    case 'note':
      return 'text-blue-600 dark:text-blue-400';
    case 'draw':
      return 'text-purple-600 dark:text-purple-400';
    case 'document':
      return 'text-red-600 dark:text-red-400';
    case 'pdf':
      return 'text-red-600 dark:text-red-400';
    case 'excel':
      return 'text-green-600 dark:text-green-400';
    case 'powerpoint':
      return 'text-orange-600 dark:text-orange-400';
    case 'image':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'video':
      return 'text-gray-600 dark:text-gray-400';
    case 'audio':
      return 'text-pink-600 dark:text-pink-400';
    case 'code':
      return 'text-orange-600 dark:text-orange-400';
    case 'archive':
      return 'text-gray-600 dark:text-gray-400';
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
  onMove,
  onNewFolder,
  onNewFile,
  setFileConflict
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
  onMove: () => void;
  onNewFolder: () => void;
  onNewFile: () => void;
  setFileConflict: (state: { 
    fileName: string; 
    sourcePath: string; 
    targetFolder: string;
    isMove: boolean;
    oldPath?: string;
    newPath?: string;
  } | null) => void;
}) => {
  const fileType = getFileType(node);
  const isNoteFile = fileType === 'note' || fileType === 'draw';
  const [isDragOver, setIsDragOver] = useState(false);
  
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
        <div
          draggable
          className={cn(
            "group relative flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200",
            "hover:bg-accent hover:shadow-sm",
            isSelected && "bg-primary/10 ring-2 ring-primary/20 shadow-sm",
            isNoteSelected && "bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-200 dark:ring-blue-800 shadow-sm",
            "border border-transparent hover:border-border/50",
            isDragOver && node.type === 'folder' && "bg-primary/20 ring-2 ring-primary"
          )}
          style={{
            marginLeft: depth * 16,
            pointerEvents: 'auto',
            zIndex: 10,
            position: 'relative'
          }}
          onDragStart={(e: React.DragEvent) => {
            e.stopPropagation();
            const dragData = {
              sourcePath: node.path,
              sourceNode: node,
              sourceType: 'sidebar'
            };
            e.dataTransfer.setData('application/json', JSON.stringify(dragData));
            e.dataTransfer.effectAllowed = 'move';
            console.log('🔵 Drag started from sidebar:', node.path);
          }}
          onDragOver={(e: React.DragEvent) => {
            if (node.type === 'folder') {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'move';
              setIsDragOver(true);
            }
          }}
          onDragLeave={(e: React.DragEvent) => {
            e.stopPropagation();
            setIsDragOver(false);
          }}
          onDrop={async (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            
            if (node.type !== 'folder') return;
            
            console.log('🟢 Sidebar drop detected');
            console.log('Data types:', e.dataTransfer.types);
            console.log('Files count:', e.dataTransfer.files.length);
            
            // Try to get JSON data first (internal drag)
            let jsonData = null;
            try {
              const dragDataStr = e.dataTransfer.getData('application/json');
              if (dragDataStr) {
                jsonData = JSON.parse(dragDataStr);
                console.log('📋 JSON data found - internal drag:', jsonData);
              }
            } catch (err) {
              // No JSON data
            }
            
            // Check if this is an external file drop
            if (!jsonData && e.dataTransfer.files.length > 0) {
              const firstFile = e.dataTransfer.files[0];
              
              console.log('📋 First file:', firstFile.name);
              console.log('📋 File type:', firstFile.type);
              console.log('📋 File size:', firstFile.size);
              
              // Use Electron's webUtils.getPathForFile to get the real file path
              let filePath: string | null = null;
              
              if (typeof window !== 'undefined' && window.electronAPI?.getPathForFile) {
                try {
                  filePath = window.electronAPI.getPathForFile(firstFile);
                  console.log('📋 File path from webUtils:', filePath);
                } catch (error) {
                  console.error('❌ Error getting file path:', error);
                }
              }
              
              // If we have a path, it's an external file from the filesystem
              if (filePath && filePath.length > 0) {
                console.log('📦 External files dropped in sidebar:', e.dataTransfer.files.length);
                
                // Process each dropped file
                for (let i = 0; i < e.dataTransfer.files.length; i++) {
                  const file = e.dataTransfer.files[i];
                  console.log('📄 Processing file:', file.name);
                  
                  // Get path for this file
                  const filePathStr = window.electronAPI?.getPathForFile ? window.electronAPI.getPathForFile(file) : null;
                  if (!filePathStr) {
                    console.error('❌ Could not get path for file:', file.name);
                    continue;
                  }
                  
                  const targetFolder = node.path;
                  
                  console.log('📂 Source:', filePathStr);
                  console.log('📂 Target folder:', targetFolder);
                  
                  // Import the file into the target folder
                  if (typeof window !== 'undefined' && window.electronAPI?.copyExternalFile) {
                    try {
                      const result = await window.electronAPI.copyExternalFile(
                        filePathStr,
                        targetFolder
                      );
                      
                      if (result.success) {
                        console.log('✅ File imported successfully:', result.targetPath);
                        // Refresh the file list
                        window.dispatchEvent(new Event('folderTreeRefresh'));
                        window.dispatchEvent(new Event('recentFilesRefresh'));
                      } else if (result.conflict) {
                        // File conflict detected, show dialog
                        console.log('⚠️ File conflict detected:', result.existingFileName);
                        setFileConflict({
                          fileName: result.existingFileName || file.name,
                          sourcePath: filePathStr,
                          targetFolder: targetFolder,
                          isMove: false
                        });
                      } else {
                        console.error('❌ Import failed:', result.error);
                      }
                    } catch (error) {
                      console.error('❌ Import error:', error);
                    }
                  } else {
                    console.error('❌ copyExternalFile API not available');
                  }
                }
                return; // Exit early, don't process as internal drag
              } else {
                console.log('⚠️ No file path found - this is an internal drag, not external');
              }
            }
            
            // Handle internal drag (move file/folder within app)
            if (jsonData) {
              try {
                const sourcePath = jsonData.sourcePath;
                const targetPath = node.path;
                
                console.log('🟢 Internal drop on folder:', targetPath);
                console.log('📁 Source:', sourcePath);
                console.log('📁 Target:', targetPath);
                
                // Don't allow dropping on self or parent
                if (sourcePath === targetPath || targetPath.startsWith(sourcePath)) {
                  console.log('❌ Cannot drop on self or child folder');
                  return;
                }
                
                // Move the file/folder using Electron API
                if (typeof window !== 'undefined' && window.electronAPI?.fsMove) {
                  const fileName = sourcePath.split('\\').pop() || sourcePath.split('/').pop();
                  const newPath = `${targetPath}\\${fileName}`;
                  
                  console.log('🚀 Moving file:', sourcePath, '→', newPath);
                  const result = await window.electronAPI.fsMove(sourcePath, newPath);
                  
                  if (result.success) {
                    console.log('✅ File moved successfully');
                    // Trigger refresh via DOM event
                    window.dispatchEvent(new Event('folderTreeRefresh'));
                    window.dispatchEvent(new Event('recentFilesRefresh'));
                  } else if (result.conflict) {
                    // File conflict detected, show dialog
                    console.log('⚠️ File conflict detected:', result.existingFileName);
                    setFileConflict({
                      fileName: result.existingFileName || fileName || '',
                      sourcePath: '',
                      targetFolder: '',
                      isMove: true,
                      oldPath: sourcePath,
                      newPath: newPath
                    });
                  } else {
                    console.error('❌ Move failed:', result.error);
                  }
                }
              } catch (error) {
                console.error('❌ Drop error:', error);
              }
            }
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

          {/* Icon - Simple icon without background */}
          <div className={cn(getFileColor(fileType))}>
            {node.icon ? (
              React.createElement(iconNameToComponent(node.icon), { className: "w-4 h-4" })
            ) : (
              getFileIcon(fileType, isExpanded, node.name)
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-medium text-sm truncate",
                isSelected ? "text-primary" :
                isNoteSelected ? "text-blue-600 dark:text-blue-400" :
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
            

          </div>

          {/* Color Pastille for Folders */}
          {fileType === 'folder' && node.color && (
            <div className="flex items-center">
              <div
                className={cn(
                  "w-3 h-3 rounded-full border border-white/20 shadow-sm",
                  node.color.startsWith('bg-') ? node.color : 'bg-gray-400'
                )}
                title={`Couleur: ${node.color}`}
              />
            </div>
          )}

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
                {/* <DropdownMenuItem onClick={onRename}>
                  Renommer
                </DropdownMenuItem> */}
                {fileType !== 'folder' && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    Dupliquer
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onMove}>
                  Déplacer
                </DropdownMenuItem>
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
        </div>
      </ContextMenuTrigger>
      
      <ContextMenuContent>
        {/* <ContextMenuItem onClick={onRename}>Renommer</ContextMenuItem> */}
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

  // Move functionality state
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [nodeToMove, setNodeToMove] = useState<EnhancedFolderNode | null>(null);

  // File conflict state
  const [fileConflict, setFileConflict] = useState<{ 
    fileName: string; 
    sourcePath: string; 
    targetFolder: string;
    isMove: boolean;
    oldPath?: string;
    newPath?: string;
  } | null>(null);

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

    // Check file extension from the actual path since node.name might be truncated
    const fileExtension = node.path.split('.').pop()?.toLowerCase() || '';
    console.log('File extension from path:', fileExtension, 'for file:', node.name, 'path:', node.path);

    // Priorité : audio
    const audioExtensions = ['mp3', 'wav', 'wave', 'ogg', 'oga', 'opus', 'flac', 'aac', 'm4a', 'm4b', 'm4p', 'wma', 'webm', 'aiff', 'aif', 'ape', 'mka', 'wv', 'tta', 'tak', 'mp2', 'mp1', 'mpa', 'ac3', 'dts', 'amr', '3gp', 'ra', 'ram'];
    if (audioExtensions.includes(fileExtension)) {
      console.log('Audio file detected, calling onNoteSelect with path:', node.path);
      onNoteSelect?.(node.path);
      return;
    }

    // PDF
    if (fileExtension === 'pdf') {
      console.log('PDF file detected, calling onNoteSelect with path:', node.path);
      onNoteSelect?.(node.path);
      return;
    }

    // Documents
    const documentExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'odt', 'ods', 'odp', 'txt', 'csv', 'tsv', 'md'];
    if (documentExtensions.includes(fileExtension)) {
      console.log('Document file detected, calling onNoteSelect with path:', node.path);
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
    } else if ((fileType === 'note' || fileType === 'draw') && onNoteSelect) {
      console.log('Note/Draw file detected, calling onNoteSelect with path:', node.path);
      onNoteSelect(node.path);
    } else if (onFolderSelect) {
      console.log('Folder detected, calling onFolderSelect with path:', node.path);
      onFolderSelect(node.path);
    } else {
      console.log('No handler available for this node type');
    }
    console.log('=== FOLDERTREE CLICK END ===');
  }, [onFolderSelect, onNoteSelect, onImageSelect, onVideoSelect]);

  // Convert tree structure to FolderNode format for the modal
  const convertToFolderNodes = useCallback((tree: EnhancedFolderNode | null): FolderNode[] => {
    if (!tree) return [];

    const convertNode = (node: EnhancedFolderNode): FolderNode => {
      // Make all folders expanded by default in the move modal
      const hasChildren = node.children && node.children.length > 0;
      return {
        id: node.id || node.path,
        name: node.name,
        path: node.path,
        children: node.children?.map(convertNode),
        parent: node.parent,
        isExpanded: hasChildren // Expand all folders that have children
      };
    };

    return [convertNode(tree)];
  }, []);

  // Handle move functionality
  const handleMove = useCallback((node: EnhancedFolderNode) => {
    console.log('Opening move modal for:', node.name, node.path);
    setNodeToMove(node);
    setIsMoveModalOpen(true);
  }, []);

  // Handle folder selection in move modal
  const handleMoveDestinationSelect = useCallback(async (folderId: string | null, folderPath: string) => {
    if (!nodeToMove) return;

    console.log('=== MOVE DEBUG ===');
    console.log('folderId:', folderId);
    console.log('folderPath:', folderPath);
    console.log('nodeToMove.path:', nodeToMove.path);
    console.log('nodeToMove.name:', nodeToMove.name);

    try {
      // Check if Electron API is available
      if (!window.electronAPI?.fileRename) {
        console.error('Electron API fileRename not available for move operation');
        return;
      }

      // Properly construct the new path
      let newPath: string;
      if (folderId === null || folderPath === '') {
        // Moving to root - just use the filename in the same directory level
        const pathParts = nodeToMove.path.split('\\');
        pathParts.pop(); // Remove the filename
        newPath = `${pathParts.join('\\')}\\${nodeToMove.name}`;
        console.log('Moving to root, new path:', newPath);
      } else {
        // Moving to a specific folder
        console.log('Moving to folder, folderPath:', folderPath);

        // Check if folderPath already contains the full path or just the folder path
        if (folderPath.includes(nodeToMove.path)) {
          // folderPath contains the full source path - this is wrong
          console.error('ERROR: folderPath contains source path - this should not happen');
          console.error('Source path:', nodeToMove.path);
          console.error('Destination path:', folderPath);
          return;
        }

        // If folderPath is already a full path to a file, get its directory
        if (folderPath.includes('.')) {
          // This looks like a file path, get its directory
          const pathParts = folderPath.split('\\');
          pathParts.pop(); // Remove the filename
          newPath = `${pathParts.join('\\')}\\${nodeToMove.name}`;
          console.log('Folder path was actually a file path, corrected to:', newPath);
        } else {
          // This is a proper folder path
          const cleanDestinationPath = folderPath.endsWith('\\') ? folderPath.slice(0, -1) : folderPath;
          newPath = `${cleanDestinationPath}\\${nodeToMove.name}`;
          console.log('Proper folder path, new path:', newPath);
        }
      }

      console.log('=== TRUE MOVE OPERATION ===');
      console.log('Final constructed new path:', newPath);
      console.log('Source path:', nodeToMove.path);
      console.log('Destination path:', newPath);

      // Check if destination file already exists
      const destinationFileName = newPath.split('\\').pop() || nodeToMove.name;
      console.log('- destination filename only:', destinationFileName);

      // Use the native fs:exists API to check if destination exists
      // This is more reliable than the Electron API wrapper
      try {
        if (window.electronAPI?.fsExists) {
          const existsResult = await window.electronAPI.fsExists(newPath);
          if (existsResult.success && existsResult.exists) {
            console.log('File already exists at destination:', newPath);
            alert(`Un fichier avec le nom "${destinationFileName}" existe déjà dans le dossier de destination.`);
            return;
          }
        }
      } catch (existsError) {
        // File doesn't exist, which is what we want - continue with move
        console.log('Destination file does not exist, proceeding with move');
      }

      // Use the native fs:move API which does copy + delete (true move)
      console.log('About to call electronAPI.fsMove with:');
      console.log('- source:', nodeToMove.path);
      console.log('- destination:', newPath);
      console.log('- operation: COPY + DELETE (true move)');

      if (!window.electronAPI?.fsMove) {
        console.error('fsMove API not available');
        return;
      }

      const result = await window.electronAPI.fsMove(nodeToMove.path, newPath);

      console.log('API call result:', result);

      if (result.success) {
        console.log(`Successfully moved: ${nodeToMove.path} -> ${result.newPath || newPath}`);

        // Force immediate UI refresh with multiple mechanisms
        setTreeVersion(prev => prev + 1);

        // Trigger multiple global refresh events for different components
        if (typeof window !== 'undefined') {
          // Main refresh event for all components
          window.dispatchEvent(new CustomEvent('fileMoved', {
            detail: {
              oldPath: nodeToMove.path,
              newPath: result.newPath || newPath,
              type: nodeToMove.type,
              timestamp: Date.now()
            }
          }));

          // Specific event for folder tree refresh
          window.dispatchEvent(new CustomEvent('folderTreeRefresh', {
            detail: { timestamp: Date.now() }
          }));

          // Specific event for file manager refresh
          window.dispatchEvent(new CustomEvent('fileManagerRefresh', {
            detail: { timestamp: Date.now() }
          }));
        }

        // Refresh the folder tree from the main process
        if (window.electronAPI?.foldersScan) {
          try {
            const scanResult = await window.electronAPI.foldersScan();
            if (scanResult && scanResult.length > 0) {
              console.log('Tree refreshed after move from main process');
              // Force another re-render after scan completes
              setTreeVersion(prev => prev + 2);
            }
          } catch (scanError) {
            console.error('Error refreshing tree after move:', scanError);
          }
        }

        // Force immediate re-render by updating component state
        setTimeout(() => {
          setTreeVersion(prev => prev + 3);
        }, 50);

        // Force a complete page refresh as fallback
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.location) {
            // Trigger a subtle refresh by updating a timestamp in the URL
            const url = new URL(window.location.href);
            url.searchParams.set('t', Date.now().toString());
            window.history.replaceState({}, '', url.toString());
          }
        }, 100);

        console.log('Move operation completed successfully - UI should refresh immediately');

      } else {
        console.error(`Failed to move ${nodeToMove.path}:`, result.error);
        alert(`Erreur lors du déplacement: ${result.error}`);
      }
    } catch (error) {
      console.error('Error during move:', error);
    }

    // Close modal and clear state
    setIsMoveModalOpen(false);
    setNodeToMove(null);
  }, [nodeToMove]);

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
          onMove={() => handleMove(node)}
          onNewFolder={() => onNewFolder?.(node.path)}
          onNewFile={() => onNewFile?.(node.path)}
          setFileConflict={setFileConflict}
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

      {/* Move Modal */}
      <FolderSelectionModal
        open={isMoveModalOpen}
        onOpenChange={setIsMoveModalOpen}
        folders={convertToFolderNodes(tree)}
        selectedFolderId={undefined}
        onFolderSelect={handleMoveDestinationSelect}
        title="Sélectionner la destination"
        description={`Déplacer "${nodeToMove?.name}" vers le dossier choisi`}
        showSearch={false}
      />

      {/* File Conflict Dialog */}
      {fileConflict && (
        <FileConflictDialog
          open={true}
          fileName={fileConflict.fileName}
          onReplace={async () => {
            if (fileConflict.isMove && fileConflict.oldPath && fileConflict.newPath) {
              // Internal move with replace
              if (window.electronAPI?.fsMove) {
                const result = await window.electronAPI.fsMove(
                  fileConflict.oldPath, 
                  fileConflict.newPath, 
                  { replace: true }
                );
                if (result?.success) {
                  console.log('✅ File replaced and moved successfully');
                  window.dispatchEvent(new Event('folderTreeRefresh'));
                  window.dispatchEvent(new Event('recentFilesRefresh'));
                } else {
                  console.error('❌ Replace move failed:', result?.error);
                }
              }
            } else {
              // External copy with replace
              if (window.electronAPI?.copyExternalFile) {
                const result = await window.electronAPI.copyExternalFile(
                  fileConflict.sourcePath, 
                  fileConflict.targetFolder, 
                  { replace: true }
                );
                if (result?.success) {
                  console.log('✅ File replaced successfully');
                  window.dispatchEvent(new Event('folderTreeRefresh'));
                  window.dispatchEvent(new Event('recentFilesRefresh'));
                } else {
                  console.error('❌ Replace failed:', result?.error);
                }
              }
            }
            setFileConflict(null);
          }}
          onRename={async (newFileName) => {
            if (fileConflict.isMove && fileConflict.oldPath && fileConflict.newPath) {
              // Internal move with rename
              if (window.electronAPI?.fsMove) {
                const result = await window.electronAPI.fsMove(
                  fileConflict.oldPath, 
                  fileConflict.newPath, 
                  { newFileName }
                );
                if (result?.success) {
                  console.log('✅ File renamed and moved successfully');
                  window.dispatchEvent(new Event('folderTreeRefresh'));
                  window.dispatchEvent(new Event('recentFilesRefresh'));
                } else {
                  console.error('❌ Rename move failed:', result?.error);
                }
              }
            } else {
              // External copy with rename
              if (window.electronAPI?.copyExternalFile) {
                const result = await window.electronAPI.copyExternalFile(
                  fileConflict.sourcePath, 
                  fileConflict.targetFolder, 
                  { newFileName }
                );
                if (result?.success) {
                  console.log('✅ File imported with new name successfully');
                  window.dispatchEvent(new Event('folderTreeRefresh'));
                  window.dispatchEvent(new Event('recentFilesRefresh'));
                } else {
                  console.error('❌ Rename import failed:', result?.error);
                }
              }
            }
            setFileConflict(null);
          }}
          onCancel={() => {
            setFileConflict(null);
          }}
        />
      )}
    </TooltipProvider>
  );
}

export default ModernFolderTree;
