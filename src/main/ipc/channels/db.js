import electron from 'electron';
const { ipcMain } = electron;
import * as db from '../../services/database/index.js';

/**
 * Registra los manejadores IPC relacionados con la Base de Datos 🗄️
 */
export function registerDBHandlers() {
    // --- Gestión de Leads (Contactos) ---
    ipcMain.handle('db:getPendingLeads', async () => await db.getPendingLeads());
    
    ipcMain.handle('db:getLeads', async (event, filter, limit, offset, search) => {
        return await db.getLeads(filter, limit, offset, search);
    });
    
    ipcMain.handle('db:getLeadsCount', async (event, filter, search) => {
        return await db.getLeadsCount(filter, search);
    });
    
    ipcMain.handle('db:insertLead', async (event, tel) => await db.insertLead(tel));
    ipcMain.handle('db:markAsContacted', async (event, id) => await db.markLeadAsContacted(id));
    
    // --- Logs y Chats ---
    ipcMain.handle('db:saveLog', async (event, logData) => {
        return await db.saveMessageLog(logData.tel, logData.msg, logData.tipo);
    });

    ipcMain.handle('db:get-chats', async () => await db.getUniqueChats());
    ipcMain.handle('db:get-chat-messages', async (event, tel) => await db.getChatMessages(tel));

    // --- Configuración y Ajustes ---
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
}
