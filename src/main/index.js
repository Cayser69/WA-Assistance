import electron from 'electron';
const { app } = electron;
import path from 'path';
import { fileURLToPath } from 'url';

// Submódulos Core 📂
import { BootManager } from './core/boot.js';
import { createWindow } from './core/window.js';
import { watchRenderer } from './core/watcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('[Main] 🚀 App Ready (Hybrid Core Activated)');

// 1. Configurar Entorno 📂
BootManager.configurePaths(app.isPackaged, process.cwd());

// 2. Estabilidad y Seguridad 🛡️
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// Variables de Estado
let mainWindow;
let services = {};
let isCleaningUp = false;

// 3. Arranque de Servicios y Ventana 🖥️
app.whenReady().then(async () => {
    try {
        services = await BootManager.loadServices(__dirname);
        
        mainWindow = createWindow({
            __dirname,
            isPackaged: app.isPackaged,
            watchRenderer,
            ...services // Pasa waClient, waScanner, waCampaign, registerIPCHandlers
        });

        // 4. Optimización de Base de Datos con Feedback Visual 🚀
        // Se ejecuta después de abrir la ventana para poder informar al usuario
        const db = await import('./services/database/index.js');
        db.repairMetaData((percent) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('wa:status', { 
                    status: 'boot', 
                    text: `Optimizando base de datos... ${percent}%`,
                    ready: false 
                });
            }
        }).then(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('wa:status', { 
                    status: 'boot', 
                    text: 'Motor de datos optimizado.',
                    ready: true 
                });
            }
        });

        // Auto-Update
        if (app.isPackaged) {
            import('electron-updater').then(({ autoUpdater }) => {
                autoUpdater.checkForUpdatesAndNotify();
            });
        }
    } catch (err) {
        console.error('[Main] 🔥 Fallo crítico durante el arranque:', err);
    }
});

// 4. Gestión de Ventanas
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// 5. Apagado Seguro 🧼
app.on('before-quit', async (event) => {
    if (isCleaningUp) return;
    
    event.preventDefault(); // Detener cierre inmediato
    isCleaningUp = true;

    await BootManager.safeShutdown(services);
});
