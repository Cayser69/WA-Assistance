import { AudienciaRender } from './audiencia/render.js';
import { AudienciaPagination } from './audiencia/pagination.js';
import { AudienciaActions } from './audiencia/actions.js';

/**
 * Sub-componente: Gestión de Audiencia (Orquestador Modular) 📂🏗️✨
 */
export const AudienciaTab = {
    render: () => AudienciaRender.template,

    init: async (appState) => {
        const tbody = document.querySelector('#leads-table tbody');
        const countSelected = document.getElementById('count-selected');
        const filterSelect = document.getElementById('filter-leads');

        const updateSelectedCount = () => {
            if (countSelected) countSelected.textContent = appState.selectedLeads.length;
        };

        // 1. Inicializar Paginación y Scroll Infinito 📟
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

        // 2. Vincular Eventos de Checkbox ⚡
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

        // 3. Inicializar Acciones (Botones) 👥
        AudienciaActions.setup({ appState, pagination, refresh, updateCount: updateSelectedCount });

        // 4. Configuración inicial
        if (filterSelect) filterSelect.onchange = refresh;
        
        await refresh();

        // Configuración inicial del estado del botón de sincronización 🛡️
        appState.updateWAStatusUI(appState.waStatus);

        const masterCheckbox = document.getElementById('master-checkbox');
        if (masterCheckbox) {
            masterCheckbox.onchange = () => {
                if (masterCheckbox.checked) document.getElementById('btn-select-all').click();
                else document.getElementById('btn-select-none').click();
            };
        }
    }
};
