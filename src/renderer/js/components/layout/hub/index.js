import { TemplateLoader } from '../../../core/loader.js';

/**
 * Componente: Hub - Lógica Encapsulada 🧠✨🛰️
 */
export const Hub = {
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
        const html = await TemplateLoader.loadHTML('hub');
        await TemplateLoader.loadCSS('hub');

        const mount = document.getElementById('global-hub-mount');
        if (mount) mount.outerHTML = html;
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
     * Actualiza el estado de la IA.
     */
    updateAI: (enabled) => {
        const hubItem = document.getElementById('hub-ai-status');
        const hubText = document.getElementById('hub-ai-text');
        if (hubItem && hubText) {
            hubItem.className = 'hub-item ai-item ' + (enabled ? 'connect' : 'disconnect');
            hubText.textContent = enabled ? 'Activa' : 'Desconectada';
        }
    }
};
