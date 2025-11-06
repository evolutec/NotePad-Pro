import {
  FolderPlus,
  FileText,
  Palette,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  File,
  Video as VideoIcon,
  Camera,
  Upload,
  Image,
  Mic,
  FolderOpen,
  Plus,
  Table,
  Presentation
} from "lucide-react"

export type FileType =
  | 'folder'
  | 'note'
  | 'draw'
  | 'document'
  | 'pdf'
  | 'excel'
  | 'powerpoint'
  | 'image'
  | 'video'
  | 'audio'
  | 'code'
  | 'archive'
  | 'generic'

export type FileColorTheme =
  | 'yellow'  // Folder
  | 'blue'    // Note
  | 'purple'  // Draw/Video
  | 'red'     // Document
  | 'green'   // Image
  | 'pink'    // Audio
  | 'orange'  // Code
  | 'gray'    // Archive
  | 'black'   // Custom

export interface FileTypeConfig {
  type: FileType
  name: string
  description: string
  colorTheme: FileColorTheme
  icon: React.ComponentType<any>
  buttonIcon: React.ComponentType<any>
  extensions: string[]
  mimeTypes: string[]
  category: 'creation' | 'media' | 'document' | 'development' | 'archive'
  sidebarButton: {
    background: string
    hover: string
    text: string
    darkBackground: string
    darkHover: string
    darkText: string
  }
  modal: {
    gradient: string
    accent: string
    line: string
  }
}

export const FILE_TYPES: Record<FileType, FileTypeConfig> = {
  folder: {
    type: 'folder',
    name: 'Dossier',
    description: 'Organiser vos fichiers',
    colorTheme: 'yellow',
    icon: FolderPlus,
    buttonIcon: FolderPlus,
    extensions: [],
    mimeTypes: [],
    category: 'creation',
    sidebarButton: {
      background: 'bg-yellow-100 hover:bg-yellow-200',
      hover: 'hover:bg-yellow-200',
      text: 'text-yellow-600',
      darkBackground: 'dark:bg-yellow-900 dark:hover:bg-yellow-800',
      darkHover: 'dark:hover:bg-yellow-800',
      darkText: 'dark:text-yellow-400'
    },
    modal: {
      gradient: 'from-yellow-500 to-yellow-600',
      accent: 'bg-yellow-500 hover:bg-yellow-600',
      line: 'bg-yellow-500'
    }
  },
  note: {
    type: 'note',
    name: 'Note',
    description: 'Notes et documents texte',
    colorTheme: 'blue',
    icon: FileText,
    buttonIcon: FileText,
    extensions: ['md', 'txt', 'markdown', 'text'],
    mimeTypes: ['text/markdown', 'text/plain', 'text/markdown'],
    category: 'document',
    sidebarButton: {
      background: 'bg-blue-100 hover:bg-blue-200',
      hover: 'hover:bg-blue-200',
      text: 'text-blue-600',
      darkBackground: 'dark:bg-blue-900 dark:hover:bg-blue-800',
      darkHover: 'dark:hover:bg-blue-800',
      darkText: 'dark:text-blue-400'
    },
    modal: {
      gradient: 'from-blue-500 to-blue-600',
      accent: 'bg-blue-500 hover:bg-blue-600',
      line: 'bg-blue-500'
    }
  },
  draw: {
    type: 'draw',
    name: 'Dessin',
    description: 'Créations graphiques',
    colorTheme: 'purple',
    icon: Palette,
    buttonIcon: Palette,
    extensions: ['draw'],
    mimeTypes: ['application/json'],
    category: 'creation',
    sidebarButton: {
      background: 'bg-purple-100 hover:bg-purple-200',
      hover: 'hover:bg-purple-200',
      text: 'text-purple-600',
      darkBackground: 'dark:bg-purple-900 dark:hover:bg-purple-800',
      darkHover: 'dark:hover:bg-purple-800',
      darkText: 'dark:text-purple-400'
    },
    modal: {
      gradient: 'from-purple-500 to-purple-600',
      accent: 'bg-purple-500 hover:bg-purple-600',
      line: 'bg-purple-500'
    }
  },
  document: {
    type: 'document',
    name: 'Document',
    description: 'Documents et PDFs',
    colorTheme: 'red',
    icon: FileText,
    buttonIcon: FileText,
    extensions: ['pdf', 'doc', 'docx', 'rtf', 'odt'],
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    category: 'document',
    sidebarButton: {
      background: 'bg-red-100 hover:bg-red-200',
      hover: 'hover:bg-red-200',
      text: 'text-red-600',
      darkBackground: 'dark:bg-red-900 dark:hover:bg-red-800',
      darkHover: 'dark:hover:bg-red-800',
      darkText: 'dark:text-red-400'
    },
    modal: {
      gradient: 'from-red-500 to-red-600',
      accent: 'bg-red-500 hover:bg-red-600',
      line: 'bg-red-500'
    }
  },
  image: {
    type: 'image',
    name: 'Image',
    description: 'Images et photos',
    colorTheme: 'yellow',
    icon: FileImage,
    buttonIcon: FileImage,
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'],
    category: 'media',
    sidebarButton: {
      background: 'bg-yellow-100 hover:bg-yellow-200',
      hover: 'hover:bg-yellow-200',
      text: 'text-yellow-600',
      darkBackground: 'dark:bg-yellow-900 dark:hover:bg-yellow-800',
      darkHover: 'dark:hover:bg-yellow-800',
      darkText: 'dark:text-yellow-400'
    },
    modal: {
      gradient: 'from-yellow-500 to-yellow-600',
      accent: 'bg-yellow-500 hover:bg-yellow-600',
      line: 'bg-yellow-500'
    }
  },
  video: {
    type: 'video',
    name: 'Vidéo',
    description: 'Vidéos et films',
    colorTheme: 'gray',
    icon: FileVideo,
    buttonIcon: FileVideo,
    extensions: ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'wmv', 'flv', '3gp'],
    mimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/x-msvideo', 'video/quicktime', 'video/x-matroska'],
    category: 'media',
    sidebarButton: {
      background: 'bg-gray-100 hover:bg-gray-200',
      hover: 'hover:bg-gray-200',
      text: 'text-gray-600',
      darkBackground: 'dark:bg-gray-900 dark:hover:bg-gray-800',
      darkHover: 'dark:hover:bg-gray-800',
      darkText: 'dark:text-gray-400'
    },
    modal: {
      gradient: 'from-gray-500 to-gray-600',
      accent: 'bg-gray-500 hover:bg-gray-600',
      line: 'bg-gray-500'
    }
  },
  audio: {
    type: 'audio',
    name: 'Audio',
    description: 'Fichiers audio et musique',
    colorTheme: 'pink',
    icon: FileAudio,
    buttonIcon: FileAudio,
    extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac', 'audio/aac'],
    category: 'media',
    sidebarButton: {
      background: 'bg-pink-100 hover:bg-pink-200',
      hover: 'hover:bg-pink-200',
      text: 'text-pink-600',
      darkBackground: 'dark:bg-pink-900 dark:hover:bg-pink-800',
      darkHover: 'dark:hover:bg-pink-800',
      darkText: 'dark:text-pink-400'
    },
    modal: {
      gradient: 'from-pink-500 to-pink-600',
      accent: 'bg-pink-500 hover:bg-pink-600',
      line: 'bg-pink-500'
    }
  },
  code: {
    type: 'code',
    name: 'Code',
    description: 'Fichiers de code source',
    colorTheme: 'orange',
    icon: FileCode,
    buttonIcon: FileCode,
    extensions: ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'cs', 'html', 'css', 'json', 'xml', 'yaml', 'yml'],
    mimeTypes: ['application/javascript', 'application/typescript', 'text/x-python', 'text/x-java-source', 'text/x-c++src', 'text/html', 'text/css', 'application/json'],
    category: 'development',
    sidebarButton: {
      background: 'bg-orange-100 hover:bg-orange-200',
      hover: 'hover:bg-orange-200',
      text: 'text-orange-600',
      darkBackground: 'dark:bg-orange-900 dark:hover:bg-orange-800',
      darkHover: 'dark:hover:bg-orange-800',
      darkText: 'dark:text-orange-400'
    },
    modal: {
      gradient: 'from-orange-500 to-orange-600',
      accent: 'bg-orange-500 hover:bg-orange-600',
      line: 'bg-orange-500'
    }
  },
  archive: {
    type: 'archive',
    name: 'Archive',
    description: 'Archives compressées',
    colorTheme: 'gray',
    icon: FileArchive,
    buttonIcon: FileArchive,
    extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip'],
    category: 'archive',
    sidebarButton: {
      background: 'bg-gray-100 hover:bg-gray-200',
      hover: 'hover:bg-gray-200',
      text: 'text-gray-600',
      darkBackground: 'dark:bg-gray-900 dark:hover:bg-gray-800',
      darkHover: 'dark:hover:bg-gray-800',
      darkText: 'dark:text-gray-400'
    },
    modal: {
      gradient: 'from-gray-500 to-gray-600',
      accent: 'bg-gray-500 hover:bg-gray-600',
      line: 'bg-gray-500'
    }
  },
  pdf: {
    type: 'pdf',
    name: 'PDF',
    description: 'Document PDF',
    colorTheme: 'red',
    icon: FileText,
    buttonIcon: FileText,
    extensions: ['pdf'],
    mimeTypes: ['application/pdf'],
    category: 'document',
    sidebarButton: {
      background: 'bg-red-100 hover:bg-red-200',
      hover: 'hover:bg-red-200',
      text: 'text-red-600',
      darkBackground: 'dark:bg-red-900 dark:hover:bg-red-800',
      darkHover: 'dark:hover:bg-red-800',
      darkText: 'dark:text-red-400'
    },
    modal: {
      gradient: 'from-red-500 to-red-600',
      accent: 'bg-red-500 hover:bg-red-600',
      line: 'bg-red-500'
    }
  },
  excel: {
    type: 'excel',
    name: 'Excel',
    description: 'Tableur Excel',
    colorTheme: 'green',
    icon: Table,
    buttonIcon: Table,
    extensions: ['xlsx', 'xls'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
    category: 'document',
    sidebarButton: {
      background: 'bg-green-100 hover:bg-green-200',
      hover: 'hover:bg-green-200',
      text: 'text-green-600',
      darkBackground: 'dark:bg-green-900 dark:hover:bg-green-800',
      darkHover: 'dark:hover:bg-green-800',
      darkText: 'dark:text-green-400'
    },
    modal: {
      gradient: 'from-green-500 to-green-600',
      accent: 'bg-green-500 hover:bg-green-600',
      line: 'bg-green-500'
    }
  },
  powerpoint: {
    type: 'powerpoint',
    name: 'PowerPoint',
    description: 'Présentation PowerPoint',
    colorTheme: 'orange',
    icon: Presentation,
    buttonIcon: Presentation,
    extensions: ['pptx', 'ppt'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint'],
    category: 'document',
    sidebarButton: {
      background: 'bg-orange-100 hover:bg-orange-200',
      hover: 'hover:bg-orange-200',
      text: 'text-orange-600',
      darkBackground: 'dark:bg-orange-900 dark:hover:bg-orange-800',
      darkHover: 'dark:hover:bg-orange-800',
      darkText: 'dark:text-orange-400'
    },
    modal: {
      gradient: 'from-orange-500 to-orange-600',
      accent: 'bg-orange-500 hover:bg-orange-600',
      line: 'bg-orange-500'
    }
  },
  generic: {
    type: 'generic',
    name: 'Fichier',
    description: 'Fichier générique',
    colorTheme: 'gray',
    icon: File,
    buttonIcon: File,
    extensions: ['*'],
    mimeTypes: ['*/*'],
    category: 'document',
    sidebarButton: {
      background: 'bg-gray-100 hover:bg-gray-200',
      hover: 'hover:bg-gray-200',
      text: 'text-gray-600',
      darkBackground: 'dark:bg-gray-900 dark:hover:bg-gray-800',
      darkHover: 'dark:hover:bg-gray-800',
      darkText: 'dark:text-gray-400'
    },
    modal: {
      gradient: 'from-gray-500 to-gray-600',
      accent: 'bg-gray-500 hover:bg-gray-600',
      line: 'bg-gray-500'
    }
  }
}

export const getFileTypeConfig = (type: FileType): FileTypeConfig => {
  return FILE_TYPES[type] || FILE_TYPES.generic
}

export const getFileTypeFromExtension = (extension: string): FileType => {
  const ext = extension.toLowerCase()

  for (const [type, config] of Object.entries(FILE_TYPES)) {
    if (config.extensions.includes(ext)) {
      return type as FileType
    }
  }

  return 'generic'
}

export const getFileTypeFromMimeType = (mimeType: string): FileType => {
  for (const [type, config] of Object.entries(FILE_TYPES)) {
    if (config.mimeTypes.includes(mimeType)) {
      return type as FileType
    }
  }

  return 'generic'
}

export const getFileTypesByCategory = (category: FileTypeConfig['category']): FileTypeConfig[] => {
  return Object.values(FILE_TYPES).filter(config => config.category === category)
}

export const getModalColorTheme = (fileType: FileType): FileColorTheme => {
  return getFileTypeConfig(fileType).colorTheme
}

export const getModalIcon = (fileType: FileType): React.ComponentType<any> => {
  return getFileTypeConfig(fileType).icon
}

export const getModalGradient = (fileType: FileType): string => {
  return getFileTypeConfig(fileType).modal.gradient
}

export const getModalAccent = (fileType: FileType): string => {
  return getFileTypeConfig(fileType).modal.accent
}

export const getModalLineColor = (fileType: FileType): string => {
  return getFileTypeConfig(fileType).modal.line
}

export const getSidebarButtonClasses = (fileType: FileType): string => {
  const config = getFileTypeConfig(fileType)
  return `${config.sidebarButton.background} ${config.sidebarButton.hover} ${config.sidebarButton.text} ${config.sidebarButton.darkBackground} ${config.sidebarButton.darkHover} ${config.sidebarButton.darkText}`
}

export default FILE_TYPES
