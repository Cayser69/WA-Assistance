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
            // 1. Renderizar el contenido de la pestaña activa
            root.innerHTML = component.render();
            if (component.init) {
                await component.init(AppState, params);
            }
            
            AppState.currentView = viewId;
            Router.updateActiveLink(viewId, params.tab);
        } catch (err) {
            console.error(`Error navegando a ${viewId}:`, err);
            AppState.pushLog({ text: `X Fallo al cargar vista ${viewId}: ${err.message}`, type: 'error' });
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
            
            // Expandir el grupo si es necesario (Auto-expand on navigate)
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
