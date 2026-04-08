import { run, all, getDB } from '../connection.js';

/**
 * Registra un log de mensaje enviado o recibido.
 */
export async function saveMessageLog(telefono, mensaje, tipo) {
    return await run("INSERT INTO logs (telefono, mensaje, tipo) VALUES (?, ?, ?)", [telefono, mensaje, tipo]);
}

/**
 * Recupera la lista de chats únicos (último mensaje de cada contacto). 💬
 */
export async function getUniqueChats() {
    const db = await getDB();
    const sql = `
        SELECT 
            l.telefono, 
            l.mensaje, 
            l.tipo, 
            l.last_msg_date,
            le.nombre
        FROM (
            SELECT telefono, mensaje, tipo, MAX(fecha) as last_msg_date
            FROM logs
            GROUP BY telefono
        ) l
        LEFT JOIN leads le ON l.telefono = le.telefono
        ORDER BY l.last_msg_date DESC
    `;
    return await all(sql);
}

/**
 * Recupera el historial completo de mensajes con un contacto específico. 📜
 */
export async function getChatMessages(telefono) {
    const db = await getDB();
    const sql = `
        SELECT id, mensaje, tipo, fecha 
        FROM logs 
        WHERE telefono = ? 
        ORDER BY fecha ASC
    `;
    return await all(sql, [telefono]);
}
