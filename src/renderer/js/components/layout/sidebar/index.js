import { TemplateLoader } from '../../../core/loader.js';

/**
 * Componente: Sidebar (Barra de Navegación Lateral)
 */
export const Sidebar = {
    render: () => `
        <div id="sidebar-placeholder"></div>
    `,

    /**
     * Lógica de inicialización.
     */
    init: async () => {
        console.log('[Sidebar] 🛠️ Iniciando carga...');
        try {
            // 1. Cargar CSS primero para evitar parpadeos
            await TemplateLoader.loadCSS('sidebar');
            
            // 2. Cargar HTML
            const html = await TemplateLoader.loadHTML('sidebar');
            
            const placeholder = document.getElementById('sidebar-placeholder');
            if (placeholder) {
                placeholder.outerHTML = html;
                console.log('[Sidebar] ✅ Inyectado correctamente.');
            } else {
                console.warn('[Sidebar] ⚠️ No se encontró el placeholder.');
            }
        } catch (err) {
            console.error('[Sidebar] ❌ Error fatal:', err);
        }
    }
};
