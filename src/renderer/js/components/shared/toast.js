/**
 * Componente: Toast (Notificaciones Premium) 🛰️✨
 * Responsabilidad: Mostrar notificaciones efímeras con diseño Neon Crystal.
 */
export const Toast = {
    /**
     * Muestra una notificación genérica.
     * @param {string} message - Texto del mensaje.
     * @param {string} type - 'success', 'error', 'info'.
     */
    show: (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        if (!container) {
            console.error('[Toast] Contenedor #toast-container no encontrado.');
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = Toast._getIcon(type);
        
        toast.innerHTML = `
            <span class="material-icons-outlined toast-icon">${icon}</span>
            <div class="toast-message">${message}</div>
        `;

        container.appendChild(toast);

        // Auto-eliminar después de 4 segundos con animación
        const timeout = setTimeout(() => {
            Toast.remove(toast);
        }, 4000);

        // Permitir cerrar al hacer clic
        toast.onclick = () => {
            clearTimeout(timeout);
            Toast.remove(toast);
        };
    },

    success: (msg) => Toast.show(msg, 'success'),
    error: (msg) => Toast.show(msg, 'error'),
    info: (msg) => Toast.show(msg, 'info'),

    /**
     * Elimina el brindis con una animación de salida.
     */
    remove: (toastEl) => {
        if (!toastEl || toastEl.classList.contains('removing')) return;
        
        toastEl.classList.add('removing');
        toastEl.addEventListener('animationend', () => {
            toastEl.remove();
        });
    },

    /**
     * Mapeo de iconos Material por tipo de alerta.
     */
    _getIcon: (type) => {
        switch (type) {
            case 'success': return 'check_circle';
            case 'error': return 'report';
            case 'info': return 'info_outline';
            default: return 'notifications';
        }
    }
};
