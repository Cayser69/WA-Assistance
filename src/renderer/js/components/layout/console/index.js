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
     * Añade un nuevo log a la consola.
     */
    appendLog: (log) => {
        const consoleEl = document.getElementById('global-console');
        if (!consoleEl) return;

        const time = log.time || new Date().toLocaleTimeString();
        const p = document.createElement('p');
        p.className = `log-${log.type || 'info'}`;
        p.textContent = `[${time}] ${log.text}`;
        
        consoleEl.appendChild(p);
        consoleEl.scrollTop = consoleEl.scrollHeight;
    }
};
