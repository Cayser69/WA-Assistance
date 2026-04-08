import { run, all } from '../connection.js';

/**
 * Guarda un estado de persistencia (JSON o Texto).
 */
export async function savePersistence(key, value) {
    const data = typeof value === 'object' ? JSON.stringify(value) : value;
    await run('INSERT OR REPLACE INTO persistence (key, value) VALUES (?, ?)', [key, data]);
}

/**
 * Obtiene un estado de persistencia.
 */
export async function getPersistence(key) {
    const rows = await all('SELECT value FROM persistence WHERE key = ?', [key]);
    if (rows.length === 0) return null;
    try {
        return JSON.parse(rows[0].value);
    } catch (e) {
        return rows[0].value;
    }
}

/**
 * Limpia una clave de persistencia específica.
 */
export async function clearPersistence(key) {
    await run('DELETE FROM persistence WHERE key = ?', [key]);
}
