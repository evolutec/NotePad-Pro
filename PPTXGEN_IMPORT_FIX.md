# Correction : Problème d'Import pptxgenjs

## 🐛 Problème

```
Module build failed: UnhandledSchemeError: Reading from "node:fs" is not handled by plugins
Import trace:
node:fs
./node_modules/pptxgenjs/dist/pptxgen.es.js
./components/office-powerpoint-editor.tsx
```

**Cause** : `pptxgenjs` utilise le module Node.js `fs` qui n'est pas disponible dans le navigateur. L'import statique au niveau du module provoque une erreur de compilation Webpack.

## ✅ Solution

### 1. Chargement Dynamique dans `document-viewer.tsx`

```typescript
// AVANT - Import statique
import { OfficePowerPointEditor } from './office-powerpoint-editor';

// APRÈS - Import dynamique avec Next.js
const OfficePowerPointEditor = dynamic(
  () => import('./office-powerpoint-editor').then(mod => ({ 
    default: mod.OfficePowerPointEditor 
  })),
  {
    ssr: false,  // Désactiver le rendu côté serveur
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-3 text-muted-foreground">Chargement de l'éditeur PowerPoint...</p>
      </div>
    )
  }
);
```

### 2. Chargement Dynamique dans `office-powerpoint-editor.tsx`

```typescript
// AVANT - Import statique
import pptxgen from 'pptxgenjs';

// APRÈS - Import dynamique avec fonction helper
let pptxgen: any = null;
const loadPptxGen = async () => {
  if (!pptxgen) {
    const module = await import('pptxgenjs');
    pptxgen = module.default;
  }
  return pptxgen;
};

// Utilisation dans les fonctions
const savePresentation = async () => {
  const PptxGen = await loadPptxGen();
  const pptx = new PptxGen();
  // ...
};

const downloadPresentation = async () => {
  const PptxGen = await loadPptxGen();
  const pptx = new PptxGen();
  // ...
};
```

## 📝 Fichiers Modifiés

### `components/document-viewer.tsx`
- ✅ Import dynamique de `OfficePowerPointEditor`
- ✅ Ajout d'un écran de chargement personnalisé
- ✅ `ssr: false` pour éviter le rendu serveur

### `components/office-powerpoint-editor.tsx`
- ✅ Suppression de `import pptxgen from 'pptxgenjs'`
- ✅ Ajout de la fonction `loadPptxGen()` pour import dynamique
- ✅ Modification de `savePresentation()` pour utiliser `await loadPptxGen()`
- ✅ Modification de `downloadPresentation()` pour utiliser `await loadPptxGen()`

## 🎯 Pourquoi Ça Fonctionne

1. **Next.js Dynamic Import** : `next/dynamic` permet de charger un composant uniquement côté client
2. **SSR Désactivé** : `ssr: false` empêche Next.js de tenter de charger le module côté serveur
3. **Import Asynchrone** : `await import('pptxgenjs')` charge la bibliothèque uniquement quand nécessaire
4. **Lazy Loading** : Le code de `pptxgenjs` n'est chargé que lorsque l'utilisateur clique sur "Éditer"

## 🚀 Avantages

- ✅ **Pas d'erreur de compilation** : Webpack ne tente plus de résoudre `node:fs`
- ✅ **Performance améliorée** : `pptxgenjs` (~300 KB) n'est chargé que si nécessaire
- ✅ **Bundle plus léger** : Le bundle initial ne contient pas `pptxgenjs`
- ✅ **Compatible Electron** : Fonctionne en mode desktop et web

## 🧪 Test de Validation

1. ✅ Lancer l'application : `npm run electron`
2. ✅ La page d'accueil se charge sans erreur
3. ✅ Ouvrir un fichier `.pptx`
4. ✅ Le visionneur s'affiche correctement
5. ✅ Cliquer sur "Éditer"
6. ✅ L'écran de chargement s'affiche brièvement
7. ✅ L'éditeur PowerPoint se charge avec le contenu
8. ✅ Modifications et sauvegarde fonctionnent

## 📚 Références

- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)
- [Webpack Module Resolution](https://webpack.js.org/concepts/module-resolution/)
- [pptxgenjs Documentation](https://gitbrent.github.io/PptxGenJS/)

## ⚠️ Notes Importantes

### Import Dynamique vs Statique

**Import Statique** (problématique pour modules Node.js) :
```typescript
import pptxgen from 'pptxgenjs';  // ❌ Charge immédiatement au niveau module
```

**Import Dynamique** (solution) :
```typescript
const module = await import('pptxgenjs');  // ✅ Charge uniquement quand appelé
```

### Autres Bibliothèques Concernées

Cette approche doit être utilisée pour toute bibliothèque qui :
- Utilise des modules Node.js (`fs`, `path`, `crypto`, etc.)
- N'est pas compatible SSR (Server-Side Rendering)
- Est volumineuse et peut être chargée à la demande

### Exemples dans l'Application

Actuellement utilisé pour :
- ✅ `react-doc-viewer` (dans `document-viewer.tsx`)
- ✅ `pptxgenjs` (dans `office-powerpoint-editor.tsx`)

Pourrait être utilisé pour :
- `mammoth` (si problèmes de taille de bundle)
- `xlsx` (si problèmes de performance)
- Autres éditeurs Office complexes

---

**Date** : 8 octobre 2025  
**Statut** : ✅ Corrigé et testé  
**Impact** : Correction critique - permet le démarrage de l'application
