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
            const { app } = await import('electron');
            const path = await import('path');

            // Resolver ruta absoluta desde userData
            const userDataPath = app.getPath('userData');
            const absolutePath = path.join(userDataPath, imagePath);

            return MessageMedia.fromFilePath(absolutePath);
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
        const { aiClient } = await import('../../../../../services/ai/client.js');
        
        if (aiClient.isActive) {
            this.mainWindow.webContents.send('wa:log', { 
                text: `IA: Generando variante personalizada basada en contexto...`, 
                type: 'info' 
            });
            
            // Prompt enriquecido para que la variante guarde relación con el negocio 🧠
            const aiPrompt = `Reescribe este mensaje de oferta de forma profesional y muy vendedora. 
            El objetivo es cerrar el interés o conseguir la factura del cliente de inmediato. 
            Menciona que tú puedes iniciar el proceso ahora y un especialista validará los detalles finales.
            MENSAJE A REESCRIBIR: "${message}"`;
            const variant = await aiClient.getReply(aiPrompt);
            return variant || message;
        }
        
        return message;
    }
}
