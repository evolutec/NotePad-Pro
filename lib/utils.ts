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
