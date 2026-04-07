import { TemplateLoader } from '../../../core/loader.js';

/**
 * Componente: Console - Lógica Encapsulada 🧠✨
 */
export const ConsoleComponent = {
    /**
     * Renderiza un "punto de anclaje" inicial.
     * La verdadera carga ocurre en el init().
     */
    render: () => `
        <div id="global-console-mount">
            <!-- Cargando terminal... -->
        </div>
    `,

    /**
     * Inicializa la carga asíncrona de recursos y activa los eventos.
     */
    init: async () => {
        // 1. Cargar Estructura y Estilos
        const html = await TemplateLoader.loadHTML('console');
        await TemplateLoader.loadCSS('console');

        const mount = document.getElementById('global-console-mount');
        if (!mount) return;

        // Inyectamos el HTML del template
        mount.outerHTML = html;

        // 2. Vincular elementos del DOM recién inyectados
        const container = document.getElementById('global-console-container');
        const resizer = document.getElementById('console-resizer');
        const header = document.getElementById('console-header');
        const toggleBtn = document.getElementById('btn-toggle-console');
        const clearBtn = document.getElementById('btn-clear-console');
        
        // Lógica: Limpieza manual de consola y memoria array
        if (clearBtn) {
            clearBtn.onclick = async (e) => {
                e.stopPropagation(); // Evitar que la consola se expanda/cierre
                
                const consoleEl = document.getElementById('global-console');
                if (consoleEl) consoleEl.innerHTML = '';
                
                // Vacía la memoria local importando el helper dinámicamente si es necesario
                try {
                    const { AppState } = await import('../../../core/state.js');
                    AppState.clearLogs();
                } catch (err) { console.error('No se pudo limpiar AppState RAM:', err); }
            };
        }

        let isResizing = false;

        const toggle = () => {
            if (!container) return;
            container.classList.toggle('minimized');
            const isMin = container.classList.contains('minimized');
            if (toggleBtn) toggleBtn.textContent = isMin ? 'expand_less' : 'remove';
        };

        if (toggleBtn) toggleBtn.onclick = (e) => { e.stopPropagation(); toggle(); };
        if (header) header.onclick = toggle;

        if (resizer) {
            resizer.addEventListener('mousedown', (e) => {
                isResizing = true;
                document.body.style.cursor = 'row-resize';
                container.style.transition = 'none';
                e.preventDefault();
            });
        }

        window.addEventListener('mousemove', (e) => {
            if (!isResizing || !container) return;
            const newHeight = window.innerHeight - e.clientY;
            if (newHeight >= 40 && newHeight <= window.innerHeight * 0.8) {
                container.style.height = `${newHeight}px`;
                if (container.classList.contains('minimized')) {
                    container.classList.remove('minimized');
                    if (toggleBtn) toggleBtn.textContent = 'remove';
                }
            }
        });

        window.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = 'default';
                container.style.transition = 'height 0.1s ease-out';
            }
        });
    },

    /**
     * Añade un nuevo log a la consola. Limitado a un máximo para proteger renderizado.
     */
    appendLog: (log) => {
        const consoleEl = document.getElementById('global-console');
        if (!consoleEl) return;

        // Limite drástico: Solo mantiene vivos los 500 mensajes más recientes
        const MAX_LOGS = 500;
        
        const time = log.time || new Date().toLocaleTimeString();
        const p = document.createElement('p');
        p.className = `log-${log.type || 'info'}`;
        p.textContent = `[${time}] ${log.text}`;
        
        consoleEl.appendChild(p);

        // Control de Límite de Buffer - Elimina del HTML el nodo superior (más antiguo)
        if (consoleEl.children.length > MAX_LOGS) {
            consoleEl.removeChild(consoleEl.firstChild);
        }

        consoleEl.scrollTop = consoleEl.scrollHeight;
    }
};
