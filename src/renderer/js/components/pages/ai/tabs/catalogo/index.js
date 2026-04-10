import { syncAISettings } from '../../utils.js';

/**
 * Componente Tab: Catálogo IA
 * Responsabilidad: Gestión de productos y servicios.
 */
export const AICatalogo = {
    /**
     * Inicializa la lógica de la pestaña de catálogo.
     */
    init: async () => {
        const kbCatalogo = document.getElementById('ai-kb-catalogo');
        const btnSave = document.getElementById('btn-save-catalogo');
        const btnGenerate = document.getElementById('btn-generate-catalogo');
        const contextArea = document.getElementById('ai-context-catalogo');

        if (!kbCatalogo || !btnSave) return;

        // --- Carga de Datos ---
        const settings = await window.api.getAllSettings();
        kbCatalogo.value = settings.ai_kb_catalogo || '';
        if (contextArea) contextArea.value = settings.ai_context_catalogo || '';

        // --- Handlers ---
        
        // Generación Inteligente
        if (btnGenerate) {
            btnGenerate.onclick = async () => {
                const context = contextArea ? contextArea.value.trim() : '';
                if (!context) {
                    window.ui.showToast('⚠️ Escribe primero qué productos o servicios vendes.', 'info');
                    return;
                }

                btnGenerate.disabled = true;
                const originalText = btnGenerate.innerHTML;
                btnGenerate.innerHTML = '<span class="material-icons-outlined animate-spin">refresh</span> REDACTANDO...';

                const response = await window.api.invoke('ai:generate-template', { context, type: 'catalogo' });
                
                if (response.success) {
                    kbCatalogo.value = response.content;
                    window.ui.showToast('📦 Catálogo generado con éxito.');
                } else {
                    window.ui.showToast('❌ Error: ' + response.error, 'error');
                }

                btnGenerate.disabled = false;
                btnGenerate.innerHTML = originalText;
            };
        }

        // Guardado Manual
        btnSave.onclick = async () => {
            // AISLAMIENTO: Solo guardamos el catálogo y su contexto local
            await window.api.saveSetting('ai_kb_catalogo', kbCatalogo.value);
            if (contextArea) await window.api.saveSetting('ai_context_catalogo', contextArea.value);
            
            // Sincronizar todos los ajustes con el motor principal
            await syncAISettings();
            
            window.ui.showToast('📦 Catálogo de productos actualizado.');
        };
    }
};
