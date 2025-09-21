# Modern Folder Tree Component

A comprehensive, modern folder tree component for React applications with enhanced UI/UX features.

## 🌟 Features

### Visual Design
- **Modern Aesthetic**: Clean, contemporary design with beautiful gradients and shadows
- **File Type Detection**: Automatic detection and appropriate styling for different file types
- **Color-Coded Icons**: Distinct colors for folders, notes, documents, images, videos, audio, code, and archives
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions
- **Responsive Design**: Mobile-friendly with adaptive layouts

### Interactive Features
- **Hover Effects**: Enhanced hover states with visual feedback
- **Context Menus**: Right-click menus with file operations (rename, duplicate, delete)
- **Multiple View Modes**: Files, Recent, Starred tabs
- **Search & Filter**: Real-time search with file type filtering
- **Drag & Drop**: Support for drag and drop operations (ready for implementation)
- **Keyboard Navigation**: Accessible keyboard controls

### Advanced Functionality
- **File Metadata**: Support for file sizes, modification dates, descriptions, and tags
- **Starred Items**: Favorite file marking system
- **Recent Files**: Automatic tracking of recently accessed files
- **Expand/Collapse**: Smooth tree node expansion with animation
- **Selection States**: Clear visual indicators for selected items
- **Custom Icons**: Support for custom file and folder icons

## 📦 Installation

The component uses several dependencies:

```bash
npm install framer-motion lucide-react
npm install @radix-ui/react-dropdown-menu @radix-ui/react-context-menu
npm install @radix-ui/react-tooltip @radix-ui/react-tabs
npm install @radix-ui/react-separator @radix-ui/react-scroll-area
```

## 🚀 Usage

### Basic Usage

```tsx
import { ModernSidebar } from '@/components/ui/sidebar-modern';
import { EnhancedFolderNode } from '@/components/ui/FolderTree-modern';

function App() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  const handleFolderSelect = (path: string) => {
    setSelectedFolder(path);
  };

  const handleNoteSelect = (path: string) => {
    setSelectedNote(path);
  };

  return (
    <ModernSidebar
      tree={yourTreeData}
      onFolderSelect={handleFolderSelect}
      selectedFolder={selectedFolder}
      onNoteSelect={handleNoteSelect}
      selectedNote={selectedNote}
    />
  );
}
```

### Advanced Usage with All Features

```tsx
<ModernSidebar
  tree={enhancedTreeData}
  onFolderSelect={handleFolderSelect}
  selectedFolder={selectedFolder}
  onNoteSelect={handleNoteSelect}
  selectedNote={selectedNote}
  onDelete={handleDelete}
  onRename={handleRename}
  onDuplicate={handleDuplicate}
  onNewFolder={handleNewFolder}
  onNewFile={handleNewFile}
  className="custom-class"
  isCollapsed={isCollapsed}
  onToggleCollapse={handleToggleCollapse}
/>
```

## 🏗️ Data Structure

### EnhancedFolderNode Type

```typescript
type EnhancedFolderNode = {
  id?: string;
  name: string;
  path: string;
  type: FileType;
  color?: string;
  icon?: string;
  description?: string;
  tags?: string[];
  parent?: string;
  children?: EnhancedFolderNode[];
  fullPath?: string;
  isDirectory?: boolean;
  size?: number;
  modifiedAt?: Date;
  createdAt?: Date;
  isStarred?: boolean;
  isShared?: boolean;
  metadata?: Record<string, any>;
};
```

### File Types Supported

- `folder` - File directories
- `note` - Markdown and text files (.md, .txt)
- `document` - Office documents (.doc, .docx, .pdf, .odt)
- `image` - Image files (.jpg, .jpeg, .png, .gif, .svg, .webp)
- `video` - Video files (.mp4, .avi, .mov, .mkv)
- `audio` - Audio files (.mp3, .wav, .flac, .aac)
- `code` - Source code files (.js, .ts, .jsx, .tsx, .py, .java, .cpp, .cs, .html, .css, .json)
- `archive` - Archive files (.zip, .rar, .7z, .tar, .gz)
- `file` - Generic files

## 🎨 Styling

### CSS Classes

The component includes comprehensive CSS styling in `tree-styles.css`:

```css
/* Import the styles */
@import '@/components/ui/tree-styles.css';

/* Custom theme variables */
:root {
  --tree-bg-primary: #ffffff;
  --tree-bg-secondary: #f8fafc;
  --tree-border-color: #e2e8f0;
  --tree-text-primary: #1e293b;
  --tree-text-secondary: #64748b;
  --tree-accent-color: #3b82f6;
}

.dark {
  --tree-bg-primary: #0f172a;
  --tree-bg-secondary: #1e293b;
  --tree-border-color: #334155;
  --tree-text-primary: #f1f5f9;
  --tree-text-secondary: #94a3b8;
  --tree-accent-color: #60a5fa;
}
```

### Custom Icons

You can provide custom icons for files and folders:

```tsx
const customNode: EnhancedFolderNode = {
  name: "Custom Folder",
  path: "/custom",
  type: "folder",
  icon: "📁", // Custom emoji or icon
  color: "#ff6b6b" // Custom color
};
```

## 🔧 Customization

### File Type Colors

Customize file type colors by modifying the CSS or using the `getFileColor` function:

```tsx
const getCustomFileColor = (type: FileType) => {
  switch (type) {
    case 'note':
      return 'text-purple-600 dark:text-purple-400';
    // Add more custom colors
    default:
      return getFileColor(type);
  }
};
```

### Animation Variants

Customize Framer Motion animations:

```tsx
const customVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};
```

## 📱 Responsive Design

The component is fully responsive with mobile-optimized layouts:

- **Desktop**: Full sidebar with all features
- **Tablet**: Collapsible sidebar with touch-friendly interactions
- **Mobile**: Bottom sheet or drawer-style navigation

## ♿ Accessibility

Built with accessibility in mind:

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: ARIA labels and descriptions
- **Focus Management**: Proper focus indicators and management
- **High Contrast**: Support for high contrast themes
- **Reduced Motion**: Respects `prefers-reduced-motion`

## 🧪 Testing

Run the demo to test all features:

```bash
# Start development server
npm run dev

# Navigate to the demo
http://localhost:3000/modern-tree-demo
```

## 🚀 Performance

Optimized for performance:

- **React.memo**: Components are memoized to prevent unnecessary re-renders
- **Virtual Scrolling**: Large trees use virtual scrolling
- **Lazy Loading**: Child nodes load on demand
- **Efficient State Management**: Optimized state updates

## 📚 Examples

### File Manager Application

```tsx
function FileManager() {
  const [files, setFiles] = useState<EnhancedFolderNode>(rootFolder);
  
  const handleDelete = (node: EnhancedFolderNode) => {
    // Implement delete logic
    const updatedFiles = deleteNode(files, node.path);
    setFiles(updatedFiles);
  };
  
  const handleRename = (node: EnhancedFolderNode) => {
    // Implement rename logic
    const newName = prompt('New name:', node.name);
    if (newName) {
      const updatedFiles = renameNode(files, node.path, newName);
      setFiles(updatedFiles);
    }
  };
  
  return (
    <div className="flex h-screen">
      <ModernSidebar
        tree={files}
        onDelete={handleDelete}
        onRename={handleRename}
        // ... other props
      />
      <main className="flex-1 p-6">
        {/* Main content */}
      </main>
    </div>
  );
}
```

### Note-Taking Application

```tsx
function NoteApp() {
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  
  const handleNoteSelect = (path: string) => {
    setSelectedNote(path);
    // Load note content
    loadNoteContent(path);
  };
  
  return (
    <div className="flex h-screen">
      <ModernSidebar
        tree={notesTree}
        onNoteSelect={handleNoteSelect}
        selectedNote={selectedNote}
      />
      <NoteEditor 
        selectedNote={selectedNote}
        onSave={handleSaveNote}
      />
    </div>
  );
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Framer Motion](https://www.framer.com/motion/) for animations
- [Lucide React](https://lucide.dev/) for icons
- [Radix UI](https://www.radix-ui.com/) for headless components
- [Tailwind CSS](https://tailwindcss.com/) for styling