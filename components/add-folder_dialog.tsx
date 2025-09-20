import * as React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FolderPlus, BookOpen, Calendar, Tag, Archive, FileText, Palette } from "lucide-react"
import type { FolderData } from "@/components/folder-manager"

const FOLDER_COLORS = [
  { name: "Bleu", value: "bg-blue-500", border: "border-blue-500" },
  { name: "Vert", value: "bg-green-500", border: "border-green-500" },
  { name: "Rouge", value: "bg-red-500", border: "border-red-500" },
  { name: "Jaune", value: "bg-yellow-500", border: "border-yellow-500" },
  { name: "Violet", value: "bg-purple-500", border: "border-purple-500" },
  { name: "Rose", value: "bg-pink-500", border: "border-pink-500" },
  { name: "Indigo", value: "bg-indigo-500", border: "border-indigo-500" },
  { name: "Orange", value: "bg-orange-500", border: "border-orange-500" },
];

const ICONS = [
  { name: "FolderPlus", Comp: FolderPlus },
  { name: "BookOpen", Comp: BookOpen },
  { name: "Calendar", Comp: Calendar },
  { name: "Tag", Comp: Tag },
  { name: "Archive", Comp: Archive },
  { name: "FileText", Comp: FileText }
];

interface AddFolderDialogProps {
  folders: FolderData[]
  onFolderAdded: (newFolder: FolderData) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddFolderDialog({ folders, onFolderAdded, open, onOpenChange }: AddFolderDialogProps) {
  // États du formulaire
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [icon, setIcon] = useState("");
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [existingFolders, setExistingFolders] = useState<FolderData[]>([]);

  // Charger les dossiers existants
  useEffect(() => {
    if (window.electronAPI?.foldersLoad) {
      window.electronAPI.foldersLoad().then((loadedFolders: any[]) => {
        setExistingFolders(
          loadedFolders.map((f) => ({
            ...f,
            createdAt: f.createdAt ? new Date(f.createdAt) : new Date(),
          }))
        );
      });
    }
  }, [open]);

  // Ajout d’un tag
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

  // Création du dossier
  const handleCreateFolder = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!folderName.trim()) return;
    let parentPath: string;
    if (parentId) {
      const parentFolder = existingFolders.find(f => f.id === parentId);
      parentPath = parentFolder?.path || "";
    } else {
      if (window.electronAPI?.loadSettings) {
        const config = await window.electronAPI.loadSettings();
        parentPath = config?.files?.rootPath || "";
      } else {
        parentPath = "";
      }
    }
    // Création physique
    if (window.electronAPI?.folderCreate) {
      const result = await window.electronAPI.folderCreate({ name: folderName.trim(), parentPath });
      if (!result.success) {
        setCreationError(result.error || "Erreur lors de la création du dossier.");
        return;
      }
      const newFolder: FolderData = {
        id: Date.now().toString(),
        name: folderName.trim(),
        description: folderDescription.trim() || undefined,
        color: selectedColor.value,
        tags,
        createdAt: new Date(),
        notes: [],
        icon: icon || undefined,
        parentId: parentId || undefined,
        path: result.path
      };
      // Mise à jour folders.json
      if (window.electronAPI?.foldersLoad && window.electronAPI?.foldersSave) {
        const folders = await window.electronAPI.foldersLoad();
        await window.electronAPI.foldersSave([...folders, newFolder]);
      }
      setCreationSuccess("Dossier créé avec succès !");
      setCreationError(null);
      onFolderAdded(newFolder);
      setTimeout(() => {
        setFolderName("");
        setFolderDescription("");
        setSelectedColor(FOLDER_COLORS[0]);
        setTags([]);
        setCurrentTag("");
        setIcon("");
        setParentId(undefined);
        setCreationSuccess(null);
        setCreationError(null);
        onOpenChange(false);
      }, 1000);
    }
  };

  // Affichage
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Créer un nouveau dossier
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Sélecteur visuel d'icône Lucide (optionnel) */}
          <div className="space-y-2">
            <Label>Icône personnalisée <span className="text-xs text-muted-foreground">(optionnel)</span></Label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(({ name, Comp }) => (
                <button
                  key={name}
                  type="button"
                  className={`p-2 rounded border ${icon === name ? "border-primary bg-accent" : "border-border"}`}
                  onClick={() => setIcon(name)}
                  title={name}
                >
                  <Comp className="h-6 w-6" />
                </button>
              ))}
              <button
                type="button"
                className={`p-2 rounded border ${icon === "" ? "border-primary bg-accent" : "border-border"}`}
                onClick={() => setIcon("")}
                title="Aucune icône"
              >
                <span className="text-xs">Aucune</span>
              </button>
            </div>
          </div>
          {/* Sélecteur arborescent du dossier parent (optionnel) */}
          <div className="space-y-2">
            <Label>Dossier parent <span className="text-xs text-muted-foreground">(optionnel)</span></Label>
            <select
              className="w-full border rounded p-2 bg-zinc-900 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={parentId || ""}
              onChange={(e) => setParentId(e.target.value || undefined)}
            >
              <option value="">Aucun (racine)</option>
              {existingFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          {/* Nom du dossier */}
          <div className="space-y-2">
            <Label htmlFor="folder-name">Nom du dossier</Label>
            <Input
              id="folder-name"
              placeholder="Ex: Projets, Réunions, Idées..."
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
            />
          </div>
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="folder-description">Description (optionnel)</Label>
            <Textarea
              id="folder-description"
              placeholder="Décrivez le contenu de ce dossier..."
              value={folderDescription}
              onChange={(e) => setFolderDescription(e.target.value)}
              rows={2}
            />
          </div>
          {/* Couleur */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Couleur
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-12 h-12 rounded-lg ${color.value} border-2 transition-all hover:scale-105 ${selectedColor.value === color.value ? `${color.border} border-2` : "border-transparent"}`}
                  onClick={() => setSelectedColor(color)}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Étiquettes
            </Label>
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
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {/* Preview */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${selectedColor.value}`} />
              <span className="font-medium">{folderName || "Nom du dossier"}</span>
            </div>
            {folderDescription && <p className="text-sm text-card-foreground mb-2">{folderDescription}</p>}
            <div className="flex items-center gap-2 text-xs text-card-foreground">
              <Calendar className="h-3 w-3" />
              Créé le {new Date().toLocaleDateString("fr-FR")}
            </div>
          </div>
          {/* Feedback création dossier */}
          {creationError && (
            <div className="text-sm text-red-500 mb-2">{creationError}</div>
          )}
          {creationSuccess && (
            <div className="text-sm text-green-600 mb-2">{creationSuccess}</div>
          )}
          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleCreateFolder} disabled={!folderName.trim()} className="flex-1">
              Créer le dossier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
