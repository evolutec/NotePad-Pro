declare global {
  interface ElectronAPI {
    deleteFolder: (path: string) => Promise<{ success: boolean; error?: string }>;
    foldersSave: (folders: any[]) => Promise<void>;
    selectFolder?: () => Promise<string>;
    foldersScan?: () => Promise<any>;
    foldersLoad?: () => Promise<any>;
    folderCreate?: (data: any) => Promise<any>;
    noteCreate?: (data: any) => Promise<any>;
    notesLoad?: () => Promise<any[]>;
    notesSave?: (notes: any[]) => Promise<any>;
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