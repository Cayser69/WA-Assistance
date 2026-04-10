import { syncAISettings } from '../../utils.js';

/**
 * Componente Tab: Operativa IA
 * Responsabilidad: Gestión de horarios y políticas.
 */
export const AIOperativa = {
    /**
     * Inicializa la lógica de la pestaña de operativa.
     */
    init: async () => {
        const kbOperativa = document.getElementById('ai-kb-operativa');
        const btnSave = document.getElementById('btn-save-operativa');
        const btnGenerate = document.getElementById('btn-generate-operativa');
        const contextArea = document.getElementById('ai-context-operativa');

        if (!kbOperativa || !btnSave) return;

        // --- Carga de Datos ---
        const settings = await window.api.getAllSettings();
        kbOperativa.value = settings.ai_kb_operativa || '';
        if (contextArea) contextArea.value = settings.ai_context_operativa || '';

        // --- Handlers ---
        
        // Generación Inteligente
        if (btnGenerate) {
            btnGenerate.onclick = async () => {
                const context = contextArea ? contextArea.value.trim() : '';
                if (!context) {
                    window.ui.showToast('⚠️ Escribe primero la operativa de tu negocio.', 'info');
                    return;
                }

                btnGenerate.disabled = true;
                const originalText = btnGenerate.innerHTML;
                btnGenerate.innerHTML = '<span class="material-icons-outlined animate-spin">refresh</span> REDACTANDO...';

                const response = await window.api.invoke('ai:generate-template', { context, type: 'operativa' });
                
                if (response.success) {
                    kbOperativa.value = response.content;
                    window.ui.showToast('📅 Datos operativos generados.');
                } else {
                    window.ui.showToast('❌ Error: ' + response.error, 'error');
                }

                btnGenerate.disabled = false;
                btnGenerate.innerHTML = originalText;
            };
        }

        // Guardado Manual
        btnSave.onclick = async () => {
            // AISLAMIENTO: Solo guardamos la operativa y su contexto local
            await window.api.saveSetting('ai_kb_operativa', kbOperativa.value);
            if (contextArea) await window.api.saveSetting('ai_context_operativa', contextArea.value);
            
            // Sincronizar todos los ajustes con el motor principal
            await syncAISettings();
            
            window.ui.showToast('📅 Datos operativos actualizados.');
        };
    }
};
