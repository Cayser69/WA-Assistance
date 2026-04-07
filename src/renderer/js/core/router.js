/**
 * Router SPA para WA Sender Pro
 */
import { Dashboard } from '../components/pages/dashboard/index.js';
import { Conexiones } from '../components/pages/conexiones/index.js';
import { Campanas } from '../components/pages/campanas/index.js';
import { Historial } from '../components/pages/historial/index.js';
import { AI } from '../components/pages/ai/index.js';
import { Scanner } from '../components/pages/scanner/index.js';

import { AppState } from './state.js';

export const Router = {
    views: {
        'dashboard': Dashboard,
        'conexiones': Conexiones,
        'campanas': Campanas,
        'historial': Historial,
        'aiConfig': AI,
        'scanner': Scanner
    },

    /**
     * Navega a una vista específica.
     */
    navigate: async (viewId, params = {}) => {
        const root = document.getElementById('view-root');
        if (!root) return;

        const component = Router.views[viewId] || Dashboard;
        
        try {
            console.log(`[Router] 🧭 Navegando a vista: ${viewId}`);
            // 1. Renderizar el contenido de la pestaña activa
            root.innerHTML = component.render();
            
            if (component.init) {
                console.log(`[Router] 🛠️ Llamando a .init() de ${viewId}...`);
                await component.init(AppState, params);
            }
            
            AppState.currentView = viewId;
            Router.updateActiveLink(viewId, params.tab);
            console.log(`[Router] ✨ Navegación a ${viewId} finalizada.`);
        } catch (err) {
            console.error(`Error navegando a ${viewId}:`, err);
        }
    },

    /**
     * Actualiza la clase 'active' en los enlaces de la barra lateral.
     */
    updateActiveLink: (viewId, tabId) => {
        // Limpiar estados previos
        document.querySelectorAll('.sidebar .active').forEach(li => li.classList.remove('active'));
        
        const targetId = tabId ? `nav-${viewId}-${tabId}` : `nav-${viewId}`;
        const el = document.getElementById(targetId);
        
        if (el) {
            el.classList.add('active');
            
            const groupMapping = { 
                'campanas': 'group-campanas', 
                'aiConfig': 'group-ai',
                'scanner': 'group-scanner'
            };
            const groupId = groupMapping[viewId];
            if (groupId) {
                const group = document.getElementById(groupId);
                if (group) {
                    group.classList.add('expanded');
                    if (group.previousElementSibling) group.previousElementSibling.classList.add('expanded-header');
                }
            }
        }
    }
};
