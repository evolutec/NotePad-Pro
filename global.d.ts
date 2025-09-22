declare global {
  interface ElectronAPI {
    deleteFolder: (path: string) => Promise<{ success: boolean; error?: string }>;
    foldersSave: (folders: any[]) => Promise<void>;
    selectFolder?: () => Promise<string>;
    foldersScan?: () => Promise<any>;
    foldersLoad?: () => Promise<any>;
    folderCreate?: (data: any) => Promise<any>;
    noteCreate?: (data: any) => Promise<any>;
    noteSave?: (data: { path: string; content: string }) => Promise<{ success: boolean; error?: string }>;
    noteLoad?: (filePath: string) => Promise<{ success: boolean; data?: { title: string; content: string }; error?: string }>;
    fileDelete?: (filePath: string) => Promise<{ success: boolean; error?: string }>;
    fileRename?: (oldPath: string, newName: string) => Promise<{ success: boolean; newPath?: string; error?: string }>;
    notesLoad?: () => Promise<any[]>;
    notesSave?: (notes: any[]) => Promise<any>;
    drawCreate?: (data: any) => Promise<any>;
    drawsLoad?: () => Promise<any[]>;
    drawsSave?: (draws: any[]) => Promise<any>;
    onFolderSelected?: (callback: (folderPath: string) => void) => void;
    loadSettings?: () => Promise<any>;
        // Ajoutez ici d'autres méthodes exposées par preload.js si besoin
  }
  interface Window {
    electron?: ElectronAPI;
    electronAPI?: ElectronAPI;
  }
}

export {};