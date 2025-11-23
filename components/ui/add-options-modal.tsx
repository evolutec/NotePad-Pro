"use client";
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FolderPlus,
  FilePlus,
  Palette,
  Table,
  Presentation,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  X
} from 'lucide-react';

interface AddOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewFolder: () => void;
  onNewNote: () => void;
  onNewDraw: () => void;
  onNewExcel: () => void;
  onNewPowerpoint: () => void;
  onNewPdf: () => void;
  onNewImage: () => void;
  onNewVideo: () => void;
  onNewAudio: () => void;
  isCollapsed?: boolean;
}

export function AddOptionsModal({
  open,
  onOpenChange,
  onNewFolder,
  onNewNote,
  onNewDraw,
  onNewExcel,
  onNewPowerpoint,
  onNewPdf,
  onNewImage,
  onNewVideo,
  onNewAudio,
  isCollapsed = false,
}: AddOptionsModalProps) {
  const addOptions = [
    {
      key: 'folder',
      label: 'Nouveau dossier',
      icon: FolderPlus,
      onClick: onNewFolder,
      className: 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white'
    },
    {
      key: 'note',
      label: 'Nouvelle note',
      icon: FilePlus,
      onClick: onNewNote,
      className: 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
    },
    {
      key: 'draw',
      label: 'Nouveau dessin',
      icon: Palette,
      onClick: onNewDraw,
      className: 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300'
    },
    {
      key: 'excel',
      label: 'Nouveau tableur',
      icon: Table,
      onClick: onNewExcel,
      className: 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
    },
    {
      key: 'powerpoint',
      label: 'Nouvelle présentation',
      icon: Presentation,
      onClick: onNewPowerpoint,
      className: 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300'
    },
    {
      key: 'pdf',
      label: 'Nouveau PDF',
      icon: FileText,
      onClick: onNewPdf,
      className: 'bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300'
    },
    {
      key: 'image',
      label: 'Nouvelle image',
      icon: FileImage,
      onClick: onNewImage,
      className: 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300'
    },
    {
      key: 'video',
      label: 'Nouvelle vidéo',
      icon: FileVideo,
      onClick: onNewVideo,
      className: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    },
    {
      key: 'audio',
      label: 'Nouvel audio',
      icon: FileAudio,
      onClick: onNewAudio,
      className: 'bg-pink-100 hover:bg-pink-200 dark:bg-pink-900 dark:hover:bg-pink-800 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300'
    }
  ];

  const handleOptionClick = (onClick: () => void) => {
    onClick();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un nouveau...</DialogTitle>
          <DialogDescription>
            Choisissez le type de fichier ou dossier à créer
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-4">
          {addOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <TooltipProvider key={option.key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`${option.className} h-16 w-16 p-0 flex flex-col items-center justify-center gap-1`}
                      onClick={() => handleOptionClick(option.onClick)}
                    >
                      <IconComponent className="w-6 h-6" />
                      <span className="text-xs font-medium leading-tight text-center">
                        {option.label.split(' ')[1]}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {option.label}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}