import electron from 'electron';
const { BrowserWindow } = electron;
import path from 'path';

/**
 * Gestor de Ventanas 🖥️
 */
export function createWindow(config) {
    const { __dirname, registerIPCHandlers, waClient, waScanner, waCampaign, aiClient, isPackaged } = config;

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

    const indexPath = path.join(__dirname, '..', 'renderer', 'index.html');
    mainWindow.loadFile(indexPath);
    mainWindow.setMenuBarVisibility(false);

    mainWindow.on('ready-to-show', async () => {
        mainWindow.show();
        
        console.log('[Main/Window] 🤖 Activando servicios de fondo...');
        if (waClient) waClient.init(mainWindow);
        if (waScanner) waScanner.init(mainWindow);
        if (waCampaign) waCampaign.init(mainWindow);

        // Notificar estado de IA inmediatamente 🛰️
        if (aiClient) {
            const status = await aiClient.getStatus();
            mainWindow.webContents.send('wa:ai-status', status);
            console.log('[Main/Window] 🛰️ Estado de IA enviado proactivamente al Hub.');
        }
    });

    // 💀 SENSOR DE MUERTE NATIVA (Diagnóstico)
    mainWindow.webContents.on('render-process-gone', (event, details) => {
        console.error('\n\n[FATAL ERROR] Proceso de renderizado (Ventana) perdido:');
        console.error('Motivo:', details.reason);
        console.error('Código de salida:', details.exitCode);
        console.error('----------------------------------------------------------\n\n');
    });

    return mainWindow;
}
