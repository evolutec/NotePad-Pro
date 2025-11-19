# 🧪 Guide de Test de l'Installeur Windows - NotePad-Pro

Ce guide détaille toutes les étapes pour tester l'installeur Windows et s'assurer qu'il fonctionne parfaitement sur Windows 11.

## 📋 Table des matières

1. [Préparation avant le test](#préparation-avant-le-test)
2. [Processus de build de l'installeur](#processus-de-build-de-linstalleur)
3. [Tests de l'installation](#tests-de-linstallation)
4. [Tests de configuration](#tests-de-configuration)
5. [Tests fonctionnels](#tests-fonctionnels)
6. [Tests de désinstallation](#tests-de-désinstallation)
7. [Checklist de validation](#checklist-de-validation)

---

## 🔧 Préparation avant le test

### 1. Environnement de test recommandé

Pour des tests optimaux, utilisez :
- **Machine virtuelle Windows 11** (propre, sans Docker pré-installé)
- Ou **Machine physique** avec capacité de restauration système
- **Minimum 8 GB RAM** et **50 GB d'espace disque libre**

### 2. Nettoyer l'environnement de développement

```powershell
# Supprimer les anciens builds
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Supprimer config.json de test
Remove-Item config.json -ErrorAction SilentlyContinue

# Vérifier que toutes les dépendances sont à jour
npm install
```

### 3. Vérifier la structure des fichiers

```powershell
# Vérifier que tous les fichiers nécessaires existent
Test-Path .\electron-builder.json
Test-Path .\build\installer.nsh
Test-Path .\installer\scripts\Post-Install.ps1
Test-Path .\installer\scripts\Launch-App.ps1
Test-Path .\installer\scripts\Install-Docker.ps1
Test-Path .\installer\scripts\Deploy-OnlyOffice.ps1
Test-Path .\installer\docker\local.json

# Tous devraient retourner True
```

---

## 🏗️ Processus de build de l'installeur

### 1. Build de l'application Next.js

```powershell
# Build de Next.js
npm run build

# Vérifier que le build est réussi
Test-Path .\.next\BUILD_ID
```

**Résultat attendu :**
- ✅ Build terminé sans erreur
- ✅ Dossier `.next` créé avec tous les fichiers
- ✅ Pas d'erreurs critiques (warnings acceptables)

### 2. Création de l'installeur

```powershell
# Créer l'installeur NSIS
npm run electron:build

# Ou pour un build plus rapide en développement
# npm run electron:build:dir
```

**Durée estimée :** 3-5 minutes

**Résultat attendu :**
- ✅ Installeur créé dans `dist\Fusion-Setup-1.0.0.exe`
- ✅ Taille approximative : 200-350 MB
- ✅ Aucune erreur critique

### 3. Vérifier l'installeur créé

```powershell
# Vérifier que l'installeur existe
$installerPath = ".\dist\Fusion-Setup-1.0.0.exe"
if (Test-Path $installerPath) {
    $size = (Get-Item $installerPath).Length / 1MB
    Write-Host "✓ Installeur créé : $([math]::Round($size, 2)) MB" -ForegroundColor Green
    
    # Calculer le hash SHA256
    $hash = Get-FileHash $installerPath -Algorithm SHA256
    Write-Host "✓ SHA256 : $($hash.Hash)" -ForegroundColor Green
} else {
    Write-Host "✗ Installeur introuvable!" -ForegroundColor Red
}
```

---

## 💿 Tests de l'installation

### Test 1 : Installation basique

#### Étapes :

1. **Copier l'installeur** sur la machine de test
2. **Exécuter** `Fusion-Setup-1.0.0.exe` en tant qu'administrateur
3. **Suivre l'assistant d'installation**

#### Vérifications :

- [ ] L'installeur se lance sans erreur
- [ ] La fenêtre d'installation s'affiche correctement
- [ ] Le choix de répertoire d'installation est proposé
- [ ] La progression s'affiche correctement
- [ ] Aucune erreur Windows Defender/SmartScreen (ou gérée correctement)

#### Répertoire d'installation par défaut :
```
C:\Program Files\Fusion\
```

### Test 2 : Configuration post-installation

Après l'installation, une fenêtre PowerShell s'ouvre automatiquement.

#### Vérifications :

**Étape 1 - Configuration du dossier de notes :**

- [ ] Le script demande de choisir un dossier de stockage
- [ ] Un chemin par défaut est proposé : `C:\Users\[USERNAME]\Documents\Notes`
- [ ] On peut choisir "O" pour utiliser le défaut
- [ ] On peut choisir "N" pour spécifier un autre chemin
- [ ] Le dossier est créé automatiquement s'il n'existe pas
- [ ] Message de confirmation du dossier créé

**Résultat attendu :**
```
✓ Dossier créé: C:\Users\[USERNAME]\Documents\Notes
✓ Configuration sauvegardée: C:\Program Files\Fusion\config.json
```

**Étape 2 - Configuration Docker :**

- [ ] Le script vérifie si Docker est installé
- [ ] Si absent : proposition d'installer Docker Desktop
- [ ] Si présent mais arrêté : proposition de démarrer Docker
- [ ] Si présent et démarré : passage à OnlyOffice

**Étape 3 - Configuration OnlyOffice :**

- [ ] Si Docker fonctionne : proposition de déployer OnlyOffice
- [ ] Téléchargement de l'image Docker OnlyOffice
- [ ] Déploiement du conteneur avec la bonne configuration
- [ ] Message de succès

### Test 3 : Vérification des fichiers installés

```powershell
$installDir = "$env:ProgramFiles\Fusion"

# Vérifier l'exécutable principal
Test-Path "$installDir\Fusion.exe"

# Vérifier les scripts d'installation
Test-Path "$installDir\resources\installer\scripts\Post-Install.ps1"
Test-Path "$installDir\resources\installer\scripts\Launch-App.ps1"
Test-Path "$installDir\resources\installer\scripts\Install-Docker.ps1"
Test-Path "$installDir\resources\installer\scripts\Deploy-OnlyOffice.ps1"

# Vérifier la configuration OnlyOffice
Test-Path "$installDir\resources\installer\docker\local.json"

# Vérifier le fichier config.json créé
Test-Path "$installDir\config.json"
```

**Tous devraient retourner `True`**

### Test 4 : Vérification des raccourcis

```powershell
# Raccourci Bureau
Test-Path "$env:USERPROFILE\Desktop\Fusion.lnk"

# Raccourci Menu Démarrer
Test-Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Fusion\Fusion.lnk"
```

**Les deux devraient retourner `True`**

---

## ⚙️ Tests de configuration

### Test 5 : Validation du fichier config.json

```powershell
# Lire la configuration créée
$configPath = "$env:ProgramFiles\Fusion\config.json"
$config = Get-Content $configPath | ConvertFrom-Json

# Vérifier la structure
$config.files.rootPath
$config.app.theme
$config.app.language
```

**Vérifications :**
- [ ] `rootPath` pointe vers le dossier choisi
- [ ] `autoSave` est à `true`
- [ ] `theme` est à `"system"`
- [ ] `language` est à `"fr"`

### Test 6 : Validation du dossier de notes

```powershell
# Vérifier que le dossier existe
$notesPath = $config.files.rootPath
Test-Path $notesPath

# Vérifier les permissions d'écriture
try {
    $testFile = Join-Path $notesPath "test.txt"
    "test" | Out-File $testFile
    Remove-Item $testFile
    Write-Host "✓ Permissions d'écriture OK" -ForegroundColor Green
} catch {
    Write-Host "✗ Impossible d'écrire dans le dossier" -ForegroundColor Red
}
```

---

## 🚀 Tests fonctionnels

### Test 7 : Premier lancement de l'application

#### Via raccourci bureau :

1. Double-cliquer sur le raccourci `Fusion` sur le bureau
2. Le script `Launch-App.ps1` s'exécute en arrière-plan
3. L'application démarre

#### Vérifications :

- [ ] Une fenêtre PowerShell peut s'afficher brièvement (vérification Docker)
- [ ] L'application Fusion se lance
- [ ] L'interface s'affiche correctement
- [ ] Aucune erreur de configuration

### Test 8 : Vérification Docker et OnlyOffice

```powershell
# Vérifier que Docker fonctionne
docker ps

# Vérifier qu'OnlyOffice est en cours d'exécution
docker ps --filter "name=onlyoffice-documentserver"
```

**Résultat attendu :**
```
CONTAINER ID   IMAGE                                  STATUS
xxxxxxxxxxxxx  onlyoffice/documentserver:latest      Up X minutes
```

### Test 9 : Test des fonctionnalités principales

Dans l'application lancée :

#### 9.1 - Création de dossiers
- [ ] Cliquer sur "Nouveau dossier"
- [ ] Entrer un nom
- [ ] Le dossier apparaît dans l'arborescence
- [ ] Le dossier physique est créé dans `rootPath`

#### 9.2 - Création de notes
- [ ] Créer une note texte
- [ ] Écrire du contenu
- [ ] Sauvegarder
- [ ] Vérifier que le fichier `.txt` ou `.md` existe dans le dossier

#### 9.3 - Édition de documents Office
- [ ] Créer un document Word (.docx)
- [ ] OnlyOffice s'ouvre dans l'application
- [ ] Éditer le document
- [ ] Sauvegarder
- [ ] Fermer et rouvrir : le contenu est conservé

#### 9.4 - Test des médias
- [ ] Ajouter une image
- [ ] L'image s'affiche correctement
- [ ] Ajouter un fichier audio
- [ ] Le lecteur audio fonctionne
- [ ] Ajouter une vidéo
- [ ] Le lecteur vidéo fonctionne

### Test 10 : Test de redémarrage

1. **Fermer l'application**
2. **Relancer** via le raccourci
3. **Vérifier** que :
   - [ ] Les dossiers créés sont toujours là
   - [ ] Les notes sont accessibles
   - [ ] OnlyOffice fonctionne toujours
   - [ ] Aucune perte de données

---

## 🗑️ Tests de désinstallation

### Test 11 : Désinstallation propre

#### Étapes :

1. **Ouvrir** Paramètres Windows → Applications → Applications installées
2. **Rechercher** "Fusion"
3. **Cliquer** sur les trois points → Désinstaller
4. **Suivre** l'assistant de désinstallation

#### Vérifications post-désinstallation :

```powershell
# L'application ne devrait plus exister
Test-Path "$env:ProgramFiles\Fusion" # False

# Les raccourcis devraient être supprimés
Test-Path "$env:USERPROFILE\Desktop\Fusion.lnk" # False
Test-Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Fusion" # False

# Le dossier de notes devrait RESTER (données utilisateur)
Test-Path "C:\Users\[USERNAME]\Documents\Notes" # True
```

**Important :** Les données utilisateur (notes) ne sont **PAS** supprimées lors de la désinstallation.

### Test 12 : Réinstallation après désinstallation

1. **Réinstaller** l'application
2. **Vérifier** que :
   - [ ] L'installation se fait sans erreur
   - [ ] Les anciennes notes sont toujours accessibles
   - [ ] La configuration peut être recréée
   - [ ] Docker/OnlyOffice fonctionnent toujours

---

## ✅ Checklist de validation complète

### Phase 1 : Build
- [ ] Build Next.js réussi
- [ ] Build Electron réussi
- [ ] Installeur NSIS créé
- [ ] Taille de l'installeur raisonnable (< 400 MB)
- [ ] Hash SHA256 calculé et documenté

### Phase 2 : Installation
- [ ] L'installeur se lance sans erreur
- [ ] Choix du répertoire d'installation fonctionnel
- [ ] Installation se termine avec succès
- [ ] Tous les fichiers copiés correctement
- [ ] Raccourcis créés (bureau + menu démarrer)

### Phase 3 : Configuration
- [ ] Script post-installation s'exécute automatiquement
- [ ] Choix du dossier de notes fonctionnel
- [ ] `config.json` créé avec les bons paramètres
- [ ] Dossier de notes créé physiquement
- [ ] Installation Docker proposée si absent
- [ ] Déploiement OnlyOffice proposé et fonctionnel

### Phase 4 : Premier lancement
- [ ] Lancement via raccourci bureau fonctionne
- [ ] Lancement via menu démarrer fonctionne
- [ ] Script `Launch-App.ps1` vérifie Docker
- [ ] Application démarre sans erreur
- [ ] Interface s'affiche correctement
- [ ] Pas d'erreur de configuration

### Phase 5 : Fonctionnalités
- [ ] Création de dossiers
- [ ] Création de notes texte
- [ ] Édition de documents Word avec OnlyOffice
- [ ] Édition de fichiers Excel
- [ ] Édition de présentations PowerPoint
- [ ] Affichage d'images
- [ ] Lecture audio
- [ ] Lecture vidéo
- [ ] Sauvegarde automatique fonctionne

### Phase 6 : Docker & OnlyOffice
- [ ] Docker Desktop fonctionne
- [ ] Conteneur OnlyOffice en cours d'exécution
- [ ] OnlyOffice accessible depuis l'app
- [ ] Édition collaborative fonctionne
- [ ] Pas d'erreur CORS
- [ ] Performance acceptable

### Phase 7 : Stabilité
- [ ] Pas de crash pendant 30 minutes d'utilisation
- [ ] Pas de fuite mémoire observable
- [ ] Redémarrage de l'app fonctionne
- [ ] Redémarrage de Windows : app se relance correctement
- [ ] Données conservées après redémarrage

### Phase 8 : Désinstallation
- [ ] Désinstallation via Paramètres Windows fonctionne
- [ ] Application supprimée complètement
- [ ] Raccourcis supprimés
- [ ] Données utilisateur (notes) conservées
- [ ] Docker/OnlyOffice continuent de fonctionner
- [ ] Réinstallation possible sans problème

---

## 🐛 Problèmes courants et solutions

### Problème 1 : L'installeur ne démarre pas

**Symptômes :**
- Double-clic sur l'exe ne fait rien
- Ou erreur "L'application n'a pas pu démarrer correctement"

**Solutions :**
```powershell
# Vérifier l'intégrité
Get-FileHash .\Fusion-Setup-1.0.0.exe -Algorithm SHA256

# Désactiver temporairement l'antivirus
# Exécuter en tant qu'administrateur
```

### Problème 2 : Windows SmartScreen bloque l'installation

**Symptômes :**
- "Windows a protégé votre PC"
- L'installeur ne peut pas s'exécuter

**Solutions :**
1. Cliquer sur "Informations complémentaires"
2. Cliquer sur "Exécuter quand même"

**Note :** Pour éviter cela en production, signer l'installeur avec un certificat Code Signing.

### Problème 3 : config.json n'est pas créé

**Diagnostic :**
```powershell
# Vérifier les permissions
Get-Acl "$env:ProgramFiles\Fusion" | Format-List

# Vérifier que le script a bien été exécuté
Get-EventLog -LogName Application -Source "Fusion" -Newest 10
```

**Solutions :**
- Réinstaller en tant qu'administrateur
- Vérifier les permissions du répertoire
- Vérifier que PowerShell peut s'exécuter : `Set-ExecutionPolicy RemoteSigned`

### Problème 4 : OnlyOffice ne démarre pas

**Diagnostic :**
```powershell
# Vérifier Docker
docker ps -a

# Vérifier les logs OnlyOffice
docker logs onlyoffice-documentserver
```

**Solutions :**
```powershell
# Redémarrer le conteneur
docker restart onlyoffice-documentserver

# Ou redéployer complètement
docker stop onlyoffice-documentserver
docker rm onlyoffice-documentserver

# Relancer le script de déploiement
& "$env:ProgramFiles\Fusion\resources\installer\scripts\Deploy-OnlyOffice.ps1" -Force
```

### Problème 5 : L'application ne trouve pas les notes

**Diagnostic :**
```powershell
# Vérifier config.json
$config = Get-Content "$env:ProgramFiles\Fusion\config.json" | ConvertFrom-Json
$config.files.rootPath

# Vérifier que le dossier existe
Test-Path $config.files.rootPath
```

**Solutions :**
- Ouvrir les paramètres de l'application
- Reconfigurer le `rootPath`
- Ou éditer manuellement `config.json`

---

## 📊 Rapport de test

Après avoir effectué tous les tests, remplir ce rapport :

### Informations système
- **OS :** Windows 11 [Version]
- **RAM :** [XX GB]
- **Processeur :** [Modèle]
- **Docker Desktop :** [Version ou N/A]

### Résultats des tests
- **Build :** ✅ / ❌
- **Installation :** ✅ / ❌
- **Configuration :** ✅ / ❌
- **Premier lancement :** ✅ / ❌
- **Fonctionnalités :** ✅ / ❌
- **Docker/OnlyOffice :** ✅ / ❌
- **Stabilité :** ✅ / ❌
- **Désinstallation :** ✅ / ❌

### Problèmes rencontrés
[Liste des problèmes avec description]

### Suggestions d'amélioration
[Liste des suggestions]

---

## 🎯 Conclusion

Si tous les tests passent avec succès :

✅ **L'installeur est prêt pour la distribution !**

Vous pouvez maintenant :
1. Créer une release GitHub
2. Uploader l'installeur
3. Publier les notes de version
4. Partager le lien de téléchargement

**Version testée :** 1.0.0  
**Date du test :** [Date]  
**Testeur :** [Nom]

---

*Guide créé pour NotePad-Pro - Novembre 2024*
