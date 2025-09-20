import * as React from "react"
import { FolderManager, type FolderData } from "@/components/folder-manager"

interface AddFolderDialogProps {
  folders: FolderData[]
  onFolderAdded: (newFolder: FolderData) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddFolderDialog({ folders, onFolderAdded, open, onOpenChange }: AddFolderDialogProps) {
  // Affiche le dialog de création et gère l'ajout
  return (
    <FolderManager
      onCreateFolder={onFolderAdded}
      open={open}
      onOpenChange={onOpenChange}
      // On pourrait passer ici les dossiers existants pour la sélection parent
    />
  )
}
