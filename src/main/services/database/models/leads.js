import { run, all } from '../connection.js';

/**
 * Verifica si un lead ya existe por su teléfono.
 */
export async function isLeadExists(telefono) {
    const row = await all('SELECT id FROM leads WHERE telefono = ?', [telefono]);
    return row.length > 0;
}

/**
 * Inserta un nuevo lead, evitando duplicados.
 */
export async function insertLead(telefono, nombre = null) {
    const exists = await isLeadExists(telefono);
    if (exists) {
        return { isDuplicate: true };
    }
    const result = await run('INSERT INTO leads (telefono, nombre) VALUES (?, ?)', [telefono, nombre]);
    return { id: result.lastID, isDuplicate: false };
}

/**
 * Obtiene leads filtrados por estado o búsqueda, con paginación.
 */
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

/**
 * Cuenta los leads según filtros.
 */
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

/**
 * Obtiene todos los leads con estado pendiente.
 */
export async function getPendingLeads() {
    return await all("SELECT * FROM leads WHERE estado = 'pendiente'");
}

/**
 * Obtiene leads capturados sin nombre para reparación.
 */
export async function getLeadsWithoutName() {
    return await all("SELECT * FROM leads WHERE nombre IS NULL OR nombre = ''");
}

/**
 * Actualiza el nombre de un lead por su ID.
 */
export async function updateLeadName(id, nombre) {
    return await run("UPDATE leads SET nombre = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?", [nombre, id]);
}

/**
 * Marca un lead como contactado.
 */
export async function markLeadAsContacted(id) {
    return await run("UPDATE leads SET estado = 'contactado', fecha_contacto = CURRENT_TIMESTAMP WHERE id = ?", [id]);
}
