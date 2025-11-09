"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FolderOpen, Check, Loader2 } from "lucide-react"

interface FirstRunSetupProps {
  onComplete: (rootPath: string) => void
}

export function FirstRunSetup({ onComplete }: FirstRunSetupProps) {
  const [rootPath, setRootPath] = useState<string>("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    // Laisser vide pour forcer l'utilisateur à choisir
    setRootPath("")
  }, [])

  const handleBrowse = async () => {
    try {
      if (!window.electronAPI?.selectFolder) {
        setError("Fonction de sélection de dossier non disponible")
        return
      }
      
      const result = await window.electronAPI.selectFolder()
      
      // Gérer le cas où result est une chaîne (ancien format) ou un objet
      if (typeof result === 'string') {
        setRootPath(result)
        setError("")
      } else if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
        setRootPath(result.filePaths[0])
        setError("")
      }
    } catch (err) {
      console.error("Erreur lors de la sélection du dossier:", err)
      setError("Impossible d'ouvrir le sélecteur de dossier")
    }
  }

  const handleComplete = async () => {
    if (!rootPath || rootPath.trim() === "") {
      setError("Veuillez sélectionner un dossier")
      return
    }

    if (!window.electronAPI?.saveSettings) {
      setError("Fonction de sauvegarde non disponible")
      return
    }

    setIsCreating(true)
    setError("")

    try {
      // Créer la configuration
      const config = {
        stylus: {
          pressureSensitivity: 1,
          offsetX: 0,
          offsetY: 0,
          minPressure: 0.1,
          maxPressure: 1,
          smoothing: 0.5,
          palmRejection: true
        },
        files: {
          rootPath: rootPath,
          autoSave: true,
          autoSaveInterval: 30,
          backupEnabled: true,
          maxFileSize: 50
        },
        app: {
          theme: "system",
          language: "fr",
          startWithWindows: false,
          minimizeToTray: true
        }
      }

      // Sauvegarder la configuration
      const success = await window.electronAPI.saveSettings(config)

      if (success) {
        // Attendre un peu pour que la configuration soit bien sauvegardée
        await new Promise(resolve => setTimeout(resolve, 500))
        onComplete(rootPath)
      } else {
        setError("Impossible de sauvegarder la configuration")
      }
    } catch (err) {
      console.error("Erreur lors de la création de la configuration:", err)
      setError("Une erreur est survenue lors de la création de la configuration")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10">
            <FolderOpen className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">
            Bienvenue dans Fusion
          </CardTitle>
          <CardDescription className="text-center text-base">
            Avant de commencer, choisissez un dossier pour stocker vos notes, documents et dessins.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="rootPath">Dossier de stockage des notes</Label>
            <div className="flex gap-2">
              <Input
                id="rootPath"
                value={rootPath}
                onChange={(e) => {
                  setRootPath(e.target.value)
                  setError("")
                }}
                placeholder="C:\Users\Documents\Notes"
                className="flex-1"
              />
              <Button onClick={handleBrowse} variant="outline" type="button">
                <FolderOpen className="w-4 h-4 mr-2" />
                Parcourir
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Ce dossier sera créé automatiquement s'il n'existe pas.
            </p>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="p-4 rounded-lg bg-muted">
            <h4 className="font-medium mb-2">Ce qui sera configuré :</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Dossier de stockage pour vos notes et documents</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Sauvegarde automatique toutes les 30 secondes</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Paramètres par défaut optimisés</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Thème adaptatif selon votre système</span>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Vous pourrez modifier ces paramètres plus tard
          </p>
          <Button onClick={handleComplete} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Configuration...
              </>
            ) : (
              <>
                Continuer
                <Check className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

