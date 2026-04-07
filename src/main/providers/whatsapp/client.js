import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Importación de Subcomponentes (Estructura Plana) ---
import { SessionManager } from './client/session.js';
import { MessagingManager } from './client/messaging.js';
import { EventDispatcher } from './client/events.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Cliente de WhatsApp (Orquestador Principal)
 * Responsabilidad: Coordinar los subcomponentes de sesión, mensajería y eventos.
 */
class WhatsAppClient {
    constructor() {
        this.client = null;
        this.mainWindow = null;
        this.waStatus = 'disconnect';
        
        // Sub-gestores
        this.messaging = null;
        this.events = null;
    }

    /**
     * Obtiene el estado actual de la conexión.
     */
    getStatus() {
        return this.waStatus;
    }

    /**
     * Inicializa el cliente de WhatsApp y sus subcomponentes.
     */
    async init(mainWindow) {
        this.mainWindow = mainWindow;

        // Centralizamos la sesión en una ruta LOCAL estática y limpia 📂✨
        const authPath = path.join(process.cwd(), '.app_data', 'whatsapp_session');
        const sessionPath = path.join(authPath, 'session-sales-assistant');
        
        console.log(`[WhatsApp] 📂 Sesión centralizada: ${authPath}`);

        // 1. Verificación y Reparación de Sesión (Solo si existe carpeta)
        if (fs.existsSync(sessionPath)) {
            console.log('WhatsApp: Detectada sesión previa. Lanzando verificador de bloqueos...');
            await SessionManager.repair(authPath);
            if (this.mainWindow) {
                this.mainWindow.webContents.send('wa:log', { 
                    text: 'Verificando sesión protegida...', 
                    type: 'info' 
                });
            }
        }

        // 2. Definición del Cliente (Delegado al SessionManager)
        this.client = SessionManager.create(authPath);

        // 3. Inicializar Subcomponentes
        this.messaging = new MessagingManager(this.client, this.mainWindow);
        this.events = new EventDispatcher(this.client, this.mainWindow, {
            set: (newStatus) => { this.waStatus = newStatus; }
        });

        // 4. Configurar Eventos
        this.events.setup(this.messaging);
        
        // 5. Lanzar Inicialización con Gestión de Errores
        try {
            await this.client.initialize();
        } catch (err) {
            await this.handleInitError(err, authPath);
        }
    }

    /**
     * Gestión centralizada de errores de arranque del navegador.
     */
    async handleInitError(err, authPath) {
        console.error('[WhatsApp] ❌ Error de inicialización:', err.message);
        
        // Evitar bucles infinitos de reintentos
        this.initRetries = (this.initRetries || 0) + 1;
        if (this.initRetries > 2) {
            console.error('[WhatsApp] 🚫 Límite de reintentos alcanzado. Requiere Intervención Manual.');
            this.waStatus = 'error';
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('wa:status', 'error');
                this.mainWindow.webContents.send('wa:log', { 
                    text: '❌ ERROR PERSISTENTE. Por favor, reinicia la computadora o borra la carpeta .wwebjs_auth manualmente.', 
                    type: 'error' 
                });
            }
            return;
        }

        if (err.message.includes('already running') || err.message.includes('Protocol error')) {
            console.warn('[WhatsApp] ⚠️ Error de instancia detectado. Intentando reparación profunda...');
            
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('wa:log', { 
                    text: '⚠️ Navegador bloqueado. Reparando rastro de procesos...', 
                    type: 'warning' 
                });
            }
            
            // 1. Ejecutar reparación modular
            await SessionManager.repair(authPath);
            
            // 2. Reintento programado con retardo de seguridad (Cortesía de 15s)
            console.log(`[WhatsApp] ⏳ Reparación completa. Reintento ${this.initRetries}/2 en 15s...`);
            
            setTimeout(async () => {
                if (this.client) {
                    try {
                        console.log('[WhatsApp] 🚀 Lanzando reintento...');
                        await this.client.initialize();
                    } catch (retryErr) {
                        await this.handleInitError(retryErr, authPath);
                    }
                }
            }, 15000);
        } else {
            // Error fatal (Ej: QR caducado o red)
            this.waStatus = 'error';
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('wa:status', 'error');
            }
        }
    }

    // --- Métodos Delegados para Compatibilidad ---
    
    async sendMessage(phone, msg) {
        return await this.messaging.send(phone, msg);
    }

    async isRegistered(phone) {
        return await this.messaging.isRegistered(phone);
    }

    async getContactName(phone) {
        return await this.messaging.getContactName(phone);
    }

    /**
     * Cierra la sesión y limpia rastro local de forma segura delegando al SessionManager.
     */
    async logout() {
        if (!this.client || !this.mainWindow) return;
        
        console.log('WhatsApp: Iniciando proceso de desconexión...');
        if (this.mainWindow) {
            this.mainWindow.webContents.send('wa:log', { 
                text: 'Cerrando sesión de forma segura...', 
                type: 'info' 
            });
        }

        const authPath = path.join(process.cwd(), '.wwebjs_auth');

        try {
            // Delegar toda la desconexión y borrado al gestor de sesión
            await SessionManager.logout(this.client, authPath);
        } finally {
            this.waStatus = 'disconnect';
            if (this.mainWindow) this.mainWindow.webContents.send('wa:status', 'disconnect');
            
            // Re-inicializar para mostrar el nuevo QR
            await this.init(this.mainWindow);
        }
    }

    /**
     * Limpieza total de recursos (The Clean Exit) ✨
     */
    async destroy() {
        if (!this.client) return;

        console.log('[WhatsApp] 🛡️ Solicitando cierre ordenado de Chrome...');
        
        try {
            // Un cierre limpio primero
            await this.client.destroy();
        } catch (e) {
            // Forzar el cierre de la instancia de Puppeteer si el cliente falla
            if (this.client.pupBrowser) {
                console.log('[WhatsApp] ⚠️ Forzando cierre del navegador...');
                await this.client.pupBrowser.close().catch(() => {});
            }
        } finally {
            this.client = null;
            this.waStatus = 'disconnect';
            console.log('[WhatsApp] 🧼 Limpieza de cliente completada.');
        }
    }
}

export const waClient = new WhatsAppClient();
export { MessageMedia };
