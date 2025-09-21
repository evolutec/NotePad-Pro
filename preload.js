const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  onFolderSelected: (callback) => ipcRenderer.on('dialog:selectedFolder', (_event, folderPath) => callback(folderPath)),
  saveSettings: (settings) => ipcRenderer.invoke('config:save', settings),
  loadSettings: () => ipcRenderer.invoke('config:load'),
  foldersLoad: () => ipcRenderer.invoke('folders:load'),
  foldersSave: (folders) => ipcRenderer.invoke('folders:save', folders),
  folderCreate: (folderData) => ipcRenderer.invoke('folder:create', folderData),
  foldersScan: () => ipcRenderer.invoke('foldersScan'),
  deleteFolder: (folderPath) => ipcRenderer.invoke('folder:delete', folderPath),
  noteCreate: (noteData) => {
    console.log('Preload: Calling note:create with', noteData);
    return ipcRenderer.invoke('note:create', noteData);
  },
  notesLoad: () => ipcRenderer.invoke('notes:load'),
  notesSave: (notes) => ipcRenderer.invoke('notes:save', notes),
});
