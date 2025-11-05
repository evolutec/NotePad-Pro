# Migration vers OnlyOffice - Documentation

## Vue d'ensemble

Tous les documents Office (Word, Excel, PowerPoint) utilisent maintenant **OnlyOffice** comme viewer et éditeur unique, remplaçant les anciens composants individuels.

## Changements effectués

### 1. Nouveau composant unifié : `OnlyOfficeEditor`

**Fichier** : `components/onlyoffice-editor.tsx`

Composant réutilisable sans modal qui remplace tous les viewers Office :
- ✅ Remplace `DocxViewer`, `OfficeWordEditor`
- ✅ Remplace `ExcelViewer`, `OfficeExcelEditor`  
- ✅ Remplace `PowerPointViewer`, `OfficePowerPointEditor`

**Props** :
```typescript
{
  filePath: string;        // Chemin du fichier
  fileName: string;        // Nom du fichier
  fileType?: string;       // Extension (docx, xlsx, pptx, etc.)
  mode?: 'view' | 'edit';  // Mode d'affichage
  onError?: (error: string) => void;
}
```

**Détection automatique du type** :
- `.doc`, `.docx`, `.rtf`, `.txt`, `.odt` → Type `word`
- `.xls`, `.xlsx`, `.csv`, `.ods` → Type `cell`
- `.ppt`, `.pptx`, `.odp` → Type `slide`

### 2. Modifications de `DocumentViewer`

**Fichier** : `components/document-viewer.tsx`

- ❌ Supprimé : Imports de `DocxViewer`, `ExcelViewer`, `PowerPointViewer`, `OfficeWordEditor`, `OfficeExcelEditor`, `OfficePowerPointEditor`
- ❌ Supprimé : Modal `OnlyOfficeViewer` 
- ✅ Ajouté : Import de `OnlyOfficeEditor`
- ✅ Modifié : Tous les fichiers Office s'ouvrent directement avec `OnlyOfficeEditor`
- ✅ Conservé : Bouton "Éditer" pour basculer entre mode lecture/édition

**Comportement** :
- Par défaut : Mode `view` (lecture seule)
- Bouton "Éditer" → Passe en mode `edit`
- Même composant pour tous les formats Office

### 3. Anciens composants (obsolètes, peuvent être supprimés)

Ces composants ne sont plus utilisés :
- `components/docx-viewer.tsx`
- `components/excel-viewer.tsx`
- `components/powerpoint-viewer.tsx`
- `components/office-word-editor.tsx`
- `components/office-excel-editor.tsx`
- `components/office-powerpoint-editor.tsx`

Le composant `components/onlyoffice-viewer.tsx` (modal) est toujours présent pour compatibilité mais n'est plus utilisé.

### 4. Dialogs de création

**Fichier** : `components/add-document_dialog.tsx`

Aucune modification nécessaire ! Le dialog utilise déjà le système d'upload générique. Les documents uploadés s'ouvriront automatiquement avec OnlyOffice grâce aux modifications de `DocumentViewer`.

## Configuration requise

### Docker OnlyOffice Document Server

Le conteneur Docker doit être configuré avec :

```bash
docker run -i -t -d -p 80:80 \
  -e JWT_ENABLED=false \
  -e WOPI_ENABLED=false \
  --add-host=host.docker.internal:host-gateway \
  --env DS_LOG_LEVEL=DEBUG \
  --name onlyoffice-documentserver \
  onlyoffice/documentserver
```

### Configuration SSRF (Critique)

Fichier : `/etc/onlyoffice/documentserver/local.json` dans le conteneur

```json
{
  "services": {
    "CoAuthoring": {
      "sql": {
        "type": "postgres",
        "dbHost": "localhost",
        "dbPort": "5432",
        "dbName": "onlyoffice",
        "dbUser": "onlyoffice",
        "dbPass": "onlyoffice"
      },
      "token": {
        "enable": {
          "request": {
            "inbox": false,
            "outbox": false
          },
          "browser": false
        }
      },
      "request-filtering-agent": {
        "allowPrivateIPAddress": true,
        "allowMetaIPAddress": true
      }
    }
  },
  "rabbitmq": {
    "url": "amqp://guest:guest@localhost"
  },
  "wopi": {
    "enable": false
  },
  "storage": {
    "fs": {
      "secretString": "Hz6Qc4fuF6ocHt90ETpW"
    }
  }
}
```

**Important** : La configuration `request-filtering-agent` avec `allowPrivateIPAddress: true` est nécessaire pour permettre à OnlyOffice d'accéder aux fichiers locaux via `host.docker.internal:38274`.

### Serveur de fichiers Electron

Le serveur HTTP Electron doit écouter sur `0.0.0.0:38274` pour être accessible depuis Docker.

**Fichier** : `electron-main.js`

```javascript
fileServer.listen(38274, '0.0.0.0', () => {
  console.log('File server listening on 0.0.0.0:38274');
});
```

## Formats supportés

### Pleinement supportés avec OnlyOffice

- **Word** : `.doc`, `.docx`, `.rtf`, `.odt`
- **Excel** : `.xls`, `.xlsx`, `.csv`, `.ods`
- **PowerPoint** : `.ppt`, `.pptx`, `.odp`

### Autres formats

- **PDF** : Iframe direct (pas OnlyOffice)
- **Texte** : `.txt`, `.md` → `NoteEditor`
- **Images** : `ImageViewer`
- **Vidéos** : `VideoViewer`

## Flux utilisateur

1. L'utilisateur clique sur un document Office dans le FileManager
2. `app/page.tsx` détecte le type et appelle `setActiveView('document_viewer')`
3. `DocumentViewer` détecte l'extension du fichier
4. Pour `.docx/.xlsx/.pptx` → Affiche `OnlyOfficeEditor` en mode `view`
5. L'utilisateur peut cliquer sur "Éditer" pour passer en mode `edit`
6. OnlyOffice charge le document depuis `http://host.docker.internal:38274/?file=...`

## Gestion des erreurs

Si OnlyOffice n'est pas disponible, `OnlyOfficeEditor` affiche :
- Message d'erreur clair
- Boutons "Ouvrir avec l'application externe" et "Télécharger"
- Instructions de vérification (Docker démarré, configuration SSRF, etc.)

## Tests à effectuer

- [x] Créer un composant OnlyOfficeEditor unifié
- [x] Remplacer tous les viewers Office dans DocumentViewer
- [x] Vérifier que les dialogs de création fonctionnent
- [ ] Tester ouverture d'un fichier .docx
- [ ] Tester ouverture d'un fichier .xlsx
- [ ] Tester ouverture d'un fichier .pptx
- [ ] Tester le mode édition
- [ ] Tester la création de nouveaux documents
- [ ] Vérifier la gestion d'erreur quand Docker est arrêté

## Avantages

✅ **Un seul viewer pour tous les formats Office** - Simplicité et cohérence  
✅ **Édition native** - Pas besoin d'application externe  
✅ **Interface unifiée** - Même expérience pour Word, Excel, PowerPoint  
✅ **Gestion centralisée** - Un seul point de configuration  
✅ **Performance** - OnlyOffice optimisé pour le web  

## Prochaines étapes potentielles

1. Supprimer les anciens composants viewers (après confirmation que tout fonctionne)
2. Ajouter la sauvegarde automatique en mode édition
3. Implémenter la collaboration en temps réel (si besoin)
4. Ajouter des templates de documents pré-configurés
