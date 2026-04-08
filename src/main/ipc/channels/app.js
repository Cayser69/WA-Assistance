import electron from 'electron';
const { ipcMain, dialog, app } = electron;
import fs from 'fs';
import path from 'path';

/**
 * Registra los manejadores IPC relacionados con el Sistema y Multimedia 🖥️
 */
export function registerAppHandlers(mainWindow) {
    // --- Gestión de Multimedia ---
    ipcMain.handle('media:importTemplateImage', async (event, sourcePath) => {
        const { MediaManager } = await import('../../utils/media.js');
        return MediaManager.importTemplateImage(sourcePath);
    });

    ipcMain.handle('media:listImages', async () => {
        const { MediaManager } = await import('../../utils/media.js');
        return MediaManager.listImages();
    });

    // --- Utilidades de Sistema e Información ---
    ipcMain.handle('app:getPath', () => {
        return app.isPackaged ? app.getAppPath() : process.cwd();
    });

    ipcMain.handle('app:read-template', async (event, relativePath) => {
        const normalized = relativePath.replace(/\//g, path.sep);
        const baseRoot = app.isPackaged ? app.getAppPath() : process.cwd();
        const fullPath = path.resolve(baseRoot, normalized);
        
        try {
            if (!fs.existsSync(fullPath)) return null;
            return fs.readFileSync(fullPath, 'utf8');
        } catch (err) {
            console.error(`[Lector-Main] ❌ ERROR: ${fullPath}`, err.message);
            return null;
        }
    });

    // --- Diálogos de Sistema ---
    ipcMain.handle('dialog:openFile', async (event, { filters }) => {
        if (!mainWindow) return null;
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters
        });
        return result.filePaths[0] || null;
    });
}
