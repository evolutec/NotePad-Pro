// Wrapper pour pptxgenjs - charge uniquement côté client depuis CDN
// Ce fichier évite complètement l'import npm pour contourner les problèmes Webpack

let PptxGenJS: any = null;
let loadingPromise: Promise<any> | null = null;

export const getPptxGen = async () => {
  // Si déjà chargé, retourner immédiatement
  if (PptxGenJS) {
    return PptxGenJS;
  }

  // Si en cours de chargement, attendre
  if (loadingPromise) {
    return loadingPromise;
  }

  // Charger depuis CDN
  loadingPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('pptxgenjs can only be loaded in browser'));
      return;
    }

    // Vérifier si déjà chargé dans window
    if ((window as any).pptxgen) {
      PptxGenJS = (window as any).pptxgen;
      resolve(PptxGenJS);
      return;
    }

    // Charger le script depuis CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
    script.async = true;
    
    script.onload = () => {
      if ((window as any).pptxgen) {
        PptxGenJS = (window as any).pptxgen;
        console.log('[PptxGen Loader] pptxgenjs loaded successfully from CDN');
        resolve(PptxGenJS);
      } else {
        reject(new Error('pptxgenjs loaded but not found in window'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load pptxgenjs from CDN'));
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
};

export const createPresentation = async () => {
  const PptxGen = await getPptxGen();
  return new PptxGen();
};
