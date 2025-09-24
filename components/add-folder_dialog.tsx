import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FolderPlus, BookOpen, Calendar, Tag, Archive, FileText, Palette } from "lucide-react"
import { GenericModal, ModalField, ModalButton } from "@/components/ui/generic-modal"
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

  // Define fields for the GenericModal
  const fields: ModalField[] = [
    {
      id: 'icon',
      label: 'Icône personnalisée',
      type: 'select',
      placeholder: 'Sélectionner une icône...',
      required: false,
      options: [
        { label: 'Aucune icône', value: '' },
        ...ICONS.map(icon => ({ label: icon.name, value: icon.name }))
      ]
    },
    {
      id: 'parent',
      label: 'Dossier parent',
      type: 'select',
      placeholder: 'Sélectionner le dossier parent...',
      required: false,
      options: [
        { label: 'Aucun (racine)', value: '' },
        ...existingFolders.map(folder => ({ label: folder.name, value: folder.id }))
      ]
    },
    {
      id: 'name',
      label: 'Nom du dossier',
      type: 'text',
      placeholder: 'Ex: Projets, Réunions, Idées...',
      required: true
    },
    {
      id: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Décrivez le contenu de ce dossier...',
      required: false
    },
    {
      id: 'color',
      label: 'Couleur',
      type: 'select',
      placeholder: 'Sélectionner une couleur...',
      required: true,
      options: FOLDER_COLORS.map(color => ({ label: color.name, value: color.value }))
    },
    {
      id: 'tags',
      label: 'Étiquettes',
      type: 'tags',
      placeholder: 'Ajouter une étiquette...',
      required: false
    }
  ];

  // Define buttons for the GenericModal
  const buttons: ModalButton[] = [
    {
      label: 'Créer le dossier',
      variant: 'default',
      onClick: handleCreateFolder,
      disabled: !folderName.trim()
    }
  ];

  // Custom content for the preview section
  const previewContent = (
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
  );

  return (
    <GenericModal
      open={open}
      onOpenChange={onOpenChange}
      title="Créer un nouveau dossier"
      icon={<FolderPlus className="h-6 w-6" />}
      description="Organisez vos fichiers et notes dans des dossiers personnalisés"
      colorTheme="yellow"
      fileType="folder"
      size="md"
      fields={fields}
      buttons={buttons}
      showCancelButton={true}
      cancelLabel="Annuler"
      error={creationError}
      success={creationSuccess}
      showCloseButton={true}
      closeButtonPosition="top-right"
      showFooter={true}
    >
      {previewContent}
    </GenericModal>
  );
}
