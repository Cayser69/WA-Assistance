import { run, all, getDB } from '../setup/connection.js';

/**
 * Registra un log de mensaje enviado o recibido.
 * ✅ Incluye soporte para multimedia (Ruta de archivo y Mimetype).
 */
export async function saveMessageLog(telefono, mensaje, tipo, fecha = null, media_path = null, mimetype = null) {
    if (fecha) {
        return await run(
            'INSERT OR IGNORE INTO logs (telefono, mensaje, tipo, fecha, media_path, mimetype) VALUES (?, ?, ?, ?, ?, ?)',
            [telefono, mensaje, tipo, fecha, media_path, mimetype]
        );
    }
    return await run(
        'INSERT OR IGNORE INTO logs (telefono, mensaje, tipo, media_path, mimetype) VALUES (?, ?, ?, ?, ?)',
        [telefono, mensaje, tipo, media_path, mimetype]
    );
}

/**
 * Recupera la lista de chats únicos (último mensaje de cada contacto). 💬
 */
export async function getUniqueChats() {
    const sql = `
        SELECT 
            l.telefono, 
            l.mensaje, 
            l.tipo, 
            l.last_msg_date,
            l.media_path,
            l.mimetype,
            le.nombre
        FROM (
            SELECT telefono, mensaje, tipo, media_path, mimetype, MAX(fecha) as last_msg_date
            FROM logs
            GROUP BY telefono
        ) l
        LEFT JOIN leads le ON l.telefono = le.telefono
        ORDER BY l.last_msg_date DESC
    `;
    const rows = await all(sql);

    // Asegurar que el nro de teléfono sea legible
    return rows.map(r => ({
        ...r,
        telefono: r.telefono.includes('@') ? r.telefono.split('@')[0] : r.telefono
    }));
}

/**
 * Recupera el historial completo de mensajes con un contacto específico. 📜
 */
export async function getChatMessages(telefono) {
    const sql = `
        SELECT id, mensaje, tipo, fecha, media_path, mimetype 
        FROM logs 
        WHERE telefono = ? 
        ORDER BY fecha ASC
    `;
    return await all(sql, [telefono]);
}