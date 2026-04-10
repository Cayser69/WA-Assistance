import electron from 'electron';
const { ipcMain } = electron;

/**
 * Registra los manejadores IPC relacionados con Inteligencia Artificial 🤖
 */
export function registerAIHandlers() {
    ipcMain.handle('ai:config', async (event, config) => {
        try {
            console.log('[Main/IPC] 🛰️ Recibida configuración de IA:', { provider: config.provider, model: config.model });
            const { aiClient } = await import('../../../main/services/ai/client.js');
            aiClient.config(config);
            
            // Notificar cambio de estado a la UI (Hub reactivo) 🛰️
            const status = await aiClient.getStatus();
            event.sender.send('wa:ai-status', status);

            console.log('[Main/IPC] ✅ Configuración aplicada al motor.');
            return { success: true };
        } catch (err) {
            console.error('[Main/IPC] ❌ Error aplicando configuración de IA:', err.message);
            throw err;
        }
    });

    ipcMain.handle('ai:get-status', async () => {
        try {
            const { aiClient } = await import('../../../main/services/ai/client.js');
            const status = await aiClient.getStatus();
            console.log('[Main/IPC] 🛰️ Status consultado vía ai:get-status:', status);
            return status;
        } catch (err) {
            console.error('[Main/IPC] ❌ Error al obtener status de IA:', err);
            return { connected: false, active: false };
        }
    });

    ipcMain.handle('ai:get-suggestion', async (event, { phone }) => {
        try {
            const { aiClient } = await import('../../../main/services/ai/client.js');
            const { getChatMessages } = await import('../../../main/services/database/index.js');

            const rawHistory = await getChatMessages(phone);
            const history = rawHistory.slice(-10).map(m => ({
                role: m.tipo === 'recibido' ? 'user' : 'assistant',
                content: m.mensaje
            }));

            const suggestion = await aiClient.getReply('Genera una respuesta sugerida perfecta para este chat.', history, true);
            return { success: true, suggestion };
        } catch (error) {
            console.error('Error en IPC ai:get-suggestion:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('ai:generate-template', async (event, { context, type }) => {
        try {
            const { aiClient } = await import('../../../main/services/ai/client.js');

            const prompts = {
                'personalidad': `Eres un experto en Branding y Ventas. Basado en este contexto: "${context}", escribe las instrucciones maestras para una IA. Define su misión, su tono (ej: cercano pero profesional) y cómo debe saludar y despedirse. Sed breve pero contundente.`,
                'catalogo': `Actúa como un gestor de inventario. Basado en este contexto: "${context}", genera una lista de productos y servicios sugeridos con precios aproximados. Usa un formato de lista claro.`,
                'faqs': `Actúa como un especialista en atención al cliente. Basado en este contexto: "${context}", genera las 5 preguntas y respuestas (FAQs) más frecuentes que harían los clientes.`,
                'operativa': `Actúa como un jefe de operaciones. Basado en este contexto: "${context}", redacta la operativa del negocio: horarios habituales, métodos de pago aceptados y políticas de envío o reserva.`
            };

            const systemPrompt = prompts[type] || prompts['personalidad'];
            const content = await aiClient.getReply(systemPrompt, [], true);

            return { success: true, content };
        } catch (error) {
            console.error('Error en IPC ai:generate-template:', error);
            return { success: false, error: error.message };
        }
    });
}
