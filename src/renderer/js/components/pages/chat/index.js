import { TemplateLoader } from '../../../core/loader.js';
import { ChatSidebar } from './parts/sidebar.js';
import { ChatWindow } from './parts/window.js';

/**
 * Orquestador Principal: Chat 💬✨🛰️
 * Responsabilidad: Coordinar el Sidebar y la Ventana de Mensajes.
 */
export const Chat = {
    /**
     * Render inicial (Esqueleto con Carga Visual)
     */
    render: () => `
        <div id="view-chat-container" class="animate-fade-in" style="height: 100%; width: 100%; display: flex; align-items: center; justify-content: center;">
            <div class="text-center" style="opacity: 0.6;">
                <div class="animate-spin" style="width: 32px; height: 32px; border: 3px solid var(--primary); border-top-color: transparent; border-radius: 50%; margin: 0 auto 15px;"></div>
                <p style="font-size: 0.9rem; letter-spacing: 1px;">CARGANDO CENTRO DE MENSAJES...</p>
            </div>
        </div>
    `,

    /**
     * Inicialización asíncrona modular
     */
    init: async () => {
        console.log('[Chat/Orchestrator] 💬 Iniciando componentes modulares...');

        try {
            // 1. Cargar estructura base
            const html = await TemplateLoader.loadHTML('chat');
            await TemplateLoader.loadCSS('chat');

            const container = document.getElementById('view-chat-container');
            if (!container) return;
            container.innerHTML = html;

            // 2. Inicializar Sub-módulos
            await ChatSidebar.init(Chat.handleContactSelect);
            ChatWindow.init();

            // 3. Suscribir Eventos Globales (IPC) 📡
            Chat.setupGlobalEvents();
        } catch (err) {
            console.error('[Chat] ❌ Error en orquestación:', err);
        }
    },

    /**
     * Delegación: El Sidebar nos avisa que el usuario cambió de chat 🔌
     */
    handleContactSelect: async (tel) => {
        const chat = ChatSidebar.chats.find(c => c.telefono === tel);
        await ChatWindow.loadMessages(tel, chat?.nombre);
    },

    /**
     * Sincronización en tiempo real desde el Main Process 🛰️
     */
    setupGlobalEvents: () => {
        // Al recibir un nuevo mensaje (Entrante o Saliente)
        window.api.onMessageReceived(async (data) => {
            await ChatSidebar.loadChats();
            if (ChatSidebar.activeChat === data.tel) {
                await ChatWindow.loadMessages(data.tel);
            }
        });

        // Sincronización masiva de chats
        window.api.onChatsSynced(async () => {
            await ChatSidebar.loadChats();
        });

        // Logs genéricos del sistema
        window.api.onMessageLog(async (log) => {
            await ChatSidebar.loadChats();
            if (ChatSidebar.activeChat === log.tel) {
                await ChatWindow.loadMessages(log.tel);
            }
        });
    }
};