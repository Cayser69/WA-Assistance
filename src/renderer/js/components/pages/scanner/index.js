import { TemplateLoader } from '../../../core/loader.js';
import { ConfigTab } from './tabs/config.js';
import { ProgresoTab } from './tabs/progreso.js';
import { ResultadosTab } from './tabs/resultados.js';

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
        console.log('[Scanner] 🔍 Iniciando módulo de validación...');

        try {
            // 1. Cargar HTML y Estilos
            const html = await TemplateLoader.loadHTML('scanner');
            await TemplateLoader.loadCSS('scanner');

            const container = document.getElementById('scanner-view-container');
            if (!container) return;

            // Inyectamos la estructura base
            container.innerHTML = html;

            // 2. Determinar la pestaña activa
            const activeTab = params.tab || 'config';
            const root = document.getElementById('scanner-content-root');
            if (!root) return;

            // 3. Mapeo de sub-componentes internos
            const tabs = {
                'config': ConfigTab,
                'progreso': ProgresoTab,
                'resultados': ResultadosTab
            };

            const component = tabs[activeTab] || ConfigTab;

            // 4. Renderizar el contenido de la pestaña activa
            root.innerHTML = component.render();

            // 5. Actualizar título dinámico
            const titles = { 
                'config': 'Lanzar Escaneo Seguro', 
                'progreso': 'Progreso en Vivo', 
                'resultados': 'Resultados del Escaneo' 
            };
            const titleEl = document.getElementById('scanner-view-title');
            if (titleEl) titleEl.textContent = titles[activeTab] || 'Validador de Números';

            // 6. Inicializar la lógica específica del sub-componente
            if (component.init) {
                await component.init(appState);
            }

            console.log(`[Scanner] ✅ Pestaña '${activeTab}' cargada.`);
        } catch (err) {
            console.error('[Scanner] ❌ Error en inicialización:', err);
        }
    }
};
