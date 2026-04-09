/**
 * Sub-manejador: Mensajes Entrantes e IA 🤖
 */

export async function handleIncomingMessage(msg, context) {
    const { mainWindow } = context;
    if (msg.from.includes('@g.us') || msg.isStatus) return;

    // Importación dinámica para evitar ciclos de dependencia
    const { aiClient } = await import('../../../services/ai/client.js');
    
    if (aiClient.isActive && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('wa:log', { 
            text: `IA: Procesando mensaje de ${msg.from.split('@')[0]}...`, 
            type: 'info' 
        });
        
        try {
            const reply = await aiClient.getReply(msg.body);
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
