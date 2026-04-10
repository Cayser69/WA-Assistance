import { TemplateLoader } from '../../../core/loader.js';

/**
 * Componente: Hub - Lógica Encapsulada (Senior Build) 🧠✨🛰️
 */
export const Hub = {
    lastStatus: null, // Memoria local para evitar pérdidas en condiciones de carrera

    /**
     * Punto de anclaje inicial.
     */
    render: () => `
        <div id="global-hub-mount">
            <!-- Cargando Hub de Conectividad... -->
        </div>
    `,

    /**
     * Carga asíncrona de recursos.
     */
    init: async () => {
        console.log('[Hub] 🛰️ Iniciando inyección de Hub...');
        const html = await TemplateLoader.loadHTML('hub');
        await TemplateLoader.loadCSS('hub');

        const mount = document.getElementById('global-hub-mount');
        if (mount) {
            mount.outerHTML = html;
            console.log('[Hub] ✅ DOM inyectado.');
            
            // Sincronización Proactiva Inmediata (Senior Pattern: No esperar a nadie) 🛰️
            try {
                const aiStatus = await window.api.invoke('ai:get-status');
                if (aiStatus) {
                    console.log('[Hub] 📥 Sincronización proactiva forzada con éxito.');
                    Hub.updateAI(aiStatus);
                }
            } catch (err) {
                console.error('[Hub] ❌ Error en sincronización inicial forzada:', err);
            }

            // Aplicar estado previo de AppState si existiera y fuera más reciente
            const { AppState } = await import('../../../core/state.js');
            if (AppState.lastAIStatus) {
                Hub.updateAI(AppState.lastAIStatus);
            }
        }
    },

    /**
     * Actualiza el estado de WhatsApp.
     */
    updateWhatsApp: (current) => {
        const hubItem = document.getElementById('hub-wa-status');
        const hubText = document.getElementById('hub-wa-text');
        if (hubItem) hubItem.className = `hub-item wa-item ${current.color}`;
        if (hubText) hubText.textContent = current.text;
    },

    /**
     * Actualiza el estado de la Campaña.
     */
    updateCampaign: (status, isActive) => {
        const hubItem = document.getElementById('hub-campaign-status');
        const hubText = document.getElementById('hub-campaign-text');
        if (hubItem && hubText) {
            if (!isActive) {
                hubItem.className = 'hub-item campaign-item disconnect';
                hubText.textContent = 'Inactiva';
            } else {
                const isPaused = typeof status === 'string' && status.includes('PAUSADO');
                hubItem.className = 'hub-item campaign-item ' + (isPaused ? 'authenticated' : 'active-process');
                hubText.textContent = status;
            }
        }
    },

    /**
     * Actualiza el estado del Scanner.
     */
    updateScanner: (isActive, isPaused) => {
        const hubItem = document.getElementById('hub-scanner-status');
        const hubText = document.getElementById('hub-scanner-text');
        if (hubItem && hubText) {
            if (!isActive) {
                hubItem.className = 'hub-item scanner-item disconnect';
                hubText.textContent = 'Inactivo';
            } else {
                hubItem.className = 'hub-item scanner-item ' + (isPaused ? 'authenticated' : 'active-process');
                hubText.textContent = isPaused ? 'PAUSADO' : 'EJECUTANDO';
            }
        }
    },

    /**
     * Actualiza el estado de la IA en el Hub Global (Nav superior).
     */
    updateAI: (aiStatus) => {
        // Almacenar siempre el último estado por si el DOM aún no está listo
        Hub.lastStatus = aiStatus;
        
        const hubItem = document.getElementById('hub-ai-status');
        const hubText = document.getElementById('hub-ai-text');
        
        if (!hubItem || !hubText) {
            // El DOM aún no existe (index.html no ha terminado o Hub.init no ha corrido)
            return;
        }

        const isConnected = typeof aiStatus === 'object' ? aiStatus.connected : aiStatus;
        const isActive = typeof aiStatus === 'object' ? aiStatus.active : aiStatus;

        let statusClass = 'disconnect';
        let statusText = 'Desconectada';

        if (isActive) {
            statusClass = 'active-process'; // Azul/Cyan Neon (según CSS actual)
            statusText = 'Activa';
        } else if (isConnected) {
            statusClass = 'authenticated'; // Amarillo/Naranja Sincro
            statusText = 'Conectada';
        }

        hubItem.className = `hub-item ai-item ${statusClass}`;
        hubText.textContent = statusText;
    }
};
