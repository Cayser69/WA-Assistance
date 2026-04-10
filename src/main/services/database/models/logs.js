import { run, all } from '../setup/connection.js';

/**
 * Registra un log de mensaje enviado o recibido.
 * ✅ Incluye soporte para multimedia y tracking de ID de mensaje (ack).
 */
export async function saveMessageLog(telefono, mensaje, tipo, fecha = null, media_path = null, mimetype = null, msg_id = null, ack = 1) {
    const sql = `
        INSERT OR IGNORE INTO logs 
        (telefono, mensaje, tipo, fecha, media_path, mimetype, msg_id, ack) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        telefono, 
        mensaje, 
        tipo, 
        fecha || new Date().toISOString(), 
        media_path, 
        mimetype, 
        msg_id, 
        ack
    ];
    
    return await run(sql, params);
}

/**
 * Actualiza el estado de entrega/lectura (ack) de un mensaje. 🛰️
 */
export async function updateMessageAck(msg_id, ack) {
    if (!msg_id) return;
    return await run(
        'UPDATE logs SET ack = ? WHERE msg_id = ?',
        [ack, msg_id]
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
            l.ack,
            le.nombre
        FROM (
            SELECT telefono, mensaje, tipo, media_path, mimetype, ack, MAX(fecha) as last_msg_date
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
        SELECT id, mensaje, tipo, fecha, media_path, mimetype, msg_id, ack
        FROM logs 
        WHERE telefono = ? 
        ORDER BY fecha ASC
    `;
    return await all(sql, [telefono]);
}