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
        const contextArea = document.getElementById('ai-business-context');

        if (!kbOperativa || !btnSave) return;

        // --- Carga de Datos ---
        const settings = await window.api.getAllSettings();
        kbOperativa.value = settings.ai_kb_operativa || '';

        // --- Handlers ---
        
        // Generación Inteligente
        if (btnGenerate) {
            btnGenerate.onclick = async () => {
                const context = contextArea ? contextArea.value.trim() : '';
                if (!context) {
                    alert('⚠️ Por favor, escribe primero un breve resumen de tu negocio en el cuadro superior.');
                    return;
                }

                btnGenerate.disabled = true;
                const originalText = btnGenerate.innerHTML;
                btnGenerate.innerHTML = '<span class="material-icons-outlined animate-spin">refresh</span> REDACTANDO...';

                const response = await window.api.invoke('ai:generate-template', { context, type: 'operativa' });
                
                if (response.success) {
                    kbOperativa.value = response.content;
                } else {
                    alert('❌ Error generando operativa: ' + response.error);
                }

                btnGenerate.disabled = false;
                btnGenerate.innerHTML = originalText;
            };
        }

        // Guardado Manual
        btnSave.onclick = async () => {
            // AISLAMIENTO: Solo guardamos la operativa
            await window.api.saveSetting('ai_kb_operativa', kbOperativa.value);
            
            // Sincronizar todos los ajustes con el motor principal
            await syncAISettings();
            
            alert('📅 Datos operativos actualizados.');
        };
    }
};
