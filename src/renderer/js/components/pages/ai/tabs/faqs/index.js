import { syncAISettings } from '../../utils.js';

/**
 * Componente Tab: FAQs IA
 * Responsabilidad: Gestión de preguntas frecuentes.
 */
export const AIFAQs = {
    /**
     * Inicializa la lógica de la pestaña de FAQs.
     */
    init: async () => {
        const kbFAQs = document.getElementById('ai-kb-faqs');
        const btnSave = document.getElementById('btn-save-faqs');
        const btnGenerate = document.getElementById('btn-generate-faqs');
        const contextArea = document.getElementById('ai-context-faqs');

        if (!kbFAQs || !btnSave) return;

        // --- Carga de Datos ---
        const settings = await window.api.getAllSettings();
        kbFAQs.value = settings.ai_kb_faqs || '';
        if (contextArea) contextArea.value = settings.ai_context_faqs || '';

        // --- Handlers ---
        
        // Generación Inteligente
        if (btnGenerate) {
            btnGenerate.onclick = async () => {
                const context = contextArea ? contextArea.value.trim() : '';
                if (!context) {
                    window.ui.showToast('⚠️ Escribe primero las dudas habituales de tus clientes.', 'info');
                    return;
                }

                btnGenerate.disabled = true;
                const originalText = btnGenerate.innerHTML;
                btnGenerate.innerHTML = '<span class="material-icons-outlined animate-spin">refresh</span> REDACTANDO...';

                const response = await window.api.invoke('ai:generate-template', { context, type: 'faqs' });
                
                if (response.success) {
                    kbFAQs.value = response.content;
                    window.ui.showToast('❓ FAQs generadas correctamente.');
                } else {
                    window.ui.showToast('❌ Error: ' + response.error, 'error');
                }

                btnGenerate.disabled = false;
                btnGenerate.innerHTML = originalText;
            };
        }

        // Guardado Manual
        btnSave.onclick = async () => {
            // AISLAMIENTO: Solo guardamos las FAQs y su contexto local
            await window.api.saveSetting('ai_kb_faqs', kbFAQs.value);
            if (contextArea) await window.api.saveSetting('ai_context_faqs', contextArea.value);
            
            // Sincronizar todos los ajustes con el motor principal
            await syncAISettings();
            
            window.ui.showToast('❓ Preguntas frecuentes guardadas.');
        };
    }
};
