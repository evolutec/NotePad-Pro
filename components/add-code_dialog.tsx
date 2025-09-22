import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Code as CodeIcon, FilePlus } from "lucide-react"; // Using Code for code icon

export interface CodeMeta {
  id: string;
  name: string;
  type: string; // e.g., "js", "py", "ts"
  parentPath: string;
  createdAt: string;
  tags?: string[];
}

export interface AddCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onCodeCreated: (code: CodeMeta) => void;
}

export function AddCodeDialog({ open, onOpenChange, parentPath, onCodeCreated }: AddCodeDialogProps) {
  const [codeName, setCodeName] = useState("");
  const [codeType, setCodeType] = useState<string>("js"); // Default to js code
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

  const handleCreateCode = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!codeName.trim()) return;

    let finalParentPath = parentPath;
    if (parentId) {
      const parentFolder = existingFolders.find(f => f.id === parentId);
      finalParentPath = parentFolder?.path || parentPath;
    }

    if (window.electronAPI?.codeCreate) {
      const result = await window.electronAPI.codeCreate({
        name: codeName.trim(),
        type: codeType,
        parentPath: finalParentPath,
        tags,
      });

      if (!result.success) {
        setCreationError(result.error || "Erreur lors de la création du fichier de code.");
        return;
      }

      const newCode: CodeMeta = {
        id: Date.now().toString(),
        name: codeName.trim(),
        type: codeType,
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
      };

      setCreationSuccess("Fichier de code créé avec succès !");
      if (onCodeCreated) onCodeCreated(newCode);
      setTimeout(() => {
        setCodeName("");
        setCodeType("js");
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
            <CodeIcon className="h-5 w-5" /> {/* Code icon */}
            Créer un nouveau fichier de code
          </DialogTitle>
          <div className="h-1 w-full bg-orange-500 mt-2" /> {/* Orange line for code files */}
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
            <Label htmlFor="code-name">Nom du fichier de code</Label>
            <Input
              id="code-name"
              placeholder="Ex: script.js, main.py, index.ts..."
              value={codeName}
              onChange={(e) => setCodeName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Type de code</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={codeType === "js" ? "default" : "outline"}
                onClick={() => setCodeType("js")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.js</span> JavaScript
              </Button>
              <Button
                variant={codeType === "py" ? "default" : "outline"}
                onClick={() => setCodeType("py")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.py</span> Python
              </Button>
              <Button
                variant={codeType === "ts" ? "default" : "outline"}
                onClick={() => setCodeType("ts")}
                className="h-10 px-4 py-2"
              >
                <span className="font-mono text-xs mr-1">.ts</span> TypeScript
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
            <Button onClick={handleCreateCode} disabled={!codeName.trim()} className="flex-1">
              Créer le fichier de code
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}