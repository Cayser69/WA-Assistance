import { Toast } from '../../../shared/toast.js';

/**
 * Sub-componente: ChatWindow 🖼️🎤📜
 * Responsabilidad: Renderizado de mensajes, multimedia y gestión de estados (Checks).
 */
export const ChatWindow = {
    activeChat: null,

    /**
     * Inicializa la ventana (Estado inicial y Eventos)
     */
    init: () => {
        const welcomeScreen = document.getElementById('chat-welcome-screen');
        const contentView = document.getElementById('chat-content-view');
        if (welcomeScreen) welcomeScreen.style.display = 'flex';
        if (contentView) contentView.style.display = 'none';

        ChatWindow.setupInputEvents();
    },

    /**
     * Configura los eventos de la barra de entrada 🛰️
     */
    setupInputEvents: () => {
        const input = document.getElementById('chat-input-text');
        const btnSend = document.getElementById('btn-chat-send');
        const btnAI = document.getElementById('btn-chat-ai');

        if (!input || !btnSend || !btnAI) return;

        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = (input.scrollHeight) + 'px';
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                ChatWindow.handleSendMessage();
            }
        });

        btnSend.addEventListener('click', () => ChatWindow.handleSendMessage());
        btnAI.addEventListener('click', () => ChatWindow.handleAISuggestion());
    },

    /**
     * Procesa el envío del mensaje actual
     */
    handleSendMessage: async () => {
        const input = document.getElementById('chat-input-text');
        const message = input?.value.trim();
        const phone = ChatWindow.activeChat;

        if (!message || !phone) return;

        try {
            input.disabled = true;
            const result = await window.api.sendMessage(phone, message);
            
            if (result.success) {
                input.value = '';
                input.style.height = 'auto';
            } else {
                Toast.error('Error al enviar: ' + result.error);
            }
        } catch (err) {
            console.error('[ChatWindow] Fallo en envío:', err);
        } finally {
            input.disabled = false;
            input.focus();
        }
    },

    /**
     * Solicita una sugerencia a la IA ✨
     */
    handleAISuggestion: async () => {
        const phone = ChatWindow.activeChat;
        const btnAI = document.getElementById('btn-chat-ai');
        const input = document.getElementById('chat-input-text');

        if (!phone || !btnAI || !input) return;

        try {
            btnAI.classList.add('loading');
            input.placeholder = 'La IA está redactando una sugerencia...';
            
            const result = await window.api.getAISuggestion(phone);
            
            if (result.success && result.suggestion) {
                input.value = result.suggestion;
                input.style.height = 'auto';
                input.style.height = (input.scrollHeight) + 'px';
            }
        } catch (err) {
            console.error('[ChatWindow] Error en sugerencia IA:', err);
        } finally {
            btnAI.classList.remove('loading');
            input.placeholder = 'Escribe un mensaje...';
            input.focus();
        }
    },

    /**
     * Carga y muestra los mensajes de un contacto
     */
    loadMessages: async (telefono, nombre) => {
        ChatWindow.activeChat = telefono;
        
        const welcomeScreen = document.getElementById('chat-welcome-screen');
        const contentView = document.getElementById('chat-content-view');
        const activeName = document.getElementById('active-chat-name');

        if (welcomeScreen) welcomeScreen.style.display = 'none';
        if (contentView) contentView.style.display = 'flex';
        if (activeName && nombre) activeName.innerText = nombre;

        try {
            const messages = await window.api.getChatMessages(telefono);
            ChatWindow.renderMessages(messages);
        } catch (error) {
            console.error('[ChatWindow] ❌ Error:', error);
        }
    },

    /**
     * Renderiza la cola de mensajes en el viewport 📜🛰️
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
            const date = msg.fecha ? new Date(msg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            // Lógica de Checks (Ack) 🛰️
            let ackHtml = '';
            if (isSent) {
                const ackClass = msg.ack === 3 ? 'ack-read' : (msg.ack >= 1 ? 'ack-delivered' : 'ack-error');
                const ackIcon = msg.ack >= 2 ? 'done_all' : (msg.ack === 1 ? 'done' : 'error_outline');
                ackHtml = `<span class="message-ack ${ackClass} material-icons-outlined" data-msg-id="${msg.msg_id}">${ackIcon}</span>`;
            }

            let mediaHtml = '';
            if (msg.media_path) {
                const mediaUrl = `app-media://${msg.media_path.replace(/\\/g, '/')}`;
                if (msg.mimetype?.startsWith('image/')) {
                    mediaHtml = `<div class="media-container"><img src="${mediaUrl}" class="chat-media-img" onclick="window.open('${mediaUrl}')"></div>`;
                } else if (msg.mimetype?.startsWith('audio/')) {
                    mediaHtml = `<div class="media-container audio"><audio controls class="chat-media-audio"><source src="${mediaUrl}" type="${msg.mimetype}"></audio></div>`;
                }
            }

            return `
                <div class="chat-bubble-wrapper ${isSent ? 'sent' : 'received'}">
                    <div class="chat-bubble" id="msg-${msg.msg_id}">
                        ${mediaHtml}
                        ${msg.mensaje ? `<div class="msg-text">${msg.mensaje}</div>` : ''}
                        <div class="msg-meta">
                            <span class="chat-time">${date}</span>
                            ${ackHtml}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        viewport.scrollTop = viewport.scrollHeight;
    },

    /**
     * Actualiza el estado de un mensaje en tiempo real (Optimización vía DOM) 🛰️⚡
     */
    handleMessageAck: (msgId, ack) => {
        const checkEl = document.querySelector(`.message-ack[data-msg-id="${msgId}"]`);
        if (!checkEl) return;

        const ackClass = ack === 3 ? 'ack-read' : (ack >= 1 ? 'ack-delivered' : 'ack-error');
        const ackIcon = ack >= 2 ? 'done_all' : (ack === 1 ? 'done' : 'error_outline');

        checkEl.className = `message-ack ${ackClass} material-icons-outlined`;
        checkEl.innerText = ackIcon;
    }
};
