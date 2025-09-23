"use client"

import type React from "react"
// @ts-ignore
const isElectron = typeof window !== 'undefined' && window.process && window.process.type === 'renderer';

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import FolderPicker from "./folder-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Folder, Pen, Monitor } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useCallback } from "react"

interface SettingsDialogProps {
  children: React.ReactNode
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  const { toast } = useToast();
  const [stylusSettings, setStylusSettings] = useState({
    pressureSensitivity: 1.0,
    offsetX: 0,
    offsetY: 0,
    minPressure: 0.1,
    maxPressure: 1.0,
    smoothing: 0.5,
    palmRejection: true,
  })

  const [fileSettings, setFileSettings] = useState({
    rootPath: "C:\\Users\\Documents\\NotesApp",
    autoSave: true,
    autoSaveInterval: 30,
    backupEnabled: true,
    maxFileSize: 50,
  })

  const [appSettings, setAppSettings] = useState({
    theme: "system",
    language: "fr",
    startWithWindows: false,
    minimizeToTray: true,
  })

  // Fonction de sauvegarde des paramètres
  const saveSettings = useCallback(() => {
    const settings = {
      stylus: stylusSettings,
      files: fileSettings,
      app: appSettings,
    };
    if (window.electronAPI && window.electronAPI.saveSettings) {
      window.electronAPI.saveSettings(settings)
        .then(() => {
          toast({
            title: "Paramètres sauvegardés",
            description: "Les paramètres ont été enregistrés avec succès.",
            variant: "default",
          });
        })
        .catch(() => {
          toast({
            title: "Erreur de sauvegarde",
            description: "Impossible d'enregistrer les paramètres.",
            variant: "destructive",
          });
        });
    } else {
      toast({
        title: "Fonctionnalité non disponible",
        description: "L'API Electron n'est pas accessible pour la sauvegarde.",
        variant: "destructive",
      });
    }
  }, [stylusSettings, fileSettings, appSettings, toast]);

  const handleStylusCalibration = () => {
    // Simulate calibration process
    alert("Veuillez toucher les 4 coins de l'écran avec votre stylet pour calibrer la précision.")
  }

  const handleResetSettings = () => {
    setStylusSettings({
      pressureSensitivity: 1.0,
      offsetX: 0,
      offsetY: 0,
      minPressure: 0.1,
      maxPressure: 1.0,
      smoothing: 0.5,
      palmRejection: true,
    })
    setFileSettings({
      rootPath: "C:\\Users\\Documents\\NotesApp",
      autoSave: true,
      autoSaveInterval: 30,
      backupEnabled: true,
      maxFileSize: 50,
    })
    setAppSettings({
      theme: "system",
      language: "fr",
      startWithWindows: false,
      minimizeToTray: true,
    })
  }

  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const handleBrowseFolder = () => {
    if (window.electronAPI && window.electronAPI.selectFolder) {
      window.electronAPI.selectFolder()
        .then((folderPath: string) => {
          if (folderPath) {
            setFileSettings((prev) => ({ ...prev, rootPath: folderPath }));
          } else {
            toast({
              title: "Sélection annulée",
              description: "Aucun dossier n'a été choisi.",
              variant: "destructive",
            });
          }
        })
        .catch(() => {
          toast({
            title: "Erreur Electron",
            description: "Impossible d'ouvrir le sélecteur de dossier natif.",
            variant: "destructive",
          });
        });
    } else {
      toast({
        title: "Fonctionnalité non disponible",
        description: "L'API Electron n'est pas accessible. Lancez l'application via Electron.",
        variant: "destructive",
      });
      setShowFolderPicker(true);
    }
  }
  const handleFolderSelect = (files: FileList) => {
    if (files.length > 0) {
      const firstFile = files[0];
      const folderName = firstFile.webkitRelativePath.split("/")[0];
      setFileSettings((prev) => ({ ...prev, rootPath: folderName }));
    }
    setShowFolderPicker(false);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration de l'application
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="stylus" className="w-full flex-1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="stylus" className="flex items-center gap-2">
                <Pen className="h-4 w-4" /> Stylet
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-2">
                <Folder className="h-4 w-4" /> Fichiers
              </TabsTrigger>
              <TabsTrigger value="app" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" /> Application
              </TabsTrigger>
              <TabsTrigger value="about">À propos</TabsTrigger>
            </TabsList>
            <TabsContent value="stylus" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Étalonnage du stylet</CardTitle>
                  <CardDescription>Configurez la précision et la sensibilité de votre stylet</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label>Calibration automatique</Label>
                    <Button onClick={handleStylusCalibration} variant="outline">
                      Calibrer maintenant
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Rejet de paume</Label>
                      <p className="text-sm text-muted-foreground">Ignore les touches accidentelles de la paume</p>
                    </div>
                    <Switch
                      checked={stylusSettings.palmRejection}
                      onCheckedChange={(checked) => setStylusSettings((prev) => ({ ...prev, palmRejection: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="files" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion des fichiers</CardTitle>
                  <CardDescription>Configurez l'emplacement et la gestion de vos fichiers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Dossier racine</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={fileSettings.rootPath}
                        readOnly
                        placeholder="Chemin du dossier racine"
                      />
                      <Button onClick={handleBrowseFolder} variant="outline">
                        Parcourir
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Sauvegarde automatique</Label>
                      <p className="text-sm text-muted-foreground">Sauvegarde automatiquement vos notes</p>
                    </div>
                    <Switch
                      checked={fileSettings.autoSave}
                      onCheckedChange={(checked) => setFileSettings((prev) => ({ ...prev, autoSave: checked }))}
                    />
                  </div>

                  {fileSettings.autoSave && (
                    <div>
                      <Label>Intervalle de sauvegarde: {fileSettings.autoSaveInterval}s</Label>
                      <Slider
                        value={[fileSettings.autoSaveInterval]}
                        onValueChange={([value]) => setFileSettings((prev) => ({ ...prev, autoSaveInterval: value }))}
                        min={10}
                        max={300}
                        step={10}
                        className="mt-2"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Sauvegarde de sécurité</Label>
                      <p className="text-sm text-muted-foreground">Crée des copies de sauvegarde</p>
                    </div>
                    <Switch
                      checked={fileSettings.backupEnabled}
                      onCheckedChange={(checked) => setFileSettings((prev) => ({ ...prev, backupEnabled: checked }))}
                    />
                  </div>

                  <div>
                    <Label>Taille maximale des fichiers: {fileSettings.maxFileSize} MB</Label>
                    <Slider
                      value={[fileSettings.maxFileSize]}
                      onValueChange={([value]) => setFileSettings((prev) => ({ ...prev, maxFileSize: value }))}
                      min={1}
                      max={500}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="app" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres de l'application</CardTitle>
                  <CardDescription>Configurez le comportement général de l'application</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Démarrer avec Windows</Label>
                      <p className="text-sm text-muted-foreground">Lance l'application au démarrage de Windows</p>
                    </div>
                    <Switch
                      checked={appSettings.startWithWindows}
                      onCheckedChange={(checked) => setAppSettings((prev) => ({ ...prev, startWithWindows: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Réduire dans la barre des tâches</Label>
                      <p className="text-sm text-muted-foreground">Minimise dans la zone de notification</p>
                    </div>
                    <Switch
                      checked={appSettings.minimizeToTray}
                      onCheckedChange={(checked) => setAppSettings((prev) => ({ ...prev, minimizeToTray: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="about" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>À propos de NotesApp</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Version 1.0.0</p>
                    <p className="text-sm text-muted-foreground">
                      Application de prise de notes manuscrites pour Windows 11
                    </p>
                  </div>
                  <div className="pt-4 border-t">
                    <Button onClick={handleResetSettings} variant="outline" className="w-full bg-transparent">
                      Réinitialiser tous les paramètres
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        {/* Footer du modal */}
        <div className="pt-4 border-t flex justify-end">
          <Button onClick={saveSettings} variant="default" className="min-w-[200px]">
            Sauvegarder les paramètres
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
