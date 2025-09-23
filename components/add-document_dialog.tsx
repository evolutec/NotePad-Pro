import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, FilePlus } from "lucide-react"; // Using FileText for document icon

export interface DocumentMeta {
  id: string;
  name: string;
  parentPath: string;
  createdAt: string;
  tags?: string[];
  content?: string; // Add content field for uploaded file
}

export interface AddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onDocumentCreated: (document: DocumentMeta) => void;
}

export function AddDocumentDialog({ open, onOpenChange, parentPath, onDocumentCreated }: AddDocumentDialogProps) {
  const [documentName, setDocumentName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // New state for selected file
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Keep the original filename with extension
      setDocumentName(file.name);
    } else {
      setSelectedFile(null);
      setDocumentName("");
    }
  };

  const isBinaryFile = (file: File): boolean => {
    const binaryTypes = [
      'application/pdf',
      'image/',
      'video/',
      'audio/',
      'application/zip',
      'application/x-zip-compressed'
    ];
    return binaryTypes.some(type => file.type.startsWith(type)) ||
           file.name.toLowerCase().endsWith('.pdf');
  };

  const handleCreateDocument = async () => {
    setCreationError(null);
    setCreationSuccess(null);
    if (!documentName.trim() && !selectedFile) {
      setCreationError("Veuillez entrer un nom de document ou sélectionner un fichier.");
      return;
    }

    let finalParentPath = parentPath;
    if (parentId) {
      const parentFolder = existingFolders.find(f => f.id === parentId);
      finalParentPath = parentFolder?.path || parentPath;
    }

    let fileContent: string | ArrayBuffer | undefined = undefined;
    let isBinary = false;

    if (selectedFile) {
      try {
        // Check if it's a binary file
        if (isBinaryFile(selectedFile)) {
          console.log('Reading binary file:', selectedFile.name);
          fileContent = await selectedFile.arrayBuffer(); // Read as binary
          isBinary = true;
        } else {
          console.log('Reading text file:', selectedFile.name);
          fileContent = await selectedFile.text(); // Read as text
          isBinary = false;
        }
      } catch (error) {
        setCreationError("Erreur lors de la lecture du fichier.");
        return;
      }
    }

    if (window.electronAPI?.documentCreate) {
      const result = await window.electronAPI.documentCreate({
        name: documentName.trim(),
        parentPath: finalParentPath,
        tags,
        content: fileContent, // Pass file content (binary or text)
        type: selectedFile?.type || 'text/plain', // Infer type from file or default
        isBinary, // Flag to indicate binary file
      });

      if (!result.success) {
        setCreationError(result.error || "Erreur lors de la création du document.");
        return;
      }

      const newDocument: DocumentMeta = {
        id: Date.now().toString(),
        name: documentName.trim(),
        parentPath: finalParentPath,
        createdAt: new Date().toISOString(),
        tags,
        content: typeof fileContent === 'string' ? fileContent : undefined,
      };

      setCreationSuccess("Document créé avec succès !");
      if (onDocumentCreated) onDocumentCreated(newDocument);
      setTimeout(() => {
        setDocumentName("");
        setSelectedFile(null);
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
            <FileText className="h-5 w-5" />
            Créer ou importer un document
          </DialogTitle>
          <div className="h-1 w-full bg-red-500 mt-2" />
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
            <Label htmlFor="document-file">Importer un fichier</Label>
            <Input
              id="document-file"
              type="file"
              onChange={handleFileChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="document-name">Nom du document</Label>
            <Input
              id="document-name"
              placeholder="Ex: Rapport, Article, Liste..."
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              disabled={!!selectedFile} // Disable if a file is selected
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
            <Button onClick={handleCreateDocument} disabled={!documentName.trim() && !selectedFile} className="flex-1">
              Créer le document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
