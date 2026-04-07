import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Módulos Internos (Estructura de Providers & Servicios)
import { waClient } from './providers/whatsapp/client.js';
import { waCampaign } from './providers/whatsapp/campaign.js';
import { waScanner } from './providers/whatsapp/scanner.js';
import { registerIPCHandlers } from './ipc/handlers.js';

// Desactivar GPU y Sandbox para evitar bloqueos de caché en Windows (Error 0x5) 🛡️
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');

// Redirigir todos los datos de la app a una carpeta LOCAL del proyecto 📂✨
// Esto evita el error de "Acceso denegado (0x5)" en la carpeta AppData del sistema.
const localAppData = path.join(process.cwd(), '.app_data');
if (!fs.existsSync(localAppData)) fs.mkdirSync(localAppData, { recursive: true });
app.setPath('userData', localAppData);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

/**
 * Handler IPC: Lectura de Plantillas de Componentes 🧱✨
 * Se asegura de usar la ruta base del proyecto para evitar duplicaciones.
 */
ipcMain.handle('read-template', async (event, relativePath) => {
    try {
        const fullPath = path.resolve(process.cwd(), relativePath);
        return fs.readFileSync(fullPath, 'utf-8');
    } catch (err) {
        console.error(`[Main] ❌ Error leyendo plantilla en ${relativePath}:`, err.message);
        throw err;
    }
});

/**
 * Hot Reload para el Renderer sin reiniciar el proceso principal.
 */
let lastReload = 0;
function watchRenderer(window) {
    const rendererPath = path.join(__dirname, '..', 'renderer');
    fs.watch(rendererPath, { recursive: true }, (eventType, filename) => {
        if (filename) {
            const now = Date.now();
            if (now - lastReload < 2000) return;
            lastReload = now;

            console.log(`UI: Cambio detectado en ${filename}. Recargando ventana...`);
            window.reload();
        }
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 800,
        backgroundColor: '#0f172a',
        show: false,
        webPreferences: {
            preload: path.join(__dirname, '..', 'preload', 'index.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false // Permitir carga de módulos desde file:// en Windows 🛡️
        }
    });

    // Inicializar Handlers de IPC inmediatamente
    registerIPCHandlers(mainWindow);

    // Cargar la UI desde la carpeta organizada
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
    mainWindow.setMenuBarVisibility(false);

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
        
        // 2. Lanzar servicios con retardo de seguridad (3s) ⏳✨
        // Esto garantiza que la interfaz (Renderer) esté lista antes de tocar WhatsApp.
        setTimeout(async () => {
            console.log('Main: ✨ Inicializando motor de WhatsApp (3s Delay)...');
            await waClient.init(mainWindow);
            waScanner.init(mainWindow);
            waCampaign.init(mainWindow);
        }, 3000);

        // Activar Hot Reload para desarrollo
        watchRenderer(mainWindow);
    });
}

// Ciclo de Vida de la Aplicación
app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', async () => {
    if (process.platform !== 'darwin') {
        await waClient.destroy();
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

/**
 * Cierre Ordenado de Procesos (The Clean Exit) 🧼🛡️
 * Atrapamos las señales de la terminal (Ctrl+C) para matar a Chrome.
 */
const cleanupAndQuit = async () => {
    console.log('\n[Sistema] 🧼 Iniciando limpieza de cierre...');
    try {
        await waClient.destroy();
        console.log('[Sistema] ✅ Procesos de WhatsApp cerrados.');
    } catch (err) {
        console.error('[Sistema] ⚠️ Error durante la limpieza:', err.message);
    } finally {
        process.exit(0);
    }
};

process.on('SIGINT', cleanupAndQuit);
process.on('SIGTERM', cleanupAndQuit);

app.on('before-quit', async () => {
    await waClient.destroy();
});
