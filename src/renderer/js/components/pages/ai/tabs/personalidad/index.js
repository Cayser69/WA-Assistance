import { syncAISettings } from '../../utils.js';

/**
 * Componente Tab: Identidad de la IA
 * Responsabilidad: Gestión de instrucciones maestras y tono de voz.
 */
export const AIPersonalidad = {
    /**
     * Inicializa la lógica de la pestaña de identidad.
     */
    init: async () => {
        const promptArea = document.getElementById('ai-system-prompt');
        const btnSavePrompt = document.getElementById('btn-save-prompt');
        const btnGeneratePrompt = document.getElementById('btn-generate-prompt');
        const contextArea = document.getElementById('ai-context-personalidad');

        if (!promptArea || !btnSavePrompt) return;

        // --- Carga de Datos ---
        const s = await window.api.getAllSettings();
        promptArea.value = s.openai_prompt || 'Eres un asistente experto.';
        if (contextArea) contextArea.value = s.ai_context_personalidad || '';

        // --- Handlers ---
        
        // Generación Inteligente
        if (btnGeneratePrompt) {
            btnGeneratePrompt.onclick = async () => {
                const context = contextArea ? contextArea.value.trim() : '';
                if (!context) {
                    window.ui.showToast('⚠️ Escribe primero el tipo de identidad que buscas.', 'info');
                    return;
                }

                btnGeneratePrompt.disabled = true;
                const originalText = btnGeneratePrompt.innerHTML;
                btnGeneratePrompt.innerHTML = '<span class="material-icons-outlined animate-spin">refresh</span> REDACTANDO...';

                const response = await window.api.invoke('ai:generate-template', { context, type: 'personalidad' });
                
                if (response.success) {
                    promptArea.value = response.content;
                    window.ui.showToast('🧠 Identidad generada con éxito.');
                } else {
                    window.ui.showToast('❌ Error: ' + response.error, 'error');
                }

                btnGeneratePrompt.disabled = false;
                btnGeneratePrompt.innerHTML = originalText;
            };
        }

        // Guardado Manual
        btnSavePrompt.onclick = async () => {
            // AISLAMIENTO: Solo guardamos el prompt maestro y su contexto de generación
            await window.api.saveSetting('openai_prompt', promptArea.value);
            if (contextArea) await window.api.saveSetting('ai_context_personalidad', contextArea.value);

            // Sincronizar todos los ajustes con el motor principal
            await syncAISettings();
            
            window.ui.showToast('🧠 Identidad de la IA actualizada.');
        };
    }
};
