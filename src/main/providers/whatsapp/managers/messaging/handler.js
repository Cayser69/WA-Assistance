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

    // 2. Descarga de Multimedia (Imágenes, Audios, etc) para ambos sentidos
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

    // 3. Guardar en Base de Datos (Persistencia Universal)
    const { saveMessageLog } = await import('../../../../services/database/index.js');
    await saveMessageLog(phone, msg.body, type, null, mediaPath, mimetype);

    // 4. Notificar al Renderer para actualización en tiempo real
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('wa:message-received', { 
            tel: phone, 
            msg: msg.body,
            media_path: mediaPath,
            mimetype: mimetype,
            tipo: type
        });
    }
    
    // 5. Procesamiento con IA (Sólo para mensajes RECIBIDOS)
    if (!isFromMe) {
        // Importación dinámica para evitar ciclos de dependencia
        const { aiClient } = await import('../../../../services/ai/client.js');
        
        if (aiClient.isActive && mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('wa:log', { 
                text: `IA: Procesando mensaje de ${phone} con memoria...`, 
                type: 'info' 
            });
            
            try {
                // 5.1 Recuperar Historial Reciente (Últimos 10 mensajes) para dar contexto 📜
                const { getChatMessages } = await import('../../../../services/database/index.js');
                const rawHistory = await getChatMessages(phone);
                
                // Formatear para OpenAI: mapear 'recibido' -> 'user' y 'enviado' -> 'assistant'
                const history = rawHistory.slice(-10).map(m => ({
                    role: m.tipo === 'recibido' ? 'user' : 'assistant',
                    content: m.mensaje
                }));

                const reply = await aiClient.getReply(msg.body, history);
                if (reply) {
                    await msg.reply(reply);
                    mainWindow.webContents.send('wa:log', { 
                        text: `IA responde: ${reply}`, 
                        type: 'success' 
                    });
                }
            } catch (err) {
                console.error('[MessagingManager/IA] Error en respuesta IA:', err.message);
            }
        }
    }
}
