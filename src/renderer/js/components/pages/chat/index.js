/**
 * Componente: Chat & Mensajería 💬✨🛰️
 * Permite visualizar el historial de conversaciones y actividad real de la app.
 */
import { TemplateLoader } from '../../../core/loader.js';

export const Chat = {
    activeChat: null,
    chats: [],

    /**
     * Render inicial (Esqueleto)
     */
    render: () => `
        <div id="view-chat-container" class="animate-fade-in">
            <!-- Cargando centro de mensajes... -->
        </div>
    `,

    /**
     * Inicialización asíncrona
     */
    init: async () => {
        console.log('[Chat] 💬 Cargando interfaz de mensajería...');

        try {
            // 1. Cargar estructura y estilos
            const html = await TemplateLoader.loadHTML('chat');
            await TemplateLoader.loadCSS('chat');

            const container = document.getElementById('view-chat-container');
            if (!container) return;

            container.innerHTML = html;

            await Chat.loadChats();
            Chat.setupEventListeners();
        } catch (err) {
            console.error('[Chat] ❌ Error en inicialización:', err);
        }
    },

    /**
     * Carga la lista de chats únicos desde la base de datos
     */
    loadChats: async () => {
        try {
            Chat.chats = await window.api.getChats();
            Chat.renderContacts();
        } catch (error) {
            console.error('[Chat] ❌ Error al cargar chats:', error);
        }
    },

    /**
     * Renderiza la lista de contactos en el sidebar del chat
     */
    renderContacts: () => {
        const list = document.getElementById('chat-contacts-list');
        const searchInput = document.getElementById('chat-search');
        if (!list) return;

        const filter = searchInput?.value.toLowerCase() || '';

        if (!Array.isArray(Chat.chats)) {
            Chat.chats = [];
        }

        const filtered = Chat.chats.filter(c =>
            c.telefono.includes(filter) ||
            (c.nombre || '').toLowerCase().includes(filter)
        );

        if (filtered.length === 0) {
            list.innerHTML = `
                <div class="text-center p-20" style="opacity: 0.5;">
                    <p>No hay conversaciones aún.</p>
                    <p style="font-size: 0.75rem; margin-top: 8px;">Los chats aparecerán aquí al conectar WhatsApp.</p>
                </div>`;
            return;
        }

        list.innerHTML = filtered.map(chat => `
            <div class="contact-item ${Chat.activeChat === chat.telefono ? 'active' : ''}" 
                 data-tel="${chat.telefono}">
                <div class="avatar">
                    <span class="material-icons-outlined">account_circle</span>
                </div>
                <div class="info">
                    <div class="header-row" style="display: flex; justify-content: space-between; align-items: start;">
                        <span class="name">${chat.nombre || chat.telefono}</span>
                        <span class="time" style="font-size: 0.6rem; opacity: 0.5;">
                            ${chat.last_msg_date ? new Date(chat.last_msg_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                    </div>
                    <span class="last-msg">${chat.mensaje || 'Sin mensajes'}</span>
                </div>
            </div>
        `).join('');

        // ✅ Event delegation en lugar de onclick inline (evita problemas con caracteres especiales en teléfonos)
        list.querySelectorAll('.contact-item').forEach(item => {
            item.onclick = () => Chat.selectContact(item.dataset.tel);
        });
    },

    /**
     * Selecciona un contacto y carga su historial
     */
    selectContact: async (telefono) => {
        Chat.activeChat = telefono;

        const welcomeScreen = document.getElementById('chat-welcome-screen');
        const contentView = document.getElementById('chat-content-view');
        const activeName = document.getElementById('active-chat-name');

        if (welcomeScreen) welcomeScreen.style.display = 'none';
        if (contentView) contentView.style.display = 'flex';
        if (activeName) {
            // Buscar el nombre en los chats cargados
            const chat = Chat.chats.find(c => c.telefono === telefono);
            activeName.innerText = chat?.nombre || telefono;
        }

        Chat.renderContacts();
        await Chat.loadMessages(telefono);
    },

    /**
     * Recupera y renderiza los mensajes de un contacto
     */
    loadMessages: async (telefono) => {
        const viewport = document.getElementById('chat-messages-viewport');
        if (!viewport) return;

        try {
            const messages = await window.api.getChatMessages(telefono);
            Chat.renderMessages(messages);
        } catch (error) {
            console.error('[Chat] ❌ Error al cargar mensajes:', error);
        }
    },

    /**
     * Dibuja las burbujas de chat
     */
    renderMessages: (messages) => {
        const viewport = document.getElementById('chat-messages-viewport');
        if (!viewport) return;

        if (!messages || messages.length === 0) {
            viewport.innerHTML = `<div class="text-center" style="opacity: 0.4; padding: 40px;">Sin mensajes registrados.</div>`;
            return;
        }

        viewport.innerHTML = messages.map(msg => {
            const isSent = msg.tipo === 'enviado';
            const date = msg.fecha
                ? new Date(msg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

            return `
                <div class="chat-bubble-wrapper ${isSent ? 'sent' : 'received'}">
                    <div class="chat-bubble">
                        <div class="msg-text">${msg.mensaje}</div>
                        <span class="chat-time">${date}</span>
                    </div>
                </div>
            `;
        }).join('');

        viewport.scrollTop = viewport.scrollHeight;
    },

    /**
     * Configura listeners de eventos
     */
    setupEventListeners: () => {
        // Búsqueda en tiempo real
        const searchInput = document.getElementById('chat-search');
        searchInput?.addEventListener('input', () => Chat.renderContacts());

        // ✅ Sincronización completada desde el main process: recargar lista de chats
        window.api.onChatsSynced(async () => {
            console.log('[Chat] 🔄 Sincronización detectada, recargando chats...');
            await Chat.loadChats();
        });

        // ✅ Mensaje recibido en tiempo real
        window.api.onMessageReceived(async (data) => {
            console.log('[Chat] 📨 Mensaje entrante de:', data.tel);
            await Chat.loadChats();
            if (Chat.activeChat === data.tel) {
                await Chat.loadMessages(data.tel);
            }
        });

        // Compatibilidad con el evento anterior de campaña
        window.api.onMessageLog(async (log) => {
            await Chat.loadChats();
            if (Chat.activeChat === log.tel) {
                await Chat.loadMessages(log.tel);
            }
        });
    }
};