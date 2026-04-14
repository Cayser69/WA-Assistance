/**
 * Sub-manejador: Gestión Universal de Mensajes (Historial Total)
 */
export async function handleMessage(msg, context) {
    const { mainWindow } = context;
    if (msg.from.includes('@g.us') || msg.isStatus) return;

    // 1. Identificar dirección y contacto (Extraer nro de teléfono siempre)
    const isFromMe = msg.fromMe;
    const type = isFromMe ? 'enviado' : 'recibido';
    
    // El 'remoteJid' es el ID de la otra persona con quien hablamos
    const remoteJid = isFromMe ? msg.to : msg.from;
    const phone = remoteJid.includes('@') ? remoteJid.split('@')[0] : remoteJid;

    // 2. Descarga de Multimedia
    let mediaPath = null;
    let mimetype = null;

    if (msg.hasMedia) {
        try {
            const media = await msg.downloadMedia();
            if (media) {
                const { MediaManager } = await import('../../../../utils/media.js');
                mediaPath = MediaManager.saveChatMedia(media, phone);
                mimetype = media.mimetype;
            }
        } catch (err) {
            console.error('[MessagingManager/Handler] Error al descargar media:', err.message);
        }
    }

    // 3. Guardar en Base de Datos (Persistencia Universal) 🛰️
    const { saveMessageLog } = await import('../../../../services/database/index.js');
    await saveMessageLog(
        phone, 
        msg.body, 
        type, 
        null, 
        mediaPath, 
        mimetype, 
        msg.id.id, // ID Único de WhatsApp 🔑
        msg.ack || 1 // Estado inicial
    );

    // 4. Notificar al Renderer para actualización en tiempo real
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('wa:message-received', { 
            tel: phone, 
            msg: msg.body,
            media_path: mediaPath,
            mimetype: mimetype,
            tipo: type,
            msg_id: msg.id.id,
            ack: msg.ack || 1
        });
    }
    
    // 5. Procesamiento con IA (Sólo para mensajes RECIBIDOS)
    if (!isFromMe) {
        const { aiClient } = await import('../../../../services/ai/client.js');
        if (aiClient.isActive && mainWindow && !mainWindow.isDestroyed()) {
            try {
                const { getChatMessages } = await import('../../../../services/database/index.js');
                const rawHistory = await getChatMessages(phone);
                const history = rawHistory.slice(-10).map(m => ({
                    role: m.tipo === 'recibido' ? 'user' : 'assistant',
                    content: m.mensaje
                }));

                const reply = await aiClient.getReply(msg.body, history);
                if (reply) {
                    await msg.reply(reply);
                }
            } catch (err) {
                console.error('[MessagingManager/IA] Error en respuesta IA:', err.message);
            }
        }
    }
}

/**
 * Gestiona las confirmaciones de lectura/entrega (Ack). 🛰️
 */
export async function handleMessageAck(msg, ack, context) {
    const { mainWindow } = context;
    const msgId = msg.id.id;

    try {
        const { updateMessageAck } = await import('../../../../services/database/index.js');
        await updateMessageAck(msgId, ack);

        // Notificar a la UI
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('wa:message-ack', { msgId, ack });
        }
    } catch (err) {
        console.error('[MessagingManager/Handler] Error en actualización Ack:', err.message);
    }
}

/**
 * Sincroniza el historial reciente de un chat específico desde WhatsApp. 🔄
 */
export async function syncChatMessages(phone, context) {
    const { client } = context;
    if (!client) return { success: false, error: 'Cliente no listo' };

    try {
        let chat = null;
        const cleanPhone = phone.split('@')[0];
        
        // Intentar con formatos comunes (@c.us, @lid)
        const trials = [`${cleanPhone}@c.us`, `${cleanPhone}@lid` ];
        
        for (const chatId of trials) {
            try {
                chat = await client.getChatById(chatId);
                if (chat) break;
            } catch (e) { }
        }
        
        if (!chat) {
            console.warn(`[MessagingManager/Sync] ⚠️ No se encontró chat para ${phone} tras probar varios formatos.`);
            return { success: false, error: 'Chat no encontrado' };
        }

        console.log(`[MessagingManager/Sync] 🔄 Sincronizando historial (${chat.id._serialized})...`);
        
        const messages = await chat.fetchMessages({ limit: 30 });
        const { saveMessageLog } = await import('../../../../services/database/index.js');

        let syncedCount = 0;
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
                // saveMessageLog usa INSERT OR IGNORE, por lo que no duplicará si el ID existe
                await saveMessageLog(
                    phone, 
                    texto, 
                    tipo, 
                    fecha, 
                    null, 
                    msg.mimetype, 
                    msg.id.id, 
                    msg.ack || 1
                );
                syncedCount++;
            } catch (e) { }
        }

        console.log(`[MessagingManager/Sync] ✅ Sincronizados ${syncedCount} mensajes para ${phone}.`);
        return { success: true, count: syncedCount };

    } catch (err) {
        console.error('[MessagingManager/Sync] ❌ Error:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Utilidad: Convierte tipo multimedia a etiqueta legible.
 */
function getLabelFromType(type) {
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
