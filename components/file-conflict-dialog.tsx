"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"

interface FileConflictDialogProps {
  open: boolean
  fileName: string
  onReplace: () => void
  onRename: (newName: string) => void
  onCancel: () => void
}

export function FileConflictDialog({
  open,
  fileName,
  onReplace,
  onRename,
  onCancel
}: FileConflictDialogProps) {
  const [newName, setNewName] = useState(fileName)
  const [selectedOption, setSelectedOption] = useState<'replace' | 'rename' | null>(null)

  const handleConfirm = () => {
    if (selectedOption === 'replace') {
      onReplace()
    } else if (selectedOption === 'rename') {
      onRename(newName)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Conflit de fichier
          </DialogTitle>
          <DialogDescription>
            Un fichier nommé <strong>{fileName}</strong> existe déjà à cet emplacement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Option 1: Replace */}
          <div 
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedOption === 'replace' 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedOption('replace')}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                checked={selectedOption === 'replace'}
                onChange={() => setSelectedOption('replace')}
                className="mt-1"
              />
              <div className="flex-1">
                <Label className="font-semibold cursor-pointer">Remplacer le fichier</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Le fichier existant sera écrasé par le nouveau fichier.
                </p>
              </div>
            </div>
          </div>

          {/* Option 2: Rename */}
          <div 
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedOption === 'rename' 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedOption('rename')}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                checked={selectedOption === 'rename'}
                onChange={() => setSelectedOption('rename')}
                className="mt-1"
              />
              <div className="flex-1">
                <Label className="font-semibold cursor-pointer">Renommer le nouveau fichier</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  Conserver les deux fichiers en donnant un nouveau nom.
                </p>
                {selectedOption === 'rename' && (
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nouveau nom de fichier"
                    className="mt-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedOption || (selectedOption === 'rename' && !newName.trim())}
          >
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
