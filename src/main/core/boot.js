import electron from 'electron';
const { app } = electron;
import path from 'path';
import fs from 'fs';

/**
 * Gestor de Arranque y Ciclo de Vida 🚀
 */
export const BootManager = {
    /**
     * Configura las rutas de datos portables (.app_data o data/)
     */
    configurePaths: (isPackaged, cwd) => {
        let localAppData;
        if (isPackaged) {
            const baseDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
            localAppData = path.join(baseDir, 'data');
        } else {
            localAppData = path.join(cwd, '.app_data');
        }

        try {
            if (!fs.existsSync(localAppData)) fs.mkdirSync(localAppData, { recursive: true });
            app.setPath('userData', localAppData);
            console.log(`[Boot] 📂 Directorio de datos: ${localAppData}`);
            return localAppData;
        } catch (err) {
            console.error(`[Boot] ❌ Error configurando rutas:`, err.message);
            return null;
        }
    },

    /**
     * Carga los servicios nucleares de la aplicación
     */
    loadServices: async (dirname) => {
        console.log('[Boot] 🤖 Cargando servicios nucleares...');
        
        // 1. Base de Datos
        const dbMod = await import('../services/database/index.js');
        await dbMod.initDB();

        // 2. WhatsApp Core & Services
        const waMod = await import('../providers/whatsapp/core/client.js');
        const campMod = await import('../providers/whatsapp/services/campaign.js');
        const scanMod = await import('../providers/whatsapp/services/scanner.js');
        const ipcMod = await import('../ipc/handlers.js');

        return {
            waClient: waMod.waClient,
            waCampaign: campMod.waCampaign,
            waScanner: scanMod.waScanner,
            registerIPCHandlers: ipcMod.registerIPCHandlers
        };
    },

    /**
     * Proceso de apagado seguro
     */
    safeShutdown: async (services) => {
        const { waClient, waCampaign, waScanner } = services;
        console.log('[Boot] 🧼 Iniciando apagado seguro...');
        
        try {
            if (waCampaign) waCampaign.stop();
            if (waScanner) waScanner.stop();
            if (waClient) await waClient.destroy();
            console.log('[Boot] ✅ Servicios detenidos correctamente.');
        } catch (err) {
            console.error('[Boot] 🔥 Error durante el apagado:', err.message);
        } finally {
            app.quit();
        }
    }
};
