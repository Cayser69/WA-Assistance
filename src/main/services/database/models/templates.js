import { run, all } from '../connection.js';

/**
 * Guarda o actualiza una plantilla de mensaje.
 */
export async function saveTemplate(id, nombre, contenido, imagePath = null) {
    if (id) {
        await run('UPDATE templates SET nombre = ?, contenido = ?, image_path = ? WHERE id = ?', [nombre, contenido, imagePath, id]);
    } else {
        await run('INSERT INTO templates (nombre, contenido, image_path) VALUES (?, ?, ?)', [nombre, contenido, imagePath]);
    }
}

/**
 * Elimina una plantilla por su ID.
 */
export async function deleteTemplate(id) {
    await run('DELETE FROM templates WHERE id = ?', [id]);
}

/**
 * Obtiene todas las plantillas ordenadas por nombre.
 */
export async function getTemplates() {
    return await all('SELECT * FROM templates ORDER BY nombre ASC');
}
