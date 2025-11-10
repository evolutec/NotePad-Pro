# OnlyOffice - Intégration dans NotePad-Pro

## ⚠️ IMPORTANT : Installation requise

**Avant d'utiliser OnlyOffice, vous devez installer OnlyOffice Document Server.**

📖 **Voir le guide complet** : [ONLYOFFICE_DOCKER_SETUP.md](./ONLYOFFICE_DOCKER_SETUP.md)

### Installation rapide avec Docker (Recommandé)

```powershell
# 1. Installer Docker Desktop : https://www.docker.com/products/docker-desktop

# 2. Lancer OnlyOffice Document Server (JWT désactivé pour développement)
docker run -i -t -d -p 80:80 -e JWT_ENABLED=false --add-host=host.docker.internal:host-gateway --name onlyoffice-documentserver onlyoffice/documentserver

# 3. Vérifier l'installation
# Ouvrir http://localhost dans votre navigateur

# 4. L'application est déjà configurée pour utiliser http://localhost
# Redémarrer votre app : npm run electron
```

⚠️ **Important** : `--add-host=host.docker.internal:host-gateway` permet au conteneur Docker d'accéder au serveur de fichiers local de votre application.

✅ **C'est tout !** OnlyOffice est maintenant prêt à l'emploi.

---

## ✅ Intégration réussie

OnlyOffice a été intégré en utilisant le **package npm officiel** `@onlyoffice/document-editor-react`.

## 📦 Package utilisé

```bash
npm install @onlyoffice/document-editor-react
```

## 📋 Caractéristiques

### OnlyOffice Document Editor
- ✅ **Formats supportés** : Word (.docx, .doc), Excel (.xlsx, .xls), PowerPoint (.pptx, .ppt)
- ✅ **Composant React officiel** : Intégration native avec React
- ✅ **Mode lecture** : Configuré en lecture seule par défaut
- ✅ **Open-source** : Gratuit et libre
- ✅ **Compatibilité MS Office** : Excellent rendu des documents Office

## 🎯 Utilisation

1. **Ouvrir un document Office** dans l'application
2. **Cliquer sur le bouton "Ouvrir avec OnlyOffice"**
3. Le document s'ouvrira dans un éditeur OnlyOffice modal

## ⚙️ Configuration

### Document Server URL
```typescript
documentServerUrl="http://localhost" // OnlyOffice Document Server (Docker)
```

✅ **Déjà configuré** dans `components/onlyoffice-viewer.tsx`

**Important** : OnlyOffice nécessite un Document Server pour fonctionner.

### Installation du Document Server

📖 **Guide complet** : [ONLYOFFICE_DOCKER_SETUP.md](./ONLYOFFICE_DOCKER_SETUP.md)

**Installation rapide** :
```powershell
docker run -i -t -d -p 80:80 -e JWT_ENABLED=false --add-host=host.docker.internal:host-gateway --name onlyoffice-documentserver onlyoffice/documentserver
```

⚠️ **Notes importantes** : 
- `-e JWT_ENABLED=false` désactive la vérification JWT pour le développement local
- `--add-host=host.docker.internal:host-gateway` permet au Document Server d'accéder au serveur de fichiers Electron sur localhost:38274

## 📁 Fichiers créés

- `components/onlyoffice-viewer.tsx` - Composant OnlyOffice avec le package React officiel
- `ONLYOFFICE_INTEGRATION.md` - Cette documentation
- `ONLYOFFICE_DOCKER_SETUP.md` - Guide complet d'installation Docker

## � Configuration du composant

```typescript
const config = {
  document: {
    fileType: 'docx',
    key: 'unique-key',
    title: 'Document.docx',
    url: 'https://example.com/document.docx', // URL publique
  },
  documentType: 'word', // 'word', 'cell', ou 'slide'
  editorConfig: {
    mode: 'view', // 'view' ou 'edit'
    lang: 'fr-FR',
    customization: {
      autosave: false,
      chat: false,
      comments: false,
      help: false,
      hideRightMenu: true,
      compactToolbar: true,
    },
  },
  height: '100%',
  width: '100%',
};
```

## ⚠️ Limitations

### Fichiers locaux
OnlyOffice fonctionne avec des URLs accessibles par le Document Server.

**Solutions pour Electron** :

1. **Serveur de fichiers local** (Déjà implémenté dans votre app)
   - Le serveur HTTP intégré écoute sur `http://localhost:38274`
   - Convertir les chemins locaux en URLs accessibles

2. **Visionneuses intégrées** (Recommandé pour simplicité)
   - Pas besoin de Document Server
   - Fonctionnent directement avec les fichiers locaux
   - Déjà implémentées et fonctionnelles

## 🔄 Alternatives intégrées

Vous disposez de visionneuses natives qui fonctionnent sans serveur :

| Format | Visionneuse | Édition |
|--------|-------------|---------|
| Word (.docx) | ✅ DocxViewer | ✅ OfficeWordEditor |
| Excel (.xlsx) | ✅ ExcelViewer | ✅ OfficeExcelEditor |
| PowerPoint (.pptx) | ✅ PowerPointViewer | ✅ OfficePowerPointEditor |

## 🚀 Installation Document Server

### Recommandé : Docker
📖 **Voir le guide complet** : [ONLYOFFICE_DOCKER_SETUP.md](./ONLYOFFICE_DOCKER_SETUP.md)

```powershell
# Installation en une commande (JWT désactivé pour développement)
docker run -i -t -d -p 80:80 -e JWT_ENABLED=false --add-host=host.docker.internal:host-gateway --name onlyoffice-documentserver onlyoffice/documentserver
```

### Alternative : Installation native
```powershell
# Windows : Télécharger depuis
https://www.onlyoffice.com/download-docs.aspx#docs-community
```

## 🛠️ Commandes Docker utiles

```powershell
# Démarrer
docker start onlyoffice-documentserver

# Arrêter
docker stop onlyoffice-documentserver

# Voir les logs
docker logs onlyoffice-documentserver

# Redémarrer
docker restart onlyoffice-documentserver
```

## 📚 Documentation

- Package npm : https://www.npmjs.com/package/@onlyoffice/document-editor-react
- CDN jsDelivr : https://www.jsdelivr.com/package/npm/@onlyoffice/document-editor-react
- Site officiel : https://www.onlyoffice.com
- API Documentation : https://api.onlyoffice.com/editors/react
- GitHub : https://github.com/ONLYOFFICE/document-editor-react

## 💡 Support

En cas de problème :
1. Vérifier que le Document Server est accessible
2. Vérifier que le fichier est accessible via URL
3. Consulter la console pour les erreurs
4. Utiliser les visionneuses intégrées comme alternative
5. Ouvrir avec l'application externe (LibreOffice/MS Office)

## 🎨 Personnalisation

Pour activer l'édition, modifier dans `onlyoffice-viewer.tsx` :
```typescript
editorConfig: {
  mode: 'edit', // Changez 'view' en 'edit'
  // ...
}
```

Pour personnaliser l'interface :
```typescript
customization: {
  autosave: true,
  chat: true,
  comments: true,
  help: true,
  hideRightMenu: false,
  compactToolbar: false,
}
```
