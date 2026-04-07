import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import url from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('[Main] 🚀 App Ready (Hybrid Core Activated)');

// 1. Configurar entorno portable 📂
let localAppData;
if (app.isPackaged) {
    const baseDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
    localAppData = path.join(baseDir, 'data');
} else {
    localAppData = path.join(process.cwd(), '.app_data');
}

try {
    if (!fs.existsSync(localAppData)) fs.mkdirSync(localAppData, { recursive: true });
    app.setPath('userData', localAppData);
    console.log(`[Main] 📂 Datos en: ${localAppData}`);
} catch (err) {
    console.error(`[Main] ❌ Error de rutas:`, err.message);
}

// Estabilidad
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// Variables globales
let waClient, waCampaign, waScanner, registerIPCHandlers;
let mainWindow;

/**
 * Hot Reload para el Renderer
 */
let lastReload = 0;
function watchRenderer(window) {
    const rendererPath = path.join(__dirname, '..', 'renderer');
    const bootTime = Date.now();
    fs.watch(rendererPath, { recursive: true }, (eventType, filename) => {
        const now = Date.now();
        if (now - bootTime < 10000 || now - lastReload < 5000) return;
        lastReload = now;
        console.log(`[UI] 🔄 RECARGANDO por cambio en ${filename}...`);
        window.reload();
    });
}

function createWindow() {
    console.log('[Main] 🖥️ Abriendo ventana principal...');
    mainWindow = new BrowserWindow({
        width: 1100, height: 800,
        backgroundColor: '#0f172a',
        show: false,
        webPreferences: {
            preload: path.join(__dirname, '..', 'preload', 'index.js'),
            contextIsolation: true, nodeIntegration: false, webSecurity: false
        }
    });

    if (registerIPCHandlers) registerIPCHandlers(mainWindow);

    const indexPath = path.resolve(__dirname, '..', 'renderer', 'index.html');
    mainWindow.loadFile(indexPath);
    mainWindow.setMenuBarVisibility(false);

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
        setTimeout(async () => {
            console.log('[Main] 🤖 Arrancando motores...');
            if (waClient) await waClient.init(mainWindow);
            if (waScanner) waScanner.init(mainWindow);
            if (waCampaign) waCampaign.init(mainWindow);
        }, 3000);
        if (!app.isPackaged) watchRenderer(mainWindow);
    });
}

// ARRANQUE
app.whenReady().then(async () => {
    console.log('[Main] ✅ Motor estable. Cargando servicios...');
    try {
        const waMod = await import('./providers/whatsapp/client.js');
        const campMod = await import('./providers/whatsapp/campaign.js');
        const scanMod = await import('./providers/whatsapp/scanner.js');
        const ipcMod = await import('./ipc/handlers.js');

        waClient = waMod.waClient;
        waCampaign = campMod.waCampaign;
        waScanner = scanMod.waScanner;
        registerIPCHandlers = ipcMod.registerIPCHandlers;

        createWindow();

        if (app.isPackaged) {
            const { autoUpdater } = await import('electron-updater');
            autoUpdater.checkForUpdatesAndNotify();
        }
    } catch (err) {
        console.error('[Main] 🔥 Error en servicios:', err);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
