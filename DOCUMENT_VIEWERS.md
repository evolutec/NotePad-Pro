# Document Viewers - Guide de Configuration

## Vue d'ensemble

L'application dispose d'un système complet de visualisation de documents qui gère automatiquement différents types de fichiers.

## Types de Fichiers Supportés

### 1. **Fichiers Texte** (.txt, .csv, .tsv)
- **Viewer utilisé**: `NoteEditor` (éditeur de texte intégré)
- **Fonctionnalités**: Édition, syntaxe highlighting, sauvegarde automatique

### 2. **Fichiers Markdown** (.md)
- **Viewer utilisé**: `NoteEditor` (éditeur markdown)
- **Fonctionnalités**: Prévisualisation markdown, édition WYSIWYG

### 3. **Fichiers PDF** (.pdf)
- **Viewer utilisé**: `PdfViewer` (react-pdf)
- **Fonctionnalités**: Zoom, navigation de pages, annotations

### 4. **Images** (.png, .jpg, .jpeg, .gif, .svg, .webp, .bmp)
- **Viewer utilisé**: `ImageViewer`
- **Fonctionnalités**: Zoom, rotation, téléchargement

### 5. **Vidéos** (.mp4, .webm, .ogg, .avi, .mov, .mkv, .wmv, .flv, .3gp)
- **Viewer utilisé**: `VideoViewer` (video.js)
- **Fonctionnalités**: Lecture, pause, volume, vitesse de lecture

### 6. **Documents Office** (.doc, .docx, .xls, .xlsx, .ppt, .pptx, .rtf, .odt, .ods, .odp)
- **Viewer utilisé**: `DocumentViewer` (react-doc-viewer)
- **Fonctionnalités**: Visualisation, téléchargement, ouverture externe

### 7. **Dessins** (.draw)
- **Viewer utilisé**: `DrawingCanvas`
- **Fonctionnalités**: Dessin, formes, couleurs, sauvegarde

## Architecture

### Composants Principaux

```
app/page.tsx
├── activeView (state) - Détermine quel viewer afficher
├── handleNoteSelect() - Logique de sélection et routage
└── Viewers:
    ├── NoteEditor (markdown, txt)
    ├── PdfViewer (pdf)
    ├── ImageViewer (images)
    ├── VideoViewer (vidéos)
    ├── DocumentViewer (office docs)
    └── DrawingCanvas (draw)
```

### Flux de Sélection de Fichier

```
1. Utilisateur clique sur un fichier
   ↓
2. handleNoteSelect() détecte l'extension
   ↓
3. Router vers le viewer approprié:
   - .mp4, .avi, etc → VideoViewer
   - .pdf → PdfViewer
   - .png, .jpg, etc → ImageViewer
   - .doc, .docx, etc → DocumentViewer
   - .txt, .csv → DocumentViewer (NoteEditor)
   - .md → NoteEditor
   - .draw → DrawingCanvas
   - Autre → NoteEditor (par défaut)
```

## Configuration du DocumentViewer

### Dépendances
```bash
npm install react-doc-viewer
```

### Props Interface
```typescript
interface DocumentViewerProps {
  filePath: string        // Chemin absolu du fichier
  fileName: string        // Nom d'affichage
  fileType: string        // Extension (doc, docx, etc.)
  onClose?: () => void    // Callback de fermeture
}
```

### Modes de Visualisation

1. **Mode Texte** (txt, csv, tsv)
   - Utilise iframe pour afficher le contenu brut
   - Pas de formatage spécial

2. **Mode DocViewer** (Office documents)
   - Utilise react-doc-viewer
   - Conversion en format visualisable
   - Limitations: Certains formats complexes peuvent ne pas s'afficher correctement

3. **Mode Externe** (fallback)
   - Bouton "Ouvrir externe" disponible
   - Utilise l'application système par défaut

## Gestion des Erreurs

### Cas d'Erreur Communs

1. **API Electron non disponible**
   - Message: "API Electron non disponible"
   - Solution: Lancer avec `npm run electron`

2. **Format non supporté**
   - Message: "Type de fichier non supporté"
   - Fallback: Bouton "Ouvrir externe"

3. **Fichier corrompu**
   - Message: "Erreur lors du chargement"
   - Options: Télécharger ou ouvrir externe

## Layout Full-Width/Full-Height

Tous les viewers utilisent maintenant le même système de layout:

```tsx
<div className="w-full h-full flex flex-col">
  {/* Header - Fixed height */}
  <div className="p-4 border-b">
    Title + Controls
  </div>
  
  {/* Content - Flex-1 (takes all space) */}
  <div className="flex-1 overflow-hidden">
    Viewer Content
  </div>
  
  {/* Footer - Fixed height (optional) */}
  <div className="p-4 border-t">
    Info + Extra controls
  </div>
</div>
```

## Extensions Futures

### Formats à Ajouter
- ✅ .txt, .csv, .tsv (Texte)
- ✅ .doc, .docx (Word)
- ✅ .xls, .xlsx (Excel)
- ✅ .ppt, .pptx (PowerPoint)
- ✅ .rtf (Rich Text)
- ✅ .odt, .ods, .odp (OpenDocument)
- ⏳ .epub (eBooks)
- ⏳ .mobi (Kindle)
- ⏳ .html (Web pages)

### Fonctionnalités à Ajouter
- [ ] Annotations sur documents
- [ ] Conversion de formats
- [ ] Recherche dans documents
- [ ] Comparaison de versions
- [ ] Collaboration en temps réel

## Dépannage

### Problem: react-doc-viewer ne s'affiche pas
**Solution**: Vérifier que le fichier est bien chargé via Electron API et que le blob URL est créé correctement.

### Problem: Fichier Office ne s'affiche pas
**Solution**: Utiliser le bouton "Ouvrir externe" pour ouvrir avec Office/LibreOffice.

### Problem: Performance lente
**Solution**: Les gros fichiers peuvent prendre du temps. Optimiser en chargeant par morceaux si nécessaire.

## Ressources

- [react-doc-viewer](https://www.npmjs.com/package/react-doc-viewer)
- [react-pdf](https://www.npmjs.com/package/react-pdf)
- [video.js](https://videojs.com/)
- [Electron File System API](https://www.electronjs.org/docs/latest/api/app)

---

**Dernière mise à jour**: 7 octobre 2025
