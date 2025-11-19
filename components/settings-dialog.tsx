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
import { Settings, Folder, Pen, Monitor, Palette, Image, X, ChevronDown, ChevronRight, Home } from "lucide-react"
import IconsSettings from "@/components/icons-settings"
import { Switch } from "@/components/ui/switch"
import { useCallback } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { BackgroundConfigModal } from './background-config-modal'
import { GPUFluidBackground } from './gpu-fluid-background'

interface SettingsDialogProps {
  children: React.ReactNode
  onBackgroundSaved?: () => void
}

export function SettingsDialog({ children, onBackgroundSaved }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);

  const { toast } = useToast();

  const [stylusSettings, setStylusSettings] = useState<any>({
    pressureSensitivity: 1.0,
    offsetX: 0,
    offsetY: 0,
    minPressure: 0.1,
    maxPressure: 1.0,
    smoothing: 0.5,
    palmRejection: true,
  });

  const [fileSettings, setFileSettings] = useState<any>({
    rootPath: "C:\\Users\\Documents\\NotesApp",
    autoSave: true,
    autoSaveInterval: 30,
    maxFileSize: 50,
  });

  const [appSettings, setAppSettings] = useState<any>({
    theme: "system",
    language: "fr",
    startWithWindows: false,
    minimizeToTray: true,
  });

  const [designSettings, setDesignSettings] = useState<any>({
    backgroundImage: null,
    fixedImage: null,
    animatedIndex: 0,
    elements: {},
    backgroundParams: null,
  });

  // Load persisted settings if available
  useEffect(() => {
    const load = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).electronAPI && (window as any).electronAPI.loadSettings) {
          const loaded = await (window as any).electronAPI.loadSettings();
          if (loaded) {
            setStylusSettings(loaded.stylus || loaded.stylusSettings || stylusSettings);
            setFileSettings(loaded.files || loaded.fileSettings || fileSettings);
            setAppSettings(loaded.app || loaded.appSettings || appSettings);
            setDesignSettings(loaded.design || loaded.designSettings || designSettings);
          }
        } else if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem('appSettings');
          if (raw) {
            const parsed = JSON.parse(raw);
            setStylusSettings(parsed.stylus || parsed.stylusSettings || stylusSettings);
            setFileSettings(parsed.files || parsed.fileSettings || fileSettings);
            setAppSettings(parsed.app || parsed.appSettings || appSettings);
            setDesignSettings(parsed.design || parsed.designSettings || designSettings);
          }
        }
      } catch (err) {
        console.warn('Unable to load settings:', err);
      }
    };
    load();
  }, []);

  const saveSettings = useCallback(async () => {
    try {
      // Send canonical key names to the main process to avoid legacy key duplication
      const payload = { stylus: stylusSettings, files: fileSettings, app: appSettings, design: designSettings };
      if (typeof window !== 'undefined' && (window as any).electronAPI && (window as any).electronAPI.saveSettings) {
        await (window as any).electronAPI.saveSettings(payload);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem('appSettings', JSON.stringify(payload));
      }

      // Broadcast updated design so previews refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { design: designSettings } }));
      }

      setOpen(false);
      toast({ title: 'Paramètres sauvegardés', description: 'Les paramètres ont été enregistrés.' });
      if (onBackgroundSaved) onBackgroundSaved();
    } catch (err) {
      console.error('settings-dialog: saveSettings error', err);
      const message = (err as any)?.message || String(err);
      toast({ title: 'Erreur de sauvegarde', description: `Impossible d'enregistrer les paramètres: ${message}`, variant: 'destructive' });
    }
  }, [stylusSettings, fileSettings, appSettings, designSettings, toast, onBackgroundSaved]);
 

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
      maxFileSize: 50,
    })
    setAppSettings({
      theme: "system",
      language: "fr",
      startWithWindows: false,
      minimizeToTray: true,
    })
    setDesignSettings({
      backgroundImage: null,
      fixedImage: null,
      animatedIndex: 0,
      elements: {}
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

  // Background modal state only
  const [backgroundModalOpen, setBackgroundModalOpen] = useState(false)

  const handleSaveBackground = (settings: { backgroundImage?: string | null; fixedImage?: string | null; animatedIndex?: number; backgroundParams?: any }) => {
    setDesignSettings(prev => {
      const updated = { ...prev, ...settings } as any
      // Notify other components immediately so previews update without saving the whole dialog
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { design: updated } }))
      }
      return updated
    })
  }

  

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Only allow opening, prevent closing from outside clicks
      if (newOpen) {
        setOpen(true);
      }
      // Ignore close requests (newOpen = false) to prevent outside click closing
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="fixed top-14 left-0 right-0 bottom-0 w-screen h-[calc(100vh-3.5rem)] m-0 p-0 flex flex-col overflow-hidden" showCloseButton={false}>
      <Tabs defaultValue="stylus" className="w-full flex flex-col flex-1 min-h-0">
        <DialogHeader className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm items-center gap-0 py-6">
          <div className="relative w-full mb-4">
            <DialogTitle className="text-lg leading-none font-semibold text-center">
              <Settings className="h-5 w-5 inline-block mr-2" />
              Configuration de l'application
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="absolute right-0 top-0 h-8 w-8 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <TabsList className="grid w-full grid-cols-6 py-1">
              <TabsTrigger value="stylus" className="flex items-center gap-2 data-[state=active]:underline data-[state=active]:underline-offset-4 data-[state=active]:decoration-2 data-[state=active]:decoration-white hover:underline hover:decoration-white">
                <Pen className="h-4 w-4" /> Stylet
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-2 data-[state=active]:underline data-[state=active]:underline-offset-4 data-[state=active]:decoration-2 data-[state=active]:decoration-white hover:underline hover:decoration-white">
                <Folder className="h-4 w-4" /> Fichiers
              </TabsTrigger>
              <TabsTrigger value="app" className="flex items-center gap-2 data-[state=active]:underline data-[state=active]:underline-offset-4 data-[state=active]:decoration-2 data-[state=active]:decoration-white hover:underline hover:decoration-white">
                <Monitor className="h-4 w-4" /> Application
              </TabsTrigger>
              <TabsTrigger value="design" className="flex items-center gap-2 data-[state=active]:underline data-[state=active]:underline-offset-4 data-[state=active]:decoration-2 data-[state=active]:decoration-white hover:underline hover:decoration-white">
                <Image className="h-4 w-4" /> Design
              </TabsTrigger>
              <TabsTrigger value="icons" className="flex items-center gap-2 data-[state=active]:underline data-[state=active]:underline-offset-4 data-[state=active]:decoration-2 data-[state=active]:decoration-white hover:underline hover:decoration-white"><Palette className="h-4 w-4" /> Icônes</TabsTrigger>
              <TabsTrigger value="about" className="data-[state=active]:underline data-[state=active]:decoration-white hover:underline hover:decoration-white">À propos</TabsTrigger>
            </TabsList>
          </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
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
            <TabsContent value="design" className="space-y-4">
              <Accordion type="multiple" defaultValue={["landing-page"]} className="w-full">
                <AccordionItem value="landing-page" className="border border-border rounded-lg bg-card/50 backdrop-blur-sm">
                  <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 transition-colors duration-200 [&[data-state=open]>svg]:rotate-180 [&>svg]:h-6 [&>svg]:w-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Home className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-foreground">Page d'accueil</div>
                        <div className="text-sm text-muted-foreground">Personnalisez l'apparence et les éléments de la page d'accueil</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Card>
                      <CardHeader>
                        <CardTitle>Aperçu de la page d'accueil</CardTitle>
                        <CardDescription>Cliquez sur l'arrière-plan pour changer l'image de fond, ou ajustez la visibilité des éléments à droite.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-12 gap-4 items-start">
                          {/* Preview left */}
                          <div className="col-span-7">
                            <div className="relative border rounded-lg overflow-hidden bg-muted/30 mx-auto" style={{ width: '100%', height: '300px' }}>
                              <div className="absolute inset-0">
                                {designSettings.backgroundImage === "__gpu_fluid_background__" ? (
                                  <div className="w-full h-full cursor-pointer" onClick={() => setBackgroundModalOpen(true)}>
                                    <GPUFluidBackground
                                      className="w-full h-full"
                                      speed={(designSettings as any).backgroundParams?.speed ?? 1.0}
                                      scale={(designSettings as any).backgroundParams?.scale ?? 1.0}
                                      tint={(designSettings as any).backgroundParams?.tint ?? '#2463ff'}
                                      opacity={(designSettings as any).backgroundParams?.opacity ?? 0.8}
                                    />
                                  </div>
                                ) : (
                                  designSettings.fixedImage && designSettings.fixedImage.startsWith('#') ? (
                                    <div 
                                      className="w-full h-full cursor-pointer" 
                                      style={{ 
                                        background: (designSettings as any).backgroundParams?.gradientEnabled ? 
                                          `linear-gradient(${(designSettings as any).backgroundParams.gradientDirection ?? 'to right'}, ${(designSettings as any).backgroundParams.gradientColor1 ?? designSettings.fixedImage}, ${(designSettings as any).backgroundParams.gradientColor2 ?? designSettings.fixedImage})` : 
                                          designSettings.fixedImage,
                                        filter: (designSettings as any).backgroundParams ? 
                                          `brightness(${(designSettings as any).backgroundParams.brightness ?? 100}%) contrast(${(designSettings as any).backgroundParams.contrast ?? 100}%) saturate(${(designSettings as any).backgroundParams.saturation ?? 100}%) hue-rotate(${(designSettings as any).backgroundParams.hue ?? 0}deg) blur(${(designSettings as any).backgroundParams.blur ?? 0}px)` : undefined
                                      }}
                                      onClick={() => setBackgroundModalOpen(true)}
                                    />
                                  ) : (
                                    <img 
                                      src={designSettings.backgroundImage || designSettings.fixedImage || `/backgrounds/bg${((designSettings.animatedIndex ?? 0) % 20) + 1}.svg`} 
                                      alt="landing preview" 
                                      className="w-full h-full object-cover cursor-pointer" 
                                      style={{
                                        filter: designSettings.fixedImage && (designSettings as any).backgroundParams ? 
                                          `brightness(${(designSettings as any).backgroundParams.brightness ?? 100}%) contrast(${(designSettings as any).backgroundParams.contrast ?? 100}%) saturate(${(designSettings as any).backgroundParams.saturation ?? 100}%) hue-rotate(${(designSettings as any).backgroundParams.hue ?? 0}deg) blur(${(designSettings as any).backgroundParams.blur ?? 0}px)` : undefined
                                      }}
                                      onClick={() => setBackgroundModalOpen(true)}
                                    />
                                  )
                                )}

                                {/* Logo, Folder, Recents, Create previews */}
                                <div className="absolute" style={{ left: '3%', top: '4%', width: '9%', height: '18%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)', borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.12)', opacity: designSettings.elements?.logo?.visible === false ? 0.25 : 1 }}>
                                  <img src="/icon-512.png" alt="logo" style={{ width: '70%', height: '70%' }} />
                                </div>

                                <div className="absolute" style={{ left: '5%', bottom: '10%', width: '25%', height: '35%', background: 'rgba(255,255,255,0.9)', borderRadius: 8, padding: 8, opacity: designSettings.elements?.folder?.visible === false ? 0.25 : 1 }}>
                                  <div className="font-medium text-xs">Arborescence</div>
                                  <div className="text-xs text-muted-foreground">Aperçu structure</div>
                                </div>

                                <div className="absolute" style={{ left: '37.5%', bottom: '10%', width: '25%', height: '35%', background: 'rgba(255,255,255,0.9)', borderRadius: 8, padding: 8, opacity: designSettings.elements?.recents?.visible === false ? 0.25 : 1 }}>
                                  <div className="font-medium text-sm">Fichiers Récents</div>
                                  <div className="text-xs text-muted-foreground">Aperçu</div>
                                </div>

                                <div className="absolute" style={{ right: '5%', bottom: '10%', width: '25%', height: '35%', background: 'rgba(255,255,255,0.9)', borderRadius: 8, padding: 8, opacity: designSettings.elements?.create?.visible === false ? 0.25 : 1 }}>
                                  <div className="font-medium text-sm">Créer</div>
                                  <div className="text-xs text-muted-foreground">Boutons rapides</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Visibility controls right */}
                          <div className="col-span-5">
                            <Card>
                              <CardHeader>
                                <CardTitle>Visibilité des éléments</CardTitle>
                                <CardDescription>Contrôlez quels éléments sont affichés sur la page d'accueil.</CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {[
                                  { id: 'logo', name: 'Logo' },
                                  { id: 'folder', name: 'Arborescence' },
                                  { id: 'recents', name: 'Fichiers Récents' },
                                  { id: 'create', name: 'Boutons Créer' }
                                ].map(element => (
                                  <div key={element.id} className="flex items-center justify-between">
                                    <Label>{element.name}</Label>
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={designSettings.elements?.[element.id]?.visible !== false}
                                        onCheckedChange={(checked) => setDesignSettings(prev => ({
                                          ...prev,
                                          elements: {
                                            ...(prev.elements || {}),
                                            [element.id]: {
                                              ...(prev.elements?.[element.id] || {}),
                                              visible: checked
                                            }
                                          }
                                        }))}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            <TabsContent value="icons" className="space-y-4">
              <IconsSettings />
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
        </div>
          </Tabs>
        {/* Footer du modal */}
        <div className="pt-4 border-t flex justify-end">
          <Button onClick={saveSettings} variant="default" className="min-w-[200px]">
            Sauvegarder les paramètres
          </Button>
        </div>

        {/* Plus de modal d'élément, uniquement le modal de fond */}
        <BackgroundConfigModal
          open={backgroundModalOpen}
          onOpenChange={setBackgroundModalOpen}
          currentSettings={{
            backgroundImage: designSettings.backgroundImage,
            fixedImage: designSettings.fixedImage,
            animatedIndex: designSettings.animatedIndex,
            backgroundParams: (designSettings as any).backgroundParams || null
          }}
          onSave={handleSaveBackground}
        />

      </DialogContent>
    </Dialog>
  );
}
