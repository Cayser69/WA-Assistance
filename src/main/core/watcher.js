import fs from 'fs';
import path from 'path';

/**
 * Motor de Hot-Reload para el Renderer (Estabilizado para Windows) 🛠️
 */
let lastReload = 0;

export function watchRenderer(window, rendererPath) {
    const bootTime = Date.now();
    const validExtensions = ['.js', '.png', '.jpg', '.svg'];

    if (!fs.existsSync(rendererPath)) {
        console.warn(`[Watcher] ⚠️ No se puede vigilar: ${rendererPath} no existe.`);
        return;
    }

    fs.watch(rendererPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;

        // Ignorar archivos temporales o de sistema comunes en Windows
        if (filename.includes('~') || filename.includes('.tmp') || filename.startsWith('.')) return;

        const now = Date.now();
        // Debounce: Aumentar espera tras arranque y entre recargas (30s de gracia)
        if (now - bootTime < 30000 || now - lastReload < 5000) return;

        // Filtrar estrictamente por extensión
        const hasValidExt = validExtensions.some(ext => filename.endsWith(ext));
        if (!hasValidExt) return;

        try {
            const filePath = path.join(rendererPath, filename);
            if (!fs.existsSync(filePath)) return;
            
            const stats = fs.statSync(filePath);
            const mtime = stats.mtimeMs;

            // Diferencia mínima para considerar un cambio como "Manual/Real"
            if (now - mtime < 1500) {
                lastReload = now;
                console.log(`[Watcher] ⚡ Cambio verificado: ${filename}. Sincronizando ventana...`);
                window.webContents.send('app:reload-status', { file: filename });
                window.reload();
            }
        } catch (err) {
            // Silenciar fallos de acceso a archivos bloqueados por el sistema
        }
    });
}
