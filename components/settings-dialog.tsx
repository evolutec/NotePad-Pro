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
import { Settings, Folder, Pen, Monitor, Palette } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Import additional Lucide icons for preview
import { Home, Wrench, FileText, Image, Music, Mic, Video, File, Archive, Code, Zap, Camera, Play, Pause, Square, Volume2, Type, Calculator, Briefcase } from "lucide-react"
// Import file types for color theming
import { FILE_TYPES, FileColorTheme } from "@/lib/file-types"

// Dynamic imports for icon libraries - client-side only
let AntIcons: any = {};
let MaterialIcons: any = {};

// Load icons only on client side
if (typeof window !== 'undefined') {
  try {
    // Dynamic import for Ant Design icons
    import('@ant-design/icons').then((antIcons) => {
      AntIcons = {
        HomeOutlined: antIcons.HomeOutlined,
        SettingOutlined: antIcons.SettingOutlined,
        FolderOutlined: antIcons.FolderOutlined,
        EditOutlined: antIcons.EditOutlined,
        FileTextOutlined: antIcons.FileTextOutlined,
        PictureOutlined: antIcons.PictureOutlined,
        AudioOutlined: antIcons.AudioOutlined,
        VideoCameraOutlined: antIcons.VideoCameraOutlined,
        PlayCircleOutlined: antIcons.PlayCircleOutlined,
        PauseOutlined: antIcons.PauseOutlined,
        StopOutlined: antIcons.StopOutlined,
        CustomerServiceOutlined: antIcons.CustomerServiceOutlined,
        CameraOutlined: antIcons.CameraOutlined,
        CalculatorOutlined: antIcons.CalculatorOutlined,
        ThunderboltOutlined: antIcons.ThunderboltOutlined,
        DesktopOutlined: antIcons.DesktopOutlined,
        ToolOutlined: antIcons.ToolOutlined,
        BgColorsOutlined: antIcons.BgColorsOutlined,
        CodeOutlined: antIcons.CodeOutlined,
        BusinessOutlined: antIcons.FileTextOutlined
      };
    }).catch(() => {
      console.log('Ant Design icons not available');
    });

    // Dynamic import for Material UI icons
    import('@mui/icons-material').then((muiIcons) => {
      MaterialIcons = {
        Home: muiIcons.Home,
        Settings: muiIcons.Settings,
        Folder: muiIcons.Folder,
        Edit: muiIcons.Edit,
        Description: muiIcons.Description,
        Image: muiIcons.Image,
        Audiotrack: muiIcons.Audiotrack,
        Videocam: muiIcons.Videocam,
        PlayArrow: muiIcons.PlayArrow,
        Pause: muiIcons.Pause,
        Stop: muiIcons.Stop,
        Mic: muiIcons.Mic,
        PhotoCamera: muiIcons.PhotoCamera,
        VolumeUp: muiIcons.VolumeUp,
        TextFields: muiIcons.TextFields,
        Calculate: muiIcons.Calculate,
        Business: muiIcons.Business,
        Code: muiIcons.Code,
        FlashOn: muiIcons.FlashOn,
        Monitor: muiIcons.Monitor,
        Build: muiIcons.Build,
        Palette: muiIcons.Palette
      };
    }).catch(() => {
      console.log('Material UI icons not available');
    });
  } catch (e) {
    console.log('Error loading icon libraries');
  }
}

// Color mapping for icons based on file types
const getIconColorTheme = (iconName: string): FileColorTheme => {
  const colorMap: { [key: string]: FileColorTheme } = {
    // Navigation & Actions
    Settings: 'gray',
    Home: 'blue',
    Folder: 'yellow',
    Pen: 'purple',
    File: 'gray',
    Archive: 'gray',

    // Media Files
    Image: 'yellow',
    Video: 'gray',
    Music: 'pink',
    Volume2: 'pink',
    Mic: 'pink',
    Camera: 'yellow',

    // Office Documents
    FileText: 'red',
    Type: 'red',
    Calculator: 'green',
    Briefcase: 'orange',
    Code: 'orange',
    Zap: 'red',

    // Media Controls
    Play: 'blue',
    Pause: 'blue',
    Square: 'red',
    Monitor: 'gray',
    Wrench: 'gray',
    Palette: 'purple'
  };

  return colorMap[iconName] || 'gray';
};

// Get color classes based on theme
const getColorClasses = (colorTheme: FileColorTheme): string => {
  const colorMap: { [key in FileColorTheme]: string } = {
    yellow: 'text-yellow-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    red: 'text-red-500',
    green: 'text-green-500',
    pink: 'text-pink-500',
    orange: 'text-orange-500',
    gray: 'text-gray-500',
    black: 'text-black'
  };

  return colorMap[colorTheme] || 'text-gray-500';
};

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

  const [iconSettings, setIconSettings] = useState({
    bundle: "lucide", // lucide, ant, material, shadcn
    style: "colored", // colored, monochrome
  })

  const [iconsLoaded, setIconsLoaded] = useState(false);

  // Load icons asynchronously on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let loadedCount = 0;
      const totalLibraries = 2; // Ant Design and Material UI

      // Load Ant Design icons
      import('@ant-design/icons').then((antIcons) => {
        AntIcons = {
          HomeOutlined: antIcons.HomeOutlined,
          SettingOutlined: antIcons.SettingOutlined,
          FolderOutlined: antIcons.FolderOutlined,
          EditOutlined: antIcons.EditOutlined,
          FileTextOutlined: antIcons.FileTextOutlined,
          PictureOutlined: antIcons.PictureOutlined,
          AudioOutlined: antIcons.AudioOutlined,
          VideoCameraOutlined: antIcons.VideoCameraOutlined,
          PlayCircleOutlined: antIcons.PlayCircleOutlined,
          PauseOutlined: antIcons.PauseOutlined,
          StopOutlined: antIcons.StopOutlined,
          CustomerServiceOutlined: antIcons.CustomerServiceOutlined,
          CameraOutlined: antIcons.CameraOutlined,
          CalculatorOutlined: antIcons.CalculatorOutlined,
          ThunderboltOutlined: antIcons.ThunderboltOutlined,
          DesktopOutlined: antIcons.DesktopOutlined,
          ToolOutlined: antIcons.ToolOutlined,
          BgColorsOutlined: antIcons.BgColorsOutlined,
          CodeOutlined: antIcons.CodeOutlined,
          BusinessOutlined: antIcons.FileTextOutlined
        };
        loadedCount++;
        if (loadedCount >= totalLibraries) setIconsLoaded(true);
      }).catch(() => {
        console.log('Ant Design icons not available');
        loadedCount++;
        if (loadedCount >= totalLibraries) setIconsLoaded(true);
      });

      // Load Material UI icons
      import('@mui/icons-material').then((muiIcons) => {
        MaterialIcons = {
          Home: muiIcons.Home,
          Settings: muiIcons.Settings,
          Folder: muiIcons.Folder,
          Edit: muiIcons.Edit,
          Description: muiIcons.Description,
          Image: muiIcons.Image,
          Audiotrack: muiIcons.Audiotrack,
          Videocam: muiIcons.Videocam,
          PlayArrow: muiIcons.PlayArrow,
          Pause: muiIcons.Pause,
          Stop: muiIcons.Stop,
          Mic: muiIcons.Mic,
          PhotoCamera: muiIcons.PhotoCamera,
          VolumeUp: muiIcons.VolumeUp,
          TextFields: muiIcons.TextFields,
          Calculate: muiIcons.Calculate,
          Business: muiIcons.Business,
          Code: muiIcons.Code,
          FlashOn: muiIcons.FlashOn,
          Monitor: muiIcons.Monitor,
          Build: muiIcons.Build,
          Palette: muiIcons.Palette
        };
        loadedCount++;
        if (loadedCount >= totalLibraries) setIconsLoaded(true);
      }).catch(() => {
        console.log('Material UI icons not available');
        loadedCount++;
        if (loadedCount >= totalLibraries) setIconsLoaded(true);
      });
    }
  }, []);

  // Helper function to render icons based on selected bundle
  const renderIcon = (iconName: string, className: string = "h-6 w-6") => {
    // Determine color class based on style selection
    let colorClass = className;
    if (iconSettings.style === 'colored') {
      const colorTheme = getIconColorTheme(iconName);
      colorClass = `${className} ${getColorClasses(colorTheme)}`;
    } else {
      colorClass = `${className} text-foreground`; // Use theme foreground color (white/black based on theme)
    }
    // For 'colored', keep default colors

    switch (iconSettings.bundle) {
      case 'lucide':
        const LucideIcon = { 
          Settings, Home, Folder, Pen, File, Archive, Image, Video, Music, Volume2, Mic, Camera,
          FileText, Type, Calculator, Briefcase, Code, Zap, Play, Pause, Square, Monitor, Wrench, Palette
        }[iconName];
        return LucideIcon ? <LucideIcon className={colorClass} /> : <Settings className={colorClass} />;

      case 'ant':
        const antIconMap: { [key: string]: string } = {
          Settings: 'SettingOutlined',
          Home: 'HomeOutlined',
          Folder: 'FolderOutlined',
          Pen: 'EditOutlined',
          File: 'FileTextOutlined',
          Archive: 'FileTextOutlined',
          Image: 'PictureOutlined',
          Video: 'VideoCameraOutlined',
          Music: 'CustomerServiceOutlined',
          Volume2: 'AudioOutlined',
          Mic: 'AudioOutlined',
          Camera: 'CameraOutlined',
          FileText: 'FileTextOutlined',
          Type: 'FileTextOutlined',
          Calculator: 'CalculatorOutlined',
          Briefcase: 'FileTextOutlined',
          Code: 'CodeOutlined',
          Zap: 'ThunderboltOutlined',
          Play: 'PlayCircleOutlined',
          Pause: 'PauseOutlined',
          Square: 'StopOutlined',
          Monitor: 'DesktopOutlined',
          Wrench: 'ToolOutlined',
          Palette: 'BgColorsOutlined'
        };
        const antIconName = antIconMap[iconName] || 'SettingOutlined';
        const AntIcon = AntIcons[antIconName as keyof typeof AntIcons];
        return AntIcon ? <AntIcon style={{ fontSize: '24px', color: iconSettings.style === 'monochrome' ? 'currentColor' : undefined }} /> : <Settings className={colorClass} />;

      case 'material':
        const materialIconMap: { [key: string]: string } = {
          Settings: 'Settings',
          Home: 'Home',
          Folder: 'Folder',
          Pen: 'Edit',
          File: 'Description',
          Archive: 'Archive',
          Image: 'Image',
          Video: 'Videocam',
          Music: 'Audiotrack',
          Volume2: 'VolumeUp',
          Mic: 'Mic',
          Camera: 'PhotoCamera',
          FileText: 'Description',
          Type: 'TextFields',
          Calculator: 'Calculate',
          Briefcase: 'Business',
          Code: 'Code',
          Zap: 'FlashOn',
          Play: 'PlayArrow',
          Pause: 'Pause',
          Square: 'Stop',
          Monitor: 'Monitor',
          Wrench: 'Build',
          Palette: 'Palette'
        };
        const materialIconName = materialIconMap[iconName] || 'Settings';
        const MaterialIcon = MaterialIcons[materialIconName as keyof typeof MaterialIcons];
        return MaterialIcon ? <MaterialIcon style={{ fontSize: '24px', color: iconSettings.style === 'monochrome' ? 'currentColor' : undefined }} /> : <Settings className={colorClass} />;

      case 'shadcn':
        // Shadcn uses Lucide icons
        const ShadcnIcon = { 
          Settings, Home, Folder, Pen, File, Archive, Image, Video, Music, Volume2, Mic, Camera,
          FileText, Type, Calculator, Briefcase, Code, Zap, Play, Pause, Square, Monitor, Wrench, Palette
        }[iconName];
        return ShadcnIcon ? <ShadcnIcon className={colorClass} /> : <Settings className={colorClass} />;

      default:
        return <Settings className={colorClass} />;
    }
  }

  // Charger les paramètres existants au montage
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.loadSettings) {
      window.electronAPI.loadSettings().then((settings) => {
        if (settings) {
          if (settings.files && settings.files.rootPath) setFileSettings({ rootPath: settings.files.rootPath });
          if (settings.app) setAppSettings(settings.app);
          if (settings.icons) setIconSettings(settings.icons);
        }
      });
    }
  }, []);

  // Fonction de sauvegarde des paramètres
  const saveSettings = useCallback(() => {
    const settings = {
      files: fileSettings,
      app: appSettings,
      icons: iconSettings,
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
  }, [fileSettings, appSettings, iconSettings, toast]);

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
    setIconSettings({
      bundle: "lucide",
      style: "colored",
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
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration de l'application
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="files" className="w-full flex-1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="files" className="flex items-center gap-2">
                <Folder className="h-4 w-4" /> Fichiers
              </TabsTrigger>
              <TabsTrigger value="app" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" /> Application
              </TabsTrigger>
              <TabsTrigger value="icons" className="flex items-center gap-2">
                <Palette className="h-4 w-4" /> Icônes
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
            <TabsContent value="icons" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration des icônes</CardTitle>
                  <CardDescription>Choisissez le bundle et le style d'icônes utilisé dans l'application. Les icônes colorées utilisent le schéma de couleurs des types de fichiers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Bundle d'icônes</Label>
                      <Select
                        value={iconSettings.bundle}
                        onValueChange={(value) => setIconSettings((prev) => ({ ...prev, bundle: value }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Sélectionnez un bundle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lucide">Lucid React</SelectItem>
                          <SelectItem value="ant">Ant Design</SelectItem>
                          <SelectItem value="material">Material UI</SelectItem>
                          <SelectItem value="shadcn">Shadcn UI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Style des icônes</Label>
                      <Select
                        value={iconSettings.style}
                        onValueChange={(value) => setIconSettings((prev) => ({ ...prev, style: value }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Sélectionnez un style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="colored">Colorées</SelectItem>
                          <SelectItem value="monochrome">Blanc/Noir</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Aperçu des icônes</Label>
                    <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                      <div className="text-center mb-4">
                        <span className="text-sm font-medium">
                          Style: {iconSettings.bundle === 'lucide' && 'Lucid React'}
                          {iconSettings.bundle === 'ant' && 'Ant Design'}
                          {iconSettings.bundle === 'material' && 'Material UI'}
                          {iconSettings.bundle === 'shadcn' && 'Shadcn UI'}
                          {' • '}
                          Style: {iconSettings.style === 'colored' && 'Colorées'}
                          {iconSettings.style === 'monochrome' && 'Monochrome'}
                        </span>
                      </div>

                      {/* Navigation & Actions */}
                      <div className="mb-4">
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">Navigation & Actions</h4>
                        <div className="grid grid-cols-10 gap-3">
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Settings')}
                            <span className="text-xs text-muted-foreground">Paramètres</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Home')}
                            <span className="text-xs text-muted-foreground">Accueil</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Folder')}
                            <span className="text-xs text-muted-foreground">Dossier</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Pen')}
                            <span className="text-xs text-muted-foreground">Éditer</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('File')}
                            <span className="text-xs text-muted-foreground">Fichier</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Archive')}
                            <span className="text-xs text-muted-foreground">Archive</span>
                          </div>
                        </div>
                      </div>

                      {/* Media Files */}
                      <div className="mb-4">
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">Fichiers Multimédia</h4>
                        <div className="grid grid-cols-10 gap-3">
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Image')}
                            <span className="text-xs text-muted-foreground">Image</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Video')}
                            <span className="text-xs text-muted-foreground">Vidéo</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Music')}
                            <span className="text-xs text-muted-foreground">Musique</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Volume2')}
                            <span className="text-xs text-muted-foreground">Audio</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Mic')}
                            <span className="text-xs text-muted-foreground">Enregistrement</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Camera')}
                            <span className="text-xs text-muted-foreground">Caméra</span>
                          </div>
                        </div>
                      </div>

                      {/* Office Documents */}
                      <div className="mb-4">
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">Documents Office</h4>
                        <div className="grid grid-cols-10 gap-3">
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('FileText')}
                            <span className="text-xs text-muted-foreground">Texte</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Type')}
                            <span className="text-xs text-muted-foreground">Word</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Calculator')}
                            <span className="text-xs text-muted-foreground">Excel</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Briefcase')}
                            <span className="text-xs text-muted-foreground">PowerPoint</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Code')}
                            <span className="text-xs text-muted-foreground">Code</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Zap')}
                            <span className="text-xs text-muted-foreground">PDF</span>
                          </div>
                        </div>
                      </div>

                      {/* Media Controls */}
                      <div className="mb-4">
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">Contrôles Multimédia</h4>
                        <div className="grid grid-cols-10 gap-3">
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Play')}
                            <span className="text-xs text-muted-foreground">Lecture</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Pause')}
                            <span className="text-xs text-muted-foreground">Pause</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Square')}
                            <span className="text-xs text-muted-foreground">Stop</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Monitor')}
                            <span className="text-xs text-muted-foreground">Écran</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Wrench')}
                            <span className="text-xs text-muted-foreground">Outils</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            {renderIcon('Palette')}
                            <span className="text-xs text-muted-foreground">Palette</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 text-center">
                        <p className="text-xs text-muted-foreground">
                          {iconSettings.bundle === 'lucide' && 'Icônes modernes et cohérentes de Lucide React'}
                          {iconSettings.bundle === 'ant' && 'Icônes élégantes du système de design Ant Design'}
                          {iconSettings.bundle === 'material' && 'Icônes Material Design de Google'}
                          {iconSettings.bundle === 'shadcn' && 'Icônes Lucide optimisées pour Shadcn UI'}
                          {' • '}
                          {iconSettings.style === 'colored' && 'Icônes colorées selon le schéma des types de fichiers (jaune=dossiers, bleu=notes, rouge=documents, etc.)'}
                          {iconSettings.style === 'monochrome' && 'Icônes en blanc/noir selon le thème'}
                        </p>
                      </div>
                    </div>
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
