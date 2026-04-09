import { all } from '../../setup/connection.js';
import { normalizePhone } from './utils.js';

/**
 * Gestor de Consultas para el Modelo de Leads 🔍
 */

/**
 * Verifica si un lead ya existe por su teléfono o ID de Meta.
 */
export async function isLeadExists(telefono, metaId = null) {
    const cleanTel = normalizePhone(telefono);
    const cleanMeta = metaId ? normalizePhone(metaId) : null;
    
    // Búsqueda Inteligente: Exacta + Variante sin prefijo (si aplica)
    let sql = 'SELECT id FROM leads WHERE (telefono = ?';
    let params = [cleanTel];

    if (cleanTel && cleanTel.startsWith('34') && cleanTel.length === 11) {
        sql += ' OR telefono = ?';
        params.push(cleanTel.substring(2)); // Buscar la versión de 9 dígitos
    }
    sql += ')';

    if (cleanMeta) {
        sql += ' OR meta_id = ?';
        params.push(cleanMeta);
    }
    
    const row = await all(sql, params);
    return row.length > 0;
}

/**
 * Obtiene leads filtrados por estado o búsqueda, con paginación.
 */
export async function getLeads(filter = 'all', limit = 50, offset = 0, searchQuery = '') {
    let sql = "SELECT * FROM leads ";
    let params = [];
    let where = [];

    if (filter === 'pendiente') where.push("estado = 'pendiente'");
    if (filter === 'contacto' || filter === 'prospecto' || filter === 'manual') {
        where.push("tipo = ?");
        params.push(filter);
    }
    
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
    if (filter === 'contacto' || filter === 'prospecto' || filter === 'manual') {
        where.push("tipo = ?");
        params.push(filter);
    }
    
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
