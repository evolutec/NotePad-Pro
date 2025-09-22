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
  Palette
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
import './tree-styles.css';

interface ModernSidebarProps {
  tree: EnhancedFolderNode | null;
  onFolderSelect?: (path: string) => void;
  selectedFolder?: string | null;
  onNoteSelect?: (notePath: string) => void;
  selectedNote?: string | null;
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Use useEffect to detect Electron mode on client side only
  React.useEffect(() => {
    setIsClient(true);
    setIsElectronMode(!!(window.electronAPI || window.electron));
  }, []);

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

  const filteredTree = useCallback((node: EnhancedFolderNode | null): EnhancedFolderNode | null => {
    if (!node) return null;
    
    console.log('filteredTree: processing node:', node.name, 'isDirectory:', node.isDirectory, 'children:', node.children?.length);
    
    if (searchQuery) {
      const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
      const filteredChildren = node.children?.map(child => filteredTree(child)).filter(Boolean) as EnhancedFolderNode[];
      
      if (matchesSearch || (filteredChildren && filteredChildren.length > 0)) {
        console.log('filteredTree: returning node with search filter:', node.name);
        return { ...node, children: filteredChildren };
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
      
      const filteredChildren = node.children?.map(child => filteredTree(child)).filter(Boolean) as EnhancedFolderNode[];
      
      if (matchesFilter || (filteredChildren && filteredChildren.length > 0)) {
        console.log('filteredTree: returning node with type filter:', node.name);
        return { ...node, children: filteredChildren };
      }
      console.log('filteredTree: returning node as-is (no type filter match):', node.name);
      return null;
    }

    console.log('filteredTree: returning node as-is (no filters):', node.name);
    return node;
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

  return (
    <aside className={cn(
      "h-full flex flex-col bg-card border-r border-border transition-all duration-300",
      sidebarCollapsed ? "w-12 min-w-[3rem]" : "w-80 min-w-[20rem] max-w-[30rem]",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-end mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1 h-8 w-8"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn("flex flex-wrap items-center gap-2", sidebarCollapsed && "flex-col")}>
              <div className="flex flex-wrap items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn("h-12 w-12 p-0 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300", sidebarCollapsed && "h-7 w-7 p-1")}
                        onClick={handleNewFolder}
                      >
                        <FolderPlus className={cn("w-4 h-4", sidebarCollapsed && "w-3 h-3")} />
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
                        className={cn("h-12 w-12 p-0 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300", sidebarCollapsed && "h-7 w-7 p-1")}
                        onClick={() => onNewFile?.('root', 'note')}
                      >
                        <FilePlus className={cn("w-4 h-4", sidebarCollapsed && "w-3 h-3")} />
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
                        className={cn("h-12 w-12 p-0 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300", sidebarCollapsed && "h-7 w-7 p-1")}
                        onClick={handleNewDraw}
                      >
                        <Palette className={cn("w-4 h-4", sidebarCollapsed && "w-3 h-3")} />
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
                        className={cn("h-12 w-12 p-0 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300", sidebarCollapsed && "h-7 w-7 p-1")}
                        onClick={() => onNewFile?.('root', 'document')}
                      >
                        <FileText className={cn("w-4 h-4", sidebarCollapsed && "w-3 h-3")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Nouveau document
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn("h-12 w-12 p-0 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300", sidebarCollapsed && "h-7 w-7 p-1")}
                        onClick={() => onNewFile?.('root', 'image')}
                      >
                        <FileImage className={cn("w-4 h-4", sidebarCollapsed && "w-3 h-3")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Nouvelle image
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn("h-12 w-12 p-0 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300", sidebarCollapsed && "h-7 w-7 p-1")}
                        onClick={() => onNewFile?.('root', 'video')}
                      >
                        <FileVideo className={cn("w-4 h-4", sidebarCollapsed && "w-3 h-3")} />
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
                        className={cn("h-12 w-12 p-0 bg-pink-100 hover:bg-pink-200 dark:bg-pink-900 dark:hover:bg-pink-800 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300", sidebarCollapsed && "h-7 w-7 p-1")}
                        onClick={() => onNewFile?.('root', 'audio')}
                      >
                        <FileAudio className={cn("w-4 h-4", sidebarCollapsed && "w-3 h-3")} />
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
                        className={cn("h-12 w-12 p-0 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300", sidebarCollapsed && "h-7 w-7 p-1")}
                        onClick={() => onNewFile?.('root', 'code')}
                      >
                        <FileCode className={cn("w-4 h-4", sidebarCollapsed && "w-3 h-3")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Nouveau code
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn("h-12 w-12 p-0 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300", sidebarCollapsed && "h-7 w-7 p-1")}
                        onClick={() => onNewFile?.('root', 'archive')}
                      >
                        <FileArchive className={cn("w-4 h-4", sidebarCollapsed && "w-3 h-3")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Nouvelle archive
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {isClient && !isElectronMode && !sidebarCollapsed && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                  Mode navigateur
                </Badge>
              )}
            </div>
          </div>


        </div>

        {/* Search - Hidden when collapsed */}
        {!sidebarCollapsed && (
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
      {!sidebarCollapsed && (
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
                      {console.log('Rendering ModernFolderTree with original tree:', tree)}
                      {console.log('Rendering ModernFolderTree with filtered tree:', filteredTree(tree))}
                      <ModernFolderTree
                        tree={filteredTree(tree)}
                        onFolderSelect={onFolderSelect}
                        selectedFolder={selectedFolder}
                        onNoteSelect={onNoteSelect}
                        selectedNote={selectedNote}
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
                  {recentFiles().map((file) => (
                    <motion.div
                      key={file.path}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                        "hover:bg-accent hover:shadow-sm",
                        selectedNote === file.path && "bg-primary/10 ring-2 ring-primary/20"
                      )}
                      onClick={() => onNoteSelect?.(file.path)}
                    >
                      <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(file.modifiedAt)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeView === 'starred' && (
                <div className="space-y-2">
                  {starredFiles().map((file) => (
                    <motion.div
                      key={file.path}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                        "hover:bg-accent hover:shadow-sm",
                        selectedNote === file.path && "bg-primary/10 ring-2 ring-primary/20"
                      )}
                      onClick={() => onNoteSelect?.(file.path)}
                    >
                      <div className="w-8 h-8 rounded-md bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 flex items-center justify-center">
                        <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400 fill-current" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(file.modifiedAt)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
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
    </aside>
  );
}

export default ModernSidebar;