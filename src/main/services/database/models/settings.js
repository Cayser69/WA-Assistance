import { run, all } from '../setup/connection.js';

/**
 * Guarda o actualiza una configuración del sistema.
 */
export async function saveSetting(key, value) {
    await run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}

/**
 * Guarda múltiples configuraciones de forma masiva (Bulk Save).
 */
export async function saveSettings(settingsObject) {
    const keys = Object.keys(settingsObject);
    if (keys.length === 0) return;

    // Usamos una ráfaga de inserciones secuenciales para asegurar integridad 🗄️
    for (const key of keys) {
        await run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, settingsObject[key]]);
    }
}

/**
 * Obtiene el valor de una configuración por su clave.
 */
export async function getSetting(key) {
    const row = await all('SELECT value FROM settings WHERE key = ?', [key]);
    return row.length > 0 ? row[0].value : null;
}

/**
 * Obtiene todas las configuraciones del sistema en formato de objeto.
 */
export async function getAllSettings() {
    const rows = await all('SELECT * FROM settings');
    return rows.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
    }, {});
}
