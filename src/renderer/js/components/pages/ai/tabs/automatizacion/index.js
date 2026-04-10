import { syncAISettings } from '../../utils.js';

/**
 * Componente Tab: Automatización IA
 * Responsabilidad: Gestión de auto-respuestas.
 */
export const AIAutomatizacion = {
    /**
     * Inicializa la lógica de la pestaña de automatización.
     */
    init: async () => {
        const autoReplyCheck = document.getElementById('ai-auto-reply');
        const btnSaveAutomation = document.getElementById('btn-save-automation');

        if (!autoReplyCheck || !btnSaveAutomation) return;

        // --- Carga de Datos ---
        const settings = await window.api.getAllSettings();
        autoReplyCheck.checked = settings.ai_auto_reply === 'true';

        // --- Handlers ---
        btnSaveAutomation.onclick = async () => {
            const isActive = autoReplyCheck.checked;
            
            // AISLAMIENTO: Solo guardamos el estado del toggle
            await window.api.saveSetting('ai_auto_reply', isActive.toString());

            // Sincronizar todos los ajustes con el motor principal
            await syncAISettings();
            
            window.ui.showToast('⚡ Ajustes de automatización aplicados.');
        };
    }
};
