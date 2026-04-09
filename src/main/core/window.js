import electron from 'electron';
const { BrowserWindow } = electron;
import path from 'path';

/**
 * Gestor de Ventanas 🖥️
 */
export function createWindow(config) {
    const { __dirname, registerIPCHandlers, waClient, waScanner, waCampaign, watchRenderer, isPackaged } = config;

    console.log('[Main/Window] 🖥️ Inicializando ventana principal...');
    
    const mainWindow = new BrowserWindow({
        width: 1100, height: 800,
        backgroundColor: '#0f172a',
        icon: path.join(__dirname, '..', '..', 'assets', 'icon.png'),
        show: false,
        webPreferences: {
            preload: path.join(__dirname, '..', 'preload', 'index.js'),
            contextIsolation: true, 
            nodeIntegration: false, 
            webSecurity: false
        }
    });

    // Registrar manejadores IPC vinculados a esta ventana
    if (registerIPCHandlers) registerIPCHandlers(mainWindow);

    const indexPath = path.resolve(__dirname, '..', 'renderer', 'index.html');
    mainWindow.loadFile(indexPath);
    mainWindow.setMenuBarVisibility(false);

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
        
        console.log('[Main/Window] 🤖 Activando servicios de fondo...');
        if (waClient) waClient.init(mainWindow);
        if (waScanner) waScanner.init(mainWindow);
        if (waCampaign) waCampaign.init(mainWindow);
        
        // Activar Hot-Reload en desarrollo
        if (!isPackaged && watchRenderer) {
            const rendererPath = path.join(__dirname, '..', 'renderer');
            watchRenderer(mainWindow, rendererPath);
        }
    });

    return mainWindow;
}
