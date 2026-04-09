import { TemplateLoader } from '../../../core/loader.js';
import { ConfigTab } from './tabs/config/index.js';
import { ProgresoTab } from './tabs/progreso/index.js';
import { ResultadosTab } from './tabs/resultados/index.js';

/**
 * Componente: Validador de Números (Scanner) - Orquestador Modular
 */
export const Scanner = {
    render: () => `
        <div id="scanner-view-container" class="animate-fade-in" style="width: 100%;">
            <!-- El contenido dinámico se inyecta aquí -->
        </div>
    `,

    /**
     * Lógica de inicialización.
     */
    init: async (appState, params = {}) => {
        const activeTab = params.tab || 'config';
        console.log(`[Scanner] 🔍 Gestionando pestaña: ${activeTab}...`);

        try {
            let root = document.getElementById('scanner-content-root');

            // 1. Detección de Estructura Persistente 🛡️
            if (!root) {
                const html = await TemplateLoader.loadHTML('scanner');
                await TemplateLoader.loadCSS('scanner');
                const container = document.getElementById('scanner-view-container');
                if (container) container.innerHTML = html;
                root = document.getElementById('scanner-content-root');
            }

            if (!root) return;

            // 2. Mapeo de sub-componentes internos
            const tabs = {
                'config': ConfigTab,
                'progreso': ProgresoTab,
                'resultados': ResultadosTab
            };
            const component = tabs[activeTab] || ConfigTab;

            // 3. Renderizado Inteligente
            root.innerHTML = await component.render();

            // 4. Actualizar título dinámico
            const titles = { 
                'config': 'Lanzar Escaneo Seguro', 
                'progreso': 'Progreso en Vivo', 
                'resultados': 'Resultados del Escaneo' 
            };
            const titleEl = document.getElementById('scanner-view-title');
            if (titleEl) titleEl.textContent = titles[activeTab] || 'Validador de Números';

            // 5. Inicialización lógica
            if (component.init) {
                await component.init(appState);
            }

            console.log(`[Scanner] ✅ Pestaña '${activeTab}' lista.`);
        } catch (err) {
            console.error('[Scanner] ❌ Error en inicialización:', err);
        }
    }
};
