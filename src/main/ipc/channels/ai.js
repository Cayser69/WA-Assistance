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
            const { getChatMessages, getLeadByPhone } = await import('../../../main/services/database/index.js');
            const { waClient } = await import('../../../main/providers/whatsapp/core/client.js');
 
            // 1. Sincronización Inteligente (On-Demand) 🔄
            let rawHistory = await getChatMessages(phone);
            
            // Si el historial es pobre, intentamos sincronizar desde WhatsApp
            if (rawHistory.length < 5 && waClient.getStatus() === 'ready') {
                await waClient.messaging?.syncChatHistory(phone);
                rawHistory = await getChatMessages(phone); // Recargar
            }

            const lead = await getLeadByPhone(phone);
            const history = rawHistory.slice(-30).map(m => ({
                role: m.tipo === 'recibido' ? 'user' : 'assistant',
                content: m.mensaje
            }));

            // 2. Metadatos de personalización 🛰️
            const customerName = lead?.nombre || 'Cliente';
            const now = new Date().toLocaleString('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            const systemInstructions = `
                ### ROL: ASESOR COMERCIAL SENIOR 🎓
                - Tu misión es acompañar al cliente y CERRAR la venta si existe interés real.
                - ESCUCHA Y ACTÚA. Si el cliente tiene dudas, resuélvelas. Si está convencido, solicita la factura o los datos para tramitar el alta de inmediato.
                
                ### GUÍA DE CONVERSACIÓN:
                1. Seduce con los precios de O2 (23€, 35€) y menciona la falta de permanencia.
                2. Si el cliente muestra interés, NO esperes; pídele los datos o la factura para que "podamos dejarlo tramitado hoy mismo".
                3. Menciona que un compañero de soporte validará la parte técnica final, pero tú lideras el cierre ahora.
                
                ### RESTRICCIONES:
                - Máximo 35 palabras. Fluido, humano y directo.
                - El objetivo es la CONVERSIÓN (Venta o Factura).
            `.trim();

            const suggestion = await aiClient.getReply('', history, true, systemInstructions);
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
