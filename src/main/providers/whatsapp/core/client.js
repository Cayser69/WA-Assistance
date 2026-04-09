import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import path from 'path';
import electron from 'electron';
const { app } = electron;

// Sub-gestores y Servicios Modulares 🛰️
import { SessionManager } from '../managers/session/index.js';
import { WhatsAppInitializer } from './initializer.js';

/**
 * Cliente de WhatsApp (Coordinador)
 * Responsabilidad: Orquestar la comunicación entre la UI y los gestores de bajo nivel.
 */
class WhatsAppClient {
    constructor() {
        this.client = null;
        this.mainWindow = null;
        this.waStatus = 'disconnect';
        
        // Sub-gestores
        this.messaging = null;
        this.events = null;
        this.initializer = new WhatsAppInitializer(this);

        // Estados
        this.initializing = false;
        this.initialized = false;
    }

    getStatus() { return this.waStatus; }

    /**
     * Punto de entrada de inicialización delegado al módulo Initializer.
     */
    async init(mainWindow) {
        if (this.initializing || this.initialized) {
            this.mainWindow = mainWindow;
            if (this.messaging) this.messaging.mainWindow = mainWindow;
            if (this.events) this.events.mainWindow = mainWindow;

            if (this.initialized && this.mainWindow) {
                this.mainWindow.webContents.send('wa:status', { 
                    status: this.waStatus, 
                    number: this.client?.info?.wid?.user 
                });
            }
            return;
        }

        await this.initializer.run(mainWindow);
    }

    // --- Métodos de Acción (Firma conservada para compatibilidad) ---
    
    async sendMessage(phone, msg) {
        return await this.messaging?.send(phone, msg);
    }

    async isRegistered(phone) {
        return await this.messaging?.isRegistered(phone);
    }

    async getContactName(phone) {
        return await this.messaging?.getContactName(phone);
    }

    async getContacts() {
        return await this.messaging?.getContacts() || [];
    }

    /**
     * Desconexión segura delegando al gestor de sesión.
     */
    async logout() {
        if (!this.client || !this.mainWindow) return;
        
        const authPath = path.join(app.getPath('userData'), 'whatsapp_session');
        try {
            await SessionManager.logout(this.client, authPath);
        } finally {
            this.waStatus = 'disconnect';
            if (this.mainWindow) this.mainWindow.webContents.send('wa:status', 'disconnect');
            await this.init(this.mainWindow);
        }
    }

    async destroy() {
        if (!this.client) return;
        try {
            await this.client.destroy();
        } catch (e) {
            if (this.client.pupBrowser) await this.client.pupBrowser.close().catch(() => {});
        } finally {
            this.client = null;
            this.waStatus = 'disconnect';
        }
    }
}

export const waClient = new WhatsAppClient();
export { MessageMedia };
