# 📦 Guide de Build de l'Installateur NotePad-Pro

Ce guide explique comment créer l'installateur Windows de NotePad-Pro avec Docker et OnlyOffice Document Server intégrés.

## 🎯 Prérequis

- Node.js 18+ installé
- pnpm installé (`npm install -g pnpm`)
- Windows 10/11
- Droits administrateur

## 📋 Structure de l'Installateur

L'installateur inclut :
- ✅ Application NotePad-Pro
- ✅ Scripts d'installation automatique de Docker Desktop
- ✅ Scripts de déploiement d'OnlyOffice Document Server
- ✅ Configuration automatique au premier lancement
- ✅ Icônes et ressources

## 🚀 Étapes de Build

### 1. Préparer l'environnement

```powershell
# Cloner le repository
git clone https://github.com/evolutec/NotePad-Pro.git
cd NotePad-Pro

# Installer les dépendances
pnpm install
```

### 2. Build de l'application Next.js

```powershell
# Build de l'application
pnpm run build
```

### 3. Build de l'installateur Electron

```powershell
# Créer l'installateur Windows
pnpm run build:electron

# OU avec npm
npm run build:electron
```

Le fichier `.exe` sera créé dans le dossier `dist/`.

## 📝 Configuration de l'Installateur

### electron-builder.json

```json
{
  "appId": "com.notepad.pro",
  "productName": "NotePad-Pro",
  "win": {
    "icon": "public/icon.ico",
    "requestedExecutionLevel": "requireAdministrator"
  },
  "nsis": {
    "oneClick": false,
    "perMachine": true,
    "allowElevation": true,
    "installerIcon": "public/icon.ico",
    "uninstallerIcon": "public/icon.ico"
  }
}
```

### Scripts Inclus

1. **Post-Install.ps1** : Configuration automatique après installation
   - Vérifie Docker
   - Installe Docker si nécessaire
   - Déploie OnlyOffice Document Server

2. **Launch-App.ps1** : Script de lancement avec vérifications
   - Vérifie que Docker est en cours d'exécution
   - Démarre OnlyOffice si nécessaire
   - Lance l'application

## 🎨 Icônes Utilisées

Les icônes suivantes depuis le dossier `public/` :
- `icon.ico` : Icône principale (16x16, 32x32, 48x48, 256x256)
- `icon-512.png` : Image de sidebar de l'installateur
- `favicon.ico` : Favicon de l'application

## 🔧 Personnalisation

### Modifier le nom du produit

Dans `electron-builder.json` :
```json
{
  "productName": "VotreNom"
}
```

### Modifier les icônes

Remplacez les fichiers dans `public/` :
- `icon.ico` : Icône Windows multi-résolution
- `icon-512.png` : Image 512x512 pour le sidebar

### Modifier la configuration Docker/OnlyOffice

Dans `installer/docker/docker-compose.yml` :
```yaml
services:
  onlyoffice:
    image: onlyoffice/documentserver:latest
    ports:
      - "8000:80"  # Modifier le port ici si nécessaire
    environment:
      - JWT_ENABLED=false  # Activer/désactiver JWT
```

## 📦 Contenu de l'Installateur

L'installateur créé (`NotePad-Pro-Setup-X.X.X.exe`) contient :

```
NotePad-Pro/
├── NotePad-Pro.exe (Application principale)
├── resources/
│   ├── installer/
│   │   ├── scripts/
│   │   │   ├── Post-Install.ps1
│   │   │   ├── Launch-App.ps1
│   │   │   ├── install-docker.ps1
│   │   │   └── deploy-onlyoffice.ps1
│   │   └── docker/
│   │       └── docker-compose.yml
│   └── icons/
│       ├── icon.ico
│       └── icon-512.png
└── Uninstall NotePad-Pro.exe
```

## 🎯 Processus d'Installation

Lorsque l'utilisateur lance l'installateur :

1. **Installation de l'application** : Copie des fichiers vers `C:\Program Files\NotePad-Pro\`

2. **Création des raccourcis** :
   - Bureau : `NotePad-Pro.lnk`
   - Menu Démarrer : `NotePad-Pro\NotePad-Pro.lnk`
   - Configuration : `NotePad-Pro\Configuration Docker & OnlyOffice.lnk`

3. **Proposition de configuration** :
   - Message demandant si l'utilisateur veut configurer Docker/OnlyOffice
   - Si Oui : Lancement automatique du script Post-Install.ps1
   - Si Non : Configuration possible plus tard via le menu démarrer

4. **Configuration Docker** (si acceptée) :
   - Vérifie si Docker est installé
   - Télécharge et installe Docker Desktop si nécessaire
   - Démarre Docker Desktop
   - Attend que Docker soit opérationnel

5. **Configuration OnlyOffice** :
   - Télécharge l'image OnlyOffice Document Server
   - Crée et démarre le conteneur
   - Configure le port 8000
   - Vérifie que le serveur est opérationnel

6. **Finalisation** :
   - Création du fichier `config.json`
   - L'application est prête à être lancée

## 🐛 Dépannage

### L'installateur ne se lance pas
- Vérifiez que vous avez les droits administrateur
- Désactivez temporairement l'antivirus

### Docker ne s'installe pas
- Téléchargez manuellement Docker Desktop : https://www.docker.com/products/docker-desktop
- Relancez le script "Configuration Docker & OnlyOffice" depuis le menu démarrer

### OnlyOffice ne démarre pas
- Vérifiez que Docker Desktop est en cours d'exécution
- Ouvrez PowerShell en tant qu'administrateur et exécutez :
  ```powershell
  docker ps -a
  docker logs onlyoffice-documentserver
  ```

### Port 8000 déjà utilisé
- Modifiez le port dans le script ou arrêtez l'application utilisant le port 8000

## 📞 Support

Pour toute question ou problème :
- GitHub Issues : https://github.com/evolutec/NotePad-Pro/issues
- Email : support@notepad-pro.com

## 📄 Licence

NotePad-Pro est distribué sous licence MIT.

---

**Dernière mise à jour** : 10 novembre 2025
**Version** : 1.0.0
