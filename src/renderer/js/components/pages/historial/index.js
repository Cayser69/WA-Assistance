import { TemplateLoader } from '../../../core/loader.js';

/**
 * Componente: Historial - Registro de Actividad 📑✨
 */
export const Historial = {
    render: () => `
        <div id="view-historial-container" class="animate-fade-in">
            <!-- Cargando Historial... -->
        </div>
    `,

    init: async () => {
        try {
            const html = await TemplateLoader.loadHTML('historial');
            const container = document.getElementById('view-historial-container');
            if (container) {
                container.innerHTML = html;
            }
        } catch (err) {
            console.error('[Historial] Error:', err);
        }
    }
};
