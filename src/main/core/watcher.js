import fs from 'fs';
import path from 'path';

/**
 * Motor de Hot-Reload para el Renderer (Estabilizado para Windows) 🛠️
 */
let lastReload = 0;

export function watchRenderer(window, rendererPath) {
    const bootTime = Date.now();
    const validExtensions = ['.js', '.html', '.css', '.png', '.jpg', '.svg'];

    if (!fs.existsSync(rendererPath)) {
        console.warn(`[Watcher] ⚠️ No se puede vigilar: ${rendererPath} no existe.`);
        return;
    }

    fs.watch(rendererPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;

        const now = Date.now();
        // Debounce: Evitar ráfagas y esperar estabilidad tras arranque
        if (now - bootTime < 10000 || now - lastReload < 2500) return;

        // Filtrar por extensión
        const hasValidExt = validExtensions.some(ext => filename.endsWith(ext));
        if (!hasValidExt) return;

        try {
            const filePath = path.join(rendererPath, filename);
            if (!fs.existsSync(filePath)) return;
            
            const stats = fs.statSync(filePath);
            const mtime = stats.mtimeMs;

            // Solo recargar si el archivo fue modificado recientemente (REAL change)
            if (now - mtime < 2000) {
                lastReload = now;
                console.log(`[Dev-Watcher] 🔄 Cambio REAL detectado en: ${filename}. Recargando...`);
                window.reload();
            }
        } catch (err) {
            // Ignorar errores de archivos temporales
        }
    });
}
