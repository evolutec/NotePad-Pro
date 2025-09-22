import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Video as VideoIcon, FilePlus } from "lucide-react"; // Using Video for video icon

export interface VideoMeta {
  id: string;
  name: string;
  type: string; // e.g., "mp4", "mov", "avi"
  parentPath: string;
  createdAt: string;
  tags?: string[];
}

export interface AddVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onVideoCreated: (video: VideoMeta) => void;
}

export function AddVideoDialog({ open, onOpenChange, parentPath, onVideoCreated }: AddVideoDialogProps) {
  const [videoName, setVideoName] = useState("");
  const [videoType, setVideoType] = useState<string>("mp4"); // Default to mp4 video
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

  const handleCreateVideo = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!videoName.trim()) return;

    let finalParentPath = parentPath;
    if (parentId) {
      const parentFolder = existingFolders.find(f => f.id === parentId);
      finalParentPath = parentFolder?.path || parentPath;
    }

    if (window.electronAPI?.videoCreate) {
      const result = await window.electronAPI.videoCreate({
        name: videoName.trim(),
        type: videoType,
        parentPath: finalParentPath,
        tags,
      });

      if (!result.success) {
        setCreationError(result.error || "Erreur lors de la création de la vidéo.");
        return;
      }

      const newVideo: VideoMeta = {
        id: Date.now().toString(),
        name: videoName.trim(),
        type: videoType,
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
      };

      setCreationSuccess("Vidéo créée avec succès !");
      if (onVideoCreated) onVideoCreated(newVideo);
      setTimeout(() => {
        setVideoName("");
        setVideoType("mp4");
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
            <VideoIcon className="h-5 w-5" /> {/* Video icon */}
            Créer une nouvelle vidéo
          </DialogTitle>
          <div className="h-1 w-full bg-blue-500 mt-2" /> {/* Blue line for videos */}
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
            <Label htmlFor="video-name">Nom de la vidéo</Label>
            <Input
              id="video-name"
              placeholder="Ex: Conférence, Vlog, Tutoriel..."
              value={videoName}
              onChange={(e) => setVideoName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Type de vidéo</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={videoType === "mp4" ? "default" : "outline"}
                onClick={() => setVideoType("mp4")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.mp4</span> MP4
              </Button>
              <Button
                variant={videoType === "mov" ? "default" : "outline"}
                onClick={() => setVideoType("mov")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.mov</span> MOV
              </Button>
              <Button
                variant={videoType === "avi" ? "default" : "outline"}
                onClick={() => setVideoType("avi")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.avi</span> AVI
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
            <Button onClick={handleCreateVideo} disabled={!videoName.trim()} className="flex-1">
              Créer la vidéo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}