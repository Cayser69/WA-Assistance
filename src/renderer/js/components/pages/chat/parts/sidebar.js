/**
 * Subcomponente: ChatSidebar 👥🔍
 * Responsabilidad: Gestión de lista de contactos y buscador.
 */
export const ChatSidebar = {
    chats: [],
    activeChat: null,
    onSelect: null, // Callback para notificar al orquestador

    /**
     * Carga la lista de chats únicos
     */
    init: async (onSelectCallback) => {
        ChatSidebar.onSelect = onSelectCallback;
        await ChatSidebar.loadChats();
        ChatSidebar.setupListeners();
    },

    loadChats: async () => {
        try {
            ChatSidebar.chats = await window.api.getChats();
            ChatSidebar.render();
        } catch (error) {
            console.error('[ChatSidebar] ❌ Error:', error);
        }
    },

    render: () => {
        const list = document.getElementById('chat-contacts-list');
        const searchInput = document.getElementById('chat-search');
        if (!list) return;

        const filter = searchInput?.value.toLowerCase() || '';
        const filtered = ChatSidebar.chats.filter(c =>
            c.telefono.includes(filter) || (c.nombre || '').toLowerCase().includes(filter)
        );

        const formatPhone = (tel) => {
            if (!tel) return '';
            const clean = tel.split('@')[0];
            if (clean.startsWith('34') && clean.length === 11) {
                return `+34 ${clean.substring(2, 5)} ${clean.substring(5, 8)} ${clean.substring(8)}`;
            }
            return clean;
        };

        if (filtered.length === 0) {
            list.innerHTML = `<div class="text-center p-20" style="opacity: 0.5;">No hay chats aún.</div>`;
            return;
        }

        list.innerHTML = filtered.map(chat => `
            <div class="contact-item ${ChatSidebar.activeChat === chat.telefono ? 'active' : ''}" data-tel="${chat.telefono}">
                <div class="avatar">
                    <span class="material-icons-outlined" style="color: ${chat.nombre ? 'var(--primary)' : 'inherit'}">
                        ${chat.nombre ? 'person' : 'account_circle'}
                    </span>
                </div>
                <div class="info">
                    <div class="header-row" style="display: flex; justify-content: space-between;">
                        <span class="name">${chat.nombre || formatPhone(chat.telefono)}</span>
                        <span class="time" style="font-size: 0.6rem; opacity: 0.5;">
                            ${chat.last_msg_date ? new Date(chat.last_msg_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                    </div>
                    <span class="last-msg">${chat.mensaje || 'Sin mensajes'}</span>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.contact-item').forEach(item => {
            item.onclick = () => {
                ChatSidebar.activeChat = item.dataset.tel;
                ChatSidebar.render(); // Actualizar estado visual
                if (ChatSidebar.onSelect) ChatSidebar.onSelect(item.dataset.tel);
            };
        });
    },

    setupListeners: () => {
        const searchInput = document.getElementById('chat-search');
        searchInput?.addEventListener('input', () => ChatSidebar.render());
    }
};
