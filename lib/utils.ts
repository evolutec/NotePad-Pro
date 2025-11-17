import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Génère l'URL HTTP locale pour accéder à un fichier via le serveur interne (pour OnlyOffice)
 * @param filePath Chemin absolu du fichier
 */
export function getOnlyOfficeFileUrl(filePath: string): string {
  // Encode le chemin pour l'URL
  const encodedPath = encodeURIComponent(filePath);
  return `http://localhost:38274/?file=${encodedPath}`;
}

// Normalise les dimensions d'une icône personnalisée pour l'affichage en vignette (preview/sidebar)
export function normalizeIconForThumbnail(
  customization: any | undefined,
  displayMaxSize: number = 40,
  options?: { respectIconSize?: boolean }
): { wrapperPx: number; iconInnerSize: number; padding: number } {
  const respectIconSize = options?.respectIconSize ?? true
  const iconSize = (customization && typeof customization.size === 'number') ? customization.size : 16
  const padding = (customization && typeof customization.padding === 'number') ? customization.padding : 6
  const wrapperSrc = (customization && typeof customization.wrapperSize === 'number') ? customization.wrapperSize : (iconSize + padding * 2)

  // If wrapper already fits, return as-is
  if (wrapperSrc <= displayMaxSize) {
    return { wrapperPx: wrapperSrc, iconInnerSize: iconSize, padding }
  }

  // If wrapper is too big but icon+padding fits within displayMaxSize, cap wrapper only
  if (iconSize + padding * 2 <= displayMaxSize && respectIconSize) {
    return { wrapperPx: displayMaxSize, iconInnerSize: iconSize, padding }
  }

  // Otherwise scale everything proportionally so the full composition fits
  const scale = displayMaxSize / wrapperSrc
  return {
    wrapperPx: Math.max(4, Math.round(wrapperSrc * scale)),
    iconInnerSize: Math.max(4, Math.round(iconSize * scale)),
    padding: Math.max(0, Math.round(padding * scale)),
  }
}
