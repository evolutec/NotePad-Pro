declare global {
  interface ElectronAPI {
    getPathForFile?: (file: File) => string | null;
    deleteFolder: (path: string) => Promise<{ success: boolean; error?: string }>;
    foldersSave: (folders: any[]) => Promise<void>;
    selectFolder?: () => Promise<{ filePaths?: string[]; canceled?: boolean } | string>;
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
    writeFile?: (filePath: string, data: string) => Promise<{ success: boolean; error?: string }>;
    readPdfFile?: (filePath: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    documentCreate?: (data: any) => Promise<{ success: boolean; path?: string; error?: string }>;
    archiveCreate?: (data: any) => Promise<{ success: boolean; path?: string; error?: string }>;
    audioCreate?: (data: any) => Promise<{ success: boolean; path?: string; error?: string }>;
    codeCreate?: (data: any) => Promise<{ success: boolean; path?: string; error?: string }>;
    imageCreate?: (data: any) => Promise<{ success: boolean; path?: string; error?: string }>;
    videoCreate?: (data: any) => Promise<{ success: boolean; path?: string; error?: string }>;

    // Camera access APIs
    getCameraDevices?: () => Promise<{ success: boolean; devices?: any[]; error?: string }>;
    startCameraRecording?: (options: { video: boolean; audio: boolean; mimeType: string }) => Promise<{ success: boolean; streamId?: string; error?: string }>;
    stopCameraRecording?: (streamId?: string) => Promise<{ success: boolean; videoData?: Blob; error?: string }>;
    requestCameraPermission?: () => Promise<{ success: boolean; error?: string }>;

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

    // Native file system APIs for more reliable file operations
    fsExists?: (filePath: string) => Promise<{ success: boolean; exists: boolean; error?: string }>;
    fsMove?: (oldPath: string, newPath: string, options?: { replace?: boolean; newFileName?: string }) => Promise<{ success: boolean; newPath?: string; conflict?: boolean; existingFileName?: string; targetPath?: string; error?: string }>;
    fsReaddir?: (dirPath: string) => Promise<{ success: boolean; items: string[]; error?: string }>;
    fsUnlink?: (filePath: string) => Promise<{ success: boolean; error?: string }>;
    fsMkdir?: (dirPath: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    copyExternalFile?: (sourcePath: string, targetFolder: string, options?: { replace?: boolean; newFileName?: string }) => Promise<{ success: boolean; targetPath?: string; conflict?: boolean; existingFileName?: string; error?: string }>;

    // NTFS Alternate Data Streams for folder metadata
    folderSetMetadata?: (folderPath: string, metadata: any) => Promise<{ success: boolean; metadata?: any; error?: string }>;
    folderGetMetadata?: (folderPath: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    folderUpdateMetadata?: (folderPath: string, updates: any) => Promise<{ success: boolean; error?: string }>;
    folderDeleteMetadata?: (folderPath: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    folderListWithMetadata?: (rootPath: string) => Promise<{ success: boolean; folders?: any[]; error?: string }>;
    foldersMigrateToADS?: () => Promise<{ success: boolean; migrated?: number; total?: number; errors?: any[]; error?: string }>;

    // Document viewer APIs
    downloadFile?: (filePath: string, fileName: string) => Promise<{ success: boolean; error?: string }>;
    openFileExternal?: (filePath: string) => Promise<{ success: boolean; error?: string }>;

    // Ajoutez ici d'autres méthodes exposées par preload.js si besoin
  }
  interface Window {
    electron?: ElectronAPI;
    electronAPI?: ElectronAPI;
  }
}

export {};

// CSS module declarations
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}
