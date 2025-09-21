import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FilePlus, FileText } from "lucide-react";

export interface NoteMeta {
  id: string;
  name: string;
  type: "text" | "markdown";
  parentPath: string;
  createdAt: string;
  tags?: string[];
}

export interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onNoteCreated: (note: NoteMeta) => void;
}

export function AddNoteDialog({ open, onOpenChange, parentPath, onNoteCreated }: AddNoteDialogProps) {
  const [noteName, setNoteName] = useState("");
  const [noteType, setNoteType] = useState<"text" | "markdown">("text");
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

  const handleCreateNote = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!noteName.trim()) return;
    let finalParentPath = parentPath;
    if (parentId) {
      const parentFolder = existingFolders.find(f => f.id === parentId);
      finalParentPath = parentFolder?.path || parentPath;
    }
    if (window.electronAPI?.noteCreate) {
      const result = await window.electronAPI.noteCreate({
        name: noteName.trim(),
        type: noteType,
        parentPath: finalParentPath,
        tags,
      });
      if (!result.success) {
        setCreationError(result.error || "Erreur lors de la création de la note.");
        return;
      }
      const newNote: NoteMeta = {
        id: Date.now().toString(),
        name: noteName.trim(),
        type: noteType,
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
      };
      if (window.electronAPI?.notesLoad && window.electronAPI?.notesSave) {
        const notes = await window.electronAPI.notesLoad();
        await window.electronAPI.notesSave([...notes, newNote]);
      }
      setCreationSuccess("Note créée avec succès !");
      if (onNoteCreated) onNoteCreated(newNote);
      setTimeout(() => {
        setNoteName("");
        setNoteType("text");
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
            <FilePlus className="h-5 w-5" />
            Créer une nouvelle note
          </DialogTitle>
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
            <Label htmlFor="note-name">Nom de la note</Label>
            <Input
              id="note-name"
              placeholder="Ex: Compte rendu, Idée, TODO..."
              value={noteName}
              onChange={(e) => setNoteName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Type de fichier</Label>
            <div className="flex gap-2">
              <Button
                variant={noteType === "text" ? "default" : "outline"}
                onClick={() => setNoteType("text")}
              >
                <FileText className="w-4 h-4 mr-1" /> Texte
              </Button>
              <Button
                variant={noteType === "markdown" ? "default" : "outline"}
                onClick={() => setNoteType("markdown")}
              >
                <span className="font-mono text-xs mr-1">.md</span> Markdown
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
            <Button onClick={handleCreateNote} disabled={!noteName.trim()} className="flex-1">
              Créer la note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

