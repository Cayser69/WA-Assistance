import fs from 'fs';
import path from 'path';
import electron from 'electron';
const { app } = electron;
import { SessionManager } from '../managers/session.js';
import { MessagingManager } from '../managers/messaging.js';
import { EventDispatcher } from '../managers/events.js';

/**
 * Gestor de Inicialización de WhatsApp 🚀
 * Responsabilidad: Manejar el arranque del navegador, la reparación de sesiones y reintentos.
 */
export class WhatsAppInitializer {
    constructor(parent) {
        this.parent = parent;
        this.initRetries = 0;
    }

    /**
     * Lógica principal de arranque y vinculación.
     */
    async run(mainWindow) {
        this.parent.initializing = true;
        this.parent.mainWindow = mainWindow;

        const authPath = path.join(app.getPath('userData'), 'whatsapp_session');
        const sessionPath = path.join(authPath, 'session-sales-assistant');

        // 1. Verificación y Reparación
        if (fs.existsSync(sessionPath)) {
            console.log(`[WA-Init] 🛠️ Reparando sesión previa en ${sessionPath}...`);
            await SessionManager.repair(authPath);
        }

        // 2. Creación de Instancia
        this.parent.client = SessionManager.create(authPath);

        // 3. Vincular Gestores
        this.parent.messaging = new MessagingManager(this.parent.client, this.parent.mainWindow);
        this.parent.events = new EventDispatcher(this.parent.client, this.parent.mainWindow, {
            set: (status) => { this.parent.waStatus = status; }
        });

        this.parent.events.setup(this.parent.messaging);

        // 4. Lanzar Inicialización
        try {
            console.log('[WA-Init] 🚀 Arrancando client.initialize()...');
            await this.parent.client.initialize();
            this.parent.initialized = true;
        } catch (err) {
            await this.handleError(err, authPath);
        } finally {
            this.parent.initializing = false;
        }
    }

    /**
     * Gestión recursiva de errores de protocolo e instancia.
     */
    async handleError(err, authPath) {
        console.error('[WA-Init] ❌ Error crítico:', err.message);
        this.initRetries++;

        if (this.initRetries > 2) {
            this.parent.waStatus = 'error';
            this.emitToUI('wa:status', 'error');
            return;
        }

        if (err.message.includes('already running') || err.message.includes('Protocol error')) {
            console.warn('[WA-Init] ⚠️ Navegador bloqueado. Intentando parche quirúrgico...');
            await SessionManager.repair(authPath);
            
            setTimeout(async () => {
                if (this.parent.client) {
                    try {
                        await this.parent.client.initialize();
                    } catch (retryErr) {
                        await this.handleError(retryErr, authPath);
                    }
                }
            }, 15000);
        } else {
            this.parent.waStatus = 'error';
            this.emitToUI('wa:status', 'error');
        }
    }

    emitToUI(channel, data) {
        if (this.parent.mainWindow && !this.parent.mainWindow.isDestroyed()) {
            this.parent.mainWindow.webContents.send(channel, data);
        }
    }
}
