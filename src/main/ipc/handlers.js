import { registerWAHandlers } from './channels/wa.js';
import { registerDBHandlers } from './channels/db.js';
import { registerAIHandlers } from './channels/ai.js';
import { registerAppHandlers } from './channels/app.js';

/**
 * Registra todos los manejadores de eventos IPC para la comunicación entre Procesos. 🧠✨
 * Esta función orquesta la carga de los submódulos especializados por canal.
 * 
 * @param {BrowserWindow} mainWindow - Referencia a la ventana principal para diálogos.
 */
export function registerIPCHandlers(mainWindow) {
    console.log('[IPC] 🛰️ Registrando canales de comunicación modular...');

    // 1. Canal WhatsApp (Control, Campañas, Scanner)
    registerWAHandlers();

    // 2. Canal Base de Datos (Leads, Logs, Chats, Config)
    registerDBHandlers();

    // 3. Canal Aplicación y Sistema (Filesystem, Diálogos, Media)
    registerAppHandlers(mainWindow);

    // 4. Canal Inteligencia Artificial (Configuración, Status)
    registerAIHandlers();

    console.log('[IPC] ✅ Todos los canales inicializados con éxito.');
}
