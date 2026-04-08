import electron from 'electron';
const { ipcMain } = electron;

/**
 * Registra los manejadores IPC relacionados con Inteligencia Artificial 🤖
 */
export function registerAIHandlers() {
    ipcMain.handle('ai:config', async (event, config) => {
        const { aiClient } = await import('../../services/ai/client.js');
        aiClient.config(config);
        return { success: true };
    });

    ipcMain.handle('ai:get-status', async () => {
        const { aiClient } = await import('../../services/ai/client.js');
        return aiClient.getStatus();
    });
}
