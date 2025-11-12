"use client"

import type React from "react"
// @ts-ignore
const isElectron = typeof window !== 'undefined' && window.process && window.process.type === 'renderer';

import { useState, useEffect } from "react"
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
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [fileSettings, setFileSettings] = useState({
    rootPath: "C:\\Users\\Documents\\NotesApp",
  })

  const [appSettings, setAppSettings] = useState({
    theme: "system",
    language: "fr",
    startWithWindows: false,
    minimizeToTray: true,
  })

  // Charger les paramètres existants au montage
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.loadSettings) {
      window.electronAPI.loadSettings().then((settings) => {
        if (settings) {
          if (settings.files && settings.files.rootPath) setFileSettings({ rootPath: settings.files.rootPath });
          if (settings.app) setAppSettings(settings.app);
        }
      });
    }
  }, []);

  // Fonction de sauvegarde des paramètres
  const saveSettings = useCallback(() => {
    const settings = {
      files: fileSettings,
      app: appSettings,
    };
    if (window.electronAPI && window.electronAPI.saveSettings) {
      window.electronAPI.saveSettings(settings)
        .then((result) => {
          if (result) {
            // Apply app settings in real-time
            if (window.electronAPI && window.electronAPI.appSettingsUpdate) {
              window.electronAPI.appSettingsUpdate(appSettings);
            }
            
            toast({
              title: "Paramètres sauvegardés",
              description: "Les paramètres ont été enregistrés avec succès.",
              variant: "default",
            });
            setOpen(false);
          } else {
            toast({
              title: "Erreur de sauvegarde",
              description: "Impossible d'enregistrer les paramètres.",
              variant: "destructive",
            });
          }
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
  }, [fileSettings, appSettings, toast]);

  const handleResetSettings = () => {
    setFileSettings({
      rootPath: "C:\\Users\\Documents\\NotesApp",
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
        .then((result: any) => {
          // Electron dialog returns an object with filePaths (array)
          const folderPath = result && result.filePaths && result.filePaths[0];
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration de l'application
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="files" className="w-full flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="files" className="flex items-center gap-2">
                <Folder className="h-4 w-4" /> Fichiers
              </TabsTrigger>
              <TabsTrigger value="app" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" /> Application
              </TabsTrigger>
              <TabsTrigger value="about">À propos</TabsTrigger>
            </TabsList>
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
                  <CardTitle>À propos de Fusion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Version 1.0.0</p>
                    <p className="text-sm text-muted-foreground">
                      Application de création et de gestion de notes avancée, prenant en charge les notes , les documents office, les images, et plus encore...
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
