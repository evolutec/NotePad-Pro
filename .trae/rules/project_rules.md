## Project Rules and Guidelines

### 1. Overview
This project is a note-taking application built using Electron for desktop functionality and Next.js/React for the frontend user interface. It integrates various features for managing different types of files, including notes, documents (PDFs), drawings, and other media.

### 2. Technologies Used
- **Electron**: For building cross-platform desktop applications with web technologies.
- **Next.js**: A React framework for building server-side rendered and static web applications.
- **React**: A JavaScript library for building user interfaces.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
- **react-pdf**: A React component for displaying PDFs.
- **Node.js (fs, path modules)**: Used in the Electron main process for file system operations.

### 3. Project Structure
- `app/`: Contains Next.js pages and global CSS.
- `components/`: Reusable React components, organized by feature (e.g., `add-note_dialog.tsx`, `file-manager.tsx`, `pdf-viewer.tsx`).
- `components/ui/`: UI components built with Shadcn UI (inferred from `components.json` and file names).
- `electron-main.js`: The main process file for Electron, handling IPC communications and native desktop features.
- `preload.js`: The Electron preload script, exposing `electronAPI` to the renderer process.
- `public/`: Static assets like images and manifest files.
- `styles/`: Global styles.
- `config.json`, `notes.json`, `draws.json`, `folders.json`: Configuration and data storage files.

### 4. Development Guidelines
- **IPC Communication**: All interactions between the renderer process (React app) and the main Electron process should go through `ipcRenderer` and `ipcMain` handlers, exposed via `window.electronAPI` in `preload.js`.
- **File System Operations**: Direct file system access is restricted to the Electron main process (`electron-main.js`) for security reasons.
- **Component Reusability**: Strive to create reusable and modular React components.
- **Styling**: Use Tailwind CSS for styling components.
- **Error Handling**: Implement robust error handling for file operations and IPC communications.

### 5. Adding New Features
When adding a new feature that requires interaction with the file system or other native Electron APIs:
1. Define the new API in `preload.js` within the `electronAPI` object.
2. Implement the corresponding IPC handler in `electron-main.js`.
3. Use the `window.electronAPI` in your React components to call the new functionality.

### 6. Code Style
- Follow standard TypeScript/JavaScript and React best practices.
- Maintain consistent code formatting (e.g., using Prettier).

### 7. Testing
- (Add testing guidelines here if applicable)

### 8. Deployment
- (Add deployment guidelines here if applicable)