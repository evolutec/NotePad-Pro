import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Archive as ArchiveIcon, FilePlus } from "lucide-react"; // Using Archive for archive icon

export interface ArchiveMeta {
  id: string;
  name: string;
  type: string; // e.g., "zip", "rar", "7z"
  parentPath: string;
  createdAt: string;
  tags?: string[];
}

export interface AddArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onArchiveCreated: (archive: ArchiveMeta) => void;
}

export function AddArchiveDialog({ open, onOpenChange, parentPath, onArchiveCreated }: AddArchiveDialogProps) {
  const [archiveName, setArchiveName] = useState("");
  const [archiveType, setArchiveType] = useState<string>("zip"); // Default to zip archive
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [existingFolders, setExistingFolders] = useState<any[]>([]);

  useEffect(() => {
    if (window.electronAPI?.foldersLoad) {
      window.electronAPI.foldersLoad().then((loadedFolders: any[]) => {
        setExistingFolders(loadedFolders);
      });
    }
  }, [open]);

  const handleCreateArchive = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!archiveName.trim()) return;

    let finalParentPath = parentPath;
    if (parentId) {
      const parentFolder = existingFolders.find(f => f.id === parentId);
      finalParentPath = parentFolder?.path || parentPath;
    }

    if (window.electronAPI?.archiveCreate) {
      const result = await window.electronAPI.archiveCreate({
        name: archiveName.trim(),
        type: archiveType,
        parentPath: finalParentPath,
        tags,
      });

      if (!result.success) {
        setCreationError(result.error || "Erreur lors de la création de l'archive.");
        return;
      }

      const newArchive: ArchiveMeta = {
        id: Date.now().toString(),
        name: archiveName.trim(),
        type: archiveType,
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
      };

      setCreationSuccess("Archive créée avec succès !");
      if (onArchiveCreated) onArchiveCreated(newArchive);
      setTimeout(() => {
        setArchiveName("");
        setArchiveType("zip");
        setTags([]);
        setCurrentTag("");
        setCreationSuccess(null);
        setCreationError(null);
        if (onOpenChange) onOpenChange(false);
      }, 1000);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArchiveIcon className="h-5 w-5" /> {/* Archive icon */}
            Créer une nouvelle archive
          </DialogTitle>
          <div className="h-1 w-full bg-gray-500 mt-2" /> {/* Gray line for archives */}
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Dossier parent <span className="text-xs text-muted-foreground">(optionnel)</span></Label>
            <select
              className="w-full border rounded p-2 bg-zinc-900 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={parentId || ""}
              onChange={(e) => setParentId(e.target.value || undefined)}
            >
              <option value="">Dossier sélectionné par défaut</option>
              {existingFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="archive-name">Nom de l'archive</Label>
            <Input
              id="archive-name"
              placeholder="Ex: documents.zip, photos.rar, backup.7z..."
              value={archiveName}
              onChange={(e) => setArchiveName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Type d'archive</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={archiveType === "zip" ? "default" : "outline"}
                onClick={() => setArchiveType("zip")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.zip</span> ZIP
              </Button>
              <Button
                variant={archiveType === "rar" ? "default" : "outline"}
                onClick={() => setArchiveType("rar")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.rar</span> RAR
              </Button>
              <Button
                variant={archiveType === "7z" ? "default" : "outline"}
                onClick={() => setArchiveType("7z")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.7z</span> 7Z
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Étiquettes</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une étiquette..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button type="button" onClick={addTag} size="sm" variant="outline">
                Ajouter
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span key={tag} className="bg-muted px-2 py-1 rounded text-xs cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </span>
              ))}
            </div>
          </div>
          {creationError && (
            <div className="text-sm text-red-500 mb-2">{creationError}</div>
          )}
          {creationSuccess && (
            <div className="text-sm text-green-600 mb-2">{creationSuccess}</div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleCreateArchive} disabled={!archiveName.trim()} className="flex-1">
              Créer l'archive
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}