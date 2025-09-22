import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Edit3 } from "lucide-react";

export interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  currentPath: string;
  isFolder: boolean;
  onRename: (newName: string) => void;
}

export function RenameDialog({ open, onOpenChange, currentName, currentPath, isFolder, onRename }: RenameDialogProps) {
  const [newName, setNewName] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setNewName(currentName);
      setRenameError(null);
      setIsProcessing(false);
    }
  }, [open, currentName]);

  const handleRename = async () => {
    setRenameError(null);
    setIsProcessing(true);
    
    if (!newName.trim()) {
      setRenameError("Le nom ne peut pas être vide");
      setIsProcessing(false);
      return;
    }
    
    if (newName === currentName) {
      setRenameError("Le nouveau nom doit être différent du nom actuel");
      setIsProcessing(false);
      return;
    }
    
    try {
      await onRename(newName.trim());
      setIsProcessing(false);
      onOpenChange(false);
    } catch (error: any) {
      setRenameError(error.message || "Erreur lors du renommage");
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isProcessing) {
      e.preventDefault();
      handleRename();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Renommer {isFolder ? 'le dossier' : 'la note'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-name">Nouveau nom</Label>
            <Input
              id="new-name"
              placeholder={`Entrez le nouveau nom ${isFolder ? 'du dossier' : 'de la note'}...`}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full"
              autoFocus
            />
          </div>
          
          {renameError && (
            <div className="text-sm text-red-500">{renameError}</div>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
              disabled={isProcessing}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleRename} 
              disabled={!newName.trim() || isProcessing} 
              className="flex-1"
            >
              {isProcessing ? 'Renommage...' : 'Renommer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}