# 📦 Améliorations de l'Installeur Windows - NotePad-Pro

## 🎯 Résumé des améliorations

Ce document décrit toutes les améliorations apportées au processus d'installation de NotePad-Pro pour Windows 11, garantissant une expérience utilisateur fluide et professionnelle.

---

## ✨ Nouvelles fonctionnalités

### 1. Configuration interactive du dossier de notes

**Avant :**
- Le dossier de notes était codé en dur dans `config.json`
- L'utilisateur devait modifier manuellement la configuration

**Après :**
- ✅ L'installeur demande à l'utilisateur de choisir son dossier de notes
- ✅ Chemin par défaut intelligent : `C:\Users\[USERNAME]\Documents\Notes`
- ✅ Possibilité de parcourir et sélectionner n'importe quel dossier
- ✅ Création automatique du dossier s'il n'existe pas
- ✅ Vérification des permissions d'écriture

**Fichiers modifiés :**
- `installer/scripts/Post-Install.ps1` - Ajout de la fonction `Set-NotesPath()`

### 2. Création automatique de config.json

**Avant :**
- `config.json` devait être créé manuellement ou en copiant un template

**Après :**
- ✅ `config.json` créé automatiquement lors de l'installation
- ✅ Configuration personnalisée avec le rootPath choisi par l'utilisateur
- ✅ Paramètres par défaut optimaux (auto-save, thème système, etc.)
- ✅ Structure complète avec toutes les sections nécessaires

**Fichiers modifiés :**
- `installer/scripts/Post-Install.ps1` - Ajout de la fonction `Create-ConfigFile()`

### 3. Gestion intelligente du premier lancement

**Avant :**
- Si `config.json` n'existait pas, l'application pouvait crasher

**Après :**
- ✅ Détection automatique de l'absence de configuration
- ✅ Génération d'une configuration par défaut
- ✅ Création automatique du dossier de notes par défaut
- ✅ Gestion gracieuse des erreurs

**Fichiers modifiés :**
- `electron-main.js` - Handler `config:load` amélioré
- `electron-main.js` - Handler `config:save` avec création du rootPath

### 4. Interface de configuration au premier lancement

**Nouveau composant créé :**
- `components/first-run-setup.tsx` - Interface graphique élégante

**Fonctionnalités :**
- ✅ Écran de bienvenue professionnel
- ✅ Sélection visuelle du dossier de notes
- ✅ Bouton "Parcourir" pour explorer les dossiers
- ✅ Aperçu des paramètres qui seront configurés
- ✅ Validation et gestion des erreurs
- ✅ Design cohérent avec l'application

---

## 🔄 Flux d'installation amélioré

### Étape 1 : Exécution de l'installeur
```
Utilisateur lance Fusion-Setup-1.0.0.exe
    ↓
Installation de l'application dans C:\Program Files\Fusion\
    ↓
Création des raccourcis (Bureau + Menu Démarrer)
    ↓
Copie des ressources (scripts, config OnlyOffice)
```

### Étape 2 : Configuration post-installation
```
Script Post-Install.ps1 s'exécute automatiquement
    ↓
╔═══════════════════════════════════════════╗
║  Configuration du dossier de notes        ║
╚═══════════════════════════════════════════╝
    ↓
Proposition du chemin par défaut : C:\Users\[USERNAME]\Documents\Notes
    ↓
Utilisateur choisit :
    • [O] Utiliser le chemin par défaut
    • [N] Spécifier un autre chemin
    ↓
Création du dossier
    ↓
✓ Dossier créé : [Chemin choisi]
    ↓
Génération de config.json avec le rootPath personnalisé
    ↓
✓ Configuration sauvegardée
```

### Étape 3 : Configuration Docker & OnlyOffice
```
Vérification de Docker
    ↓
Docker installé ?
    • Oui → Vérifier s'il fonctionne
    • Non → Proposer l'installation
    ↓
Docker fonctionne ?
    • Oui → Proposer le déploiement d'OnlyOffice
    • Non → Proposer de démarrer Docker
    ↓
OnlyOffice déployé avec succès
    ↓
✓ Configuration complète !
```

### Étape 4 : Premier lancement
```
Utilisateur double-clique sur le raccourci
    ↓
Launch-App.ps1 s'exécute
    ↓
Vérifications :
    • Docker est-il installé ?
    • Docker fonctionne-t-il ?
    • OnlyOffice est-il déployé ?
    ↓
Si tout est OK → Lancement de Fusion.exe
    ↓
Application démarre avec config.json personnalisé
    ↓
Interface charge le dossier de notes choisi
    ↓
✓ Prêt à l'emploi !
```

---

## 📁 Structure des fichiers de configuration

### config.json (créé automatiquement)

```json
{
  "stylus": {
    "pressureSensitivity": 1,
    "offsetX": 0,
    "offsetY": 0,
    "minPressure": 0.1,
    "maxPressure": 1,
    "smoothing": 0.5,
    "palmRejection": true
  },
  "files": {
    "rootPath": "C:\\Users\\[USERNAME]\\Documents\\Notes",  // ← Personnalisé !
    "autoSave": true,
    "autoSaveInterval": 30,
    "maxFileSize": 50
  },
  "app": {
    "theme": "system",
    "language": "fr",
    "startWithWindows": false,
    "minimizeToTray": true
  }
}
```

**Emplacement :** `C:\Program Files\Fusion\config.json`

---

## 🛠️ Modifications techniques détaillées

### 1. Post-Install.ps1

**Nouvelles fonctions ajoutées :**

#### `Set-NotesPath()`
```powershell
function Set-NotesPath {
    # Affiche un dialogue pour choisir le dossier de notes
    # Propose un chemin par défaut intelligent
    # Crée le dossier s'il n'existe pas
    # Retourne le chemin validé
}
```

#### `Create-ConfigFile()`
```powershell
function Create-ConfigFile {
    param([string]$NotesPath)
    
    # Crée la structure complète de config.json
    # Intègre le rootPath personnalisé
    # Sauvegarde dans C:\Program Files\Fusion\config.json
}
```

**Flux du script :**
```powershell
Write-Banner
    ↓
Set-NotesPath → Retourne $notesPath
    ↓
Create-ConfigFile -NotesPath $notesPath → Crée config.json
    ↓
Configuration Docker/OnlyOffice (existant)
    ↓
Fin
```

### 2. electron-main.js

**Handler `config:load` amélioré :**

```javascript
ipcMain.handle('config:load', async () => {
  const configPath = path.join(__dirname, 'config.json');
  
  if (fs.existsSync(configPath)) {
    // Charger la configuration existante
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } else {
    // Créer une configuration par défaut
    const defaultConfig = {
      // Configuration par défaut avec rootPath intelligent
    };
    
    // Créer le dossier par défaut
    fs.mkdirSync(defaultConfig.files.rootPath, { recursive: true });
    
    return defaultConfig;
  }
});
```

**Handler `config:save` amélioré :**

```javascript
ipcMain.handle('config:save', async (_event, settings) => {
  // Créer le dossier rootPath s'il n'existe pas
  if (settings.files?.rootPath) {
    if (!fs.existsSync(settings.files.rootPath)) {
      fs.mkdirSync(settings.files.rootPath, { recursive: true });
    }
  }
  
  // Sauvegarder la configuration
  fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));
});
```

### 3. first-run-setup.tsx

**Nouveau composant React :**

```typescript
interface FirstRunSetupProps {
  onComplete: (rootPath: string) => void
}

export function FirstRunSetup({ onComplete }: FirstRunSetupProps)
```

**Fonctionnalités clés :**
- Interface utilisateur moderne avec shadcn/ui
- Sélection de dossier avec API Electron
- Validation en temps réel
- Gestion des erreurs élégante
- Animation de chargement pendant la configuration

---

## 🎨 Amélioration de l'expérience utilisateur

### Interface de sélection de dossier

**Design moderne :**
- Carte centrée avec gradient de fond
- Icône de dossier distinctive
- Texte explicatif clair
- Input avec bouton "Parcourir" intégré
- Liste visuelle des paramètres qui seront configurés

**Feedback utilisateur :**
- Messages de confirmation clairs
- Indicateurs de progression
- Messages d'erreur contextuels
- Animation de chargement pendant la sauvegarde

### Messages du script PowerShell

**Code couleur :**
- 🟢 Vert : Succès et confirmations
- 🟡 Jaune : Avertissements et informations
- 🔵 Cyan : Titres et séparateurs
- 🔴 Rouge : Erreurs

**Exemple de sortie :**
```
╔════════════════════════════════════════════════════════╗
║          Configuration de NotePad-Pro                 ║
╚════════════════════════════════════════════════════════╝

✓ Dossier créé: C:\Users\John\Documents\Notes
✓ Configuration sauvegardée: C:\Program Files\Fusion\config.json

════════════════════════════════════════════════════════
Configuration terminée!
════════════════════════════════════════════════════════
```

---

## 🧪 Validation et tests

### Tests automatisés disponibles

Un guide complet de test a été créé : `INSTALLER_TEST_GUIDE.md`

**Couvre :**
- ✅ Build de l'installeur
- ✅ Installation sur machine vierge
- ✅ Configuration du rootPath
- ✅ Création de config.json
- ✅ Premier lancement
- ✅ Fonctionnalités de base
- ✅ Désinstallation propre

### Scénarios de test clés

#### Scénario 1 : Installation standard
1. Lancer l'installeur
2. Accepter le chemin par défaut pour les notes
3. Installer Docker si proposé
4. Déployer OnlyOffice
5. Lancer l'application → ✅ Tout fonctionne

#### Scénario 2 : Chemin personnalisé
1. Lancer l'installeur
2. Choisir un chemin personnalisé (ex: `D:\MesNotes`)
3. Vérifier que le dossier est créé
4. Lancer l'application
5. Créer une note → ✅ Sauvegardée dans `D:\MesNotes`

#### Scénario 3 : Installation sans Docker
1. Lancer l'installeur
2. Refuser l'installation de Docker
3. Lancer l'application
4. ✅ L'application fonctionne (sans OnlyOffice)

---

## 📊 Compatibilité

### Systèmes supportés
- ✅ Windows 11 (toutes versions)
- ✅ Windows 10 version 1809+
- ⚠️ Windows Server 2019+ (non testé mais devrait fonctionner)

### Prérequis
- **Obligatoires :**
  - Windows 64-bit
  - 4 GB RAM minimum
  - 2 GB d'espace disque libre
  - PowerShell 5.1+

- **Optionnels (pour OnlyOffice) :**
  - Docker Desktop
  - WSL2
  - 8 GB RAM recommandés
  - 10 GB d'espace disque supplémentaire

---

## 🚀 Instructions de build

### Créer l'installeur

```powershell
# 1. Nettoyer
Remove-Item -Recurse -Force dist, .next -ErrorAction SilentlyContinue

# 2. Installer les dépendances
npm install

# 3. Build Next.js
npm run build

# 4. Créer l'installeur
npm run electron:build

# 5. L'installeur est créé dans dist/
# Fusion-Setup-1.0.0.exe
```

### Tester localement

```powershell
# Option 1 : Build sans compression (plus rapide)
npm run electron:build:dir

# Option 2 : Test en mode développement
npm run electron
```

---

## 📝 Documentation utilisateur

### Pour l'utilisateur final

**Étapes d'installation :**

1. **Télécharger** `Fusion-Setup-1.0.0.exe`
2. **Exécuter** l'installeur (double-clic)
3. **Suivre** l'assistant d'installation
4. **Choisir** un dossier pour vos notes
5. **Accepter** l'installation de Docker si proposé
6. **Attendre** le déploiement d'OnlyOffice
7. **Lancer** l'application depuis le bureau

**C'est tout !** 🎉

### Premiers pas

Une fois l'application lancée :
1. Créez votre premier dossier
2. Ajoutez une note
3. Essayez d'éditer un document Word
4. Explorez toutes les fonctionnalités !

---

## 🔧 Dépannage

### Config.json n'est pas créé

**Solution :**
```powershell
# Exécuter manuellement le script
cd "C:\Program Files\Fusion\resources\installer\scripts"
powershell -ExecutionPolicy Bypass -File .\Post-Install.ps1
```

### Le dossier de notes n'est pas accessible

**Solution :**
1. Ouvrir `C:\Program Files\Fusion\config.json`
2. Modifier `files.rootPath` vers un chemin valide
3. Redémarrer l'application

### OnlyOffice ne fonctionne pas

**Solution :**
```powershell
# Vérifier Docker
docker ps

# Redéployer OnlyOffice
cd "C:\Program Files\Fusion\resources\installer\scripts"
powershell -ExecutionPolicy Bypass -File .\Deploy-OnlyOffice.ps1 -Force
```

---

## 📈 Améliorations futures possibles

### Court terme
- [ ] Signer l'installeur avec certificat Code Signing
- [ ] Ajouter une page "À propos" dans l'installeur
- [ ] Permettre la mise à jour automatique

### Moyen terme
- [ ] Installeur multi-langue (EN, FR, ES, etc.)
- [ ] Option d'installation portableapps
- [ ] Assistant de migration depuis d'autres apps

### Long terme
- [ ] Distribution via Microsoft Store
- [ ] Synchronisation cloud optionnelle
- [ ] Installation en mode "entreprise" avec déploiement centralisé

---

## 🎯 Conclusion

L'installeur de NotePad-Pro offre maintenant une expérience d'installation professionnelle et complète :

✅ **Installation en un clic** avec configuration automatique  
✅ **Choix personnalisé** du dossier de notes  
✅ **Configuration intelligente** de Docker et OnlyOffice  
✅ **Gestion des erreurs** robuste  
✅ **Documentation complète** pour les tests et le dépannage  

**L'application est prête pour une distribution publique !** 🚀

---

**Version :** 1.0.0  
**Date :** 8 novembre 2024  
**Auteur :** NotePad-Pro Team
