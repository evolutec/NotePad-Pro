import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FilePlus, Palette } from "lucide-react";

export interface DrawMeta {
  id: string;
  name: string;
  type: "draw";
  parentPath: string;
  createdAt: string;
  tags?: string[];
}

export interface AddDrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onDrawCreated: (draw: DrawMeta) => void;
}

export function AddDrawDialog({ open, onOpenChange, parentPath, onDrawCreated }: AddDrawDialogProps) {
  const [drawName, setDrawName] = useState("");
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

  const handleCreateDraw = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!drawName.trim()) return;
    let finalParentPath = parentPath;
    if (parentId) {
      const parentFolder = existingFolders.find(f => f.id === parentId);
      finalParentPath = parentFolder?.path || parentPath;
    }
    if (window.electronAPI?.drawCreate) {
      const result = await window.electronAPI.drawCreate({
        name: drawName.trim(),
        type: "draw",
        parentPath: finalParentPath,
        tags,
      });
      if (!result.success) {
        setCreationError(result.error || "Erreur lors de la création du dessin.");
        return;
      }
      const newDraw: DrawMeta = {
        id: Date.now().toString(),
        name: drawName.trim(),
        type: "draw",
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
      };
      if (window.electronAPI?.drawsLoad && window.electronAPI?.drawsSave) {
        const draws = await window.electronAPI.drawsLoad();
        await window.electronAPI.drawsSave([...draws, newDraw]);
      }
      setCreationSuccess("Dessin créé avec succès !");
      if (onDrawCreated) onDrawCreated(newDraw);
      setTimeout(() => {
        setDrawName("");
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
      <DialogContent className="sm:max-w-md" aria-describedby="draw-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Créer un nouveau dessin
          </DialogTitle>
          <p id="draw-dialog-description" className="text-sm text-muted-foreground">
            Créez un nouveau dessin avec des outils de dessin avancés
          </p>
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
            <Label htmlFor="draw-name">Nom du dessin</Label>
            <Input
              id="draw-name"
              placeholder="Ex: Croquis, Schéma, Diagramme..."
              value={drawName}
              onChange={(e) => setDrawName(e.target.value)}
            />
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
            <Button onClick={handleCreateDraw} disabled={!drawName.trim()} className="flex-1">
              Créer le dessin
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}