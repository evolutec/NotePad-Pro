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
    if (window.electronAPI?.foldersScan) {
      window.electronAPI.foldersScan().then((scannedFolders: any[]) => {
        setExistingFolders(
          scannedFolders.map((f) => ({
            ...f,
            createdAt: f.createdAt ? new Date(f.createdAt) : new Date(),
          }))
        );
      });
    }
  }, [open]);

  // Convert folders to FolderNode format for the tree selector
  const folderNodes: FolderNode[] = React.useMemo(() => {
    // Handle the tree structure returned by foldersScan
    const convertTreeToNodes = (treeNode: any, parentId?: string): FolderNode[] => {
      if (!treeNode || typeof treeNode !== 'object') return [];

      const nodes: FolderNode[] = [];

      // Add the current node if it's a directory
      if (treeNode.isDirectory) {
        nodes.push({
          id: treeNode.path || `${parentId}-${treeNode.name}`,
          name: treeNode.name,
          path: treeNode.path,
          children: treeNode.children ? convertTreeToNodesFromArray(treeNode.children, treeNode.path) : [],
          parent: parentId
        });
      }

      return nodes;
    };

    const convertTreeToNodesFromArray = (children: any[], parentPath?: string): FolderNode[] => {
      if (!Array.isArray(children)) return [];

      return children
        .filter(child => child && child.isDirectory)
        .map(child => ({
          id: child.path || `${parentPath}-${child.name}`,
          name: child.name,
          path: child.path,
          children: child.children ? convertTreeToNodesFromArray(child.children, child.path) : [],
          parent: parentPath
        }));
    };

    // Handle both flat array of folders (from foldersLoad) and tree structure (from foldersScan)
    if (existingFolders.length > 0 && (existingFolders[0] as any).children) {
      // Tree structure from foldersScan
      return convertTreeToNodesFromArray((existingFolders[0] as any).children || []);
    } else {
      // Flat array structure from foldersLoad
      const buildTree = (folders: any[], parentId?: string): FolderNode[] => {
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
    }
  }, [existingFolders]);

  // Handle folder selection
  const handleFolderSelect = (folderId: string | null, folderPath: string) => {
    console.log('=== handleFolderSelect called ===');
    console.log('folderId:', folderId);
    console.log('folderPath:', folderPath);
    console.log('Setting parentId to folderPath:', folderPath);
    // Use folderPath instead of folderId because we need the actual path for file creation
    setParentId(folderPath || undefined);
    setShowFolderModal(false); // Close the modal after selection
  };

  // Get selected folder name for display
  const getSelectedFolderName = React.useMemo(() => {
    console.log('=== getSelectedFolderName called ===');
    console.log('parentId:', parentId);
    console.log('existingFolders:', existingFolders);

    if (!parentId) {
      console.log('No parentId, returning Racine');
      return "Racine";
    }

    // First try to find in existingFolders (from foldersScan)
    const folder = existingFolders.find(f => {
      console.log('Checking folder:', f.id, f.name, 'against parentId:', parentId);
      return f.id === parentId;
    });

    if (folder?.name) {
      console.log('Found folder with name:', folder.name);
      return folder.name;
    }

    // If not found in root level, try to search in the tree structure
    if (existingFolders.length > 0 && (existingFolders[0] as any).children) {
      const findInTree = (nodes: any[]): any => {
        for (const node of nodes) {
          if (node.path === parentId || node.id === parentId) {
            console.log('Found in tree:', node.name);
            return node;
          }
          if (node.children) {
            const found = findInTree(node.children);
            if (found) return found;
          }
        }
        return null;
      };

      const foundFolder = findInTree((existingFolders[0] as any).children || []);
      if (foundFolder?.name) {
        console.log('Found folder in tree with name:', foundFolder.name);
        return foundFolder.name;
      }
    }

    // If not found, try to extract from the path
    if (typeof parentId === 'string' && parentId.includes('/')) {
      const pathParts = parentId.split('/');
      const folderName = pathParts[pathParts.length - 1] || "Racine";
      console.log('Extracted from path:', folderName);
      return folderName;
    }

    console.log('Using default: Racine');
    return "Racine";
  }, [parentId, existingFolders]);

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

    // IMPORTANT: Use parentId from state, not from formData
    const actualParentId = parentId || formData.parentId;
    console.log('Using parentId:', actualParentId);

    let parentPath: string;
    if (actualParentId) {
      const parentFolder = existingFolders.find(f => f.id === actualParentId || f.path === actualParentId);
      parentPath = parentFolder?.path || actualParentId;
      console.log('Found parent folder path:', parentPath);
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
          parentId: actualParentId || undefined,
          path: result.path
        };

        console.log('New folder object:', newFolder);

        // Store metadata using NTFS ADS instead of folders.json
        if (window.electronAPI?.folderSetMetadata) {
          try {
            const metadataResult = await window.electronAPI.folderSetMetadata(result.path, {
              id: newFolder.id,
              name: newFolder.name,
              description: newFolder.description,
              color: newFolder.color,
              tags: newFolder.tags,
              createdAt: newFolder.createdAt.toISOString(),
              notes: newFolder.notes,
              icon: newFolder.icon,
              path: newFolder.path
            });

            if (metadataResult.success) {
              console.log('✅ Folder metadata stored in NTFS ADS successfully');
            } else {
              console.error('❌ Failed to store metadata in NTFS ADS:', metadataResult.error);
              // Fallback to folders.json if NTFS ADS fails
              if (window.electronAPI?.foldersLoad && window.electronAPI?.foldersSave) {
                const folders = await window.electronAPI.foldersLoad();
                await window.electronAPI.foldersSave([...folders, newFolder]);
                console.log('✅ Metadata stored in folders.json as fallback');
              }
            }
          } catch (metadataError) {
            console.error('❌ Error storing NTFS ADS metadata:', metadataError);
            // Fallback to folders.json
            if (window.electronAPI?.foldersLoad && window.electronAPI?.foldersSave) {
              const folders = await window.electronAPI.foldersLoad();
              await window.electronAPI.foldersSave([...folders, newFolder]);
              console.log('✅ Metadata stored in folders.json as fallback');
            }
          }
        } else {
          // Fallback to folders.json if NTFS ADS API not available
          console.log('NTFS ADS API not available, using folders.json fallback');
          if (window.electronAPI?.foldersLoad && window.electronAPI?.foldersSave) {
            const folders = await window.electronAPI.foldersLoad();
            await window.electronAPI.foldersSave([...folders, newFolder]);
          }
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
            <span className="truncate">{getSelectedFolderName}</span>
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
