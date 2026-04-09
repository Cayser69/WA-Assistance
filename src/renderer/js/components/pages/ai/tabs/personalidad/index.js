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
        const contextArea = document.getElementById('ai-business-context');

        if (!promptArea || !btnSavePrompt) return;

        // --- Carga de Datos ---
        const s = await window.api.getAllSettings();
        promptArea.value = s.openai_prompt || 'Eres un asistente experto.';

        // --- Handlers ---
        
        // Generación Inteligente
        if (btnGeneratePrompt) {
            btnGeneratePrompt.onclick = async () => {
                const context = contextArea ? contextArea.value.trim() : '';
                if (!context) {
                    alert('⚠️ Por favor, escribe primero un breve resumen de tu negocio en el cuadro superior.');
                    return;
                }

                btnGeneratePrompt.disabled = true;
                const originalText = btnGeneratePrompt.innerHTML;
                btnGeneratePrompt.innerHTML = '<span class="material-icons-outlined animate-spin">refresh</span> REDACTANDO...';

                const response = await window.api.invoke('ai:generate-template', { context, type: 'personalidad' });
                
                if (response.success) {
                    promptArea.value = response.content;
                } else {
                    alert('❌ Error generando identidad: ' + response.error);
                }

                btnGeneratePrompt.disabled = false;
                btnGeneratePrompt.innerHTML = originalText;
            };
        }

        // Guardado Manual
        btnSavePrompt.onclick = async () => {
            // AISLAMIENTO: Solo guardamos el prompt maestro
            await window.api.saveSetting('openai_prompt', promptArea.value);

            // Sincronizar todos los ajustes con el motor principal
            await syncAISettings();
            
            alert('🧠 Identidad de la IA actualizada correctamente.');
        };
    }
};
