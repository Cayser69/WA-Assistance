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

    // --- Envío Manual de Mensajes 💬 ---
    ipcMain.handle('wa:send-message', async (event, { phone, message }) => {
        try {
            const result = await waClient.sendMessage(phone, message);
            return { success: true, message: result };
        } catch (error) {
            console.error('Error en IPC wa:send-message:', error);
            return { success: false, error: error.message };
        }
    });

    // --- Sincronización de Agenda Real 👥 ---
    ipcMain.handle('wa:sync-contacts', async () => {
        try {
            // Validación de seguridad: No sincronizar si no hay conexión activa
            if (waClient.getStatus() !== 'connect') {
                return { success: false, error: 'WhatsApp no está conectado. Escanea el QR primero.' };
            }

            const contacts = await waClient.getContacts();
            let imported = 0;
            
            for (const c of contacts) {
                const telefono = c.number; // Teléfono humano
                const name = c.name || c.pushname || null;
                const metaId = c.id ? c.id.user : null;
                
                // Filtro Radical: Solo números de 5 a 13 dígitos (Teléfonos reales)
                const isRealPhone = telefono && telefono.length >= 5 && telefono.length <= 13;

                if (isRealPhone && telefono !== '0') {
                    // insertLead ahora es simple y unificado por teléfono
                    const result = await db.insertLead(telefono, name, 'contacto', metaId);
                    if (!result.isDuplicate) imported++;
                }
            }
            
            return { success: true, total: contacts.length, imported };
        } catch (error) {
            console.error('Error en IPC wa:sync-contacts:', error);
            return { success: false, error: error.message };
        }
    });
}
