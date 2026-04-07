import { ipcMain, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from '../services/database/index.js';
import { waClient } from '../providers/whatsapp/client.js';
import { waCampaign } from '../providers/whatsapp/campaign.js';
import { waScanner } from '../providers/whatsapp/scanner.js';

// Configuración de rutas para ESM 🧭
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Registra todos los manejadores de eventos IPC para la comunicación entre Procesos.
 */
export function registerIPCHandlers(mainWindow) {
    // --- Gestión de Base de Datos (Leads y Logs) ---
    ipcMain.handle('db:getPendingLeads', async () => await db.getPendingLeads());
    
    ipcMain.handle('db:getLeads', async (event, filter, limit, offset, search) => {
        return await db.getLeads(filter, limit, offset, search);
    });
    
    ipcMain.handle('db:getLeadsCount', async (event, filter, search) => {
        return await db.getLeadsCount(filter, search);
    });
    
    ipcMain.handle('db:insertLead', async (event, tel) => await db.insertLead(tel));
    ipcMain.handle('db:markAsContacted', async (event, id) => await db.markLeadAsContacted(id));
    
    ipcMain.handle('db:saveLog', async (event, logData) => {
        return await db.saveMessageLog(logData.tel, logData.msg, logData.tipo);
    });

    // --- Gestión de Persistencia de Tareas ---
    ipcMain.handle('wa:check-persistence', async (event, key) => await db.getPersistence(key));
    ipcMain.handle('wa:clear-persistence', async (event, key) => await db.clearPersistence(key));

    // --- Control de WhatsApp ---
    ipcMain.handle('wa:get-status', () => waClient.getStatus());
    ipcMain.handle('wa:get-campaign-status', () => waCampaign.getStatus());
    ipcMain.handle('wa:logout', async () => await waClient.logout());
    
    // Campaña con Soporte para Reanudación
    ipcMain.handle('wa:start-campaign', async (event, data, startIndex = 0) => {
        return await waCampaign.start(data, startIndex);
    });
    ipcMain.handle('wa:stop-campaign', () => waCampaign.stop());

    // --- WhatsApp Scanner ---
    ipcMain.handle('wa:startScanner', async (event, data, startIndex = 0) => {
        return await waScanner.start(data, startIndex);
    });
    
    ipcMain.handle('wa:stopScanner', () => {
        waScanner.stop();
    });
    
    ipcMain.handle('wa:getScannerStatus', () => {
        return waScanner.getStatus();
    });

    ipcMain.handle('wa:startRepair', () => {
        return waScanner.startRepair();
    });

    // --- Inteligencia Artificial ---
    ipcMain.handle('ai:config', async (event, config) => {
        const { aiClient } = await import('../services/ai/client.js');
        aiClient.config(config);
        return { success: true };
    });

    ipcMain.handle('ai:get-status', async () => {
        const { aiClient } = await import('../services/ai/client.js');
        return aiClient.getStatus();
    });

    // --- Configuración Persistente (SQLite) ---
    ipcMain.handle('db:saveSetting', async (event, { key, value }) => {
        await db.saveSetting(key, value);
        return true;
    });

    ipcMain.handle('db:getSetting', async (event, key) => {
        return await db.getSetting(key);
    });

    ipcMain.handle('db:getAllSettings', async () => {
        return await db.getAllSettings();
    });

    // --- Gestión de Plantillas ---
    ipcMain.handle('db:saveTemplate', async (event, { id, nombre, contenido, imagePath }) => {
        await db.saveTemplate(id, nombre, contenido, imagePath);
        return true;
    });

    ipcMain.handle('db:getTemplates', async () => {
        return await db.getTemplates();
    });

    ipcMain.handle('db:deleteTemplate', async (event, id) => {
        await db.deleteTemplate(id);
        return true;
    });

    // --- Gestión de Multimedia ---
    ipcMain.handle('media:importTemplateImage', async (event, sourcePath) => {
        const { MediaManager } = await import('../utils/media.js');
        return MediaManager.importTemplateImage(sourcePath);
    });

    ipcMain.handle('app:getPath', () => {
        return process.cwd();
    });

    // Nuevo: Lector de Plantillas Robusto 🏰✨
    ipcMain.handle('app:read-template', async (event, relativePath) => {
        // Normalizar la ruta para Windows/Linux
        const normalized = relativePath.replace(/\//g, path.sep);
        const fullPath = path.resolve(process.cwd(), normalized);
        
        try {
            if (!fs.existsSync(fullPath)) {
                console.error(`[Lector-Main] ❌ NO EXISTE: ${fullPath}`);
                throw new Error(`Archivo no encontrado: ${fullPath}`);
            }
            const content = fs.readFileSync(fullPath, 'utf8');
            return content;
        } catch (err) {
            console.error(`[Lector-Main] ❌ ERROR: ${fullPath}`, err.message);
            throw err;
        }
    });

    // --- Utilidades de Sistema ---
    ipcMain.handle('dialog:openFile', async (event, { filters }) => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters
        });
        return result.filePaths[0] || null;
    });
}
