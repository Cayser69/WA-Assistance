/**
 * Gestor de Mensajería y Contactos de WhatsApp (Subcomponente de Cliente)
 * Responsabilidad: Envío de mensajes, búsqueda de contactos e integración con IA.
 */
export class MessagingManager {
    constructor(client, mainWindow) {
        this.client = client;
        this.mainWindow = mainWindow;
    }

    /**
     * Envia un mensaje a un número específico.
     */
    async send(phone, msg) {
        if (!this.client) throw new Error('Cliente no inicializado');
        const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
        return await this.client.sendMessage(chatId, msg);
    }

    /**
     * Verifica si un número está registrado en WhatsApp.
     */
    async isRegistered(phone) {
        if (!this.client) return false;
        const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
        try {
            return await this.client.isRegisteredUser(chatId);
        } catch (err) {
            return false;
        }
    }

    /**
     * Obtiene el nombre público (pushname) de un contacto.
     */
    async getContactName(phone) {
        if (!this.client) return null;
        try {
            const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
            const contact = await this.client.getContactById(chatId);
            return contact.pushname || contact.name || null;
        } catch (err) {
            return null;
        }
    }

    /**
     * Lógica de respuesta automática con IA.
     */
    async handleIncomingMessage(msg) {
        if (msg.from.includes('@g.us') || msg.isStatus) return;

        // Importación dinámica para evitar ciclos de dependencia (ajustada a la arquitectura anidada)
        const { aiClient } = await import('../../../services/ai/client.js');
        
        if (aiClient.isActive && this.mainWindow) {
            this.mainWindow.webContents.send('wa:log', { 
                text: `IA: Procesando mensaje de ${msg.from.split('@')[0]}...`, 
                type: 'info' 
            });
            
            const reply = await aiClient.getReply(msg.body);
            if (reply) {
                await msg.reply(reply);
                this.mainWindow.webContents.send('wa:log', { 
                    text: `IA responde: ${reply}`, 
                    type: 'success' 
                });
            }
        }
    }
}
