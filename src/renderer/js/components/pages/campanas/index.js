import { TemplateLoader } from '../../../core/loader.js';
import { MensajeTab } from './tabs/mensaje.js';
import { PlantillasTab } from './tabs/plantillas.js';
import { MultimediaTab } from './tabs/multimedia.js';
import { AudienciaTab } from './tabs/audiencia.js';

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
        console.log('[Campanas] 📊 Iniciando orquestador de envíos...');

        try {
            // 1. Cargar estructura base y estilos modulares
            const html = await TemplateLoader.loadHTML('campanas');
            await TemplateLoader.loadCSS('campanas');

            const container = document.getElementById('view-campanas-container');
            if (!container) return;

            // Inyectamos el esqueleto maestro
            container.innerHTML = html;

            // 2. Determinar la pestaña activa
            const activeTab = params.tab || 'mensaje';
            const root = document.getElementById('campaign-content-root');
            
            const tabs = {
                'mensaje': MensajeTab,
                'plantillas': PlantillasTab,
                'multimedia': MultimediaTab,
                'audiencia': AudienciaTab
            };

            const component = tabs[activeTab] || MensajeTab;

            // 3. Renderizar el sub-componente de la pestaña
            if (root) {
                root.innerHTML = component.render();
            }

            // 4. Actualizar título dinámico
            const titles = { 
                'mensaje': 'Lanzar Envío Masivo', 
                'plantillas': 'Biblioteca de Plantillas', 
                'multimedia': 'Gestión de Multimedia', 
                'audiencia': 'Selección de Leads' 
            };
            const titleEl = document.getElementById('view-title');
            if (titleEl) {
                titleEl.textContent = titles[activeTab] || 'Gestión de Campañas';
            }

            // 5. Utilidades compartidas para los sub-componentes
            const utils = {
                refreshTemplates: async () => {
                    const templates = await window.api.getTemplates();
                    const select = document.getElementById('select-templates');
                    if (select) {
                        select.innerHTML = '<option value="">Cargar Plantilla...</option>' + 
                            templates.map(t => `<option value="${t.id}" data-content="${encodeURIComponent(t.contenido)}">${t.nombre}</option>`).join('');
                    }
                    return templates;
                }
            };

            // 6. Inicializar la lógica específica de la pestaña
            if (component.init) {
                await component.init(appState, utils);
            }

            console.log(`[Campanas] ✅ Pestaña '${activeTab}' inicializada.`);
        } catch (err) {
            console.error('[Campanas] ❌ Error en inicialización modular:', err);
        }
    }
};
