import * as qrHandler from './events/qr.js';
import * as connHandler from './events/connection.js';
import * as syncHandler from './events/sync.js';

/**
 * Gestor de Eventos de WhatsApp (Orquestador Modular) 📂🏗️✨
 */
export class EventDispatcher {
    constructor(client, mainWindow, appStatus) {
        this.client = client;
        this.mainWindow = mainWindow;
        this.appStatus = appStatus;
    }

    /**
     * Vincula los eventos del cliente de WhatsApp con sus respectivos manejadores.
     */
    setup(messagingManager) {
        if (!this.client) return;

        // Contexto compartido para los manejadores
        const context = {
            client: this.client,
            mainWindow: this.mainWindow,
            appStatus: this.appStatus,
            messagingManager
        };

        // 1. Evento de Escaneo QR
        this.client.on('qr', (qr) => qrHandler.handleQR(qr, context));

        // 2. Eventos de Estado de Conexión
        this.client.on('authenticated', () => connHandler.handleAuthenticated(context));
        this.client.on('ready', () => connHandler.handleReady(context));
        this.client.on('disconnected', (reason) => connHandler.handleDisconnected(reason, context));

        // 3. Evento de Control Total de Mensajes (Entrantes y Salientes)
        this.client.on('message_create', async (msg) => {
            if (messagingManager) await messagingManager.handleMessage(msg);
        });

        // 4. Evento de Confirmación de Entrega/Lectura (Ack) 🛰️
        this.client.on('message_ack', async (msg, ack) => {
            if (messagingManager) await messagingManager.handleMessageAck(msg, ack);
        });
    }

    /**
     * Acceso directo a utilidades de sincronización (Si se requiere desde fuera)
     */
    async syncRecentChats() {
        return await syncHandler.syncRecentChats({
            client: this.client,
            mainWindow: this.mainWindow
        });
    }
}
