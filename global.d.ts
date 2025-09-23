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
    fileRead?: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    readFile?: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    readPdfFile?: (filePath: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    documentCreate?: (data: any) => Promise<{ success: boolean; path?: string; error?: string }>;
    archiveCreate?: (data: any) => Promise<{ success: boolean; path?: string; error?: string }>;
    audioCreate?: (data: any) => Promise<{ success: boolean; path?: string; error?: string }>;
    codeCreate?: (data: any) => Promise<{ success: boolean; path?: string; error?: string }>;
    imageCreate?: (data: any) => Promise<{ success: boolean; path?: string; error?: string }>;
    videoCreate?: (data: any) => Promise<{ success: boolean; path?: string; error?: string }>;
    saveSettings?: (settings: any) => Promise<boolean>;
    notesLoad?: () => Promise<any[]>;
    notesSave?: (notes: any[]) => Promise<any>;
    drawCreate?: (data: any) => Promise<any>;
    drawsLoad?: () => Promise<any[]>;
    drawsSave?: (draws: any[]) => Promise<any>;
    drawLoad?: (filePath: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    drawSave?: (filePath: string, drawingData: any) => Promise<{ success: boolean; error?: string }>;
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
