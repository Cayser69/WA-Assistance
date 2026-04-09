/**
 * Manejador de Sincronización y Utilidades 🔄
 */

/**
 * Aplica el parche para evitar errores de carga de chat en WA Business.
 */
export async function patchBrowser(client) {
    try {
        await client.pupPage.evaluate(() => {
            if (!window.Store) return false;
            for (const key of Object.keys(window.Store)) {
                const mod = window.Store[key];
                if (mod && typeof mod.waitForChatLoading === 'function') {
                    mod.waitForChatLoading = async () => Promise.resolve();
                }
            }
            try {
                const chat = window.Store.Chat?.models?.[0] || Array.from(window.Store.Chat?.values?.() || [])[0];
                if (chat && chat.constructor?.prototype?.waitForChatLoading) {
                    chat.constructor.prototype.waitForChatLoading = async () => Promise.resolve();
                }
            } catch (e) { }
            return true;
        });
        console.log('[WA-Events/Sync] ✅ Parche de navegador aplicado.');
    } catch (err) {
        console.warn('[WA-Events/Sync] ⚠️ Error aplicando parche:', err.message);
    }
}

/**
 * Convierte tipo multimedia a etiqueta legible.
 */
export function getLabelFromType(type) {
    const labels = {
        image: '📷 Imagen',
        audio: '🎵 Audio',
        ptt: '🎤 Nota de voz',
        video: '🎥 Vídeo',
        document: '📄 Documento',
        sticker: '🩹 Sticker',
        location: '📍 Ubicación',
        vcard: '👤 Contacto',
    };
    return labels[type] || null;
}

/**
 * Orquestador de sincronización de chats recientes.
 */
export async function syncRecentChats(context) {
    const { client, mainWindow } = context;
    try {
        console.log('[WA-Events/Sync] 🔄 Iniciando sincronización de historial...');

        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('wa:log', { text: 'Sincronizando historial de chats...', type: 'info' });
        }

        // 1. Preparar navegador
        await patchBrowser(client);

        // 2. Importaciones dinámicas (DB)
        const { saveMessageLog } = await import('../../../../../services/database/models/logs.js');
        const { insertLead, updateLeadName, isLeadExists } = await import('../../../../../services/database/models/leads.js');
        const { run } = await import('../../../../../services/database/connection.js');

        const chats = await client.getChats();
        const individualChats = chats.filter(c => !c.isGroup).slice(0, 20);

        let totalMsgs = 0;
        let totalChats = 0;

        for (const chat of individualChats) {
            const telefono = chat.id.user;
            await new Promise(r => setTimeout(r, 300));

            // -- Sincronizar info del Lead --
            try {
                const metaId = chat.id.user;
                const rawName = chat.name || '';
                const isPhoneInName = /^[\d\+\s\(\)\-]{8,}$/.test(rawName.trim());
                
                let phone = metaId;
                let name = rawName;

                if (isPhoneInName) {
                    phone = rawName.replace(/[\s\(\)\-]/g, '');
                    name = null;
                }

                const existe = await isLeadExists(phone);
                if (existe) {
                    if (name) await updateLeadName(null, name, phone);
                    await run('UPDATE leads SET meta_id = ? WHERE telefono = ? AND meta_id IS NULL', [metaId, phone]);
                } else {
                    await insertLead(phone, name, 'contacto', metaId);
                }
            } catch (e) { }

            // -- Obtener mensajes --
            let messages = [];
            try {
                messages = await chat.fetchMessages({ limit: 20 });
            } catch (fetchErr) {
                if (chat.lastMessage) messages = [chat.lastMessage];
            }

            if (messages.length === 0) continue;
            totalChats++;

            // -- Persistir en logs --
            for (const msg of messages) {
                const type = msg.type || 'chat';
                if (['e2e_notification', 'protocol', 'gp2', 'ciphertext'].includes(type)) continue;

                let texto = (msg.body || '').trim();
                if (!texto) {
                    texto = getLabelFromType(type);
                    if (!texto) continue;
                }

                const tipo = msg.fromMe ? 'enviado' : 'recibido';
                const fecha = msg.timestamp ? new Date(msg.timestamp * 1000).toISOString() : null;

                try {
                    await saveMessageLog(telefono, texto, tipo, fecha);
                    totalMsgs++;
                } catch (e) { }
            }
        }

        console.log(`[WA-Events/Sync] ✅ Sincronización completa: ${totalMsgs} mensajes.`);

        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('wa:log', {
                text: `Historial sincronizado: ${totalMsgs} mensajes de ${totalChats} chats.`,
                type: 'success'
            });
            mainWindow.webContents.send('wa:chats-synced');
        }

    } catch (err) {
        console.error('[WA-Events/Sync] ❌ Error:', err.message);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('wa:log', { text: `Error al sincronizar: ${err.message}`, type: 'error' });
        }
    }
}
