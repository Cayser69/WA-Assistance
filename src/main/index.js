import electron from 'electron';
const { app, BrowserWindow, ipcMain } = electron;
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
let isCleaningUp = false;

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
        icon: path.join(__dirname, '..', '..', 'assets', 'icon.png'),
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
        // 1. Inicializar Base de Datos primero 📦
        console.log('[Main] 📦 Cargando base de datos...');
        const dbMod = await import('./services/database/index.js');
        await dbMod.initDB();

        console.log('[Main] 🤖 Cargando proveedores y handlers...');
        const waMod = await import('./providers/whatsapp/core/client.js');
        const campMod = await import('./providers/whatsapp/services/campaign.js');
        const scanMod = await import('./providers/whatsapp/services/scanner.js');
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

// --- APAGADO SEGURO (SAFE SHUTDOWN) 🧼 ---
app.on('before-quit', async (event) => {
    if (isCleaningUp) return;
    
    // Evitar que la app se cierre inmediatamente para poder limpiar recursos asíncronos
    event.preventDefault();
    isCleaningUp = true;

    console.log('[Main] 🧼 Iniciando limpieza final (Cierre de Servicios)...');

    try {
        // 1. Detener procesos activos
        if (waCampaign) waCampaign.stop();
        if (waScanner) waScanner.stop();

        // 2. Destruir cliente de WhatsApp (Mata los procesos de Chrome/Puppeteer)
        if (waClient) {
            await waClient.destroy();
        }

        console.log('[Main] ✅ Limpieza completada con éxito. Saliendo...');
    } catch (err) {
        console.error('[Main] 🔥 Error durante el apagado seguro:', err.message);
    } finally {
        // Una vez limpios los recursos, salimos definitivamente
        app.quit();
    }
});
