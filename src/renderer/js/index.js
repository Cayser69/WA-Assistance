import { Router } from './core/router.js';
import { AppState } from './core/state.js';
import { Sidebar } from './components/layout/sidebar/index.js';
import { Hub } from './components/layout/hub/index.js';
import { ConsoleComponent } from './components/layout/console/index.js';
import { UIEvents } from './core/ui-events.js';

window.addEventListener('DOMContentLoaded', async () => {
    // Exponer Router, Consola y Hub (Para AppState) 🛡️
    window.router = Router;
    window.ConsoleComponent = ConsoleComponent;
    window.Hub = Hub;
    
    console.log('[Renderer-Boot] 🎬 AISLAMIENTO NIVEL 5');
    console.log('[Renderer-Boot] 🚀 MOTOR RENDERER ACTIVO');

    try {
        // 1. Inicializar Eventos Globales e IPC
        UIEvents.initGlobal();
        UIEvents.initIPC();

        // 2. Cargar Sidebar
        const sidebarRoot = document.getElementById('sidebar-root');
        if (sidebarRoot) {
            sidebarRoot.innerHTML = Sidebar.render();
            await Sidebar.init();
        }

        // 3. Cargar Hub Superior 🛰️
        const hubRoot = document.getElementById('hub-root');
        if (hubRoot) {
            hubRoot.innerHTML = Hub.render();
            await Hub.init();
            
            // Sincronización inicial de persistencia 🛰️
            setTimeout(async () => {
                const saved = await window.api.checkPersistence('scanner_active');
                if (saved) window.Hub.updateScanner(true, true);
            }, 1000);
        }

        // 4. Cargar Consola 📟
        const consoleRoot = document.getElementById('console-root');
        if (consoleRoot) {
            consoleRoot.innerHTML = ConsoleComponent.render();
            await ConsoleComponent.init();
        }

        console.log('[Renderer-Boot] 🧭 Navegando al Dashboard (Aislamiento 5)...');
        await Router.navigate('dashboard');

        console.log('[Renderer-Boot] ✅ Chasis completo: Hub, Sidebar y Consola.');
    } catch (err) {
        console.error('[Renderer-Boot] 🔥 ERROR EN AISLAMIENTO 5:', err);
    }
});
