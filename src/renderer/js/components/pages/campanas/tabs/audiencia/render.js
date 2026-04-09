/**
 * Sub-manejador: Renderizado de Audiencia 🎨
 */

export const AudienciaRender = {
    template: `
        <div id="section-audiencia" class="animate-fade-in" style="display: block; width: 100%;">
            <div style="display: grid; grid-template-columns: 0.7fr 1.3fr; gap: 20px; width: 100%;">
                
                <div class="left-panel">
                    <div class="card glass-card">
                        <h3 style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                            <span class="material-icons-outlined" style="color: var(--primary);">person_add</span> 
                            Añadir Lead Manual
                        </h3>
                        <div class="add-lead-row" style="display: flex; flex-direction: column; gap: 15px;">
                            <div class="input-group">
                                <label style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 5px;">Nombre del Contacto</label>
                                <input type="text" id="new-lead-name" placeholder="Ej: Juan Pérez" style="width: 100%;">
                            </div>
                            <div class="input-group">
                                <label style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 5px;">Teléfono (WhatsApp)</label>
                                <div style="display: flex; gap: 10px;">
                                    <input type="text" id="new-lead-phone" placeholder="Ej: 34600111222" style="flex: 1;">
                                    <button id="btn-add-lead" class="btn btn-primary" style="padding: 0 20px;">
                                        <span class="material-icons-outlined">add</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <hr style="border: 0.5px solid var(--glass-border); margin: 20px 0;">
                        <button id="btn-import-csv" class="btn btn-secondary full-width">
                            <span class="material-icons-outlined">upload_file</span> Importar CSV de Leads
                        </button>
                    </div>

                    <div class="card glass-card" style="margin-top: 20px;">
                        <h3 style="display: flex; align-items: center; gap: 10px;"><span class="material-icons-outlined" style="color: var(--primary);">check_box</span> Acciones de Selección</h3>
                        <p class="text-muted" style="font-size: 0.8rem; margin-bottom: 15px;">Seleccionados para campaña: <b id="count-selected">0</b></p>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <button id="btn-select-all" class="btn" style="background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.1); font-size: 0.8rem; font-weight: 600;">
                                <span class="material-icons-outlined" style="font-size: 1rem; vertical-align: middle;">done_all</span> SELECCIONAR PÁGINA
                            </button>
                            <button id="btn-select-none" class="btn" style="background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.1); font-size: 0.8rem; font-weight: 600;">
                                <span class="material-icons-outlined" style="font-size: 1rem; vertical-align: middle;">deselect</span> LIMPIAR SELECCIÓN
                            </button>
                            <button id="btn-delete-selected" class="btn" style="background: rgba(255,50,50,0.1); color: #ff5f5f; border: 1px solid rgba(255,50,50,0.2); font-size: 0.8rem; font-weight: 600; margin-top: 10px;">
                                <span class="material-icons-outlined" style="font-size: 1rem; vertical-align: middle;">delete</span> ELIMINAR SELECCIONADOS
                            </button>
                            <button id="btn-sync-contacts" class="btn" style="background: rgba(50,255,50,0.1); color: #5fff5f; border: 1px solid rgba(50,255,50,0.2); font-size: 0.8rem; font-weight: 600; margin-top: 10px;">
                                <span class="material-icons-outlined" style="font-size: 1rem; vertical-align: middle;">sync</span> SINCRONIZAR AHORA
                            </button>
                        </div>
                        <hr style="border: 0.5px solid var(--glass-border); margin: 20px 0;">
                        <button id="btn-go-to-message" class="btn btn-primary full-width" style="padding: 12px !important;">
                            <span class="material-icons-outlined">send</span> CONTINUAR A REDACCIÓN
                        </button>
                    </div>
                </div>

                <div class="card glass-card leads-card">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="display: flex; align-items: center; gap: 10px;"><span class="material-icons-outlined" style="color: var(--primary);">list</span> Gestión de Base de Datos</h3>
                        <div class="filter-actions">
                             <select id="filter-leads" class="template-select" style="min-width: 150px;">
                                <option value="all">Filtro: Todos</option>
                                <option value="pendiente">Filtro: Pendientes</option>
                                <option value="contacto">Filtro: Contactos WA</option>
                                <option value="prospecto">Filtro: Prospectos Scan</option>
                             </select>
                        </div>
                    </div>
                    <div class="table-container">
                        <table id="leads-table">
                            <thead>
                                <tr>
                                    <th style="width: 40px;"><input type="checkbox" id="master-checkbox"></th>
                                    <th>Teléfono</th>
                                    <th>Nombre</th>
                                    <th>Tipo</th>
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

    renderRow: (l, isSelected) => {
        const tipoIcon = { 'contacto': '📱', 'prospecto': '🔍', 'manual': '👤' }[l.tipo || 'manual'];
        return `
            <tr class="lead-row animate-fade-in">
                <td>
                    <input type="checkbox" class="lead-checkbox" data-id="${l.id}" data-phone="${l.telefono}" 
                    ${isSelected ? 'checked' : ''}>
                </td>
                <td><strong>${l.telefono}</strong></td>
                <td>${l.nombre || '<i>Desconocido</i>'}</td>
                <td><span title="${l.tipo || 'manual'}">${tipoIcon} ${l.tipo || 'manual'}</span></td>
                <td><span class="badge ${l.estado}">${l.estado.toUpperCase()}</span></td>
            </tr>
        `;
    }
};
