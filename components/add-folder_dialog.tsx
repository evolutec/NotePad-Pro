import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FolderPlus, BookOpen, Calendar, Tag, Archive, FileText, Palette, Folder, Home } from "lucide-react";
import { GenericModal, ModalField, ModalButton, type GenericModalRef } from "@/components/ui/generic-modal";
import { FolderSelectionModal, type FolderNode } from "@/components/ui/folder-selection-modal";
import { ColorSelectionModal, type ColorOption } from "@/components/ui/color-selection-modal";
import { IconSelectionModal, type IconOption } from "@/components/ui/icon-selection-modal";
import type { FolderData } from "@/components/folder-manager";

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
  folders: FolderData[];
  onFolderAdded: (newFolder: FolderData) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddFolderDialog({ folders, onFolderAdded, open, onOpenChange }: AddFolderDialogProps) {
  // Form states
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
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);
  const modalRef = React.useRef<GenericModalRef>(null);

  // Load existing folders
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

  // Convert folders to FolderNode format for the tree selector
  const folderNodes: FolderNode[] = React.useMemo(() => {
    const buildTree = (folders: FolderData[], parentId?: string): FolderNode[] => {
      return folders
        .filter(folder => folder.parentId === parentId)
        .map(folder => ({
          id: folder.id,
          name: folder.name,
          path: folder.path || folder.name,
          children: buildTree(folders, folder.id),
          parent: parentId
        }));
    };
    return buildTree(existingFolders);
  }, [existingFolders]);

  // Handle folder selection
  const handleFolderSelect = (folderId: string | null, folderPath: string) => {
    setParentId(folderId || undefined);
  };

  // Get selected folder name for display
  const getSelectedFolderName = () => {
    if (!parentId) return "Racine";
    const folder = existingFolders.find(f => f.id === parentId);
    return folder?.name || "Racine";
  };

  // Add tag
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

  // Create folder
  const handleCreateFolder = async () => {
    console.log('handleCreateFolder called');

    setCreationError(null);
    setCreationSuccess(null);

    // Get form data from GenericModal using ref
    let formData: any = {};
    if (modalRef.current) {
      formData = modalRef.current.getFormData();
      console.log('Form data from modal:', formData);

      if (!formData.name?.trim()) {
        console.log('No folder name provided');
        setCreationError("Le nom du dossier est requis.");
        return;
      }
    } else {
      console.error('Modal ref not available - trying alternative approach');
      // Alternative approach: use the external state variables
      formData = {
        name: folderName,
        description: folderDescription,
        color: selectedColor.value,
        icon: icon,
        tags: tags,
        parentId: parentId
      };
      console.log('Using external state as fallback:', formData);

      if (!formData.name?.trim()) {
        console.log('No folder name provided');
        setCreationError("Le nom du dossier est requis.");
        return;
      }
    }

    let parentPath: string;
    if (formData.parentId) {
      const parentFolder = existingFolders.find(f => f.id === formData.parentId);
      parentPath = parentFolder?.path || "";
    } else {
      if (window.electronAPI?.loadSettings) {
        const config = await window.electronAPI.loadSettings();
        parentPath = config?.files?.rootPath || "";
      } else {
        parentPath = "";
      }
    }

    console.log('Creating folder with:', { name: formData.name, parentPath });

    // Physical creation
    if (window.electronAPI?.folderCreate) {
      try {
        const result = await window.electronAPI.folderCreate({ name: formData.name.trim(), parentPath });
        console.log('Folder creation result:', result);

        if (!result.success) {
          setCreationError(result.error || "Erreur lors de la création du dossier.");
          return;
        }

        const newFolder: FolderData = {
          id: Date.now().toString(),
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          color: formData.color,
          tags: formData.tags || [],
          createdAt: new Date(),
          notes: [],
          icon: formData.icon || undefined,
          parentId: formData.parentId || undefined,
          path: result.path
        };

        console.log('New folder object:', newFolder);

        // Update folders.json
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
      } catch (error) {
        console.error('Error creating folder:', error);
        setCreationError("Erreur lors de la création du dossier.");
      }
    } else {
      console.error('window.electronAPI.folderCreate not available');
      setCreationError("API de création de dossier non disponible.");
    }
  };

  // Define fields for the GenericModal - reordered to put name first, then path selector
  const fields: ModalField[] = [
    {
      id: 'name',
      label: 'Nom du dossier',
      type: 'text',
      placeholder: 'Ex: Projets, Réunions, Idées...',
      required: true,
      value: folderName,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFolderName(e.target.value);
      }
    },
    {
      id: 'path',
      label: 'Dossier parent',
      type: 'custom',
      content: (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between text-left font-normal"
          onClick={() => setShowFolderModal(true)}
        >
          <div className="flex items-center gap-2 truncate">
            <Home className="w-4 h-4" />
            <span className="truncate">{getSelectedFolderName()}</span>
          </div>
          <Folder className="w-4 h-4 opacity-50" />
        </Button>
      )
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
      type: 'custom',
      content: (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between text-left font-normal"
          onClick={() => setShowColorModal(true)}
        >
          <div className="flex items-center gap-2 truncate">
            <div className={`w-4 h-4 rounded-full ${selectedColor.value} ${selectedColor.border}`} />
            <span className="truncate">{selectedColor.name}</span>
          </div>
          <Palette className="w-4 h-4 opacity-50" />
        </Button>
      )
    },
    {
      id: 'icon',
      label: 'Icône personnalisée',
      type: 'custom',
      content: (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between text-left font-normal"
          onClick={() => setShowIconModal(true)}
        >
          <div className="flex items-center gap-2 truncate">
            {icon ? (
              <>
                {React.createElement(ICONS.find(i => i.name === icon)?.Comp || FolderPlus, { className: "w-4 h-4" })}
                <span className="truncate capitalize">{icon.replace(/([A-Z])/g, ' $1').trim()}</span>
              </>
            ) : (
              <>
                <FolderPlus className="w-4 h-4 opacity-50" />
                <span className="truncate text-muted-foreground">Aucune icône</span>
              </>
            )}
          </div>
          <FolderPlus className="w-4 h-4 opacity-50" />
        </Button>
      )
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
      onClick: () => {
        console.log('Button clicked, calling handleCreateFolder');
        handleCreateFolder();
      },
      disabled: false // Let handleCreateFolder check the form data
    }
  ];

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setFolderName("");
      setFolderDescription("");
      setSelectedColor(FOLDER_COLORS[0]);
      setTags([]);
      setCurrentTag("");
      setIcon("");
      setParentId(undefined);
      setCreationError(null);
      setCreationSuccess(null);
    }
  }, [open]);

  // Custom content for the preview section (no duplicate path selector)
  const customContent = (
    <div className="space-y-4">
      {/* Preview section */}
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
    </div>
  );

  return (
    <>
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
        {customContent}
      </GenericModal>

      {/* Folder Selection Modal */}
      <FolderSelectionModal
        open={showFolderModal}
        onOpenChange={setShowFolderModal}
        folders={folderNodes}
        selectedFolderId={parentId}
        onFolderSelect={handleFolderSelect}
        title="Sélectionner le dossier parent"
        description="Choisissez le dossier dans lequel créer le nouveau dossier"
      />

      {/* Color Selection Modal */}
      <ColorSelectionModal
        open={showColorModal}
        onOpenChange={setShowColorModal}
        colors={FOLDER_COLORS}
        selectedColor={selectedColor}
        onColorSelect={setSelectedColor}
        title="Sélectionner une couleur"
        description="Choisissez la couleur de votre dossier"
      />

      {/* Icon Selection Modal */}
      <IconSelectionModal
        open={showIconModal}
        onOpenChange={setShowIconModal}
        icons={ICONS}
        selectedIcon={icon}
        onIconSelect={setIcon}
        title="Sélectionner une icône"
        description="Choisissez une icône pour votre dossier"
      />
    </>
  );
}
