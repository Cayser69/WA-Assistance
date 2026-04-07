import { Router } from './core/router.js';
import { UIEvents } from './core/ui-events.js';
import { AppState } from './core/state.js';
import { Hub } from './components/layout/hub/index.js';
import { ConsoleComponent } from './components/layout/console/index.js';
import { Sidebar } from './components/layout/sidebar/index.js';

/**
 * Entry Point de la Aplicación para WA Sender Pro
 * Orquestación Inicial al Cargar el DOM
 */
window.addEventListener('DOMContentLoaded', async () => {
    // Exponer componentes para AppState (Evita circularidad)
    window.Hub = Hub;
    window.ConsoleComponent = ConsoleComponent;

    console.log('[Sistema] 🚀 MOTOR RENDERER ACTIVO');

    try {
        // 1. Inicializar infraestructura base
        console.log('[Sistema] ⚙️ Inicializando infraestructura (Eventos/IPC)...');
        UIEvents.initGlobal();
        UIEvents.initIPC();

        // 2. Inyectar componentes globales DE FORMA NO BLOQUEANTE ⚡✨
        const globalComponents = [
            { rootId: 'sidebar-root', comp: Sidebar, label: 'Sidebar' },
            { rootId: 'hub-root', comp: Hub, label: 'Hub' },
            { rootId: 'console-root', comp: ConsoleComponent, label: 'Consola' }
        ];

        console.log(`[Sistema] 🏗️ Iniciando carga de ${globalComponents.length} componentes globales...`);

        // Carga secuencial para evitar parpadeos y asegurar orden
        for (const { rootId, comp, label } of globalComponents) {
            const root = document.getElementById(rootId);
            if (root) {
                try {
                    console.log(`[Sistema] 🛠️ Inyectando ${label}...`);
                    root.innerHTML = comp.render();
                    await comp.init();
                    console.log(`[Sistema] ✅ ${label} listo.`);
                } catch (err) {
                    console.error(`[Sistema] ❌ Error en ${label}:`, err);
                }
            }
        }

        // 3. Navegar al Dashboard INMEDIATAMENTE 🚀
        console.log('[Sistema] 🧭 Navegando al Dashboard principal...');
        await Router.navigate('dashboard');
        console.log(`[Sistema] ✨ Dashboard cargado en ${Date.now() - startTime}ms.`);

        // 4. Limpieza: Ocultar el indicador de carga 🫧✨
        const loader = document.getElementById('app-loading-screen');
        if (loader) loader.style.display = 'none';

        // 5. Sincronizar estados (Diferido)
        setTimeout(async () => {
             console.log('[Sistema] 📻 Sincronizando estados iniciales...');
             if (window.api && window.api.getWAStatus) {
                try {
                    const status = await window.api.getWAStatus();
                    AppState.updateWAStatusUI(status);
                    console.log('[Sistema] ✅ Estados sincronizados.');
                } catch (e) {
                    console.warn('[Sistema] ⚠️ No se pudo obtener el estado inicial de WA.');
                }
             }
        }, 1000);

    } catch (err) {
        console.error('[Sistema] 🔥 ERROR CRÍTICO EN ARRANQUE:', err);
        const root = document.getElementById('view-root');
        if (root) {
            root.innerHTML = `
                <div style="padding: 40px; color: #ef4444; background: rgba(0,0,0,0.8); border-radius: 12px; margin: 20px; border: 2px solid #ef4444;">
                    <h3>🚨 Error Detenido el Sistema</h3>
                    <p style="font-size: 1.1rem;">${err.message}</p>
                    <hr style="border-color: rgba(239, 68, 68, 0.2);">
                    <p style="font-size: 0.8rem; font-family: monospace;">${err.stack}</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">REINTENTAR</button>
                </div>
            `;
        }
    }
});
