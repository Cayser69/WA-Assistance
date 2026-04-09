/**
 * Subcomponente: ChatWindow 🖼️🎤📜
 * Responsabilidad: Renderizado de mensajes, multimedia y pantalla de bienvenida.
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

        // 1. Auto-ajuste de altura del textarea
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = (input.scrollHeight) + 'px';
        });

        // 2. Enviar con Enter (sin Shift)
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                ChatWindow.handleSendMessage();
            }
        });

        // 3. Click en Enviar
        btnSend.addEventListener('click', () => ChatWindow.handleSendMessage());

        // 4. Click en Asistente IA ✨
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
            // Deshabilitar temporalmente para evitar doble envío
            input.disabled = true;
            const result = await window.api.sendMessage(phone, message);
            
            if (result.success) {
                input.value = '';
                input.style.height = 'auto';
                // El mensaje se pintará automáticamente vía IPC (onMessageReceived)
            } else {
                alert('Error al enviar: ' + result.error);
            }
        } catch (err) {
            console.error('[ChatWindow] Fallo en envío:', err);
        } finally {
            input.disabled = false;
            input.focus();
        }
    },

    /**
     * Solicita una sugerencia a la IA basada en el contexto actual ✨
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
        if (activeName) activeName.innerText = nombre || telefono;

        // Limpiar input al cambiar de chat 🧼
        const input = document.getElementById('chat-input-text');
        if (input) {
            input.value = '';
            input.style.height = 'auto';
        }

        try {
            const messages = await window.api.getChatMessages(telefono);
            ChatWindow.renderMessages(messages);
        } catch (error) {
            console.error('[ChatWindow] ❌ Error:', error);
        }
    },

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

            // --- Lógica Multimedia 🛰️ ---
            let mediaHtml = '';
            if (msg.media_path) {
                const mediaUrl = `app-media://${msg.media_path.replace(/\\/g, '/')}`;
                if (msg.mimetype?.startsWith('image/')) {
                    mediaHtml = `<div class="media-container"><img src="${mediaUrl}" class="chat-media-img" onclick="window.open('${mediaUrl}')"></div>`;
                } else if (msg.mimetype?.startsWith('audio/')) {
                    mediaHtml = `
                        <div class="media-container audio">
                            <audio controls class="chat-media-audio"><source src="${mediaUrl}" type="${msg.mimetype}"></audio>
                        </div>`;
                }
            }

            return `
                <div class="chat-bubble-wrapper ${isSent ? 'sent' : 'received'}">
                    <div class="chat-bubble">
                        ${mediaHtml}
                        ${msg.mensaje ? `<div class="msg-text">${msg.mensaje}</div>` : ''}
                        <span class="chat-time">${date}</span>
                    </div>
                </div>
            `;
        }).join('');

        viewport.scrollTop = viewport.scrollHeight;
    }
};
