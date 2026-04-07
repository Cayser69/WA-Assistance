import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { app, BrowserWindow, ipcMain } = require('electron');
import path from 'path';
import fs from 'fs';
import url, { fileURLToPath } from 'url';

// Disable electron security warnings since we disabled webSecurity intentionally
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

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
 * Hot Reload para el Renderer sin reiniciar el proceso principal.
 */
let lastReload = 0;
function watchRenderer(window) {
    const rendererPath = path.join(__dirname, '..', 'renderer');
    const bootTime = Date.now();
    
    fs.watch(rendererPath, { recursive: true }, (eventType, filename) => {
            console.log(`[Watcher] 🔍 Evento '${eventType}' en: ${filename}`);
            const now = Date.now();
            // Ignorar cambios detectados en los primeros 10s tras el arranque o si han pasado menos de 5s desde el último reload.
            if (now - bootTime < 10000 || now - lastReload < 5000) {
                console.log(`[Watcher] ⏳ Ignorando reload (booting/debounce)...`);
                return;
            }
            lastReload = now;

            console.log(`[UI] 🔄 RECARGANDO VENTANA por cambio en ${filename}...`);
            window.reload();
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
    const indexPath = path.resolve(__dirname, '..', 'renderer', 'index.html');
    const indexUrl = url.pathToFileURL(indexPath).toString();
    console.log(`[Main] 🌐 Cargando URL de la interfaz: ${indexUrl}`);
    mainWindow.loadURL(indexUrl);
    mainWindow.setMenuBarVisibility(false);

    // --- PUENTE DE LOGS DEL RENDERER (Debug) ---
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        // Reducir la verbosidad: Imprimir sólo si es un error (level >= 2) o si hay variable de entorno DEBUG
        if (level < 2 && process.env.DEBUG !== 'true') return;
        
        const levels = ['ℹ️ INFO', '⚠️ WARN', '❌ ERROR', '💬 LOG'];
        console.log(`[Renderer-${levels[level] || 'LOG'}] ${message} (${path.basename(sourceId)}:${line})`);
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error(`[Main] 🔥 FALLO DE CARGA en ${validatedURL}: ${errorDescription} (${errorCode})`);
    });

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
        
        // 2. Lanzar servicios con retardo de seguridad (3s) ⏳✨
        // Esto garantiza que la interfaz (Renderer) esté lista antes de tocar WhatsApp.
        console.log('[Main] ⏳ Iniciando espera de 3s antes de arrancar los motores...');
        setTimeout(async () => {
            console.log('[Main] 🕒 FIN de espera de 3s. Arrancando WA...');
            console.log('Main: ✨ Inicializando motor de WhatsApp (3s Delay)...');
            await waClient.init(mainWindow);
            console.log('[Main] ✅ WhatsApp inicializado (pasando a Scanner/Campaign)...');
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
