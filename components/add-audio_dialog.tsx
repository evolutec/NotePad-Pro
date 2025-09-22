import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Music as MusicIcon, FilePlus } from "lucide-react"; // Using Music for audio icon

export interface AudioMeta {
  id: string;
  name: string;
  type: string; // e.g., "mp3", "wav", "ogg"
  parentPath: string;
  createdAt: string;
  tags?: string[];
}

export interface AddAudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onAudioCreated: (audio: AudioMeta) => void;
}

export function AddAudioDialog({ open, onOpenChange, parentPath, onAudioCreated }: AddAudioDialogProps) {
  const [audioName, setAudioName] = useState("");
  const [audioType, setAudioType] = useState<string>("mp3"); // Default to mp3 audio
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

  const handleCreateAudio = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!audioName.trim()) return;

    let finalParentPath = parentPath;
    if (parentId) {
      const parentFolder = existingFolders.find(f => f.id === parentId);
      finalParentPath = parentFolder?.path || parentPath;
    }

    if (window.electronAPI?.audioCreate) {
      const result = await window.electronAPI.audioCreate({
        name: audioName.trim(),
        type: audioType,
        parentPath: finalParentPath,
        tags,
      });

      if (!result.success) {
        setCreationError(result.error || "Erreur lors de la création de l'audio.");
        return;
      }

      const newAudio: AudioMeta = {
        id: Date.now().toString(),
        name: audioName.trim(),
        type: audioType,
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
      };

      setCreationSuccess("Audio créé avec succès !");
      if (onAudioCreated) onAudioCreated(newAudio);
      setTimeout(() => {
        setAudioName("");
        setAudioType("mp3");
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
            <MusicIcon className="h-5 w-5" /> {/* Audio icon */}
            Créer un nouvel audio
          </DialogTitle>
          <div className="h-1 w-full bg-purple-500 mt-2" /> {/* Purple line for audios */}
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
            <Label htmlFor="audio-name">Nom de l'audio</Label>
            <Input
              id="audio-name"
              placeholder="Ex: Chanson, Podcast, Enregistrement..."
              value={audioName}
              onChange={(e) => setAudioName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Type d'audio</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={audioType === "mp3" ? "default" : "outline"}
                onClick={() => setAudioType("mp3")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.mp3</span> MP3
              </Button>
              <Button
                variant={audioType === "wav" ? "default" : "outline"}
                onClick={() => setAudioType("wav")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.wav</span> WAV
              </Button>
              <Button
                variant={audioType === "ogg" ? "default" : "outline"}
                onClick={() => setAudioType("ogg")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.ogg</span> OGG
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
            <Button onClick={handleCreateAudio} disabled={!audioName.trim()} className="flex-1">
              Créer l'audio
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}