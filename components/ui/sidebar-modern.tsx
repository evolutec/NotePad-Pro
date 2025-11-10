"use client";
/// <reference path="../../global.d.ts" />
import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  FolderPlus,
  FilePlus,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  Settings,
  LayoutGrid,
  List,
  Star,
  Clock,
  Tag,
  ChevronLeft,
  ChevronRight,
  Home,
  Bookmark,
  Users,
  Trash2,
  Folder,
  FolderOpen,
  Palette,
  Table,
  Presentation,
  Sheet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ModernFolderTree, { EnhancedFolderNode } from './FolderTree-modern';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AddExcelDialog } from '@/components/add-excel_dialog';
import { AddPowerpointDialog } from '@/components/add-powerpoint_dialog';
import { AddPdfDocumentDialog } from '@/components/add-pdf-document_dialog';

interface ModernSidebarProps {
  tree: EnhancedFolderNode | null;
  onFolderSelect?: (path: string) => void;
  selectedFolder?: string | null;
  onNoteSelect?: (notePath: string) => void;
  selectedNote?: string | null;
  onImageSelect?: (path: string, name: string, type: string) => void;
  onVideoSelect?: (path: string, name: string, type: string) => void;
  onDelete?: (node: EnhancedFolderNode) => void;
  onRename?: (node: EnhancedFolderNode) => void;
  onDuplicate?: (node: EnhancedFolderNode) => void;
  onNewFolder?: (parentPath: string) => void;
  onNewFile?: (parentPath: string, fileType?: string) => void;
  onNewDraw?: () => void;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ModernSidebar({
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
  onNewDraw,
  className,
  isCollapsed = false,
  onToggleCollapse,
}: ModernSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'files' | 'recent' | 'starred' | 'shared'>('files');
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [filterType, setFilterType] = useState<'all' | 'folders' | 'notes' | 'draws' | 'documents' | 'images'>('all');
  const [isElectronMode, setIsElectronMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [enhancedTree, setEnhancedTree] = useState<EnhancedFolderNode | null>(null);
  const [showExcelDialog, setShowExcelDialog] = useState(false);
  const [showPowerpointDialog, setShowPowerpointDialog] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);

  // Use useEffect to detect Electron mode on client side only
  React.useEffect(() => {
    setIsClient(true);
    setIsElectronMode(!!(window.electronAPI || window.electron));
  }, []);

  // Sync with parent collapse state
  const handleToggleCollapse = useCallback(() => {
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  }, [onToggleCollapse]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleNewFolder = useCallback(() => {
    onNewFolder?.('root');
  }, [onNewFolder]);

  const handleNewFile = useCallback(() => {
    onNewFile?.('root');
  }, [onNewFile]);

  const handleNewDocument = useCallback(() => {
    onNewFile?.('root', 'document'); // Assuming onNewFile can handle different types
  }, [onNewFile]);

  const handleNewDraw = useCallback(() => {
    onNewDraw?.();
  }, [onNewDraw]);

  // Fonction pour sélectionner un dossier racine (comme dans sidebar.tsx)
  const handleSelectRootFolder = useCallback(async () => {
    if (window.electronAPI?.selectFolder) {
      try {
        const folderPath = await window.electronAPI.selectFolder();
        if (folderPath) {
          // Reload to scan the new folder
          window.location.reload();
        }
      } catch (error) {
        console.error('Erreur lors de la sélection du dossier:', error);
        alert('Erreur lors de la sélection du dossier. Veuillez réessayer.');
      }
    } else {
      alert('La sélection de dossier n\'est disponible que dans l\'application Electron.\\n\\nVeuillez lancer l\'application avec npm run electron');
    }
  }, []);

  const filteredTree = useCallback(async (node: EnhancedFolderNode | null): Promise<EnhancedFolderNode | null> => {
    if (!node) return null;

    console.log('filteredTree: processing node:', node.name, 'isDirectory:', node.isDirectory, 'children:', node.children?.length);

    // Load NTFS metadata for folders
    let enhancedNode = { ...node };

    if (node.isDirectory && window.electronAPI?.folderGetMetadata) {
      try {
        const metadataResult = await window.electronAPI.folderGetMetadata(node.path);
        if (metadataResult.success && metadataResult.data) {
          enhancedNode = {
            ...node,
            color: metadataResult.data.color,
            icon: metadataResult.data.icon,
            description: metadataResult.data.description,
            tags: metadataResult.data.tags,
            metadata: metadataResult.data
          };
          console.log('✅ Loaded NTFS metadata for folder:', node.name, metadataResult.data);
        }
      } catch (error) {
        console.error('❌ Error loading NTFS metadata for folder:', node.name, error);
      }
    }

    if (searchQuery) {
      const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
      const filteredChildren = node.children ? await Promise.all(node.children.map(child => filteredTree(child))) : [];
      const validChildren = filteredChildren.filter(Boolean) as EnhancedFolderNode[];

      if (matchesSearch || (validChildren && validChildren.length > 0)) {
        console.log('filteredTree: returning node with search filter:', node.name);
        return { ...enhancedNode, children: validChildren };
      }
      console.log('filteredTree: returning null for search filter:', node.name);
      return null;
    }

    if (filterType !== 'all') {
      console.log('filteredTree: applying filter type:', filterType);
      const typeMap = {
        'folders': 'folder',
        'notes': 'note',
        'draws': 'draw',
        'documents': 'document',
        'images': 'image'
      };

      const matchesFilter = !node.isDirectory &&
        ((node.name.endsWith('.md') || node.name.endsWith('.txt')) && filterType === 'notes') ||
        (node.name.endsWith('.draw') && filterType === 'draws');

      const filteredChildren = node.children ? await Promise.all(node.children.map(child => filteredTree(child))) : [];
      const validChildren = filteredChildren.filter(Boolean) as EnhancedFolderNode[];

      if (matchesFilter || (validChildren && validChildren.length > 0)) {
        console.log('filteredTree: returning node with type filter:', node.name);
        return { ...enhancedNode, children: validChildren };
      }
      console.log('filteredTree: returning node as-is (no type filter match):', node.name);
      return null;
    }

    // Load metadata for children recursively
    const enhancedChildren = node.children ? await Promise.all(node.children.map(child => filteredTree(child))) : [];
    const validChildren = enhancedChildren.filter(Boolean) as EnhancedFolderNode[];

    console.log('filteredTree: returning node as-is (no filters):', node.name);
    return { ...enhancedNode, children: validChildren };
  }, [searchQuery, filterType]);

  const recentFiles = useCallback((): EnhancedFolderNode[] => {
    const files: EnhancedFolderNode[] = [];
    const collectFiles = (node: EnhancedFolderNode) => {
      if (!node.isDirectory && (node.name.endsWith('.md') || node.name.endsWith('.txt') || node.name.endsWith('.draw'))) {
        files.push(node);
      }
      node.children?.forEach(collectFiles);
    };
    if (tree) collectFiles(tree);
    return files.sort((a, b) => (b.modifiedAt?.getTime() || 0) - (a.modifiedAt?.getTime() || 0)).slice(0, 10);
  }, [tree]);

  const starredFiles = useCallback((): EnhancedFolderNode[] => {
    const files: EnhancedFolderNode[] = [];
    const collectFiles = (node: EnhancedFolderNode) => {
      if (node.isStarred) {
        files.push(node);
      }
      node.children?.forEach(collectFiles);
    };
    if (tree) collectFiles(tree);
    return files;
  }, [tree]);

  // Format date on client side only to avoid hydration issues
  const formatDate = useCallback((date: Date | undefined) => {
    if (!date || !isClient) return '';
    return date.toLocaleDateString('fr-FR');
  }, [isClient]);

  // Debug logging for tree data
  useEffect(() => {
    console.log('Sidebar: tree prop received:', tree);
    if (tree) {
      console.log('Sidebar: tree name:', tree.name);
      console.log('Sidebar: tree path:', tree.path);
      console.log('Sidebar: tree children count:', tree.children?.length);
      console.log('Sidebar: tree isDirectory:', tree.isDirectory);
    }
  }, [tree]);

  // Handle async filteredTree with NTFS metadata loading
  useEffect(() => {
    const loadEnhancedTree = async () => {
      if (tree) {
        console.log('Loading enhanced tree with NTFS metadata...');
        const enhanced = await filteredTree(tree);
        setEnhancedTree(enhanced);
        console.log('Enhanced tree loaded:', enhanced);
      } else {
        setEnhancedTree(null);
      }
    };

    loadEnhancedTree();
  }, [tree, searchQuery, filterType, filteredTree]);

  return (
    <aside className={cn(
      "h-full flex flex-col bg-card border-r border-border transition-all duration-300",
      isCollapsed ? "w-12 min-w-[3rem]" : "w-80 min-w-[20rem] max-w-[30rem]",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-8 w-8"
            onClick={handleToggleCollapse}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center gap-2", isCollapsed ? "flex-col" : "flex-col")}>
              {/* Collapsed layout - only essential buttons */}
              {isCollapsed ? (
                <>
                  {/* Dossier, Note, Dessin - une seule fois chacun */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-1 bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white"
                          onClick={handleNewFolder}
                        >
                          <FolderPlus className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Nouveau dossier
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 hover:text-blue-700"
                          onClick={() => onNewFile?.('root', 'note')}
                        >
                          <FilePlus className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Nouvelle note
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-600 dark:text-purple-400 hover:text-purple-700"
                          onClick={handleNewDraw}
                        >
                          <Palette className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Nouveau dessin
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-1 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-600 dark:text-green-400 hover:text-green-700"
                          onClick={() => setShowExcelDialog(true)}
                        >
                          <Table className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Nouveau tableur
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-1 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800 text-orange-600 dark:text-orange-400 hover:text-orange-700"
                          onClick={() => setShowPowerpointDialog(true)}
                        >
                          <Presentation className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Nouvelle présentation
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-1 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-600 dark:text-red-400 hover:text-red-700"
                          onClick={() => setShowPdfDialog(true)}
                        >
                          <FileText className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Nouveau PDF
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-1 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700"
                          onClick={() => onNewFile?.('root', 'image')}
                        >
                          <FileImage className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Nouvelle image
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-700"
                          onClick={() => onNewFile?.('root', 'video')}
                        >
                          <FileVideo className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Nouvelle vidéo
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-1 bg-pink-100 hover:bg-pink-200 dark:bg-pink-900 dark:hover:bg-pink-800 text-pink-600 dark:text-pink-400 hover:text-pink-700"
                          onClick={() => onNewFile?.('root', 'audio')}
                        >
                          <FileAudio className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Nouvel audio
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              ) : (
                /* Expanded layout - original horizontal arrangement */
                <>
                  {/* First row - 4 buttons */}
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 p-0 bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white"
                            onClick={handleNewFolder}
                          >
                            <FolderPlus className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          Nouveau dossier
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 p-0 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            onClick={() => onNewFile?.('root', 'note')}
                          >
                            <FilePlus className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          Nouvelle note
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 p-0 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                            onClick={handleNewDraw}
                          >
                            <Palette className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          Nouveau dessin
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 p-0 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                            onClick={() => setShowExcelDialog(true)}
                          >
                            {/* Utiliser FileSpreadsheet ou FileTable */}
                            <Table className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          Nouveau tableur
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 p-0 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                            onClick={() => setShowPowerpointDialog(true)}
                          >
                            {/* Utiliser Presentation ou FilePresentation */}
                            <Presentation className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          Nouvelle présentation
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Second row - 3 buttons */}
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 p-0 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
                            onClick={() => onNewFile?.('root', 'image')}
                          >
                            <FileImage className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          Nouvelle image
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 p-0 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            onClick={() => onNewFile?.('root', 'video')}
                          >
                            <FileVideo className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          Nouvelle vidéo
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 p-0 bg-pink-100 hover:bg-pink-200 dark:bg-pink-900 dark:hover:bg-pink-800 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300"
                            onClick={() => onNewFile?.('root', 'audio')}
                          >
                            <FileAudio className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          Nouvel audio
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 p-0 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            onClick={() => setShowPdfDialog(true)}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          Nouveau PDF
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {isClient && !isElectronMode && (
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                      Mode navigateur
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>


        </div>

        {/* Search - Hidden when collapsed */}
        {!isCollapsed && (
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des fichiers..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6"
                >
                  <Filter className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setFilterType('all')}>
                  Tous les fichiers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('folders')}>
                  Dossiers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('notes')}>
                  Notes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('draws')}>
                  Dessins
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('documents')}>
                  Documents
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('images')}>
                  Images
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Content - Hidden when collapsed */}
      {!isCollapsed && (
        <>
          {/* Tabs */}
          <div className="border-b border-border/50">
            <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-10">
                <TabsTrigger value="files" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  <Home className="w-4 h-4 mr-2" />
                  Fichiers
                </TabsTrigger>
                <TabsTrigger value="recent" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  <Clock className="w-4 h-4 mr-2" />
                  Récent
                </TabsTrigger>
                <TabsTrigger value="starred" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  <Star className="w-4 h-4 mr-2" />
                  Favoris
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {activeView === 'files' && (
                <div>
                  {!tree ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="mb-4">Aucun dossier sélectionné</p>
                      <Button onClick={handleSelectRootFolder} size="sm" variant="outline">
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Sélectionner un dossier
                      </Button>
                    </div>
                  ) : !tree.children || tree.children.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Folder className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>Aucun fichier trouvé dans ce dossier</p>
                      <p className="text-xs mt-2">Dossier: {tree.name}</p>
                      <p className="text-xs">Chemin: {tree.path}</p>
                      <Button onClick={handleSelectRootFolder} size="sm" variant="outline" className="mt-4">
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Changer de dossier
                      </Button>
                    </div>
                  ) : (
                    <>
                      {console.log('Rendering ModernFolderTree with enhanced tree:', enhancedTree)}
                      <ModernFolderTree
                        tree={enhancedTree}
                        onFolderSelect={onFolderSelect}
                        selectedFolder={selectedFolder}
                        onNoteSelect={onNoteSelect}
                        selectedNote={selectedNote}
                        onImageSelect={onImageSelect}
                        onVideoSelect={onVideoSelect}
                        onDelete={onDelete}
                        onRename={onRename}
                        onDuplicate={onDuplicate}
                        onNewFolder={onNewFolder}
                        onNewFile={onNewFile}
                      />
                    </>
                  )}
                </div>
              )}

              {activeView === 'recent' && (
                <div className="space-y-2">
                  {recentFiles().map((file) => {
                    const getFileIcon = () => {
                      const ext = file.name.split('.').pop()?.toLowerCase() || ''
                      
                      // Images - yellow
                      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
                        return <FileImage className="w-4 h-4 text-yellow-500" />;
                      }
                      // Videos - gray
                      else if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'wmv', 'flv', '3gp'].includes(ext)) {
                        return <FileVideo className="w-4 h-4 text-gray-500" />;
                      }
                      // Audio - pink
                      else if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) {
                        return <FileAudio className="w-4 h-4 text-pink-500" />;
                      }
                      // Excel - green
                      else if (['xls', 'xlsx'].includes(ext)) {
                        return <Table className="w-4 h-4 text-green-600" />;
                      }
                      // PowerPoint - orange
                      else if (['ppt', 'pptx'].includes(ext)) {
                        return <Presentation className="w-4 h-4 text-orange-600" />;
                      }
                      // PDF - red
                      else if (ext === 'pdf') {
                        return <FileText className="w-4 h-4 text-red-600" />;
                      }
                      // Draw - purple
                      else if (file.name.endsWith('.draw')) {
                        return <Palette className="w-4 h-4 text-purple-600" />;
                      }
                      // Code - orange
                      else if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'cs', 'html', 'css', 'json'].includes(ext)) {
                        return <FileCode className="w-4 h-4 text-orange-500" />;
                      }
                      // Documents - blue
                      else if (['doc', 'docx', 'rtf'].includes(ext)) {
                        return <FileText className="w-4 h-4 text-blue-600" />;
                      }
                      // Notes - blue
                      else if (['md', 'txt'].includes(ext)) {
                        return <FileText className="w-4 h-4 text-blue-500" />;
                      }
                      // Default
                      return <FileText className="w-4 h-4 text-blue-600" />;
                    };

                    const getFileColor = () => {
                      const ext = file.name.split('.').pop()?.toLowerCase() || ''
                      
                      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
                        return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
                      } else if (['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(ext)) {
                        return 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800';
                      } else if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
                        return 'bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-800';
                      } else if (['xls', 'xlsx'].includes(ext)) {
                        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
                      } else if (['ppt', 'pptx'].includes(ext)) {
                        return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800';
                      } else if (ext === 'pdf') {
                        return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
                      } else if (file.name.endsWith('.draw')) {
                        return 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800';
                      }
                      return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
                    };

                    return (
                      <motion.div
                        key={file.path}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all",
                          "hover:bg-accent hover:shadow-sm",
                          selectedNote === file.path && "bg-primary/10 ring-2 ring-primary/20"
                        )}
                        onClick={() => onNoteSelect?.(file.path)}
                      >
                        <div className={cn("w-8 h-8 rounded-md border flex items-center justify-center relative", getFileColor())}>
                          {getFileIcon()}
                          {/* File name inside the icon container */}
                          <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-md">
                            <span className="text-xs font-medium text-white mix-blend-difference truncate px-1">
                              {file.name.length > 4 ? file.name.substring(0, 4) + '...' : file.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(file.modifiedAt)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {activeView === 'starred' && (
                <div className="space-y-2">
                  {starredFiles().map((file) => {
                    const getFileIcon = () => {
                      const ext = file.name.split('.').pop()?.toLowerCase() || ''
                      
                      // Images - yellow
                      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
                        return <FileImage className="w-4 h-4 text-yellow-500" />;
                      }
                      // Videos - gray
                      else if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'wmv', 'flv', '3gp'].includes(ext)) {
                        return <FileVideo className="w-4 h-4 text-gray-500" />;
                      }
                      // Audio - pink
                      else if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) {
                        return <FileAudio className="w-4 h-4 text-pink-500" />;
                      }
                      // Excel - green
                      else if (['xls', 'xlsx'].includes(ext)) {
                        return <Table className="w-4 h-4 text-green-600" />;
                      }
                      // PowerPoint - orange
                      else if (['ppt', 'pptx'].includes(ext)) {
                        return <Presentation className="w-4 h-4 text-orange-600" />;
                      }
                      // PDF - red
                      else if (ext === 'pdf') {
                        return <FileText className="w-4 h-4 text-red-600" />;
                      }
                      // Draw - purple
                      else if (file.name.endsWith('.draw')) {
                        return <Palette className="w-4 h-4 text-purple-600" />;
                      }
                      // Code - orange
                      else if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'cs', 'html', 'css', 'json'].includes(ext)) {
                        return <FileCode className="w-4 h-4 text-orange-500" />;
                      }
                      // Documents - blue
                      else if (['doc', 'docx', 'rtf'].includes(ext)) {
                        return <FileText className="w-4 h-4 text-blue-600" />;
                      }
                      // Notes - blue
                      else if (['md', 'txt'].includes(ext)) {
                        return <FileText className="w-4 h-4 text-blue-500" />;
                      }
                      // Default
                      return <FileText className="w-4 h-4 text-blue-600" />;
                    };

                    const getFileColor = () => {
                      const ext = file.name.split('.').pop()?.toLowerCase() || ''
                      
                      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
                        return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
                      } else if (['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(ext)) {
                        return 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800';
                      } else if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
                        return 'bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-800';
                      } else if (['xls', 'xlsx'].includes(ext)) {
                        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
                      } else if (['ppt', 'pptx'].includes(ext)) {
                        return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800';
                      } else if (ext === 'pdf') {
                        return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
                      } else if (file.name.endsWith('.draw')) {
                        return 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800';
                      }
                      return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
                    };

                    return (
                      <motion.div
                        key={file.path}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all",
                          "hover:bg-accent hover:shadow-sm",
                          selectedNote === file.path && "bg-primary/10 ring-2 ring-primary/20"
                        )}
                        onClick={() => onNoteSelect?.(file.path)}
                      >
                        <div className={cn("w-8 h-8 rounded-md border flex items-center justify-center relative", getFileColor())}>
                          {getFileIcon()}
                          {/* File name inside the icon container */}
                          <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-md">
                            <span className="text-xs font-medium text-white mix-blend-difference truncate px-1">
                              {file.name.length > 4 ? file.name.substring(0, 4) + '...' : file.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(file.modifiedAt)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Storage</span>
              <Badge variant="outline" className="text-xs">
                2.4 GB / 15 GB
              </Badge>
            </div>
          </div>
        </>
      )}

      {/* Dialogs */}
      <AddExcelDialog
        open={showExcelDialog}
        onOpenChange={setShowExcelDialog}
        parentPath="root"
        onExcelCreated={(excel) => {
          onNewFile?.('root', 'excel');
        }}
      />
      <AddPowerpointDialog
        open={showPowerpointDialog}
        onOpenChange={setShowPowerpointDialog}
        parentPath="root"
        onPowerpointCreated={(powerpoint) => {
          onNewFile?.('root', 'powerpoint');
        }}
      />
      <AddPdfDocumentDialog
        open={showPdfDialog}
        onOpenChange={setShowPdfDialog}
        parentPath="root"
        onDocumentCreated={(pdf) => {
          onNewFile?.('root', 'pdf');
        }}
      />
    </aside>
  );
}

export default ModernSidebar;
