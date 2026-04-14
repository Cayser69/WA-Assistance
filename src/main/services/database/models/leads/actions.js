import { run } from '../../setup/connection.js';
import { normalizePhone, isInternalID } from './utils.js';
import { isLeadExists } from './queries.js';

/**
 * Gestor de Acciones y Mutaciones para el Modelo de Leads 🎯
 */

/**
 * Inserta un nuevo lead, evitando duplicados y normalizando formatos.
 * Prioridad absoluta: El número de teléfono real.
 */
export async function insertLead(telefono, nombre = null, tipo = 'manual', meta_id = null) {
    const cleanTel = normalizePhone(telefono);
    const cleanMeta = meta_id ? normalizePhone(meta_id) : null;

    if (!cleanTel) return { error: 'Teléfono inválido' };

    // Si es un ID interno largo, lo ignoramos (Simplificación definitiva)
    if (isInternalID(cleanTel)) {
        return { error: 'ID interno ignorado', isInternal: true };
    }

    const exists = await isLeadExists(cleanTel, cleanMeta);
    if (exists) {
        // Enriquecer registro existente si hay nuevos datos
        if (cleanMeta || (nombre && nombre !== 'Desconocido')) {
            let updates = [];
            let params = [];
            
            if (cleanMeta) {
                updates.push('meta_id = IFNULL(meta_id, ?)');
                params.push(cleanMeta);
            }
            if (nombre && nombre !== 'Desconocido') {
                updates.push('nombre = IFNULL(nombre, ?)');
                params.push(nombre);
            }

            if (updates.length > 0) {
                params.push(cleanTel); // Para el WHERE
                await run(`UPDATE leads SET ${updates.join(', ')}, reparado = 0 WHERE telefono = ?`, params);
            }
        }
        return { isDuplicate: true };
    }

    const result = await run(
        'INSERT INTO leads (telefono, nombre, tipo, meta_id, reparado) VALUES (?, ?, ?, ?, 1)', 
        [cleanTel, nombre, tipo, cleanMeta]
    );
    return { id: result.lastID, isDuplicate: false };
}

/**
 * Actualiza el nombre de un lead por su ID o teléfono.
 */
export async function updateLeadName(id, nombre, telefono = null) {
    if (id) {
        return await run("UPDATE leads SET nombre = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?", [nombre, id]);
    } else if (telefono) {
        return await run("UPDATE leads SET nombre = ?, created_at = CURRENT_TIMESTAMP WHERE telefono = ?", [nombre, telefono]);
    }
}

/**
 * Marca un lead como contactado.
 */
export async function markLeadAsContacted(id) {
    return await run("UPDATE leads SET estado = 'contactado', fecha_contacto = CURRENT_TIMESTAMP WHERE id = ?", [id]);
}

/**
 * Elimina varios leads por sus IDs.
 */
export async function deleteLeads(ids) {
    if (!ids || ids.length === 0) return { deleted: 0 };
    const placeholders = ids.map(() => '?').join(',');
    const result = await run(`DELETE FROM leads WHERE id IN (${placeholders})`, ids);
    return { deleted: result.changes };
}

/**
 * Inserta múltiples leads en una sola transacción para alto rendimiento. 🚀⚡
 * Sigue la regla: Si el número ya existe, se ignora por completo (No modifica).
 */
export async function insertLeadsBatch(leads) {
    if (!leads || !Array.isArray(leads)) return { imported: 0, skipped: 0 };
    
    await run('BEGIN TRANSACTION');
    let imported = 0;
    let skipped = 0;

    try {
        for (const lead of leads) {
            const { telefono, nombre } = lead;
            const cleanTel = normalizePhone(telefono);

            if (!cleanTel || isInternalID(cleanTel)) {
                skipped++;
                continue;
            }

            // Según requerimiento: Si ya existe, NO se guarda/modifica.
            const exists = await isLeadExists(cleanTel);
            if (exists) {
                skipped++;
                continue;
            }

            await run(
                'INSERT INTO leads (telefono, nombre, tipo, reparado) VALUES (?, ?, ?, 1)', 
                [cleanTel, nombre || null, 'manual']
            );
            imported++;
        }
        await run('COMMIT');
        return { success: true, imported, skipped };
    } catch (err) {
        await run('ROLLBACK');
        console.error('[Database-Leads] Error en inserción masiva:', err);
        throw err;
    }
}
