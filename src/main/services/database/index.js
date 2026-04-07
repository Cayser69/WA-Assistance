import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// La base de datos se guarda en la raíz del proyecto
const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const all = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

/**
 * Inicializa las tablas necesarias.
 */
export async function initDB() {
    try {
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

        // Migraciones rápidas
        try {
            await run('ALTER TABLE templates ADD COLUMN image_path TEXT');
        } catch (e) {}

        try {
            await run('ALTER TABLE leads ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
        } catch (e) {}

        try {
            await run('ALTER TABLE leads ADD COLUMN nombre TEXT');
        } catch (e) {}

        console.log('Base de datos inicializada correctamente.');
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
    }
}

// --- Métodos de Persistencia ---
export async function savePersistence(key, value) {
    const data = typeof value === 'object' ? JSON.stringify(value) : value;
    await run('INSERT OR REPLACE INTO persistence (key, value) VALUES (?, ?)', [key, data]);
}

export async function getPersistence(key) {
    const rows = await all('SELECT value FROM persistence WHERE key = ?', [key]);
    if (rows.length === 0) return null;
    try {
        return JSON.parse(rows[0].value);
    } catch (e) {
        return rows[0].value;
    }
}

export async function clearPersistence(key) {
    await run('DELETE FROM persistence WHERE key = ?', [key]);
}

// --- Métodos de Plantillas ---
export async function saveTemplate(id, nombre, contenido) {
    if (id) {
        await run('UPDATE templates SET nombre = ?, contenido = ? WHERE id = ?', [nombre, contenido, id]);
    } else {
        await run('INSERT INTO templates (nombre, contenido) VALUES (?, ?)', [nombre, contenido]);
    }
}

export async function deleteTemplate(id) {
    await run('DELETE FROM templates WHERE id = ?', [id]);
}

export async function getTemplates() {
    return await all('SELECT * FROM templates ORDER BY nombre ASC');
}

// --- Métodos de Configuración ---
export async function saveSetting(key, value) {
    await run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}

export async function getSetting(key) {
    const row = await all('SELECT value FROM settings WHERE key = ?', [key]);
    return row.length > 0 ? row[0].value : null;
}

export async function getAllSettings() {
    const rows = await all('SELECT * FROM settings');
    return rows.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
    }, {});
}

export async function isLeadExists(telefono) {
    const row = await all('SELECT id FROM leads WHERE telefono = ?', [telefono]);
    return row.length > 0;
}

/**
 * Inserta un nuevo lead, evitando duplicados.
 * Retorna { id, isDuplicate: boolean }
 */
export async function insertLead(telefono, nombre = null) {
    const exists = await isLeadExists(telefono);
    if (exists) {
        return { isDuplicate: true };
    }
    const result = await run('INSERT INTO leads (telefono, nombre) VALUES (?, ?)', [telefono, nombre]);
    return { id: result.lastID, isDuplicate: false };
}

export async function getLeads(filter = 'all', limit = 50, offset = 0, searchQuery = '') {
    let sql = "SELECT * FROM leads ";
    let params = [];
    let where = [];

    if (filter === 'pendiente') where.push("estado = 'pendiente'");
    if (searchQuery) {
        where.push("telefono LIKE ?");
        params.push(`%${searchQuery}%`);
    }

    if (where.length > 0) sql += " WHERE " + where.join(" AND ");

    sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    
    return await all(sql, params);
}

export async function getLeadsCount(filter = 'all', searchQuery = '') {
    let sql = "SELECT COUNT(*) as total FROM leads ";
    let params = [];
    let where = [];

    if (filter === 'pendiente') where.push("estado = 'pendiente'");
    if (searchQuery) {
        where.push("telefono LIKE ?");
        params.push(`%${searchQuery}%`);
    }

    if (where.length > 0) sql += " WHERE " + where.join(" AND ");
    
    const rows = await all(sql, params);
    return rows[0].total;
}

export async function getPendingLeads() {
    return await all("SELECT * FROM leads WHERE estado = 'pendiente'");
}

export async function getLeadsWithoutName() {
    return await all("SELECT * FROM leads WHERE nombre IS NULL OR nombre = ''");
}

export async function updateLeadName(id, nombre) {
    return await run("UPDATE leads SET nombre = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?", [nombre, id]);
}

export async function markLeadAsContacted(id) {
    return await run("UPDATE leads SET estado = 'contactado', fecha_contacto = CURRENT_TIMESTAMP WHERE id = ?", [id]);
}

export async function saveMessageLog(telefono, mensaje, tipo) {
    return await run("INSERT INTO logs (telefono, mensaje, tipo) VALUES (?, ?, ?)", [telefono, mensaje, tipo]);
}

// Inicializar DB al cargar el módulo
initDB();

export default db;
