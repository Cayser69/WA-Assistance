import qrcode from 'qrcode';

/**
 * Manejador de eventos QR 🤳
 */
export function handleQR(qr, context) {
    const { mainWindow, appStatus } = context;
    
    appStatus.set('disconnect');
    
    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error('[WA-Events/QR] Error generando código QR:', err);
            return;
        }
        
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('wa:qr-update', url);
        }
    });
}
