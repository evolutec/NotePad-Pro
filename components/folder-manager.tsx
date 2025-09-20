"use client"

import * as React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FolderPlus, BookOpen, Calendar, Tag, Archive, FileText, Palette } from "lucide-react"

interface FolderManagerProps {
  onCreateFolder: (folder: FolderData) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export interface FolderData {
  id: string
  name: string
  description?: string
  color: string
  tags: string[]
  createdAt: Date
  notes: NoteData[]
  icon?: string // nom ou chemin de l'icône personnalisée
  parentId?: string // id du dossier parent pour l'imbrication
  path: string // chemin absolu du dossier sur le disque
}

export interface NoteData {
  id: string
  name: string
  type: "handwritten" | "text" | "mixed"
  content?: string
  lastModified: Date
  tags: string[]
}

const FOLDER_COLORS = [
  { name: "Bleu", value: "bg-blue-500", border: "border-blue-500" },
  { name: "Vert", value: "bg-green-500", border: "border-green-500" },
  { name: "Rouge", value: "bg-red-500", border: "border-red-500" },
  { name: "Jaune", value: "bg-yellow-500", border: "border-yellow-500" },
  { name: "Violet", value: "bg-purple-500", border: "border-purple-500" },
  { name: "Rose", value: "bg-pink-500", border: "border-pink-500" },
  { name: "Indigo", value: "bg-indigo-500", border: "border-indigo-500" },
  { name: "Orange", value: "bg-orange-500", border: "border-orange-500" },
]

export function FolderManager({ onCreateFolder, open, onOpenChange }: FolderManagerProps) {
  // Mapping tailwind -> hex pour badge couleur
  const tailwindToHex: Record<string, string> = {
    "bg-blue-500": "#3B82F6",
    "bg-green-500": "#22C55E",
    "bg-red-500": "#EF4444",
    "bg-yellow-500": "#FACC15",
    "bg-purple-500": "#A21CAF",
    "bg-pink-500": "#EC4899",
    "bg-indigo-500": "#6366F1",
    "bg-orange-500": "#F97316",
  };
  // Mapping Lucide (composants)
  const lucideIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    BookOpen,
    Calendar,
    Tag,
    Archive,
    FileText,
    FolderPlus,
  };
  // Ajout d'un état pour le dossier sélectionné (navigation)
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // Fonction pour naviguer dans un dossier
  const handleFolderDoubleClick = (folderId: string) => {
    setActiveFolderId(folderId);
    // Optionnel : si la sidebar est accessible via props/context, déclencher la sélection globale
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent("folder-selected", { detail: { folderId } }));
    }
  };
  // Icônes Lucide dynamiques
  const LucideIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    BookOpen,
    Calendar,
    Tag,
    Archive,
    FileText,
    FolderPlus,
  };
  // Si open/onOpenChange sont fournis, contrôle externe, sinon interne
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = typeof open === "boolean" ? open : internalOpen;
  const setIsOpen = typeof onOpenChange === "function" ? onOpenChange : setInternalOpen;
  const [folderName, setFolderName] = useState("")
  const [folderDescription, setFolderDescription] = useState("")
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0])
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [icon, setIcon] = useState("") // chemin ou nom de l'icône personnalisée
  const [parentId, setParentId] = useState<string | undefined>(undefined) // id du dossier parent

  // Liste d'icônes Lucide pour le sélecteur visuel
  // Liste d'icônes Lucide React standards (importées explicitement)
  const ICONS = [
    { name: "FolderPlus", Comp: FolderPlus },
    { name: "BookOpen", Comp: BookOpen },
    { name: "Calendar", Comp: Calendar },
    { name: "Tag", Comp: Tag },
    { name: "Archive", Comp: Archive },
    { name: "FileText", Comp: FileText }
  ];
  // Utilisation dynamique via Lucide
  // const LucideIcons = {
  //   FolderPlus,
  //   BookOpen,
  //   Lightbulb,
  //   Target,
  //   Users,
  //   Archive,
  //   FileText,
  //   Calendar,
  //   Tag,
  // }

  // Récupérer la liste des dossiers existants pour l'arborescence
  const [existingFolders, setExistingFolders] = useState<FolderData[]>([])
  React.useEffect(() => {
    if (window.electronAPI?.foldersLoad) {
      window.electronAPI.foldersLoad().then((loadedFolders: any[]) => {
        setExistingFolders(
          loadedFolders.map((f) => ({
            ...f,
            createdAt: f.createdAt ? new Date(f.createdAt) : new Date(),
          }))
        )
      })
    }
  }, [isOpen])

  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);

  const handleCreateFolder = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!folderName.trim()) return;

    // Déterminer le chemin parent absolu
    let parentPath: string;
    if (parentId) {
      // Chercher le dossier parent dans la liste existante
      const parentFolder = existingFolders.find(f => f.id === parentId);
      parentPath = parentFolder?.path || "";
    } else {
      // Racine : utiliser rootPath depuis la config
      if (window.electronAPI?.loadSettings) {
        const config = await window.electronAPI.loadSettings();
        parentPath = config?.files?.rootPath || "";
      } else {
        parentPath = "";
      }
    }

    // Log diagnostic avant création
    console.log('[FolderManager] Création dossier - name:', folderName.trim(), 'parentPath:', parentPath);

    // Appel IPC pour créer le dossier physiquement
    if (window.electronAPI?.folderCreate) {
      const result = await window.electronAPI.folderCreate({ name: folderName.trim(), parentPath });
      console.log('[FolderManager] Résultat IPC folderCreate:', result);
      if (!result.success) {
        setCreationError(result.error || "Erreur lors de la création du dossier.");
        return;
      }
      // Mettre à jour le chemin dans les métadonnées
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
        path: result.path // chemin absolu créé
      };
      // Persister dans folders.json via l'API
      if (window.electronAPI?.foldersLoad && window.electronAPI?.foldersSave) {
        const folders = await window.electronAPI.foldersLoad();
        await window.electronAPI.foldersSave([...folders, newFolder]);
      }
      setCreationSuccess("Dossier créé avec succès !");
      setCreationError(null); // Réinitialise l'erreur après succès
      onCreateFolder(newFolder);
      // Reset form et fermer le modal après un court délai
      setTimeout(() => {
        setFolderName("");
        setFolderDescription("");
        setSelectedColor(FOLDER_COLORS[0]);
        setTags([]);
        setCurrentTag("");
        setIcon("");
        setParentId(undefined);
        setIsOpen(false);
        setCreationSuccess(null);
        setCreationError(null);
      }, 1000);
    }
  }

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()])
      setCurrentTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  return (
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Créer un nouveau dossier
          </DialogTitle>
        </DialogHeader>

        {/* Liste des dossiers existants avec couleur et icône */}
        {existingFolders.length > 0 && (
          <div className="mb-4">
            <Label className="mb-2">Dossiers existants</Label>
            <div className="space-y-2">
              {existingFolders.map((folder) => {
                // Couleur badge
                let badgeColor = "#D1D5DB";
                if (folder.color) {
                  if (folder.color.startsWith("bg-")) {
                    badgeColor = tailwindToHex[folder.color] || "#D1D5DB";
                  } else if (folder.color.startsWith("#")) {
                    badgeColor = folder.color;
                  }
                }
                // Icône visuelle
                let iconNode = null;
                let iconKey = folder.icon?.trim() || "";
                // Capitalise la première lettre si besoin
                if (iconKey.length > 0) {
                  iconKey = iconKey[0].toUpperCase() + iconKey.slice(1);
                }
                if (iconKey && lucideIcons[iconKey]) {
                  const Comp = lucideIcons[iconKey];
                  iconNode = <Comp className="w-4 h-4 align-middle" />;
                } else if (folder.icon && typeof folder.icon === "string" && folder.icon.match(/^[\u{1F300}-\u{1F6FF}]/u)) {
                  iconNode = <span className="text-lg">{folder.icon}</span>;
                } else {
                  const Comp = lucideIcons["FileText"];
                  iconNode = <Comp className="w-4 h-4 align-middle" />;
                }
                return (
                  <div
                    key={folder.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${activeFolderId === folder.id ? "bg-blue-100" : "bg-muted"}`}
                    onDoubleClick={() => handleFolderDoubleClick(folder.id)}
                  >
                    <span className="inline-block w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: badgeColor }} />
                    {iconNode}
                    <span className="font-medium truncate">{folder.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
              className="w-full border rounded p-2"
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
          {/* Folder Name */}
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

          {/* Color Selection */}
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
                  className={`w-12 h-12 rounded-lg ${color.value} border-2 transition-all hover:scale-105 ${
                    selectedColor.value === color.value ? `${color.border} border-2` : "border-transparent"
                  }`}
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
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleCreateFolder} disabled={!folderName.trim()} className="flex-1">
              Créer le dossier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
