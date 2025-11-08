
const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const url = require('url');

let mainWindow;
let fileServer;
let nextServer; // Serveur pour les fichiers Next.js

// Create a simple HTTP server to serve Next.js static files in production
function createNextServer() {
  const isDev = !app.isPackaged;

  if (isDev) {
    console.log('[Next Server] Dev mode - using Next.js dev server on port 3000');
    return Promise.resolve();
  }

  // En production, créer un serveur HTTP pour servir les fichiers statiques
  return new Promise((resolve, reject) => {
    try {
      nextServer = http.createServer((req, res) => {
    // When packaged, files in asarUnpack are in app.asar.unpacked folder
    const outDir = app.isPackaged 
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'out')
      : path.join(__dirname, 'out');
    
    let filePath = path.join(outDir, req.url === '/' ? 'index.html' : req.url);
    
    // Gérer les fichiers dans _next
    if (req.url.startsWith('/_next/')) {
      filePath = path.join(outDir, req.url);
    }
    
    console.log('[Next Server] Request:', req.url, '-> File:', filePath);
    
    // Déterminer le type de contenu
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
        fs.readFile(filePath, (err, data) => {
          if (err) {
            console.error('[Next Server] File not found:', filePath);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
            return;
          }

          res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
          });
          res.end(data);
        });
      });

      nextServer.once('error', (err) => {
        console.error('[Next Server] Error starting server:', err);
        reject(err);
      });

      nextServer.listen(3000, '127.0.0.1', () => {
        console.log('[Next Server] Production server listening on http://127.0.0.1:3000');
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Create a simple HTTP server to serve local files
function createFileServer() {
  fileServer = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    // Get file path from query parameter
    const filePath = parsedUrl.query.file;
    
    console.log('[File Server] Request for:', filePath);
    
    if (!filePath) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing file parameter');
      return;
    }
    
    if (!fs.existsSync(filePath)) {
      console.error('[File Server] File not found:', filePath);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
    
    // Determine content type based on extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.csv': 'text/csv',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    try {
      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache',
      });
      
      console.log('[File Server] Serving file:', filePath, 'Size:', stat.size, 'Type:', contentType);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (err) {
      console.error('[File Server] Error serving file:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error serving file');
    }
  });
  
  // Écouter sur 0.0.0.0 pour permettre l'accès depuis Docker (host.docker.internal)
  return new Promise((resolve, reject) => {
    fileServer.once('error', (err) => {
      console.error('[File Server] Error starting:', err);
      reject(err);
    });

    fileServer.listen(38274, '0.0.0.0', () => {
      console.log('[File Server] Listening on http://0.0.0.0:38274 (accessible from Docker)');
      resolve();
    });
  });
}

function createWindow() {
  console.log('[Electron] Creating window...');
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Désactiver webSecurity pour permettre le chargement du CDN ZetaOffice
      webSecurity: false,
      // Active SharedArrayBuffer nécessaire pour WASM
      enableBlinkFeatures: 'SharedArrayBuffer',
      // Support pour les Web Workers nécessaires à ZetaOffice
      nodeIntegrationInWorker: false,
      // Permettre l'exécution de workers
      backgroundThrottling: false,
      // Activer les fonctionnalités expérimentales pour WASM
      experimentalFeatures: true,
    },
  });

  // Setup permission handler for camera and microphone access
  const { session } = require('electron');
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'mediaKeySystem', 'geolocation', 'notifications', 'midi', 'midiSysex', 'pointerLock', 'fullscreen', 'openExternal'];
    
    if (allowedPermissions.includes(permission)) {
      callback(true); // Allow
    } else {
      callback(false); // Deny
    }
  });
  
  // Intercepter les requêtes pour ajouter les en-têtes CORS
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    
    // Supprimer tous les en-têtes CORS qui pourraient bloquer
    delete responseHeaders['Cross-Origin-Opener-Policy'];
    delete responseHeaders['Cross-Origin-Embedder-Policy'];
    delete responseHeaders['Cross-Origin-Resource-Policy'];
    
    // Pour les ressources CDN de ZetaOffice, ajouter les bons en-têtes
    if (details.url.includes('zetaoffice.net')) {
      responseHeaders['Access-Control-Allow-Origin'] = ['*'];
      responseHeaders['Access-Control-Allow-Methods'] = ['GET, HEAD, OPTIONS'];
      responseHeaders['Access-Control-Allow-Headers'] = ['*'];
    }
    
    callback({ responseHeaders });
  });
  
  console.log('[Electron] Window created successfully with CORS headers for ZetaOffice');

  // Détecter si on est en développement ou en production
  const isDev = !app.isPackaged;
  const serverUrl = 'http://localhost:3000';
  
  console.log('[Electron] Mode:', isDev ? 'Development' : 'Production');
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

// NTFS Alternate Data Streams Handlers for folder metadata
ipcMain.handle('folder:setMetadata', async (_event, folderPath, metadata) => {
  try {
    console.log('[NTFS ADS] Setting metadata for:', folderPath);

    // Structure complète des métadonnées supportées
    const fullMetadata = {
      id: metadata.id || `folder_${Date.now()}`,
      name: metadata.name || '',
      color: metadata.color || '',
      tags: metadata.tags || [],
      createdAt: metadata.createdAt || new Date().toISOString(),
      notes: metadata.notes || [],
      icon: metadata.icon || '',
      description: metadata.description || '',
      iconFile: metadata.iconFile || '',
      tooltip: metadata.tooltip || '',
      customFields: metadata.customFields || {},
      version: '1.0'
    };

    const metadataStream = JSON.stringify(fullMetadata, null, 2);
    const streamPath = folderPath + ':folder_metadata';

    fs.writeFileSync(streamPath, metadataStream, 'utf-8');
    console.log('[NTFS ADS] Metadata saved successfully');
    return { success: true, metadata: fullMetadata };
  } catch (err) {
    console.error('[NTFS ADS] Error setting metadata:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('folder:getMetadata', async (_event, folderPath) => {
  try {
    console.log('[NTFS ADS] Getting metadata for:', folderPath);
    const streamPath = folderPath + ':folder_metadata';

    if (fs.existsSync(streamPath)) {
      const metadataStream = fs.readFileSync(streamPath, 'utf-8');
      const metadata = JSON.parse(metadataStream);
      console.log('[NTFS ADS] Metadata loaded:', metadata);
      return { success: true, data: metadata };
    } else {
      console.log('[NTFS ADS] No metadata found');
      return { success: true, data: null };
    }
  } catch (err) {
    console.error('[NTFS ADS] Error getting metadata:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('folder:updateMetadata', async (_event, folderPath, updates) => {
  try {
    console.log('[NTFS ADS] Updating metadata for:', folderPath);

    // Get existing metadata
    const existingResult = await folderGetMetadata(folderPath);
    if (!existingResult.success) {
      return existingResult;
    }

    const currentMetadata = existingResult.data || {};
    const updatedMetadata = { ...currentMetadata, ...updates };

    // Save updated metadata
    return await folderSetMetadata(folderPath, updatedMetadata);
  } catch (err) {
    console.error('[NTFS ADS] Error updating metadata:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('folder:deleteMetadata', async (_event, folderPath) => {
  try {
    console.log('[NTFS ADS] Deleting metadata for:', folderPath);
    const streamPath = folderPath + ':folder_metadata';

    if (fs.existsSync(streamPath)) {
      fs.unlinkSync(streamPath);
      console.log('[NTFS ADS] Metadata deleted');
      return { success: true };
    } else {
      return { success: true, message: 'No metadata found to delete' };
    }
  } catch (err) {
    console.error('[NTFS ADS] Error deleting metadata:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('folder:listWithMetadata', async (_event, rootPath) => {
  try {
    console.log('[NTFS ADS] Listing folders with metadata:', rootPath);

    if (!fs.existsSync(rootPath)) {
      return { success: false, error: 'Root path does not exist' };
    }

    const foldersWithMetadata = [];

    function scanDirectory(dirPath) {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          // Check for metadata
          const metadataResult = folderGetMetadata(itemPath);
          if (metadataResult.success && metadataResult.data) {
            foldersWithMetadata.push({
              path: itemPath,
              name: item,
              metadata: metadataResult.data
            });
          }

          // Recursively scan subdirectories
          try {
            scanDirectory(itemPath);
          } catch (err) {
            // Skip directories we can't read
            console.log('[NTFS ADS] Skipping directory:', itemPath);
          }
        }
      }
    }

    scanDirectory(rootPath);
    console.log('[NTFS ADS] Found folders with metadata:', foldersWithMetadata.length);
    return { success: true, folders: foldersWithMetadata };
  } catch (err) {
    console.error('[NTFS ADS] Error listing folders:', err);
    return { success: false, error: err.message };
  }
});

// Migration handler to move from folders.json to NTFS ADS
ipcMain.handle('folders:migrateToADS', async () => {
  try {
    console.log('[NTFS ADS] Starting migration from folders.json');
    const foldersPath = path.join(__dirname, 'folders.json');

    if (!fs.existsSync(foldersPath)) {
      return { success: false, error: 'No folders.json found to migrate' };
    }

    const folders = JSON.parse(fs.readFileSync(foldersPath, 'utf-8'));
    let migrated = 0;
    let errors = [];

    for (const folder of folders) {
      try {
        if (folder.path && fs.existsSync(folder.path)) {
          const result = await folderSetMetadata(folder.path, folder);
          if (result.success) {
            migrated++;
            console.log('[NTFS ADS] Migrated folder:', folder.name);
          } else {
            errors.push({ folder: folder.name, error: result.error });
          }
        } else {
          errors.push({ folder: folder.name, error: 'Folder path does not exist' });
        }
      } catch (err) {
        errors.push({ folder: folder.name, error: err.message });
      }
    }

    console.log('[NTFS ADS] Migration completed:', { migrated, errors: errors.length });
    return {
      success: true,
      migrated,
      total: folders.length,
      errors
    };
  } catch (err) {
    console.error('[NTFS ADS] Migration error:', err);
    return { success: false, error: err.message };
  }
});

// Legacy handlers for folders.json (keeping for compatibility)
ipcMain.handle('folders:save', async (_event, folders) => {
  try {
    const foldersPath = path.join(__dirname, 'folders.json');
    fs.writeFileSync(foldersPath, JSON.stringify(folders, null, 2), 'utf-8');
    return true;
  } catch (err) {
    return false;
  }
});

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
          } else if (['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'wmv', 'flv', '3gp'].includes(fileExtension)) {
            fileType = 'video';
          } else if (['zip', 'rar', '7z', 'tar'].includes(fileExtension)) {
            fileType = 'archive';
          } else if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'cs', 'html', 'css', 'json'].includes(fileExtension)) {
            fileType = 'code';
          } else if (item.startsWith("http://") || item.startsWith("https://")) {
            fileType = 'link';
          }

          // Get file size
          let fileSize = 0;
          try {
            const stats = fs.statSync(itemPath);
            fileSize = stats.size;
          } catch (err) {
            console.log(`Could not get size for file ${item}:`, err.message);
          }

          node.children.push({
            name: item,
            path: itemPath,
            type: fileType,
            isDirectory: false,
            size: fileSize,
            modifiedAt: itemStats.mtime,
            createdAt: itemStats.birthtime
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
    
    // Déterminer l'extension en fonction du type
    let fileName;
    let isOfficeDocument = false;
    
    switch (type) {
      case 'markdown':
        fileName = `${name}.md`;
        break;
      case 'text':
        fileName = `${name}.txt`;
        break;
      case 'doc':
        fileName = `${name}.doc`;
        isOfficeDocument = true;
        break;
      case 'docx':
        fileName = `${name}.docx`;
        isOfficeDocument = true;
        break;
      default:
        fileName = `${name}.txt`;
    }
    
    const fullPath = path.join(parentPath || rootPath, fileName);

    if (fs.existsSync(fullPath)) {
      console.log('note:create handler error: Note already exists');
      return { success: false, error: 'Note already exists' };
    }

    // Pour les documents Office, on crée un fichier vide minimal
    // OnlyOffice pourra ensuite l'éditer et créer le contenu approprié
    if (isOfficeDocument) {
      // Créer un fichier vide - OnlyOffice se chargera de créer la structure
      fs.writeFileSync(fullPath, '', 'binary');
      console.log(`note:create handler created empty Office document: ${fullPath}`);
    } else {
      // Pour .txt et .md, créer un fichier texte vide
      fs.writeFileSync(fullPath, '', 'utf-8');
      console.log(`note:create handler created text note: ${fullPath}`);
    }
    
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

// Handler pour créer un document
console.log('Registering document:create handler');
ipcMain.handle('document:create', async (_event, documentData) => {
  console.log('document:create handler called with:', documentData);
  try {
    const configPath = path.join(__dirname, 'config.json');
    if (!fs.existsSync(configPath)) {
      console.log('document:create handler error: Config not found');
      return { success: false, error: 'Config not found' };
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const rootPath = config.files?.rootPath;
    if (!rootPath) {
      console.log('document:create handler error: rootPath not set');
      return { success: false, error: 'rootPath not set' };
    }

    const { name, parentPath, tags, content, type, isBinary } = documentData;
    const fileName = name; // Use the provided name directly to preserve original extension
    const fullPath = path.join(parentPath || rootPath, fileName);
    console.log('Attempting to create document at:', fullPath);

    if (fs.existsSync(fullPath)) {
      console.log('document:create handler error: Document already exists');
      return { success: false, error: 'Document already exists' };
    }

    console.log('Writing document to:', fullPath, 'with content length:', content ? content.length : 0, 'isBinary:', isBinary);

    // Handle binary files (like PDFs) differently from text files
    if (isBinary) {
      // For binary files, write as binary data
      if (typeof content === 'string') {
        // If content is base64 string, convert to buffer
        const binaryData = Buffer.from(content, 'base64');
        fs.writeFileSync(fullPath, binaryData);
        console.log('Binary file written successfully');
      } else if (content instanceof ArrayBuffer) {
        // If content is ArrayBuffer, convert to Buffer
        const binaryData = Buffer.from(content);
        fs.writeFileSync(fullPath, binaryData);
        console.log('Binary file (ArrayBuffer) written successfully');
      } else if (content && typeof content === 'object' && content.type === 'Buffer') {
        // If content is a Buffer-like object from Node.js
        fs.writeFileSync(fullPath, Buffer.from(content.data));
        console.log('Binary file (Buffer) written successfully');
      } else {
        // Assume it's already a buffer or buffer-like
        fs.writeFileSync(fullPath, content);
        console.log('Binary file written successfully');
      }
    } else {
      // For text files, write as UTF-8
      fs.writeFileSync(fullPath, content || '', 'utf-8');
      console.log('Text file written successfully');
    }

    console.log('document:create handler returning success');
    return { success: true, path: fullPath };
  } catch (err) {
    console.log('document:create handler error:', err.message);
    return { success: false, error: err.message };
  }
});

// Handler pour créer un fichier audio
console.log('Registering audio:create handler');
ipcMain.handle('audio:create', async (_event, audioData) => {
  console.log('audio:create handler called with:', { ...audioData, content: audioData.content ? `[Binary data: ${audioData.content.byteLength || audioData.content.size || 0} bytes]` : 'none' });
  try {
    const configPath = path.join(__dirname, 'config.json');
    if (!fs.existsSync(configPath)) {
      console.log('audio:create handler error: Config not found');
      return { success: false, error: 'Config not found' };
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const rootPath = config.files?.rootPath;
    if (!rootPath) {
      console.log('audio:create handler error: rootPath not set');
      return { success: false, error: 'rootPath not set' };
    }

    const { name, type, parentPath, tags, content, isBinary } = audioData;
    
    // Use the provided name directly (which already includes timestamp and extension)
    const fileName = name.includes('.') ? name : `${name}.${type}`;
    const fullPath = path.join(parentPath || rootPath, fileName);

    console.log('[Audio Create] Full path:', fullPath);
    console.log('[Audio Create] Has content:', !!content);
    console.log('[Audio Create] Is binary:', isBinary);

    if (fs.existsSync(fullPath)) {
      console.log('audio:create handler error: Audio file already exists');
      return { success: false, error: 'Audio file already exists' };
    }

    // Ensure parent directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file content
    if (content && isBinary) {
      // Handle binary content (ArrayBuffer)
      let buffer;
      if (content instanceof ArrayBuffer || (typeof content === 'object' && content.byteLength !== undefined)) {
        buffer = Buffer.from(content);
      } else if (content.constructor && content.constructor.name === 'Uint8Array') {
        buffer = Buffer.from(content);
      } else if (Array.isArray(content)) {
        // Handle array of numbers (from ArrayBuffer conversion)
        buffer = Buffer.from(content);
      } else if (typeof content === 'object' && content.data) {
        // Handle Node Buffer-like objects with data property
        buffer = Buffer.from(content.data || content);
      } else {
        console.error('[Audio Create] Unknown content type:', typeof content, content.constructor?.name);
        buffer = Buffer.from(content);
      }
      
      console.log('[Audio Create] Writing binary data, size:', buffer.length);
      fs.writeFileSync(fullPath, buffer);
    } else {
      // Create empty file for manual audio creation
      fs.writeFileSync(fullPath, Buffer.alloc(0));
    }

    console.log('audio:create handler returning success');
    return { success: true, path: fullPath };
  } catch (err) {
    console.log('audio:create handler error:', err.message);
    return { success: false, error: err.message };
  }
});

// Handler pour créer un fichier code
console.log('Registering code:create handler');
ipcMain.handle('code:create', async (_event, codeData) => {
  console.log('code:create handler called with:', codeData);
  try {
    const configPath = path.join(__dirname, 'config.json');
    if (!fs.existsSync(configPath)) {
      console.log('code:create handler error: Config not found');
      return { success: false, error: 'Config not found' };
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const rootPath = config.files?.rootPath;
    if (!rootPath) {
      console.log('code:create handler error: rootPath not set');
      return { success: false, error: 'rootPath not set' };
    }

    const { name, type, parentPath, tags } = codeData;
    const fileName = `${name}.${type}`;
    const fullPath = path.join(parentPath || rootPath, fileName);

    if (fs.existsSync(fullPath)) {
      console.log('code:create handler error: Code file already exists');
      return { success: false, error: 'Code file already exists' };
    }

    fs.writeFileSync(fullPath, '', 'utf-8');
    console.log('code:create handler returning success');
    return { success: true, path: fullPath };
  } catch (err) {
    console.log('code:create handler error:', err.message);
    return { success: false, error: err.message };
  }
});

// Handler pour créer un fichier image
console.log('Registering image:create handler');
ipcMain.handle('image:create', async (_event, imageData) => {
  console.log('image:create handler called with:', imageData);
  try {
    const configPath = path.join(__dirname, 'config.json');
    if (!fs.existsSync(configPath)) {
      console.log('image:create handler error: Config not found');
      return { success: false, error: 'Config not found' };
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const rootPath = config.files?.rootPath;
    if (!rootPath) {
      console.log('image:create handler error: rootPath not set');
      return { success: false, error: 'rootPath not set' };
    }

    const { name, type, parentPath, tags, content, isBinary } = imageData;
    const fileName = `${name}.${type}`;
    const fullPath = path.join(parentPath || rootPath, fileName);
    console.log('Attempting to create image at:', fullPath);

    if (fs.existsSync(fullPath)) {
      console.log('image:create handler error: Image file already exists');
      return { success: false, error: 'Image file already exists' };
    }

    console.log('Writing image to:', fullPath, 'with content length:', content ? content.length : 0, 'isBinary:', isBinary);

    // Handle binary image files
    if (isBinary && content) {
      try {
        if (typeof content === 'string') {
          // If content is base64 string, convert to buffer
          const binaryData = Buffer.from(content, 'base64');
          fs.writeFileSync(fullPath, binaryData);
          console.log('Binary image file written successfully, size:', binaryData.length);
        } else if (content instanceof ArrayBuffer) {
          // If content is ArrayBuffer, convert to Buffer
          const binaryData = Buffer.from(content);
          fs.writeFileSync(fullPath, binaryData);
          console.log('Binary image file (ArrayBuffer) written successfully, size:', binaryData.length);
        } else if (content && typeof content === 'object' && content.type === 'Buffer') {
          // If content is a Buffer-like object from Node.js
          fs.writeFileSync(fullPath, Buffer.from(content.data));
          console.log('Binary image file (Buffer) written successfully');
        } else {
          // Assume it's already a buffer or buffer-like
          fs.writeFileSync(fullPath, content);
          console.log('Binary image file written successfully');
        }
      } catch (writeError) {
        console.error('Error writing binary image file:', writeError);
        return { success: false, error: `Failed to write image file: ${writeError.message}` };
      }
    } else {
      // For text-based formats or empty files, write as UTF-8
      fs.writeFileSync(fullPath, content || '', 'utf-8');
      console.log('Text image file written successfully');
    }

    console.log('image:create handler returning success');
    return { success: true, path: fullPath };
  } catch (err) {
    console.log('image:create handler error:', err.message);
    return { success: false, error: err.message };
  }
});

// Handler pour créer un fichier video
console.log('Registering video:create handler');
ipcMain.handle('video:create', async (_event, videoData) => {
  console.log('video:create handler called with:', videoData);
  try {
    const configPath = path.join(__dirname, 'config.json');
    if (!fs.existsSync(configPath)) {
      console.log('video:create handler error: Config not found');
      return { success: false, error: 'Config not found' };
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const rootPath = config.files?.rootPath;
    if (!rootPath) {
      console.log('video:create handler error: rootPath not set');
      return { success: false, error: 'rootPath not set' };
    }

    const { name, type, parentPath, tags, content, isBinary } = videoData;
    const fileName = `${name}.${type}`;
    const fullPath = path.join(parentPath || rootPath, fileName);
    console.log('Attempting to create video at:', fullPath);

    if (fs.existsSync(fullPath)) {
      console.log('video:create handler error: Video file already exists');
      return { success: false, error: 'Video file already exists' };
    }

    console.log('Writing video to:', fullPath, 'with content length:', content ? content.length : 0, 'isBinary:', isBinary);

    // Handle binary video files
    if (isBinary && content) {
      try {
        if (typeof content === 'string') {
          // If content is base64 string, convert to buffer
          const binaryData = Buffer.from(content, 'base64');
          fs.writeFileSync(fullPath, binaryData);
          console.log('Binary video file written successfully, size:', binaryData.length);
        } else if (content instanceof ArrayBuffer) {
          // If content is ArrayBuffer, convert to Buffer
          const binaryData = Buffer.from(content);
          fs.writeFileSync(fullPath, binaryData);
          console.log('Binary video file (ArrayBuffer) written successfully, size:', binaryData.length);
        } else if (content && typeof content === 'object' && content.type === 'Buffer') {
          // If content is a Buffer-like object from Node.js
          fs.writeFileSync(fullPath, Buffer.from(content.data));
          console.log('Binary video file (Buffer) written successfully');
        } else {
          // Assume it's already a buffer or buffer-like
          fs.writeFileSync(fullPath, content);
          console.log('Binary video file written successfully');
        }
      } catch (writeError) {
        console.error('Error writing binary video file:', writeError);
        return { success: false, error: `Failed to write video file: ${writeError.message}` };
      }
    } else {
      // For text-based formats or empty files, write as UTF-8
      fs.writeFileSync(fullPath, content || '', 'utf-8');
      console.log('Text video file written successfully');
    }

    console.log('video:create handler returning success');
    return { success: true, path: fullPath };
  } catch (err) {
    console.log('video:create handler error:', err.message);
    return { success: false, error: err.message };
  }
});

// Handler for camera access and video recording in Electron desktop app
console.log('Registering camera access handlers for Electron desktop app');

// Get available camera devices using Electron APIs
ipcMain.handle('camera:getDevices', async () => {
  try {
    console.log('Getting camera devices using Electron APIs...');

    // In Electron desktop app, we need to use different approaches:
    // 1. Use desktopCapturer for screen sharing
    // 2. Use system APIs for camera enumeration
    // 3. Use native modules for direct camera access

    const { desktopCapturer } = require('electron');

    // Get available sources (screens and windows)
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window']
    });

    // For camera devices, we'll return mock devices since direct camera access
    // in Electron main process is limited. The actual camera access will be
    // handled in the renderer process using browser APIs.
    const devices = [
      {
        deviceId: 'camera-0',
        label: 'Caméra principale',
        kind: 'videoinput',
        type: 'camera'
      },
      {
        deviceId: 'microphone-0',
        label: 'Microphone principal',
        kind: 'audioinput',
        type: 'microphone'
      }
    ];

    // Add screen capture devices
    sources.forEach((source, index) => {
      devices.push({
        deviceId: `screen-${index}`,
        label: source.name,
        kind: 'screen',
        type: 'screen',
        thumbnail: source.thumbnail.toDataURL()
      });
    });

    console.log('Found devices:', devices.length);
    return { success: true, devices };
  } catch (err) {
    console.error('Error getting camera devices:', err);
    return { success: false, error: err.message };
  }
});

// Request camera permission for Electron desktop app
ipcMain.handle('camera:requestPermission', async () => {
  try {
    console.log('Requesting camera permission for Electron desktop app...');

    // In Electron desktop app, camera permissions are handled differently:
    // 1. The app needs to be packaged and signed
    // 2. User needs to grant permissions in system settings
    // 3. We can show a dialog to guide the user

    const { dialog } = require('electron');

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Permission caméra requise',
      message: 'L\'application a besoin d\'accéder à votre caméra pour enregistrer des vidéos.',
      detail: 'Veuillez autoriser l\'accès à la caméra dans les paramètres système de votre ordinateur.',
      buttons: ['J\'ai compris', 'Ouvrir les paramètres'],
      defaultId: 0,
      cancelId: 0
    });

    if (result.response === 1) {
      // User wants to open settings - we can't directly open camera settings
      // but we can provide instructions
      console.log('User wants to open camera settings');
    }

    console.log('Camera permission dialog shown');
    return { success: true, message: 'Permission dialog shown' };
  } catch (err) {
    console.error('Error requesting camera permission:', err);
    return { success: false, error: err.message };
  }
});

// Start camera recording using Electron desktop APIs
ipcMain.handle('camera:startRecording', async (_event, options) => {
  try {
    console.log('Starting video recording with Electron desktop APIs:', options);

    // In Electron desktop app, we need to use different approaches:
    // 1. Use navigator.mediaDevices.getUserMedia in renderer process
    // 2. Use native modules for camera access
    // 3. Use system APIs for video capture

    const streamId = 'electron-recording-' + Date.now();
    console.log('Recording request acknowledged with stream ID:', streamId);

    return {
      success: true,
      streamId,
      message: 'Recording started using Electron desktop APIs',
      method: 'electron-desktop'
    };
  } catch (err) {
    console.error('Error starting recording:', err);
    return { success: false, error: err.message };
  }
});

// Stop camera recording using Electron desktop APIs
ipcMain.handle('camera:stopRecording', async (_event, streamId) => {
  try {
    console.log('Stopping video recording:', streamId);

    // The actual recording stop will be handled in the renderer process
    // This handler just acknowledges the request
    console.log('Recording stop request acknowledged');

    return { success: true, message: 'Recording stopped in renderer' };
  } catch (err) {
    console.error('Error stopping recording:', err);
    return { success: false, error: err.message };
  }
});

// Save recorded video data using Electron file system APIs
ipcMain.handle('camera:saveRecording', async (_event, videoData) => {
  try {
    console.log('Saving recorded video data using Electron APIs...');

    const { videoBlob, fileName, filePath } = videoData;

    // Convert blob to buffer and save to file using Electron's fs module
    const buffer = Buffer.from(await videoBlob.arrayBuffer());
    const fs = require('fs');
    const path = require('path');

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write video file
    fs.writeFileSync(filePath, buffer);
    console.log('Video file saved successfully using Electron APIs:', filePath);

    return { success: true, path: filePath };
  } catch (err) {
    console.error('Error saving recording:', err);
    return { success: false, error: err.message };
  }
});

// Get system camera information for Electron desktop app
ipcMain.handle('camera:getSystemInfo', async () => {
  try {
    console.log('Getting system camera information for Electron desktop app...');

    // Get comprehensive system information for Electron desktop app
    const systemInfo = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      hasCamera: true, // Assume camera is available in desktop app
      supportedFormats: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
      isElectronDesktop: true,
      appPath: app.getAppPath(),
      userDataPath: app.getPath('userData'),
      desktopCapturerAvailable: true,
      mediaDevicesAvailable: true
    };

    console.log('System info for Electron desktop app:', systemInfo);
    return { success: true, systemInfo };
  } catch (err) {
    console.error('Error getting system info:', err);
    return { success: false, error: err.message };
  }
});

// Check if camera is available in Electron desktop app
ipcMain.handle('camera:checkAvailability', async () => {
  try {
    console.log('Checking camera availability in Electron desktop app...');

    // In Electron desktop app, camera availability depends on:
    // 1. System hardware
    // 2. Driver support
    // 3. User permissions
    // 4. App packaging and signing

    const availability = {
      available: true, // Assume available in desktop app
      method: 'electron-desktop',
      requiresPermission: true,
      permissionStatus: 'unknown', // Will be checked in renderer
      message: 'Camera check initiated for Electron desktop app'
    };

    console.log('Camera availability check:', availability);
    return { success: true, ...availability };
  } catch (err) {
    console.error('Error checking camera availability:', err);
    return { success: false, available: false, error: err.message };
  }
});

// Get desktop capture sources (screens and windows)
ipcMain.handle('camera:getDesktopSources', async () => {
  try {
    console.log('Getting desktop capture sources...');

    const { desktopCapturer } = require('electron');

    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window']
    });

    const desktopSources = sources.map((source, index) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      type: 'desktop',
      display_id: source.display_id,
      index: index
    }));

    console.log('Found desktop sources:', desktopSources.length);
    return { success: true, sources: desktopSources };
  } catch (err) {
    console.error('Error getting desktop sources:', err);
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

// Handler pour vérifier l'existence d'un fichier avec fs.existsSync
ipcMain.handle('fs:exists', async (_event, filePath) => {
  try {
    const exists = fs.existsSync(filePath);
    return { success: true, exists };
  } catch (err) {
    return { success: false, error: err.message, exists: false };
  }
});

// Handler pour déplacer un fichier (copy + delete) using native fs functions
ipcMain.handle('fs:move', async (_event, oldPath, newPath) => {
  try {
    console.log('=== NATIVE FS MOVE OPERATION ===');
    console.log('Source path:', oldPath);
    console.log('Destination path:', newPath);

    // Use native fs functions directly
    if (!fs.existsSync(oldPath)) {
      console.log('Source file does not exist:', oldPath);
      return { success: false, error: 'Source file not found' };
    }

    // Ensure destination directory exists
    const destDir = path.dirname(newPath);
    console.log('Destination directory:', destDir);

    if (!fs.existsSync(destDir)) {
      console.log('Creating destination directory:', destDir);
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Check if destination already exists using native fs
    if (fs.existsSync(newPath)) {
      console.log('Destination file already exists:', newPath);
      return { success: false, error: 'Destination file already exists' };
    }

    // Step 1: Copy the file to destination using native fs
    console.log('Copying file using fs.copyFileSync...');
    fs.copyFileSync(oldPath, newPath);
    console.log('File copied successfully');

    // Step 2: Delete the original file using native fs
    console.log('Deleting original file using fs.unlinkSync...');
    fs.unlinkSync(oldPath);
    console.log('Original file deleted successfully');

    console.log('=== NATIVE FS MOVE COMPLETED ===');
    console.log('File moved successfully from', oldPath, 'to', newPath);
    return { success: true, newPath };
  } catch (err) {
    console.error('=== NATIVE FS MOVE ERROR ===');
    console.error('Error during file move:', err);
    return { success: false, error: err.message };
  }
});

// Handler pour lister le contenu d'un dossier avec fs.readdirSync
ipcMain.handle('fs:readdir', async (_event, dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      return { success: false, error: 'Directory not found' };
    }

    const items = fs.readdirSync(dirPath);
    return { success: true, items };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Handler pour supprimer un fichier avec fs.unlinkSync
ipcMain.handle('fs:unlink', async (_event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }

    fs.unlinkSync(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Handler pour créer un dossier avec fs.mkdirSync
ipcMain.handle('fs:mkdir', async (_event, dirPath) => {
  try {
    if (fs.existsSync(dirPath)) {
      return { success: false, error: 'Directory already exists' };
    }

    fs.mkdirSync(dirPath, { recursive: true });
    return { success: true, path: dirPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Handler to read file content (for videos, images, etc.)
ipcMain.handle('file:read', async (_event, filePath) => {
  try {
    console.log('[Electron] file:read called with:', filePath);
    if (!fs.existsSync(filePath)) {
      console.log('[Electron] File not found:', filePath);
      return { success: false, error: 'File not found' };
    }

    const content = fs.readFileSync(filePath);
    console.log('[Electron] File read successfully, size:', content.length);
    return { success: true, data: content };
  } catch (err) {
    console.error('[Electron] Error reading file:', err.message);
    return { success: false, error: err.message };
  }
});

// Handler to read PDF file content
ipcMain.handle('readPdfFile', async (_event, filePath) => {
  try {
    console.log('[Electron] readPdfFile called with:', filePath);
    if (!fs.existsSync(filePath)) {
      console.log('[Electron] PDF file not found:', filePath);
      return { success: false, error: 'PDF file not found' };
    }

    const content = fs.readFileSync(filePath);
    console.log('[Electron] PDF file read successfully, size:', content.length);
    return { success: true, data: content };
  } catch (err) {
    console.error('[Electron] Error reading PDF file:', err.message);
    return { success: false, error: err.message };
  }
});

// Handler pour ouvrir un fichier avec l'application externe par défaut
ipcMain.handle('file:openExternal', async (_event, filePath) => {
  try {
    console.log('[Electron] Opening file externally:', filePath);
    if (!fs.existsSync(filePath)) {
      console.log('[Electron] File not found:', filePath);
      return { success: false, error: 'File not found' };
    }

    const { shell } = require('electron');
    await shell.openPath(filePath);
    console.log('[Electron] File opened successfully with default application');
    return { success: true };
  } catch (err) {
    console.error('[Electron] Error opening file externally:', err.message);
    return { success: false, error: err.message };
  }
});

// Handler pour télécharger/copier un fichier
ipcMain.handle('file:download', async (_event, filePath, fileName) => {
  try {
    console.log('[Electron] Downloading file:', filePath);
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }

    const { dialog } = require('electron');
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Enregistrer sous',
      defaultPath: fileName,
      filters: [
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      fs.copyFileSync(filePath, result.filePath);
      console.log('[Electron] File downloaded to:', result.filePath);
      return { success: true, path: result.filePath };
    }

    return { success: false, error: 'Download canceled' };
  } catch (err) {
    console.error('[Electron] Error downloading file:', err.message);
    return { success: false, error: err.message };
  }
});

// Handler pour ouvrir une fenêtre audio séparée
ipcMain.handle('audio:openWindow', async (_event, audioPath) => {
  try {
    console.log('[Electron] Opening audio window for:', audioPath);
    
    // Create a new window for audio player
    const audioWindow = new BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 600,
      minHeight: 400,
      backgroundColor: '#18181b',
      title: 'Lecteur Audio - ' + path.basename(audioPath),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      autoHideMenuBar: true
    });

    // Load the audio player page with the file path as query param
    const isDev = !app.isPackaged;
    const baseUrl = isDev ? 'http://localhost:3000' : 'http://127.0.0.1:3000';
    const encodedPath = encodeURIComponent(audioPath);
    audioWindow.loadURL(`${baseUrl}/audio-player?audioPath=${encodedPath}`);

    // Open DevTools in development
    // Ne pas ouvrir les DevTools automatiquement

    console.log('[Electron] Audio window created successfully');
    return { success: true };
  } catch (err) {
    console.error('[Electron] Error opening audio window:', err.message);
    return { success: false, error: err.message };
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(async () => {
  console.log('[Electron] App is ready - starting embedded servers before creating window');

  // persistent simple main-process log file for diagnostics
  const logPath = path.join(app.getPath('userData'), 'main.log');
  function writeLog(line) {
    try {
      fs.appendFileSync(logPath, `${new Date().toISOString()} ${line}\n`);
    } catch (e) {
      console.error('Failed to write to main.log', e);
    }
  }

  writeLog('App ready - init servers');

  try {
    // Start servers sequentially and wait until they are listening
    await createNextServer();
    writeLog('Next static server started');

    await createFileServer();
    writeLog('File server started');

    // Once servers are ready, create the BrowserWindow
    createWindow();
  } catch (err) {
    console.error('[Electron] Error during server startup:', err);
    writeLog(`Error during server startup: ${err && err.message}`);
    // Still attempt to create window so user can see the error
    createWindow();
  }

  app.on('activate', function () {
    console.log('[Electron] App activated');
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
