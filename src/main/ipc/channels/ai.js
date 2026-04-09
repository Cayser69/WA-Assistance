import electron from 'electron';
const { ipcMain } = electron;

/**
 * Registra los manejadores IPC relacionados con Inteligencia Artificial 🤖
 */
export function registerAIHandlers() {
    ipcMain.handle('ai:config', async (event, config) => {
        const { aiClient } = await import('../../../main/services/ai/client.js');
        aiClient.config(config);
        return { success: true };
    });

    ipcMain.handle('ai:get-status', async () => {
        const { aiClient } = await import('../../../main/services/ai/client.js');
        return aiClient.getStatus();
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

            const suggestion = await aiClient.getReply('Genera una respuesta sugerida perfecta para este chat.', history);
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
            const content = await aiClient.getReply(systemPrompt);

            return { success: true, content };
        } catch (error) {
            console.error('Error en IPC ai:generate-template:', error);
            return { success: false, error: error.message };
        }
    });
}
