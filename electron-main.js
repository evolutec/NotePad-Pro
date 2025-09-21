
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Wait for the Next.js server to be ready
  const serverUrl = 'http://localhost:3003';
  mainWindow.loadURL(serverUrl);

  mainWindow.on('closed', function () {
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
          node.children.push({
            name: item,
            path: itemPath,
            type: 'file',
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

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});