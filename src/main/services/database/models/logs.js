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
 * ✅ Optimización: Unifica identidades y prioriza nombres de la agenda.
 */
export async function getUniqueChats() {
    const sql = `
        SELECT 
            clean_l.clean_tel as telefono, 
            l.mensaje, 
            l.tipo, 
            l.fecha as last_msg_date,
            l.media_path,
            l.mimetype,
            l.ack,
            le.nombre
        FROM (
            SELECT 
                REPLACE(REPLACE(telefono, '@c.us', ''), '@lid', '') as clean_tel,
                MAX(fecha) as last_date
            FROM logs
            GROUP BY REPLACE(REPLACE(telefono, '@c.us', ''), '@lid', '')
        ) clean_l
        INNER JOIN logs l ON 
            REPLACE(REPLACE(l.telefono, '@c.us', ''), '@lid', '') = clean_l.clean_tel 
            AND l.fecha = clean_l.last_date
        LEFT JOIN leads le ON clean_l.clean_tel = le.telefono
        GROUP BY clean_l.clean_tel
        ORDER BY l.fecha DESC
    `;
    const rows = await all(sql);
    
    // Limpieza final de campos resultantes
    return rows.map(r => ({
        ...r,
        telefono: r.telefono
    }));
}

/**
 * Recupera el historial completo de mensajes con un contacto específico. 📜
 */
export async function getChatMessages(telefono) {
    const cleanTel = telefono.includes('@') ? telefono.split('@')[0] : telefono;
    const sql = `
        SELECT id, mensaje, tipo, fecha, media_path, mimetype, msg_id, ack
        FROM logs 
        WHERE telefono = ? OR REPLACE(REPLACE(telefono, '@c.us', ''), '@lid', '') = ?
        ORDER BY fecha ASC
    `;
    return await all(sql, [telefono, cleanTel]);
}

/**
 * Normaliza y purga los IDs de WhatsApp en la tabla de logs. 🧼
 * Esto se ejecuta al iniciar para unificar el historial antiguo.
 */
export async function cleanLogsJIDs() {
    console.log('[Database/Leads] 🧼 Iniciando purga de JIDs en logs...');
    // Actualizar todos los números con sufijo a formato limpio
    const res = await run(`
        UPDATE logs 
        SET telefono = REPLACE(REPLACE(telefono, '@c.us', ''), '@lid', '') 
        WHERE telefono LIKE '%@%'
    `);
    if (res.changes > 0) {
        console.log(`[Database/Leads] ✅ Se han normalizado ${res.changes} identificadores de chat.`);
    }
}