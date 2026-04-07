import qrcode from 'qrcode';

/**
 * Gestor de Despacho de Eventos de WhatsApp (Subcomponente de Cliente)
 * Responsabilidad: Escuchar eventos del cliente y notificar al Renderer.
 */
export class EventDispatcher {
    constructor(client, mainWindow, appStatus) {
        this.client = client;
        this.mainWindow = mainWindow;
        this.appStatus = appStatus;
    }

    /**
     * Registra todos los escuchadores de eventos.
     */
    setup(messagingManager) {
        if (!this.client) return;

        // --- Evento: Código QR ---
        this.client.on('qr', (qr) => {
            this.appStatus.set('disconnect');
            qrcode.toDataURL(qr, (err, url) => {
                if (this.mainWindow) this.mainWindow.webContents.send('wa:qr-update', url);
            });
        });

        // --- Evento: Autenticación ---
        this.client.on('authenticated', () => {
            this.appStatus.set('authenticated');
            console.log('WhatsApp Events: Autenticado. Esperando sincronización...');
            if (this.mainWindow) this.mainWindow.webContents.send('wa:status', 'authenticated');
        });

        // --- Evento: Cliente Listo ---
        this.client.on('ready', () => {
            this.appStatus.set('connect');
            const me = this.client.info?.wid?.user || '---';
            console.log(`WhatsApp Events: Cliente Listo (${me})`);
            
            if (this.mainWindow) {
                this.mainWindow.webContents.send('wa:status', { 
                    status: 'connect', 
                    number: me 
                });
                this.mainWindow.webContents.send('wa:log', { 
                    text: `Conexión establecida con ${me}.`, 
                    type: 'success' 
                });
            }
        });

        // --- Evento: Desconexión ---
        this.client.on('disconnected', (reason) => {
            this.appStatus.set('disconnect');
            console.log('WhatsApp Events: Desconectado.', reason);
            if (this.mainWindow) {
                this.mainWindow.webContents.send('wa:status', 'disconnect');
                this.mainWindow.webContents.send('wa:log', { 
                    text: `Desconectado: ${reason}`, 
                    type: 'error' 
                });
            }
        });

        // --- Evento: Mensaje Entrante ---
        this.client.on('message', async (msg) => {
            if (messagingManager) {
                await messagingManager.handleIncomingMessage(msg);
            }
        });
    }
}
