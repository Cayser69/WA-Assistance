import { run, getDB } from './connection.js';

// Importar todos los modelos para re-exportar (Retrocompatibilidad)
import * as persistence from './models/persistence.js';
import * as settings from './models/settings.js';
import * as templates from './models/templates.js';
import * as leads from './models/leads.js';
import * as logs from './models/logs.js';

/**
 * Inicializa las tablas necesarias de la base de datos.
 * Se llama al arrancar la aplicación para garantizar la integridad estructural.
 */
export async function initDB() {
    try {
        // Tablas Base
        await run(`
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telefono TEXT NOT NULL UNIQUE,
                estado TEXT DEFAULT 'pendiente',
                fecha_contacto DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                nombre TEXT
            )
        `);

        await run(`
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telefono TEXT NOT NULL,
                mensaje TEXT,
                tipo TEXT CHECK(tipo IN ('enviado', 'recebido')),
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await run(`
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        `);

        await run(`
            CREATE TABLE IF NOT EXISTS templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                contenido TEXT NOT NULL,
                image_path TEXT
            )
        `);

        await run(`
            CREATE TABLE IF NOT EXISTS persistence (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        `);

        // Migraciones rápidas de seguridad (Evita errores de columna ausente)
        try { await run('ALTER TABLE templates ADD COLUMN image_path TEXT'); } catch (e) {}
        try { await run('ALTER TABLE leads ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP'); } catch (e) {}
        try { await run('ALTER TABLE leads ADD COLUMN nombre TEXT'); } catch (e) {}

        console.log('[Database] ✅ Esquema inicializado correctamente.');
    } catch (error) {
        console.error('[Database] ❌ Error crítico durante la inicialización:', error);
        throw error;
    }
}

// --- Re-exportación de todos los métodos (Manteniendo la firma original) ---

// Persistencia
export const { savePersistence, getPersistence, clearPersistence } = persistence;

// Plantillas
export const { saveTemplate, deleteTemplate, getTemplates } = templates;

// Ajustes
export const { saveSetting, getSetting, getAllSettings } = settings;

// Leads/Contactos
export const { 
    isLeadExists, 
    insertLead, 
    getLeads, 
    getLeadsCount, 
    getPendingLeads, 
    getLeadsWithoutName, 
    updateLeadName, 
    markLeadAsContacted 
} = leads;

// Logs de Mensajes
export { saveMessageLog, getUniqueChats, getChatMessages } from './models/logs.js';

// Exportación de la conexión original por si se requiere
export { getDB };
