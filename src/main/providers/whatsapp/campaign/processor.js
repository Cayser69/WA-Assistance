/**
 * Gestor de Procesamiento de Mensajes de Campaña
 * Responsabilidad: Carga de multimedia mediante MessageMedia e integración con IA.
 */
export class CampaignProcessor {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
    }

    /**
     * Carga y prepara contenido multimedia de forma asíncrona.
     */
    async prepareMedia(imagePath, logger) {
        if (!imagePath) return null;
        
        try {
            const { default: pkg } = await import('whatsapp-web.js');
            const { MessageMedia } = pkg;
            return MessageMedia.fromFilePath(imagePath);
        } catch (err) {
            logger(`❌ Error cargando imagen: ${err.message}`, 'error');
            return null;
        }
    }

    /**
     * Obtiene una variante del mensaje usando el motor de IA si está activo.
     */
    async getAIVariant(message, useAI) {
        if (!useAI) return message;

        // Importación dinámica para evitar ciclos de dependencia
        const { aiClient } = await import('../../../services/ai/client.js');
        
        if (aiClient.isActive) {
            this.mainWindow.webContents.send('wa:log', { 
                text: `IA: Generando variante para el envío...`, 
                type: 'info' 
            });
            
            const aiPrompt = `Reescribe este mensaje de forma profesional y amigable: "${message}"`;
            const variant = await aiClient.getReply(aiPrompt);
            return variant || message;
        }
        
        return message;
    }
}
