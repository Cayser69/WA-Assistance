import { getDB } from './setup/connection.js';
import { initDB } from './setup/initializer.js';

// Importar todos los modelos para re-exportar (Retrocompatibilidad e Interfaz Unificada)
import * as leads from './models/leads/index.js';
import * as persistence from './models/persistence.js';
import * as settings from './models/settings.js';
import * as templates from './models/templates.js';
import * as logs from './models/logs.js';

/**
 * Orquestador Global de Base de Datos 🗄️🏢
 */
export { initDB, getDB };

// --- Re-exportación de todos los métodos de modelos ---
export const { savePersistence, getPersistence, clearPersistence } = persistence;
export const { saveTemplate, deleteTemplate, getTemplates } = templates;
export const { saveSetting, getSetting, getAllSettings } = settings;

// Modelo de Leads (Agenda)
export const {
    normalizePhone,
    isInternalID,
    isLeadExists,
    insertLead,
    getLeads,
    getLeadsCount,
    getPendingLeads,
    getLeadsWithoutName,
    updateLeadName,
    markLeadAsContacted,
    repairMetaData,
    deleteLeads,
    truncateLeads
} = leads;

// Modelo de Logs (Mensajería)
export { saveMessageLog, getUniqueChats, getChatMessages } from './models/logs.js';