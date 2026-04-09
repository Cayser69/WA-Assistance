import { TemplateLoader } from '../../../core/loader.js';
import { MensajeTab } from './tabs/mensaje/index.js';
import { PlantillasTab } from './tabs/plantillas.js';
import { AudienciaTab } from './tabs/audiencia.js';

const DummyTab = { render: () => '<div class="p-20">Pestaña Aislada (Test)</div>', init: () => {} };

/**
 * Componente: Campanas - Centro de Estrategia Industrial 📊📈🚀
 * Orquestador modular de Mensajería, Multimedia, Plantillas y Audiencia.
 */
export const Campanas = {
    /**
     * Render inicial (Esqueleto de la vista)
     */
    render: () => `
        <div id="view-campanas-container" class="animate-fade-in">
            <!-- Cargando estructura de campañas... -->
        </div>
    `,

    /**
     * Inicialización, carga de estilos y ruteo interno de pestañas.
     */
    init: async (appState, params = {}) => {
        const activeTab = params.tab || 'mensaje';
        console.log(`[Campanas] 📊 Gestionando pestaña: ${activeTab}...`);

        try {
            let root = document.getElementById('campaign-content-root');
            
            // 1. Detección de Estructura Persistente 🛡️
            // Si el root no existe, cargamos la estructura base completa
            if (!root) {
                const html = await TemplateLoader.loadHTML('pages/campanas');
                await TemplateLoader.loadCSS('pages/campanas');
                const container = document.getElementById('view-campanas-container');
                if (container) container.innerHTML = html;
                root = document.getElementById('campaign-content-root');
            }

            if (!root) return;

            // 2. Determinar componente de pestaña
            const tabs = {
                'mensaje': MensajeTab,
                'plantillas': PlantillasTab,
                'audiencia': AudienciaTab
            };
            const component = tabs[activeTab] || MensajeTab;

            // 3. Renderizado Inteligente de Pestaña
            // Solo inyectamos si el contenido es diferente o forzamos refresco
            root.innerHTML = await component.render();

            // 4. Actualizar título dinámico
            const titles = { 
                'mensaje': 'Lanzar Envío Masivo', 
                'plantillas': 'Biblioteca de Plantillas', 
                'audiencia': 'Selección de Leads' 
            };
            const titleEl = document.getElementById('view-title');
            if (titleEl) {
                titleEl.textContent = titles[activeTab] || 'Gestión de Campañas';
            }

            // 5. Utilidades compartidas
            const utils = {
                refreshTemplates: async () => {
                    const templates = await window.api.getTemplates();
                    const select = document.getElementById('select-templates');
                    if (select) {
                        select.innerHTML = '<option value="">Cargar Plantilla...</option>' + 
                            templates.map(t => `<option value="${t.id}" data-content="${encodeURIComponent(t.contenido)}" data-image="${t.image_path || ''}">${t.nombre}</option>`).join('');
                    }
                    return templates;
                }
            };

            // 6. Inicialización lógica (Paralela si es posible)
            if (component.init) {
                await component.init(appState, utils);
            }

            console.log(`[Campanas] ✅ Pestaña '${activeTab}' lista.`);
        } catch (err) {
            console.error('[Campanas] ❌ Error en inicialización modular:', err);
        }
    }
};
