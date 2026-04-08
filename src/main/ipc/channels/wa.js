import electron from 'electron';
const { ipcMain } = electron;
import { waClient } from '../../providers/whatsapp/core/client.js';
import { waCampaign } from '../../providers/whatsapp/services/campaign.js';
import { waScanner } from '../../providers/whatsapp/services/scanner.js';
import * as db from '../../services/database/index.js';

/**
 * Registra los manejadores IPC relacionados con WhatsApp y Campañas 🛰️
 */
export function registerWAHandlers() {
    // --- Control de Estado y Sesión ---
    ipcMain.handle('wa:get-status', () => waClient.getStatus());
    ipcMain.handle('wa:logout', async () => await waClient.logout());
    ipcMain.handle('wa:get-campaign-status', () => waCampaign.getStatus());
    
    // --- Gestión de Persistencia de Tareas ---
    ipcMain.handle('wa:check-persistence', async (event, key) => await db.getPersistence(key));
    ipcMain.handle('wa:clear-persistence', async (event, key) => await db.clearPersistence(key));

    // --- Motor de Campañas ---
    ipcMain.handle('wa:start-campaign', async (event, data, startIndex = 0) => {
        return await waCampaign.start(data, startIndex);
    });
    ipcMain.handle('wa:stop-campaign', () => waCampaign.stop());

    // --- WhatsApp Scanner ---
    ipcMain.handle('wa:startScanner', async (event, data, startIndex = 0) => {
        return await waScanner.start(data, startIndex);
    });
    
    ipcMain.handle('wa:stopScanner', () => waScanner.stop());
    ipcMain.handle('wa:getScannerStatus', () => waScanner.getStatus());
    ipcMain.handle('wa:startRepair', () => waScanner.startRepair());

    // --- Sincronización de Agenda Real 👥 ---
    ipcMain.handle('wa:sync-contacts', async () => {
        try {
            const contacts = await waClient.getContacts();
            let imported = 0;
            
            for (const c of contacts) {
                const result = await db.insertLead(c.number, c.name);
                if (!result.isDuplicate) imported++;
            }
            
            return { success: true, total: contacts.length, imported };
        } catch (error) {
            console.error('Error en IPC wa:sync-contacts:', error);
            return { success: false, error: error.message };
        }
    });
}
