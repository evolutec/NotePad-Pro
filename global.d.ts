declare global {
  interface ElectronAPI {
    deleteFolder: (path: string) => Promise<{ success: boolean; error?: string }>;
    foldersSave: (folders: any[]) => Promise<void>;
    // Ajoutez ici d'autres méthodes exposées par preload.js si besoin
  }
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};