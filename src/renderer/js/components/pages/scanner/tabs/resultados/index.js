import { TemplateLoader } from '../../../../../core/loader.js';

/**
 * Sub-Componente de Scanner: Resultados
 */
export const ResultadosTab = {
    render: async () => {
        return await TemplateLoader.loadHTML('scanner/tabs/resultados');
    },

    init: async (appState) => {
        const tbody = document.getElementById('scanner-results-body');
        const btnRepair = document.getElementById('btn-repair-leads');
        
        if (btnRepair) {
            btnRepair.onclick = async () => {
                if (confirm('¿Quieres re-escanear los contactos sin nombre?')) {
                    await window.api.startRepair();
                    window.router.navigate('scanner', { tab: 'progreso' });
                }
            };
        }

        if (!tbody) return;

        try {
            const formatPhone = (phone) => {
                const clean = phone.replace(/\D/g, '');
                if (clean.length === 11) {
                    return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)} ${clean.slice(9, 11)}`;
                }
                return clean.replace(/(\d{3})(?=\d)/g, '$1 ');
            };

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
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #ef4444;">Error al cargar resultados.</td></tr>`;
        }
    }
};
