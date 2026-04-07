/**
 * Sub-Componente de Scanner: Resultados
 */
export const ResultadosTab = {
    render: () => `
        <div class="card glass-card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <h3><span class="material-icons-outlined">fact_check</span> Números Válidos Encontrados</h3>
                <button id="btn-repair-leads" class="btn btn-secondary btn-sm" title="Re-escanear nombres desconocidos">
                    <span class="material-icons-outlined">auto_fix_high</span> Reparar Nombres
                </button>
            </div>
            <p class="text-muted">Aquí verás los últimos números que han sido validados con éxito y están listos para ser usados en campañas.</p>
            
            <div id="results-list-container" style="margin-top: 20px;">
                <div class="table-container">
                    <table class="leads-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Teléfono (WA)</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody id="scanner-results-body">
                            <tr>
                                <td colspan="4" style="text-align: center; padding: 40px; color: var(--text-muted);">
                                    Cargando resultados...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,

    init: async (appState) => {
        const tbody = document.getElementById('scanner-results-body');
        const btnRepair = document.getElementById('btn-repair-leads');
        
        if (btnRepair) {
            btnRepair.onclick = async () => {
                const confirmed = confirm('¿Quieres re-escanear los contactos sin nombre? Esto actualizará la información y la fecha de registro siguiendo las reglas de seguridad.');
                if (confirmed) {
                    await window.api.startRepair();
                    window.router.navigate('scanner', { tab: 'progreso' });
                }
            };
        }

        if (!tbody) return;

        try {
            // Helper para formatear números de forma humana: 34 600 11 22 33
            const formatPhone = (phone) => {
                if (!phone) return '';
                const clean = phone.replace(/\D/g, '');
                if (clean.length === 11) {
                    return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)} ${clean.slice(9, 11)}`;
                }
                return clean.replace(/(\d{3})(?=\d)/g, '$1 ');
            };

            // Obtener los leads no contactados (que suelen ser los resultados del scanner)
            const leads = await window.api.getLeads('pendiente', 50, 0, '');
            
            if (leads.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px; color: var(--text-muted);">No hay leads pendientes todavía.</td></tr>`;
                return;
            }

            tbody.innerHTML = leads.map(lead => `
                <tr>
                    <td><strong>${lead.nombre || '<i>Desconocido</i>'}</strong></td>
                    <td>${formatPhone(lead.telefono)}</td>
                    <td><span class="status-badge connect">VÁLIDO</span></td>
                    <td class="text-muted" style="font-size: 0.8rem;">${lead.created_at ? new Date(lead.created_at).toLocaleString() : 'Recién añadido'}</td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error cargando resultados del scanner:', error);
            tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #ef4444;">Error al cargar resultados.</td></tr>`;
        }
    }
};
