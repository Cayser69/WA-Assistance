import { run, all } from '../../setup/connection.js';
import { normalizePhone } from './utils.js';

/**
 * Gestor de Optimización y Mantenimiento de la Base de Datos de Leads 🧹
 */

/**
 * 🛠️ Función de Optimización y Limpieza Profunda (Async)
 * Diseñada para manejar millones de registros mediante chunks y ejecución no bloqueante.
 */
export async function repairMetaData(onProgress = null) {
    console.log('[Database/Leads/Maintenance] 🚀 Iniciando optimización de alto rendimiento...');
    
    // 1. ELIMINACIÓN RADICAL de registros de ID de Meta (>= 13 dígitos)
    const deleted = await run('DELETE FROM leads WHERE length(telefono) >= 13');
    if (deleted.changes > 0) {
        console.log(`[Database/Maintenance] 🧹 Limpieza radical completada: ${deleted.changes} IDs de Meta eliminados.`);
    }

    // 2. NORMALIZACIÓN INCREMENTAL (Por Chunks)
    const CHUNK_SIZE = 1000;
    const totalToRepairRows = await all('SELECT COUNT(*) as total FROM leads WHERE reparado = 0');
    const totalToRepair = totalToRepairRows[0].total;

    if (totalToRepair === 0) {
        console.log('[Database/Maintenance] ✅ Todo está al día.');
        return 0;
    }

    let processed = 0;
    while (processed < totalToRepair) {
        const batch = await all('SELECT * FROM leads WHERE reparado = 0 LIMIT ?', [CHUNK_SIZE]);
        if (batch.length === 0) break;

        for (const lead of batch) {
            const cleanTel = normalizePhone(lead.telefono);
            
            if (cleanTel !== lead.telefono) {
                try {
                    await run('UPDATE leads SET telefono = ?, reparado = 1 WHERE id = ?', [cleanTel, lead.id]);
                } catch (err) {
                    if (err.message.includes('UNIQUE')) {
                        await run('DELETE FROM leads WHERE id = ?', [lead.id]);
                    }
                }
            } else {
                await run('UPDATE leads SET reparado = 1 WHERE id = ?', [lead.id]);
            }
            processed++;
        }

        if (onProgress) {
            const percent = Math.round((processed / totalToRepair) * 100);
            onProgress(percent);
        }
    }

    console.log(`[Database/Maintenance] ✅ Optimización finalizada. Registros procesados: ${processed}`);

    // 3. UNIFICACIÓN DE PREFIJOS (Fusión de 9 y 11 dígitos)
    console.log('[Database/Maintenance] 🏹 Iniciando fase de unificación de prefijos...');
    const shortLeads = await all("SELECT * FROM leads WHERE length(telefono) = 9");
    let unifications = 0;

    for (const lead of shortLeads) {
        const longVersion = '34' + lead.telefono;
        const existingLong = await all("SELECT id, nombre, meta_id FROM leads WHERE telefono = ?", [longVersion]);

        if (existingLong.length > 0) {
            const longId = existingLong[0].id;
            console.log(`[Maintenance] Fusionando ${lead.telefono} -> ${longVersion}`);
            
            // Unificar metadatos (Nombre y MetaID) si el corto tiene datos y el largo no
            if (lead.nombre && lead.nombre !== 'Desconocido' && (!existingLong[0].nombre || existingLong[0].nombre === 'Desconocido')) {
                await run("UPDATE leads SET nombre = ? WHERE id = ?", [lead.nombre, longId]);
            }
            if (lead.meta_id && !existingLong[0].meta_id) {
                await run("UPDATE leads SET meta_id = ? WHERE id = ?", [lead.meta_id, longId]);
            }

            // Borrar el corto duplicado
            await run("DELETE FROM leads WHERE id = ?", [lead.id]);
            unifications++;
        } else {
            // Si no existe la versión larga, simplemente normalizar el teléfono de este registro
            // pero con cuidado de no violar UNIQUE (aunque ya comprobamos que no existe)
            try {
                await run("UPDATE leads SET telefono = ?, reparado = 1 WHERE id = ?", [longVersion, lead.id]);
                unifications++;
            } catch (e) { }
        }
    }
    
    if (unifications > 0) console.log(`[Database/Maintenance] 🎯 Unificadas ${unifications} variantes de teléfono.`);
    return processed;
}

/**
 * Vacía completamente la tabla de leads para pruebas.
 */
export async function truncateLeads() {
    return await run("DELETE FROM leads");
}
