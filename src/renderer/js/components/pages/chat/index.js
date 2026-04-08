/**
 * Componente: Chat & Mensajería 💬✨🛰️
 * Permite visualizar el historial de conversaciones y actividad real de la app.
 */
import { AppState } from '../../../core/state.js';
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

            // Inyectamos el HTML modular
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
        
        // Validación de Seguridad: Asegurar que Chat.chats sea un Array 🛡️
        if (!Array.isArray(Chat.chats)) {
            console.warn('[Chat] ⚠️ Los chats no se han cargado como un Array:', Chat.chats);
            Chat.chats = [];
        }

        const filtered = Chat.chats.filter(c => c.telefono.includes(filter));

        if (filtered.length === 0) {
            list.innerHTML = `<div class="text-center p-20" style="opacity: 0.5;"><p>No hay conservaciones aún.</p></div>`;
            return;
        }

        list.innerHTML = filtered.map(chat => `
            <div class="contact-item ${Chat.activeChat === chat.telefono ? 'active' : ''}" 
                 onclick="Chat.selectContact('${chat.telefono}')">
                <div class="avatar">
                    <span class="material-icons-outlined">account_circle</span>
                </div>
                <div class="info">
                    <div class="header-row" style="display: flex; justify-content: space-between; align-items: start;">
                        <span class="name">${chat.nombre || chat.telefono}</span>
                        <span class="time" style="font-size: 0.6rem; opacity: 0.5;">${new Date(chat.last_msg_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span class="last-msg">${chat.mensaje || 'Sin mensajes'}</span>
                </div>
            </div>
        `).join('');
    },

    /**
     * Selecciona un contacto y carga su historial
     */
    selectContact: async (telefono) => {
        Chat.activeChat = telefono;
        
        // UI Updates
        document.getElementById('chat-welcome-screen').style.display = 'none';
        document.getElementById('chat-content-view').style.display = 'flex';
        document.getElementById('active-chat-name').innerText = telefono;
        
        Chat.renderContacts(); // Actualizar clase 'active'
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

        viewport.innerHTML = messages.map(msg => {
            const isSent = msg.tipo === 'enviado';
            const date = new Date(msg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return `
                <div class="chat-bubble-wrapper ${isSent ? 'sent' : 'received'}">
                    <div class="chat-bubble">
                        <div class="msg-text">${msg.mensaje}</div>
                        <span class="chat-time">${date}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Auto-scroll al fondo
        viewport.scrollTop = viewport.scrollHeight;
    },

    /**
     * Configura listeners de eventos (Búsqueda y Logs en tiempo real)
     */
    setupEventListeners: () => {
        // Búsqueda en tiempo real
        const searchInput = document.getElementById('chat-search');
        searchInput?.addEventListener('input', () => Chat.renderContacts());

        // Actualización en tiempo real desde WhatsApp
        window.api.onMessageLog(async (log) => {
            console.log('[Chat] 📨 Nuevo mensaje detectado, actualizando historial...');
            await Chat.loadChats(); // Recargar lista de contactos para mostrar el último mensaje
            
            // Si el mensaje es del chat activo, recargar mensajes
            if (Chat.activeChat === log.tel) {
                await Chat.loadMessages(log.tel);
            }
        });
    }
};
