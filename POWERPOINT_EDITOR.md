# Éditeur et Visionneur PowerPoint

## Vue d'ensemble

L'application intègre maintenant un **éditeur PowerPoint** complet ainsi qu'un **visionneur amélioré** pour les fichiers `.ppt` et `.pptx`.

## Fonctionnalités

### 1. Visionneur PowerPoint (`powerpoint-viewer.tsx`)

Le visionneur PowerPoint offre deux modes de visualisation :

#### **Mode Grille**
- Affiche toutes les diapositives sous forme de vignettes
- Métadonnées de la présentation (titre, nombre de slides, taille)
- Extraction du contenu texte de chaque diapositive
- Support des images intégrées

#### **Mode Diaporama**
- Navigation slide par slide (précédent/suivant)
- Affichage plein écran des images de slides
- Miniatures de navigation en bas
- Compteur de slides

### Support des Formats

- ✅ **`.pptx`** (PowerPoint 2007+) - Support complet avec extraction de contenu
- ⚠️ **`.ppt`** (PowerPoint ancien) - Affichage des métadonnées uniquement (format binaire non supporté pour extraction)

### 2. Éditeur PowerPoint (`office-powerpoint-editor.tsx`)

Un éditeur simple mais fonctionnel utilisant la bibliothèque `pptxgenjs`.

#### Fonctionnalités de l'Éditeur

1. **Gestion des Diapositives**
   - ➕ Ajouter de nouvelles diapositives
   - 🗑️ Supprimer des diapositives
   - 🔀 Navigation entre diapositives
   - 📋 Aperçu en temps réel

2. **Édition de Contenu**
   - Titre de la diapositive
   - Contenu texte
   - Couleur de fond personnalisable
   - Plusieurs mises en page :
     - **Titre** : Diapositive de titre avec sous-titre
     - **Titre et contenu** : Titre + zone de contenu principale
     - **Titre seulement** : Juste un titre
     - **Vide** : Diapositive vierge

3. **Sauvegarde**
   - 💾 **Enregistrer** : Sauvegarde via l'API Electron
   - 📥 **Télécharger** : Téléchargement direct du fichier `.pptx`

4. **Interface Utilisateur**
   - Barre latérale avec vignettes de toutes les diapositives
   - Éditeur principal avec aperçu en temps réel
   - Navigation rapide entre slides
   - Éditeur de titre et contenu

## Utilisation

### Ouvrir une Présentation

1. Cliquez sur un fichier `.ppt` ou `.pptx` dans l'application
2. Le visionneur s'ouvre automatiquement en **Mode Grille**

### Basculer en Mode Diaporama

- Cliquez sur le bouton **"Diaporama"** en haut du visionneur
- Utilisez les flèches ← → pour naviguer
- Cliquez sur les vignettes en bas pour sauter à une slide

### Éditer une Présentation

1. Ouvrez une présentation (`.pptx` recommandé)
2. Cliquez sur le bouton **"Éditer"** dans l'en-tête
3. L'éditeur se charge avec le contenu extrait
4. Modifiez le titre, le contenu, les couleurs, etc.
5. Cliquez sur **"Enregistrer"** pour sauvegarder

### Créer une Nouvelle Diapositive

1. Dans l'éditeur, cliquez sur **"Nouvelle diapositive"** dans la barre latérale
2. La nouvelle slide est ajoutée à la fin
3. Cliquez dessus pour l'éditer

### Changer la Mise en Page

1. Sélectionnez une diapositive
2. Dans le menu déroulant "Mise en page", choisissez :
   - **Titre** : Pour la première slide de présentation
   - **Titre et contenu** : Pour les slides standards
   - **Titre seulement** : Pour les slides de transition
   - **Vide** : Pour commencer de zéro

## Technologies Utilisées

### Bibliothèques

- **`pptxgenjs` v4.0.1** : Génération de fichiers PowerPoint
  - Support PPTX (Office 2007+)
  - Création programmatique de slides
  - Personnalisation complète (texte, images, formes, tableaux)

- **`JSZip` v3.10.1** : Extraction de contenu PPTX
  - Les fichiers `.pptx` sont des archives ZIP
  - Extraction du XML des slides
  - Récupération des images et médias

### Architecture

```
DocumentViewer (document-viewer.tsx)
  ↓
  editMode === true?
  ↓
  OfficePowerPointEditor (office-powerpoint-editor.tsx)
    - Charge le .pptx existant avec JSZip
    - Extrait les slides et leur contenu
    - Interface d'édition (titre, contenu, mise en page)
    - Génère nouveau .pptx avec pptxgenjs
    - Sauvegarde via Electron API
  
  editMode === false?
  ↓
  PowerPointViewer (powerpoint-viewer.tsx)
    - Charge le .pptx avec JSZip
    - Extrait slides, images, métadonnées
    - Affiche en mode Grille ou Diaporama
    - Support .ppt ancien (métadonnées uniquement)
```

## Limitations et Notes

### Fichiers `.ppt` (Format Ancien)

- ⚠️ Le format `.ppt` est **binaire** et non supporté pour l'extraction de contenu
- Seules les métadonnées de base sont affichées
- **Recommandation** : Convertir en `.pptx` avec PowerPoint/LibreOffice pour un support complet

### Édition Avancée

L'éditeur actuel supporte :
- ✅ Texte (titre, contenu)
- ✅ Couleurs de fond
- ✅ Mises en page prédéfinies

Pas encore supporté (mais possible avec `pptxgenjs`) :
- ❌ Images insérées
- ❌ Formes et graphiques
- ❌ Tableaux
- ❌ Animations
- ❌ Thèmes personnalisés

Pour des modifications avancées, utilisez le bouton **"Ouvrir externe"** pour ouvrir dans PowerPoint.

### Extraction de Contenu

- L'extraction de texte depuis `.pptx` existants est **basique**
- Les slides complexes peuvent ne pas être entièrement extraites
- Les images sont extraites du dossier `ppt/media/`
- Certains éléments (WordArt, SmartArt) ne sont pas supportés

## Ouvrir avec PowerPoint

Pour une édition complète, utilisez le bouton **"Ouvrir externe"** :

1. Cliquez sur **"Ouvrir externe"** dans l'en-tête du visionneur
2. Le fichier s'ouvre avec **Microsoft PowerPoint** (si installé)
3. Modifiez avec toutes les fonctionnalités de PowerPoint
4. Enregistrez et fermez PowerPoint
5. Rechargez le fichier dans l'application pour voir les changements

## Résolution de Problèmes

### "Erreur lors du chargement du fichier"

**Cause** : Fichier `.ppt` ancien ou corrompu

**Solution** :
1. Vérifiez que le fichier est valide en l'ouvrant dans PowerPoint
2. Convertissez le `.ppt` en `.pptx` : `Fichier > Enregistrer sous > Format .pptx`
3. Réessayez dans l'application

### "Aucune présentation chargée"

**Cause** : Problème d'extraction JSZip

**Solution** :
1. Vérifiez que le fichier est un `.pptx` valide
2. Vérifiez la console du navigateur (F12) pour voir l'erreur exacte
3. Si le fichier est trop volumineux (>50 MB), envisagez de le compresser

### Les images ne s'affichent pas

**Cause** : Formats d'image non supportés (EMF, WMF)

**Solution** :
- Les formats Windows Metafile (EMF/WMF) ne sont pas supportés par les navigateurs
- Utilisez PNG/JPEG pour les images
- Ou ouvrez avec PowerPoint pour voir toutes les images

### L'éditeur ne sauvegarde pas

**Cause** : API Electron non disponible

**Solution** :
1. Vérifiez que l'application tourne en mode Electron (pas en mode web)
2. Redémarrez l'application
3. Vérifiez la console : `window.electronAPI.documentCreate` doit exister

## Exemples de Code

### Créer une Présentation Simple

```typescript
import pptxgen from 'pptxgenjs';

const pptx = new pptxgen();

// Slide de titre
const slide1 = pptx.addSlide();
slide1.addText('Ma Présentation', {
  x: 0.5, y: 1.5, w: '90%', h: 1.5,
  fontSize: 44, bold: true, align: 'center'
});

// Slide de contenu
const slide2 = pptx.addSlide();
slide2.addText('Point Important', {
  x: 0.5, y: 0.5, w: '90%', h: 0.75,
  fontSize: 32, bold: true
});
slide2.addText('Description détaillée...', {
  x: 0.5, y: 1.5, w: '90%', h: 4,
  fontSize: 18
});

// Sauvegarder
await pptx.writeFile({ fileName: 'presentation.pptx' });
```

## Améliorations Futures

### Court Terme
- [ ] Support des images dans l'éditeur
- [ ] Duplication de slides
- [ ] Réorganisation des slides par drag & drop
- [ ] Plus de mises en page prédéfinies

### Moyen Terme
- [ ] Support des tableaux
- [ ] Formes et icônes basiques
- [ ] Thèmes de couleurs prédéfinis
- [ ] Import/export de notes de présentation

### Long Terme
- [ ] Graphiques et diagrammes
- [ ] Animations de base
- [ ] Collaboration en temps réel
- [ ] Templates de présentation

## Support

Pour toute question ou problème :
1. Vérifiez ce document
2. Consultez la documentation de [pptxgenjs](https://gitbrent.github.io/PptxGenJS/)
3. Ouvrez un ticket GitHub si le problème persiste

---

**Version** : 1.0.0  
**Dernière mise à jour** : 8 octobre 2025  
**Bibliothèques** : pptxgenjs 4.0.1, JSZip 3.10.1
