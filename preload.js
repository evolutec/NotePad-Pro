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
  noteSave: (noteData) => ipcRenderer.invoke('note:save', noteData),
  noteLoad: (filePath) => ipcRenderer.invoke('note:load', filePath),
  fileDelete: (filePath) => ipcRenderer.invoke('file:delete', filePath),
  fileRename: (oldPath, newName) => ipcRenderer.invoke('file:rename', oldPath, newName),
  notesLoad: () => ipcRenderer.invoke('notes:load'),
  notesSave: (notes) => ipcRenderer.invoke('notes:save', notes),
  drawCreate: (drawData) => {
    console.log('Preload: Calling draw:create with', drawData);
    return ipcRenderer.invoke('draw:create', drawData);
  },
  drawSave: (filePath, drawingData) => ipcRenderer.invoke('draw:save', filePath, drawingData),
  drawLoad: (filePath) => ipcRenderer.invoke('draw:load', filePath),
  drawsLoad: () => ipcRenderer.invoke('draws:load'),
  drawsSave: (draws) => ipcRenderer.invoke('draws:save', draws),
  documentCreate: (documentData) => {
    console.log('Preload: Calling document:create with', documentData);
    return ipcRenderer.invoke('document:create', documentData);
  },
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  readPdfFile: (filePath) => {
    console.log('Preload: Calling readPdfFile with', filePath);
    return ipcRenderer.invoke('readPdfFile', filePath);
  },
  audioCreate: (audioData) => {
    console.log('Preload: Calling audio:create with', audioData);
    return ipcRenderer.invoke('audio:create', audioData);
  },
  codeCreate: (codeData) => {
    console.log('Preload: Calling code:create with', codeData);
    return ipcRenderer.invoke('code:create', codeData);
  },
  imageCreate: (imageData) => {
    console.log('Preload: Calling image:create with', imageData);
    return ipcRenderer.invoke('image:create', imageData);
  },
  videoCreate: (videoData) => {
    console.log('Preload: Calling video:create with', videoData);
    return ipcRenderer.invoke('video:create', videoData);
  },

  // Camera access APIs
  getCameraDevices: () => {
    console.log('Preload: Getting camera devices');
    return ipcRenderer.invoke('camera:getDevices');
  },

  startCameraRecording: (options) => {
    console.log('Preload: Starting camera recording with options:', options);
    return ipcRenderer.invoke('camera:startRecording', options);
  },

  stopCameraRecording: (streamId) => {
    console.log('Preload: Stopping camera recording:', streamId);
    return ipcRenderer.invoke('camera:stopRecording', streamId);
  },

  requestCameraPermission: () => {
    console.log('Preload: Requesting camera permission');
    return ipcRenderer.invoke('camera:requestPermission');
  },

  // Additional camera APIs
  getSystemInfo: () => {
    console.log('Preload: Getting system info');
    return ipcRenderer.invoke('camera:getSystemInfo');
  },

  checkAvailability: () => {
    console.log('Preload: Checking camera availability');
    return ipcRenderer.invoke('camera:checkAvailability');
  },

  getDesktopSources: () => {
    console.log('Preload: Getting desktop sources');
    return ipcRenderer.invoke('camera:getDesktopSources');
  },

  saveRecording: (videoData) => {
    console.log('Preload: Saving recording');
    return ipcRenderer.invoke('camera:saveRecording', videoData);
  },

  // Native file system APIs for more reliable file operations
  fsExists: (filePath) => {
    console.log('Preload: Checking if file exists:', filePath);
    return ipcRenderer.invoke('fs:exists', filePath);
  },

  fsMove: (oldPath, newPath) => {
    console.log('Preload: Moving file from', oldPath, 'to', newPath);
    return ipcRenderer.invoke('fs:move', oldPath, newPath);
  },

  fsReaddir: (dirPath) => {
    console.log('Preload: Reading directory:', dirPath);
    return ipcRenderer.invoke('fs:readdir', dirPath);
  },

  fsUnlink: (filePath) => {
    console.log('Preload: Deleting file:', filePath);
    return ipcRenderer.invoke('fs:unlink', filePath);
  },

  fsMkdir: (dirPath) => {
    console.log('Preload: Creating directory:', dirPath);
    return ipcRenderer.invoke('fs:mkdir', dirPath);
  },
});
