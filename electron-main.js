
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  console.log('[Electron] Creating window...');
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  console.log('[Electron] Window created successfully');

  // Wait for the Next.js server to be ready
  const serverUrl = 'http://localhost:3000';
  console.log('[Electron] Loading URL:', serverUrl);
  mainWindow.loadURL(serverUrl);
  console.log('[Electron] URL loaded');

  mainWindow.on('closed', function () {
    console.log('[Electron] Window closed');
    mainWindow = null;
  });
}

// Handler pour ouvrir le dialogue de sélection de dossier
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result;
});

// Handler pour sauvegarder la configuration
ipcMain.handle('config:save', async (_event, settings) => {
  try {
    const configPath = path.join(__dirname, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (err) {
    return false;
  }
});

// Handler pour charger la configuration
ipcMain.handle('config:load', async () => {
  try {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    } else {
      return null;
    }
  } catch (err) {
    return null;
  }
});

// Handler pour supprimer un dossier du filesystem
ipcMain.handle('folder:delete', async (_event, folderPath) => {
  try {
    if (fs.existsSync(folderPath)) {
      fs.rmdirSync(folderPath, { recursive: true });
      return { success: true };
    } else {
      return { success: false, error: 'Folder does not exist' };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Handler pour créer un dossier dans le chemin rootPath
ipcMain.handle('folder:create', async (_event, folderName) => {
  try {
    const configPath = path.join(__dirname, 'config.json');
    if (!fs.existsSync(configPath)) {
      console.log('[folder:create] Config not found:', configPath);
      return { success: false, error: 'Config not found' };
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const rootPath = config.files?.rootPath;
    if (!rootPath) {
      console.log('[folder:create] rootPath not set in config:', config);
      return { success: false, error: 'rootPath not set' };
    }

    // Récupérer le chemin du dossier parent si fourni
    let folderNameValue = folderName;
    let parentPath = rootPath;
    if (typeof folderName === "object" && folderName !== null) {
      folderNameValue = folderName.name;
      parentPath = folderName.parentPath || rootPath;
    }
    console.log('[folder:create] folderNameValue:', folderNameValue);
    console.log('[folder:create] parentPath:', parentPath);
    const folderPath = path.join(parentPath, folderNameValue);
    console.log('[folder:create] folderPath to create:', folderPath);
    console.log('[folder:create] fs.existsSync(folderPath):', fs.existsSync(folderPath));
    if (!fs.existsSync(folderPath)) {
      try {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log('[folder:create] Folder created:', folderPath);
        return { success: true, path: folderPath };
      } catch (mkdirErr) {
        console.log('[folder:create] Error during mkdirSync:', mkdirErr);
        return { success: false, error: mkdirErr.message };
      }
    } else {
      console.log('[folder:create] Folder already exists:', folderPath);
      return { success: false, error: 'Folder already exists' };
    }
  } catch (err) {
    console.log('[folder:create] General error:', err);
    return { success: false, error: err.message };
  }
});

// Handler pour sauvegarder les métadonnées des dossiers dans folders.json
ipcMain.handle('folders:save', async (_event, folders) => {
  try {
    const foldersPath = path.join(__dirname, 'folders.json');
    fs.writeFileSync(foldersPath, JSON.stringify(folders, null, 2), 'utf-8');
    return true;
  } catch (err) {
    return false;
  }
});

// Handler pour charger les métadonnées des dossiers depuis folders.json
ipcMain.handle('folders:load', async () => {
  try {
    const foldersPath = path.join(__dirname, 'folders.json');
    if (fs.existsSync(foldersPath)) {
      const data = fs.readFileSync(foldersPath, 'utf-8');
      return JSON.parse(data);
    } else {
      return [];
    }
  } catch (err) {
    return [];
  }
});

// Handler pour scanner le filesystem et reconstruire l'arborescence réelle
ipcMain.handle('foldersScan', async () => {
  try {
    const configPath = path.join(__dirname, 'config.json');
    if (!fs.existsSync(configPath)) return [];
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const rootPath = config.files?.rootPath || config.rootPath;
    if (!rootPath || !fs.existsSync(rootPath)) return [];

    function scanFolderTree(dirPath) {
      const stats = fs.statSync(dirPath);
      if (!stats.isDirectory()) return null;
      const node = {
        name: path.basename(dirPath),
        path: dirPath,
        type: 'folder',
        children: [],
        isDirectory: true,
      };
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const itemStats = fs.statSync(itemPath);
        if (itemStats.isDirectory()) {
          node.children.push(scanFolderTree(itemPath));
        } else {
          const fileExtension = item.split('.').pop()?.toLowerCase();
          let fileType = 'file'; // Default to 'file'
          if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(fileExtension)) {
            fileType = 'image';
          } else if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(fileExtension)) {
            fileType = 'document';
          } else if (['draw'].includes(fileExtension)) {
            fileType = 'draw';
          } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(fileExtension)) {
            fileType = 'audio';
          } else if (['mp4', 'avi', 'mov', 'webm'].includes(fileExtension)) {
            fileType = 'video';
          } else if (['zip', 'rar', '7z', 'tar'].includes(fileExtension)) {
            fileType = 'archive';
          } else if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'cs', 'html', 'css', 'json'].includes(fileExtension)) {
            fileType = 'code';
          } else if (item.startsWith("http://") || item.startsWith("https://")) {
            fileType = 'link';
          }
          node.children.push({
            name: item,
            path: itemPath,
            type: fileType,
            isDirectory: false,
          });
        }
      }
      return node;
    }
    const tree = scanFolderTree(rootPath);
    return [tree];
  } catch (err) {
    console.error('[Electron] Erreur scan:', err);
    return [];
  }
});

// Handler pour créer une note
console.log('Registering note:create handler');
ipcMain.handle('note:create', async (_event, noteData) => {
  console.log('note:create handler called with:', noteData);
  try {
    const configPath = path.join(__dirname, 'config.json');
    if (!fs.existsSync(configPath)) {
      console.log('note:create handler error: Config not found');
      return { success: false, error: 'Config not found' };
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const rootPath = config.files?.rootPath;
    if (!rootPath) {
      console.log('note:create handler error: rootPath not set');
      return { success: false, error: 'rootPath not set' };
    }

    const { name, type, parentPath, tags } = noteData;
    const fileName = type === 'markdown' ? `${name}.md` : `${name}.txt`;
    const fullPath = path.join(parentPath || rootPath, fileName);

    if (fs.existsSync(fullPath)) {
      console.log('note:create handler error: Note already exists');
      return { success: false, error: 'Note already exists' };
    }

    fs.writeFileSync(fullPath, '', 'utf-8');
    console.log('note:create handler returning success');
    return { success: true, path: fullPath };
  } catch (err) {
    console.log('note:create handler error:', err.message);
    return { success: false, error: err.message };
  }
});

// Handler pour créer un dessin
console.log('Registering draw:create handler');
ipcMain.handle('draw:create', async (_event, drawData) => {
  console.log('draw:create handler called with:', drawData);
  try {
    const configPath = path.join(__dirname, 'config.json');
    if (!fs.existsSync(configPath)) {
      console.log('draw:create handler error: Config not found');
      return { success: false, error: 'Config not found' };
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const rootPath = config.files?.rootPath;
    if (!rootPath) {
      console.log('draw:create handler error: rootPath not set');
      return { success: false, error: 'rootPath not set' };
    }

    const { name, parentPath, tags } = drawData;
    const fileName = `${name}.draw`;
    const fullPath = path.join(parentPath || rootPath, fileName);

    if (fs.existsSync(fullPath)) {
      console.log('draw:create handler error: Draw already exists');
      return { success: false, error: 'Draw already exists' };
    }

    fs.writeFileSync(fullPath, JSON.stringify({ name, tags, content: [] }, null, 2), 'utf-8');
    console.log('draw:create handler returning success');
    return { success: true, path: fullPath };
  } catch (err) {
    console.log('draw:create handler error:', err.message);
    return { success: false, error: err.message };
  }
});

// Handler pour charger les notes depuis notes.json
ipcMain.handle('notes:load', async () => {
  try {
    const notesPath = path.join(__dirname, 'notes.json');
    if (fs.existsSync(notesPath)) {
      const data = fs.readFileSync(notesPath, 'utf-8');
      return JSON.parse(data);
    } else {
      return [];
    }
  } catch (err) {
    return [];
  }
});

// Handler pour sauvegarder les notes dans notes.json
ipcMain.handle('notes:save', async (_event, notes) => {
  try {
    const notesPath = path.join(__dirname, 'notes.json');
    fs.writeFileSync(notesPath, JSON.stringify(notes, null, 2), 'utf-8');
    return true;
  } catch (err) {
    return false;
  }
});

// Handler pour charger les dessins depuis draws.json
ipcMain.handle('draws:load', async () => {
  try {
    const drawsPath = path.join(__dirname, 'draws.json');
    if (fs.existsSync(drawsPath)) {
      const data = fs.readFileSync(drawsPath, 'utf-8');
      return JSON.parse(data);
    } else {
      return [];
    }
  } catch (err) {
    return [];
  }
});

// Handler pour sauvegarder les dessins dans draws.json
ipcMain.handle('draws:save', async (_event, draws) => {
  try {
    const drawsPath = path.join(__dirname, 'draws.json');
    fs.writeFileSync(drawsPath, JSON.stringify(draws, null, 2), 'utf-8');
    return true;
  } catch (err) {
    return false;
  }
});

// Handler pour sauvegarder le contenu d'une note dans un fichier
ipcMain.handle('note:save', async (_event, noteData) => {
  try {
    const { path: filePath, content } = noteData;
    if (!filePath) {
      return { success: false, error: 'File path is required' };
    }
    
    // Ensure the directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Handler pour charger le contenu d'une note depuis un fichier
ipcMain.handle('note:load', async (_event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    // Extract title from first line or use filename
    const title = content.split('\n')[0].replace(/^#\s*/, '') || path.basename(filePath, path.extname(filePath));
    return { success: true, data: { title, content } };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Handler pour sauvegarder le contenu d'un dessin dans un fichier
ipcMain.handle('draw:save', async (_event, filePath, drawingData) => {
  try {
    if (!filePath) {
      return { success: false, error: 'File path is required' };
    }
    
    // Ensure the directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(drawingData, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Handler pour charger le contenu d'un dessin depuis un fichier
ipcMain.handle('draw:load', async (_event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, data: JSON.parse(content) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Handler pour supprimer un fichier ou dossier
ipcMain.handle('file:delete', async (_event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File or folder not found' };
    }
    
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      // Remove directory and all its contents
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      // Remove file
      fs.unlinkSync(filePath);
    }
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Handler pour renommer un fichier ou dossier
ipcMain.handle('file:rename', async (_event, oldPath, newName) => {
  try {
    if (!fs.existsSync(oldPath)) {
      return { success: false, error: 'File or folder not found' };
    }
    
    const dir = path.dirname(oldPath);
    const newPath = path.join(dir, newName);
    
    if (fs.existsSync(newPath)) {
      return { success: false, error: 'A file or folder with that name already exists' };
    }
    
    fs.renameSync(oldPath, newPath);
    return { success: true, newPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(() => {
  console.log('[Electron] App is ready, creating window...');
  createWindow();
  app.on('activate', function () {
    console.log('[Electron] App activated');
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('ready', () => {
  console.log('[Electron] App ready event fired');
});