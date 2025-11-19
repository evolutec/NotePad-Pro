# 🚀 Guide de Build - Installateur Windows NotePad-Pro

Ce guide explique comment créer l'installateur Windows (.exe) de NotePad-Pro qui installe automatiquement l'application, Docker et OnlyOffice Document Server.

## 📋 Vue d'ensemble

L'installateur créé effectue automatiquement :

1. ✅ **Installation de NotePad-Pro** sur le système
2. ✅ **Vérification et installation de Docker Desktop** si nécessaire
3. ✅ **Déploiement d'OnlyOffice Document Server** avec configuration optimale
4. ✅ **Création de raccourcis intelligents** qui vérifient Docker/OnlyOffice avant de lancer l'app
5. ✅ **Lancement automatique** de l'application après installation

## 🛠️ Prérequis pour builder

### Logiciels requis

1. **Node.js** (v18 ou supérieur)
2. **npm** ou **pnpm**
3. **Windows 10/11** (pour builder l'installateur Windows)
4. **Electron Builder** (installé automatiquement via npm)

### Installation des dépendances

```powershell
# Installer electron-builder
npm install --save-dev electron-builder

# Ou avec npm
npm install --save-dev electron-builder
```

## 📦 Structure de l'installateur

```
note-taking-app/
├── electron-builder.json          # Configuration de l'installateur
├── build/
│   ├── installer.nsh              # Script NSIS personnalisé
│   └── icon.ico                   # Icône de l'application (à créer)
├── installer/
│   ├── scripts/
│   │   ├── Post-Install.ps1       # Configuration après installation
│   │   ├── Launch-App.ps1         # Lancement avec vérifications
│   │   ├── Install-Docker.ps1     # Installation Docker
│   │   └── Deploy-OnlyOffice.ps1  # Déploiement OnlyOffice
│   └── docker/
│       └── local.json             # Configuration SSRF OnlyOffice
└── package.json                   # Scripts de build
```

## 🎯 Créer l'installateur

### Méthode 1 : Build complet (Recommandé)

Crée l'installateur .exe dans le dossier `dist/` :

```powershell
npm run electron:build
```

Cette commande :
1. Build l'application Next.js
2. Package l'application Electron
3. Crée l'installateur NSIS (.exe)
4. Inclut tous les scripts d'installation

### Méthode 2 : Build sans compression (Plus rapide)

Pour tester rapidement sans créer l'installateur :

```powershell
npm run electron:build:dir
```

Crée un répertoire non compressé dans `dist/win-unpacked/`

### Méthode 3 : Build avec electron-builder directement

```powershell
# Build pour Windows
npx electron-builder build --win --x64

# Build pour Windows avec options
npx electron-builder build --win --x64 --publish never
```

## 📂 Créer l'icône de l'application

### Prérequis
- Fichier PNG haute résolution (512x512px minimum)

### Conversion en .ico

**Option 1 : Outil en ligne**
1. Allez sur https://convertio.co/png-ico/
2. Uploadez votre PNG
3. Téléchargez le fichier .ico
4. Placez-le dans `public/icon.ico`

**Option 2 : ImageMagick**
```powershell
# Installer ImageMagick
choco install imagemagick

# Convertir
magick convert icon.png -define icon:auto-resize=256,128,64,48,32,16 public/icon.ico
```

**Option 3 : Créer une icône par défaut**
```powershell
# Si vous n'avez pas d'icône, utilisez celle d'Electron
# Le build utilisera l'icône par défaut d'Electron
```

## 🔧 Configuration de l'installateur

### electron-builder.json

```json
{
  "appId": "com.notepadpro.app",
  "productName": "NotePad-Pro",
  "win": {
    "target": "nsis",
    "icon": "public/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "perMachine": true,
    "allowElevation": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  }
}
```

### Scripts inclus dans l'installateur

Les scripts PowerShell sont automatiquement inclus via `extraResources` :

- ✅ `Post-Install.ps1` - Exécuté après l'installation
- ✅ `Launch-App.ps1` - Vérifie Docker/OnlyOffice avant de lancer
- ✅ `Install-Docker.ps1` - Installe Docker Desktop
- ✅ `Deploy-OnlyOffice.ps1` - Déploie OnlyOffice
- ✅ `local.json` - Configuration SSRF

## 🚀 Processus de build détaillé

### 1. Préparation

```powershell
# Nettoyer les anciens builds
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# Vérifier que tous les fichiers sont présents
Get-ChildItem -Recurse installer/
```

### 2. Build de l'application Next.js

```powershell
npm run build
# Crée le dossier .next/ avec l'application compilée
```

### 3. Build de l'installateur Electron

```powershell
npm run electron:build
```

**Ce qui se passe :**

1. **Packaging Electron**
   - Copie l'application dans le bundle Electron
   - Inclut les dépendances Node.js nécessaires
   - Exclut les fichiers de développement

2. **Inclusion des ressources**
   - Copie les scripts PowerShell dans `resources/installer/`
   - Inclut la configuration OnlyOffice

3. **Création de l'installateur NSIS**
   - Génère l'installateur .exe
   - Intègre le script `installer.nsh` personnalisé
   - Configure les raccourcis avec PowerShell

4. **Signature (optionnel)**
   - Si un certificat est configuré, signe l'installateur

### 4. Résultat

L'installateur est créé dans :
```
dist/
└── NotePad-Pro-Setup-1.0.0.exe
```

## 📋 Tester l'installateur

### Test local

1. **Exécuter l'installateur**
   ```powershell
   .\dist\NotePad-Pro-Setup-1.0.0.exe
   ```

2. **Suivre l'installation**
   - Choisir le répertoire d'installation
   - Accepter les raccourcis
   - Attendre la fin

3. **Configuration post-installation**
   - Une fenêtre PowerShell s'ouvre
   - Choix d'installer Docker si nécessaire
   - Configuration d'OnlyOffice

4. **Lancement de l'application**
   - Double-cliquer sur le raccourci bureau
   - Ou depuis le menu Démarrer

### Vérifications

✅ **Installation de l'application**
```powershell
# Vérifier l'installation
Test-Path "$env:ProgramFiles\NotePad-Pro\NotePad-Pro.exe"
```

✅ **Scripts inclus**
```powershell
# Vérifier les scripts
Get-ChildItem "$env:ProgramFiles\NotePad-Pro\resources\installer\scripts"
```

✅ **Raccourcis créés**
```powershell
# Vérifier les raccourcis
Test-Path "$env:USERPROFILE\Desktop\NotePad-Pro.lnk"
Test-Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\NotePad-Pro\NotePad-Pro.lnk"
```

## 🔄 Workflow de lancement

Quand l'utilisateur double-clique sur le raccourci :

1. **`Launch-App.ps1` s'exécute**
   - Vérifie si Docker est installé
   - Vérifie si Docker fonctionne
   - Démarre Docker si nécessaire

2. **Vérification OnlyOffice**
   - Vérifie si OnlyOffice est déployé
   - Propose de le déployer si nécessaire
   - Exécute `Deploy-OnlyOffice.ps1`

3. **Lancement de l'application**
   - Lance `NotePad-Pro.exe`
   - L'application a accès à OnlyOffice

## 🛠️ Dépannage du build

### Erreur : "Cannot find module 'electron-builder'"

**Solution :**
```powershell
npm install --save-dev electron-builder
```

### Erreur : "NSIS installer.nsh not found"

**Solution :**
```powershell
# Vérifier que le fichier existe
Test-Path build/installer.nsh

# Si absent, recréer le dossier build
New-Item -ItemType Directory -Force build
```

### Erreur : "Icon file not found"

**Solution :**
```powershell
# Option 1 : Créer une icône
# Placez icon.ico dans public/

# Option 2 : Désactiver l'icône temporairement
# Dans electron-builder.json, commentez la ligne "icon"
```

### Build très lent

**Optimisations :**

1. **Exclure node_modules**
   ```json
   "files": [
     "**/*",
     "!node_modules/**/*"
   ]
   ```

2. **Build sans compression**
   ```powershell
   npm run electron:build:dir
   ```

3. **Désactiver Asar**
   ```json
   "asar": false
   ```

### Erreur : "Application won't start after install"

**Diagnostic :**
```powershell
# Vérifier les logs Electron
Get-Content "$env:APPDATA\NotePad-Pro\logs\main.log"

# Lancer en mode debug
& "$env:ProgramFiles\NotePad-Pro\NotePad-Pro.exe" --enable-logging
```

## 📦 Distribution

### Préparer la release

1. **Mettre à jour la version**
   ```json
   // package.json
   "version": "1.0.0"
   ```

2. **Build final**
   ```powershell
   npm run electron:build
   ```

3. **Tester l'installateur**
   - Sur une machine vierge si possible
   - Vérifier toutes les fonctionnalités

4. **Créer les checksums**
   ```powershell
   Get-FileHash .\dist\NotePad-Pro-Setup-1.0.0.exe -Algorithm SHA256 | Select-Object Hash
   ```

### Options de distribution

**Option 1 : GitHub Releases**
```powershell
# Upload sur GitHub Releases
# L'installateur sera disponible pour téléchargement
```

**Option 2 : Site web**
```powershell
# Héberger sur votre serveur web
# Fournir un lien de téléchargement
```

**Option 3 : Microsoft Store**
- Nécessite un compte développeur Microsoft
- Processus de soumission et certification

## 🔐 Signature de l'installateur (Optionnel)

### Pourquoi signer ?

- ✅ Évite l'avertissement Windows SmartScreen
- ✅ Augmente la confiance des utilisateurs
- ✅ Obligatoire pour Microsoft Store

### Obtenir un certificat

1. **Acheter un certificat Code Signing**
   - DigiCert, Sectigo, GlobalSign
   - ~200-400€ par an

2. **Configurer electron-builder**
   ```json
   "win": {
     "certificateFile": "path/to/certificate.pfx",
     "certificatePassword": "password"
   }
   ```

3. **Variables d'environnement**
   ```powershell
   $env:CSC_LINK = "path/to/certificate.pfx"
   $env:CSC_KEY_PASSWORD = "password"
   ```

## 📊 Tailles attendues

- **Application packagée** : ~300-500 MB
- **Installateur .exe** : ~200-300 MB (compressé)
- **Installation complète** : ~600-800 MB

## ✅ Checklist avant distribution

- [ ] Version mise à jour dans package.json
- [ ] Icône de l'application créée
- [ ] Build réussi sans erreurs
- [ ] Installateur testé sur machine vierge
- [ ] Docker s'installe correctement
- [ ] OnlyOffice se déploie correctement
- [ ] Application se lance sans erreurs
- [ ] Tous les raccourcis fonctionnent
- [ ] Désinstallation fonctionne
- [ ] Checksums SHA256 générés
- [ ] Notes de version rédigées

## 🆘 Support

En cas de problème lors du build :

1. **Vérifier les logs**
   ```powershell
   # Logs electron-builder
   $env:DEBUG = "electron-builder"
   npm run electron:build
   ```

2. **Nettoyer et rebuild**
   ```powershell
   Remove-Item -Recurse -Force dist, .next, node_modules
   npm install
   npm run electron:build
   ```

3. **Consulter la documentation**
   - [Electron Builder](https://www.electron.build/)
   - [NSIS Documentation](https://nsis.sourceforge.io/Docs/)

## 🎉 Félicitations !

Une fois le build réussi, vous avez créé un installateur Windows professionnel qui :

- ✅ Installe votre application en un clic
- ✅ Configure automatiquement Docker
- ✅ Déploie OnlyOffice avec les bonnes configurations
- ✅ Lance l'application prête à l'emploi

**Pour distribuer :**
1. Uploadez `NotePad-Pro-Setup-1.0.0.exe` sur GitHub Releases
2. Partagez le lien de téléchargement
3. Les utilisateurs n'ont qu'à lancer l'installateur !

---

**Version :** 1.0  
**Date :** Novembre 2024  
**Auteur :** NotePad-Pro Team
