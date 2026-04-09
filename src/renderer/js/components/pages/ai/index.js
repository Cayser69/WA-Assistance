import { TemplateLoader } from '../../../core/loader.js';

// --- Importación de Sub-Componentes (Tabs) ---
import { AIConexion } from './tabs/conexion/index.js';
import { AIPersonalidad } from './tabs/personalidad/index.js';
import { AIAutomatizacion } from './tabs/automatizacion/index.js';
import { AICatalogo } from './tabs/catalogo/index.js';
import { AIFAQs } from './tabs/faqs/index.js';
import { AIOperativa } from './tabs/operativa/index.js';

/**
 * Componente: AI (Inteligencia Artificial) - Orquestador Modular
 * Responsabilidad: Gestión de navegación y orquestación de sub-componentes.
 */
export const AI = {
    render: () => `
        <div id="ai-content-root" class="animate-fade-in" style="width: 100%;">
            <!-- El orquestador inyectará el contenido aquí -->
        </div>
    `,

    /**
     * Lógica de inicialización y ruteo interno.
     */
    init: async (appState, params = {}) => {
        const activeTab = params.tab || 'conexion';
        console.log(`[AI] Orquestando vista: ${activeTab}`);

        try {
            // 1. Cargar Contenedor Principal (Bypass cache)
            const mainHtml = await TemplateLoader.loadHTML('ai', 'template.html', true);
            await TemplateLoader.loadCSS('ai');
            const root = document.getElementById('ai-content-root');
            if (!root) return;
            root.innerHTML = mainHtml;

            // --- Lógica del Mago de Configuración (Persistente) ---
            const contextArea = document.getElementById('ai-business-context');
            const btnSaveContext = document.getElementById('btn-save-context');
            
            if (contextArea && btnSaveContext) {
                const settings = await window.api.getAllSettings();
                contextArea.value = settings.ai_business_context || '';
                
                btnSaveContext.onclick = async () => {
                    await window.api.saveSetting('ai_business_context', contextArea.value);
                    alert('✨ Contexto de negocio guardado. Ahora puedes usar la IA para auto-completar las secciones.');
                };
            }

            // 2. Títulos Dinámicos (Sincronizados con el Sidebar)
            const titles = { 
                'conexion': 'Conexión API OpenAI', 
                'personalidad': 'Identidad de la IA', 
                'automatizacion': 'Automatización de Respuestas',
                'catalogo': 'Catálogo de Productos',
                'faqs': 'Preguntas Frecuentes',
                'operativa': 'Operativa y Políticas'
            };
            const titleEl = document.getElementById('ai-view-title');
            if (titleEl) titleEl.textContent = titles[activeTab] || 'Configuración IA';

            // 3. Cargar y Renderizar el Sub-Componente Activo (Bypass cache)
            const tabContainer = document.getElementById('ai-tab-container');
            if (!tabContainer) return;

            // Cargar HTML específico de la sub-vista
            const tabHtml = await TemplateLoader.loadHTML(`ai/tabs/${activeTab}`, 'template.html', true);
            tabContainer.innerHTML = tabHtml;

            // 4. Inicializar Lógica del Sub-Componente
            const components = {
                'conexion': AIConexion,
                'personalidad': AIPersonalidad,
                'automatizacion': AIAutomatizacion,
                'catalogo': AICatalogo,
                'faqs': AIFAQs,
                'operativa': AIOperativa
            };

            const activeComponent = components[activeTab];
            if (activeComponent && activeComponent.init) {
                await activeComponent.init();
            }

            console.log(`[AI] Sub-módulo '${activeTab}' inicializado.`);
        } catch (err) {
            console.error('[AI] Error en orquestación modular:', err);
        }
    }
};
