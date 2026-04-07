/**
 * Sub-componente: Gestión de Audiencia (Leads)
 */

export const AudienciaTab = {
    render: () => `
        <div id="section-audiencia" class="animate-fade-in" style="display: block; width: 100%;">
            <div style="display: grid; grid-template-columns: 0.7fr 1.3fr; gap: 20px; width: 100%;">
                
                <div class="left-panel">
                    <div class="card glass-card">
                        <h3><span class="material-icons-outlined">person_add</span> Añadir Contactos</h3>
                        <div class="add-lead-row">
                            <input type="text" id="new-lead-phone" placeholder="Ej: 34600111222">
                            <button id="btn-add-lead" class="btn btn-primary">Añadir</button>
                        </div>
                        <hr style="border: 0.5px solid var(--glass-border); margin: 20px 0;">
                        <button id="btn-import-csv" class="btn btn-secondary full-width">
                            <span class="material-icons-outlined">upload_file</span> Importar CSV de Leads
                        </button>
                    </div>

                    <div class="card glass-card" style="margin-top: 20px;">
                        <h3><span class="material-icons-outlined">check_box</span> Acciones de Selección</h3>
                        <p class="text-muted" style="font-size: 0.8rem; margin-bottom: 15px;">Seleccionados para campaña: <b id="count-selected">0</b></p>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <button id="btn-select-all" class="btn" style="background: rgba(255,255,255,0.05); font-size: 0.85rem;">SELECCIONAR TODO (PAG)</button>
                            <button id="btn-select-none" class="btn" style="background: rgba(255,255,255,0.05); font-size: 0.85rem;">LIMPIAR SELECCIÓN</button>
                        </div>
                        <hr style="border: 0.5px solid var(--glass-border); margin: 20px 0;">
                        <button id="btn-go-to-message" class="btn btn-primary full-width" style="background: var(--primary); border: none;">
                            <span class="material-icons-outlined">send</span> CONTINUAR A REDACCIÓN
                        </button>
                    </div>
                </div>

                <div class="card glass-card leads-card">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3><span class="material-icons-outlined">list</span> Gestión de Base de Datos</h3>
                        <div class="filter-actions">
                             <select id="filter-leads" class="template-select">
                                <option value="pendiente">Solo Pendientes</option>
                                <option value="all">Ver Todos</option>
                             </select>
                        </div>
                    </div>
                    <div class="table-container">
                        <table id="leads-table">
                            <thead>
                                <tr>
                                    <th style="width: 40px;"><input type="checkbox" id="master-checkbox"></th>
                                    <th>Teléfono</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,

    init: async (appState) => {
        const btnAddLead = document.getElementById('btn-add-lead');
        const phoneInput = document.getElementById('new-lead-phone');
        const btnImportCSV = document.getElementById('btn-import-csv');
        const filterSelect = document.getElementById('filter-leads');
        const countSelected = document.getElementById('count-selected');
        const btnSelectAll = document.getElementById('btn-select-all');
        const btnSelectNone = document.getElementById('btn-select-none');
        const masterCheckbox = document.getElementById('master-checkbox');

        const updateSelectedCount = () => {
            if (countSelected) countSelected.textContent = appState.selectedLeads.length;
        };

        const refreshLeadsList = async () => {
            const filter = filterSelect ? filterSelect.value : 'pendiente';
            const leads = await window.api.getLeads(filter);
            const tbody = document.querySelector('#leads-table tbody');
            
            if (tbody) {
                tbody.innerHTML = leads.length ? leads.map(l => `
                    <tr>
                        <td>
                            <input type="checkbox" class="lead-checkbox" data-id="${l.id}" data-phone="${l.telefono}" 
                            ${appState.selectedLeads.some(s => s.id === l.id) ? 'checked' : ''}>
                        </td>
                        <td><strong>${l.nombre || '<i>Desconocido</i>'}</strong></td>
                        <td>${l.telefono}</td>
                        <td><span class="badge ${l.estado}">${l.estado.toUpperCase()}</span></td>
                    </tr>
                `).join('') : '<tr><td colspan="4" style="text-align:center; padding: 40px; color: var(--text-muted);">Sin registros</td></tr>';

                // Re-vincular eventos de checkboxes
                const checkboxes = document.querySelectorAll('.lead-checkbox');
                checkboxes.forEach(cb => {
                    cb.onchange = (e) => {
                        const id = parseInt(cb.dataset.id);
                        const phone = cb.dataset.phone;
                        if (cb.checked) {
                            if (!appState.selectedLeads.find(l => l.id === id)) {
                                appState.selectedLeads.push({ id, telefono: phone });
                            }
                        } else {
                            appState.selectedLeads = appState.selectedLeads.filter(l => l.id !== id);
                        }
                        updateSelectedCount();
                    };
                });
            }
            updateSelectedCount();
        };

        await refreshLeadsList();

        if (filterSelect) filterSelect.onchange = refreshLeadsList;

        btnAddLead.onclick = async () => {
            const tel = phoneInput.value.trim();
            if (tel) {
                const res = await window.api.insertLead(tel);
                if (res.isDuplicate) {
                    alert('Este teléfono ya existe en la base de datos.');
                } else {
                    phoneInput.value = '';
                    await refreshLeadsList();
                }
            }
        };

        btnSelectAll.onclick = () => {
            const checkboxes = document.querySelectorAll('.lead-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = true;
                const id = parseInt(cb.dataset.id);
                const phone = cb.dataset.phone;
                if (!appState.selectedLeads.find(l => l.id === id)) {
                    appState.selectedLeads.push({ id, telefono: phone });
                }
            });
            masterCheckbox.checked = true;
            updateSelectedCount();
        };

        btnSelectNone.onclick = () => {
            const checkboxes = document.querySelectorAll('.lead-checkbox');
            checkboxes.forEach(cb => cb.checked = false);
            appState.selectedLeads = [];
            masterCheckbox.checked = false;
            updateSelectedCount();
        };

        masterCheckbox.onchange = () => {
            if (masterCheckbox.checked) btnSelectAll.click();
            else btnSelectNone.click();
        };

        const btnGoToMessage = document.getElementById('btn-go-to-message');

        if (btnGoToMessage) {
            btnGoToMessage.onclick = () => {
                if (appState.selectedLeads.length === 0) {
                    const confirmAll = confirm('No has seleccionado ningún contacto. ¿Quieres ir a enviar a TODOS los pendientes?');
                    if (!confirmAll) return;
                }
                window.router.navigate('campanas', { tab: 'mensaje' });
            };
        }

        if (btnImportCSV) {
            btnImportCSV.onclick = () => {
                alert('Funcionalidad de importación CSV próximamente...');
            }
        }
    }
};
