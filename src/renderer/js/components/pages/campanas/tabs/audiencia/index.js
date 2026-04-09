import { TemplateLoader } from '../../../../../core/loader.js';
import { AudienciaRender } from './render.js';
import { AudienciaPagination } from './pagination.js';
import { AudienciaActions } from './actions.js';

/**
 * Sub-componente Modular: Gestión de Audiencia (Orquestador)
 */
export const AudienciaTab = {
    /**
     * Carga el fragmento HTML dinámicamente.
     */
    render: async () => {
        return await TemplateLoader.loadHTML('campanas/tabs/audiencia');
    },

    /**
     * Inicialización de la lógica, eventos y sub-módulos.
     */
    init: async (appState) => {
        const tbody = document.querySelector('#leads-table tbody');
        const countSelected = document.getElementById('count-selected');
        const filterSelect = document.getElementById('filter-leads');

        const updateSelectedCount = () => {
            if (countSelected) countSelected.textContent = appState.selectedLeads.length;
        };

        // 1. Inicializar Paginación y Scroll Infinito
        const pagination = new AudienciaPagination({
            tbody,
            renderRow: AudienciaRender.renderRow,
            isSelected: (id) => appState.selectedLeads.some(s => s.id === id),
            onRowsAdded: () => {
                bindCheckboxEvents();
                updateSelectedCount();
            }
        });

        const refresh = () => pagination.loadNextPage(filterSelect?.value || 'all');

        // 2. Vincular Eventos de Checkbox
        const bindCheckboxEvents = () => {
            document.querySelectorAll('.lead-checkbox').forEach(cb => {
                cb.onchange = () => {
                    const id = parseInt(cb.dataset.id);
                    if (cb.checked) {
                        if (!appState.selectedLeads.find(l => l.id === id)) {
                            appState.selectedLeads.push({ id, telefono: cb.dataset.phone });
                        }
                    } else {
                        appState.selectedLeads = appState.selectedLeads.filter(l => l.id !== id);
                    }
                    updateSelectedCount();
                };
            });
        };

        // 3. Inicializar Acciones (Añadir Lead, Sincronizar, Importar, etc.)
        AudienciaActions.setup({ 
            appState, 
            pagination, 
            refresh, 
            updateCount: updateSelectedCount 
        });

        // 4. Configuración de filtros
        if (filterSelect) {
            filterSelect.onchange = refresh;
        }
        
        await refresh();

        // Actualización del estado visual de sincronización
        if (appState && typeof appState.updateWAStatusUI === 'function') {
            appState.updateWAStatusUI(appState.waStatus);
        }
    }
};
