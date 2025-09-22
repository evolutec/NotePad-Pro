import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, FilePlus } from "lucide-react"; // Using Image for image icon

export interface ImageMeta {
  id: string;
  name: string;
  type: string; // e.g., "png", "jpg", "svg"
  parentPath: string;
  createdAt: string;
  tags?: string[];
}

export interface AddImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onImageCreated: (image: ImageMeta) => void;
}

export function AddImageDialog({ open, onOpenChange, parentPath, onImageCreated }: AddImageDialogProps) {
  const [imageName, setImageName] = useState("");
  const [imageType, setImageType] = useState<string>("png"); // Default to png image
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

  const handleCreateImage = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!imageName.trim()) return;

    let finalParentPath = parentPath;
    if (parentId) {
      const parentFolder = existingFolders.find(f => f.id === parentId);
      finalParentPath = parentFolder?.path || parentPath;
    }

    if (window.electronAPI?.imageCreate) {
      const result = await window.electronAPI.imageCreate({
        name: imageName.trim(),
        type: imageType,
        parentPath: finalParentPath,
        tags,
      });

      if (!result.success) {
        setCreationError(result.error || "Erreur lors de la création de l'image.");
        return;
      }

      const newImage: ImageMeta = {
        id: Date.now().toString(),
        name: imageName.trim(),
        type: imageType,
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
      };

      setCreationSuccess("Image créée avec succès !");
      if (onImageCreated) onImageCreated(newImage);
      setTimeout(() => {
        setImageName("");
        setImageType("png");
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
            <ImageIcon className="h-5 w-5" /> {/* Image icon */}
            Créer une nouvelle image
          </DialogTitle>
          <div className="h-1 w-full bg-red-500 mt-2" /> {/* Red line for images */}
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
            <Label htmlFor="image-name">Nom de l'image</Label>
            <Input
              id="image-name"
              placeholder="Ex: Photo de vacances, Logo, Icône..."
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Type d'image</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={imageType === "png" ? "default" : "outline"}
                onClick={() => setImageType("png")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.png</span> PNG
              </Button>
              <Button
                variant={imageType === "jpg" ? "default" : "outline"}
                onClick={() => setImageType("jpg")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.jpg</span> JPG
              </Button>
              <Button
                variant={imageType === "svg" ? "default" : "outline"}
                onClick={() => setImageType("svg")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.svg</span> SVG
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
            <Button onClick={handleCreateImage} disabled={!imageName.trim()} className="flex-1">
              Créer l'image
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}