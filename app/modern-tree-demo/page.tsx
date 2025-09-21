"use client";
import React, { useState } from "react";
import { ModernSidebar } from "@/components/ui/sidebar-modern";
import { EnhancedFolderNode } from "@/components/ui/FolderTree-modern";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Palette, 
  Zap, 
  Sparkles, 
  ArrowRight,
  Download,
  Code,
  Eye
} from 'lucide-react';
import '@/components/ui/tree-styles.css';

// Sample data for demonstration
const sampleTree: EnhancedFolderNode = {
  name: "My Projects",
  path: "/projects",
  type: "folder",
  color: "#f59e0b",
  description: "Root project directory",
  isDirectory: true,
  modifiedAt: new Date(Date.now() - 86400000),
  createdAt: new Date(Date.now() - 864000000),
  children: [
    {
      name: "Documents",
      path: "/projects/documents",
      type: "folder",
      color: "#3b82f6",
      description: "Documentation and notes",
      isDirectory: true,
      modifiedAt: new Date(Date.now() - 3600000),
      createdAt: new Date(Date.now() - 432000000),
      children: [
        {
          name: "README.md",
          path: "/projects/documents/README.md",
          type: "note",
          description: "Project overview and setup instructions",
          modifiedAt: new Date(Date.now() - 1800000),
          createdAt: new Date(Date.now() - 86400000),
          size: 2456,
          isStarred: true,
          tags: ["important", "setup"]
        },
        {
          name: "Architecture.md",
          path: "/projects/documents/Architecture.md",
          type: "note",
          description: "System architecture documentation",
          modifiedAt: new Date(Date.now() - 7200000),
          createdAt: new Date(Date.now() - 172800000),
          size: 5421,
          tags: ["architecture", "technical"]
        },
        {
          name: "Meeting Notes.txt",
          path: "/projects/documents/meeting-notes.txt",
          type: "note",
          description: "Team meeting notes from last week",
          modifiedAt: new Date(Date.now() - 5400000),
          createdAt: new Date(Date.now() - 259200000),
          size: 1234
        }
      ]
    },
    {
      name: "Code",
      path: "/projects/code",
      type: "folder",
      color: "#10b981",
      description: "Source code files",
      isDirectory: true,
      modifiedAt: new Date(Date.now() - 7200000),
      createdAt: new Date(Date.now() - 345600000),
      children: [
        {
          name: "index.js",
          path: "/projects/code/index.js",
          type: "code",
          description: "Main application entry point",
          modifiedAt: new Date(Date.now() - 3600000),
          createdAt: new Date(Date.now() - 604800000),
          size: 3421
        },
        {
          name: "styles.css",
          path: "/projects/code/styles.css",
          type: "code",
          description: "Application styles and themes",
          modifiedAt: new Date(Date.now() - 10800000),
          createdAt: new Date(Date.now() - 432000000),
          size: 2156
        },
        {
          name: "components",
          path: "/projects/code/components",
          type: "folder",
          description: "React components directory",
          isDirectory: true,
          modifiedAt: new Date(Date.now() - 14400000),
          createdAt: new Date(Date.now() - 518400000),
          children: [
            {
              name: "Button.jsx",
              path: "/projects/code/components/Button.jsx",
              type: "code",
              description: "Reusable button component",
              modifiedAt: new Date(Date.now() - 21600000),
              createdAt: new Date(Date.now() - 604800000),
              size: 1876,
              isStarred: true
            },
            {
              name: "Card.tsx",
              path: "/projects/code/components/Card.tsx",
              type: "code",
              description: "Card component with variants",
              modifiedAt: new Date(Date.now() - 25200000),
              createdAt: new Date(Date.now() - 691200000),
              size: 2543
            }
          ]
        }
      ]
    },
    {
      name: "Assets",
      path: "/projects/assets",
      type: "folder",
      color: "#8b5cf6",
      description: "Images and media files",
      isDirectory: true,
      modifiedAt: new Date(Date.now() - 86400000),
      createdAt: new Date(Date.now() - 777600000),
      children: [
        {
          name: "logo.png",
          path: "/projects/assets/logo.png",
          type: "image",
          description: "Application logo",
          modifiedAt: new Date(Date.now() - 172800000),
          createdAt: new Date(Date.now() - 1036800000),
          size: 45678
        },
        {
          name: "background.jpg",
          path: "/projects/assets/background.jpg",
          type: "image",
          description: "Application background image",
          modifiedAt: new Date(Date.now() - 259200000),
          createdAt: new Date(Date.now() - 1209600000),
          size: 234567
        }
      ]
    },
    {
      name: "Archive.zip",
      path: "/projects/archive.zip",
      type: "archive",
      description: "Backup archive from last month",
      modifiedAt: new Date(Date.now() - 2592000000),
      createdAt: new Date(Date.now() - 2592000000),
      size: 10485760
    }
  ]
};

export default function ModernTreeDemo() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

  const handleFolderSelect = (path: string) => {
    setSelectedFolder(path);
    console.log('Folder selected:', path);
  };

  const handleNoteSelect = (path: string) => {
    setSelectedNote(path);
    console.log('Note selected:', path);
  };

  const handleDelete = (node: EnhancedFolderNode) => {
    console.log('Delete:', node.name);
  };

  const handleRename = (node: EnhancedFolderNode) => {
    console.log('Rename:', node.name);
  };

  const handleDuplicate = (node: EnhancedFolderNode) => {
    console.log('Duplicate:', node.name);
  };

  const handleNewFolder = (parentPath: string) => {
    console.log('New folder in:', parentPath);
  };

  const handleNewFile = (parentPath: string) => {
    console.log('New file in:', parentPath);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Modern Folder Tree
                </h1>
              </div>
              <Badge variant="outline" className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
                <Zap className="w-3 h-3 mr-1" />
                Live Demo
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('preview')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                variant={viewMode === 'code' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('code')}
              >
                <Code className="w-4 h-4 mr-2" />
                Code
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-[600px] shadow-lg border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  Enhanced File Explorer
                </CardTitle>
                <CardDescription>
                  Modern folder tree with advanced features
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[calc(600px-120px)]">
                <ModernSidebar
                  tree={sampleTree}
                  onFolderSelect={handleFolderSelect}
                  selectedFolder={selectedFolder}
                  onNoteSelect={handleNoteSelect}
                  selectedNote={selectedNote}
                  onDelete={handleDelete}
                  onRename={handleRename}
                  onDuplicate={handleDuplicate}
                  onNewFolder={handleNewFolder}
                  onNewFile={handleNewFile}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </div>

          {/* Features & Documentation */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-border/50">
              <CardHeader>
                <CardTitle className="text-xl">Key Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                        <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Modern Design</h3>
                        <p className="text-sm text-muted-foreground">
                          Clean, modern interface with beautiful gradients and smooth animations
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Smart File Detection</h3>
                        <p className="text-sm text-muted-foreground">
                          Automatic file type detection with appropriate icons and colors
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Enhanced Interactions</h3>
                        <p className="text-sm text-muted-foreground">
                          Hover effects, context menus, and smooth transitions
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
                        <Eye className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Visual Feedback</h3>
                        <p className="text-sm text-muted-foreground">
                          Clear visual indicators for selections, states, and file types
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
                        <ArrowRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Advanced Navigation</h3>
                        <p className="text-sm text-muted-foreground">
                          Multiple view modes: files, recent, starred, with search and filtering
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900 flex items-center justify-center flex-shrink-0">
                        <Code className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Developer Friendly</h3>
                        <p className="text-sm text-muted-foreground">
                          TypeScript support, customizable props, and extensible architecture
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Item Info */}
            {(selectedFolder || selectedNote) && (
              <Card className="shadow-lg border-border/50">
                <CardHeader>
                  <CardTitle>Selected Item</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedFolder && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
                          Folder
                        </Badge>
                        <span className="font-medium">{selectedFolder}</span>
                      </div>
                    )}
                    {selectedNote && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
                          Note
                        </Badge>
                        <span className="font-medium">{selectedNote}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Usage Instructions */}
            <Card className="shadow-lg border-border/50">
              <CardHeader>
                <CardTitle>How to Use</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-semibold text-sm">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Navigate Files</h4>
                      <p className="text-sm text-muted-foreground">
                        Click on folders to expand/collapse them. Click on files to select them.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-semibold text-sm">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Use Context Menus</h4>
                      <p className="text-sm text-muted-foreground">
                        Right-click on items to access actions like rename, duplicate, or delete.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-semibold text-sm">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Switch Views</h4>
                      <p className="text-sm text-muted-foreground">
                        Use the tabs to switch between file tree, recent files, and starred items.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}