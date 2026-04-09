/**
 * Manejadores de Estado de Conexión 🔌
 */

export function handleAuthenticated(context) {
    const { mainWindow, appStatus } = context;
    appStatus.set('authenticated');
    console.log('[WA-Events/Conn] Autenticado. Esperando sincronización...');
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('wa:status', 'authenticated');
    }
}

export async function handleReady(context) {
    const { client, mainWindow, appStatus } = context;
    appStatus.set('connect');
    
    const me = client.info?.wid?.user || '---';
    console.log(`[WA-Events/Conn] WhatsApp Ready (${me})`);

    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('wa:status', { status: 'connect', number: me });
        // Señal de carga completada para el Dashboard
        mainWindow.webContents.send('wa:status', { status: 'boot', text: 'Aplicación lista', ready: true });
        mainWindow.webContents.send('wa:log', { text: `Conexión establecida con ${me}.`, type: 'success' });
    }
}

export function handleDisconnected(reason, context) {
    const { mainWindow, appStatus } = context;
    appStatus.set('disconnect');
    console.log('[WA-Events/Conn] Desconectado:', reason);
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('wa:status', 'disconnect');
        mainWindow.webContents.send('wa:log', { text: `Desconectado: ${reason}`, type: 'error' });
    }
}
