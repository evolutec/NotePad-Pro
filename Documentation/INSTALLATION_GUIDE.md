# 🚀 Guide d'Installation - NotePad-Pro

Bienvenue dans NotePad-Pro ! Ce guide vous aidera à installer et configurer l'application.

## 📥 Installation

### Méthode 1 : Installation Complète (Recommandée)

1. **Téléchargez l'installateur**
   - Fichier : `NotePad-Pro-Setup-1.0.0.exe`
   - Taille : ~150 MB

2. **Exécutez l'installateur**
   - Double-cliquez sur le fichier `.exe`
   - Acceptez les droits administrateur (requis pour Docker)
   - Suivez les instructions à l'écran

3. **Configuration Docker & OnlyOffice**
   - À la fin de l'installation, un message vous demandera si vous voulez configurer Docker et OnlyOffice
   - **Choisissez "Oui"** pour une configuration automatique (recommandé)
   - Le processus peut prendre 15-20 minutes selon votre connexion internet

4. **Lancez l'application**
   - Double-cliquez sur l'icône NotePad-Pro sur votre bureau
   - Ou cherchez "NotePad-Pro" dans le menu démarrer

## 🐳 À Propos de Docker et OnlyOffice

### Pourquoi Docker ?

NotePad-Pro utilise Docker pour exécuter OnlyOffice Document Server, qui permet d'éditer des documents Word, Excel et PowerPoint directement dans l'application.

### Qu'est-ce qui est installé ?

L'installateur configure automatiquement :
- ✅ **Docker Desktop** : Plateforme de conteneurisation
- ✅ **OnlyOffice Document Server** : Serveur d'édition de documents
- ✅ **Configuration automatique** : Tout est prêt à l'emploi

### Configuration Système Requise

- **OS** : Windows 10/11 (64-bit)
- **RAM** : 8 GB minimum (16 GB recommandé)
- **Disque** : 10 GB d'espace libre
- **Processeur** : Compatible avec virtualisation (VT-x/AMD-V activé)

## ⚙️ Configuration Manuelle (Si Nécessaire)

Si vous avez choisi "Non" lors de l'installation ou si quelque chose ne fonctionne pas :

### Option 1 : Via le Menu Démarrer

1. Ouvrez le menu Démarrer
2. Cherchez "NotePad-Pro"
3. Cliquez sur "Configuration Docker & OnlyOffice"
4. Suivez les instructions

### Option 2 : Commande PowerShell

```powershell
# Ouvrez PowerShell en tant qu'administrateur
cd "C:\Program Files\NotePad-Pro\resources\installer\scripts"
.\Post-Install.ps1 -InstallDir "C:\Program Files\NotePad-Pro"
```

## 🔧 Vérification de l'Installation

### Vérifier Docker

```powershell
docker --version
docker ps
```

Vous devriez voir le conteneur `onlyoffice-documentserver` en cours d'exécution.

### Vérifier OnlyOffice

Ouvrez votre navigateur et allez à : http://localhost:8000

Vous devriez voir la page OnlyOffice Document Server.

## 🎯 Première Utilisation

1. **Lancez NotePad-Pro**
2. **Créez votre premier dossier**
   - Cliquez sur le bouton "+" dans la sidebar
   - Choisissez "Nouveau Dossier"
3. **Créez votre première note**
   - Cliquez sur l'icône de document
   - Choisissez le type de fichier
4. **Explorez les fonctionnalités !**

## 📚 Fonctionnalités Principales

### Types de Fichiers Supportés

- 📝 **Notes** : Markdown, texte brut
- 🎨 **Dessins** : Canvas de dessin intégré
- 📄 **Documents** : Word (.docx), PDF
- 📊 **Tableurs** : Excel (.xlsx)
- 📽️ **Présentations** : PowerPoint (.pptx)
- 🖼️ **Images** : PNG, JPG, GIF, SVG
- 🎥 **Vidéos** : MP4, WebM, AVI, MKV
- 🎵 **Audio** : MP3, WAV, OGG, FLAC
- 💻 **Code** : JavaScript, Python, etc.

### Fonctionnalités Clés

- ✅ Organisation par dossiers avec drag & drop
- ✅ Édition de documents Office en ligne
- ✅ Gestion des conflits de fichiers
- ✅ Interface moderne et intuitive
- ✅ Thème clair/sombre
- ✅ Recherche rapide
- ✅ Fichiers récents

## 🐛 Dépannage

### Docker ne démarre pas

**Problème** : "Docker Desktop n'est pas en cours d'exécution"

**Solutions** :
1. Cherchez "Docker Desktop" dans le menu Démarrer et lancez-le
2. Attendez 1-2 minutes qu'il démarre complètement
3. Relancez NotePad-Pro

### OnlyOffice ne fonctionne pas

**Problème** : Impossible d'éditer des documents Word/Excel/PowerPoint

**Solutions** :
1. Vérifiez que Docker Desktop est en cours d'exécution
2. Ouvrez PowerShell en tant qu'administrateur :
   ```powershell
   docker ps
   ```
3. Si vous ne voyez pas `onlyoffice-documentserver`, relancez la configuration :
   ```powershell
   cd "C:\Program Files\NotePad-Pro\resources\installer\scripts"
   .\Post-Install.ps1
   ```

### Port 8000 déjà utilisé

**Problème** : "Le port 8000 est déjà utilisé"

**Solutions** :
1. Identifiez l'application utilisant le port :
   ```powershell
   netstat -ano | findstr :8000
   ```
2. Arrêtez l'application ou modifiez la configuration OnlyOffice

### L'application ne se lance pas

**Solutions** :
1. Vérifiez les droits administrateur
2. Désactivez temporairement l'antivirus
3. Réinstallez l'application

## 🔄 Mise à Jour

1. Téléchargez la dernière version
2. Désinstallez l'ancienne version (gardez "Oui" pour conserver les données)
3. Installez la nouvelle version
4. Les conteneurs Docker et vos fichiers seront conservés

## 🗑️ Désinstallation

### Via Panneau de Configuration

1. Ouvrez le Panneau de Configuration
2. Cliquez sur "Programmes et fonctionnalités"
3. Trouvez "NotePad-Pro"
4. Cliquez sur "Désinstaller"
5. Choisissez si vous voulez supprimer les conteneurs Docker

### Désinstallation Complète

```powershell
# Supprimer l'application
# Utilisez le désinstalleur depuis le menu Démarrer

# Supprimer les conteneurs Docker (optionnel)
docker stop onlyoffice-documentserver
docker rm onlyoffice-documentserver
docker rmi onlyoffice/documentserver

# Désinstaller Docker Desktop (optionnel)
# Via Panneau de Configuration > Programmes et fonctionnalités
```

## 📞 Support

### Obtenir de l'Aide

- **Documentation** : Consultez les guides dans le dossier Documentation/
- **Issues GitHub** : https://github.com/evolutec/NotePad-Pro/issues
- **Email** : support@notepad-pro.com

### Rapporter un Bug

1. Collectez les informations :
   - Version de NotePad-Pro
   - Version de Windows
   - Message d'erreur
   - Steps pour reproduire
2. Créez une issue sur GitHub avec ces informations

## 📄 Licence

NotePad-Pro est distribué sous licence MIT.

---

**Version** : 1.0.0
**Dernière mise à jour** : 10 novembre 2025

Merci d'utiliser NotePad-Pro ! 🎉
