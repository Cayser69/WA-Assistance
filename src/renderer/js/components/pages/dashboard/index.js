import { TemplateLoader } from '../../../core/loader.js';

/**
 * Componente: Dashboard - Arquitectura de Élite 🚀💎✨
 * Vista inicial del sistema con acceso rápido a módulos.
 */
export const Dashboard = {
    /**
     * Render inicial (Esqueleto)
     */
    render: () => `
        <div id="view-dashboard-container" class="animate-fade-in">
            <!-- Cargando Dashboard de Élite... -->
        </div>
    `,

    /**
     * Inicialización y carga de recursos asíncronos.
     */
    init: async (appState) => {
        console.log('[Dashboard] 🚀 Iniciando carga modular...');

        try {
            // 1. Cargar estructura y estilos dinámicamente
            const html = await TemplateLoader.loadHTML('dashboard');
            await TemplateLoader.loadCSS('dashboard');

            const container = document.getElementById('view-dashboard-container');
            if (container) {
                container.innerHTML = html;
                console.log('[Dashboard] ✅ Renderizado modular completado.');
            }
        } catch (err) {
            console.error('[Dashboard] ❌ Error crítico en inicialización:', err);
        }
    }
};
