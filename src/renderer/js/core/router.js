/**
 * Router SPA para WA Sender Pro
 */
import { Dashboard } from '../components/pages/dashboard/index.js';
import { Conexiones } from '../components/pages/conexiones/index.js';
import { Campanas } from '../components/pages/campanas/index.js';
import { AI } from '../components/pages/ai/index.js';
import { Scanner } from '../components/pages/scanner/index.js';
import { Chat } from '../components/pages/chat/index.js';

import { AppState } from './state.js';

export const Router = {
    views: {
        'dashboard': Dashboard,
        'conexiones': Conexiones,
        'campanas': Campanas,
        'aiConfig': AI,
        'scanner': Scanner,
        'chat': Chat
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
        // 1. Limpiar estados previos
        document.querySelectorAll('.sidebar .active').forEach(li => li.classList.remove('active'));
        
        // Determinar ID del link (Soporta Nivel 2 y Nivel 3)
        const targetId = tabId ? `nav-${viewId}-${tabId}` : `nav-${viewId}`;
        const el = document.getElementById(targetId);
        
        if (el) {
            el.classList.add('active');
            
            // 2. Auto-expandir grupos padres para mostrar ubicación actual 🧭
            const groupsToExpand = [];
            
            if (viewId === 'campanas' || viewId === 'scanner' || viewId === 'conexiones' || viewId === 'chat') {
                groupsToExpand.push('group-whatsapp');
                if (viewId === 'campanas') groupsToExpand.push('subgroup-campanas');
                if (viewId === 'scanner') groupsToExpand.push('subgroup-scanner');
            } else if (viewId === 'aiConfig') {
                groupsToExpand.push('group-ai');
            }

            groupsToExpand.forEach(groupId => {
                const group = document.getElementById(groupId);
                if (group) {
                    group.classList.add('expanded');
                    if (group.previousElementSibling) group.previousElementSibling.classList.add('expanded-header');
                }
            });
        }
    }
};
