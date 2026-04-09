/**
 * Sub-manejador: Renderizado de Audiencia 🎨
 */

export const AudienciaRender = {
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
