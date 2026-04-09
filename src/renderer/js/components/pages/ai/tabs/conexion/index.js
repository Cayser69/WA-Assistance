import { syncAISettings } from '../../utils.js';

/**
 * Componente Tab: Conexión IA
 * Responsabilidad: Gestión de API Key y selección de modelo.
 */
export const AIConexion = {
    /**
     * Inicializa la lógica de la pestaña de conexión.
     */
    init: async () => {
        const keyInput = document.getElementById('openai-key');
        const modelSelect = document.getElementById('openai-model');
        const btnSaveKey = document.getElementById('btn-save-key');

        if (!keyInput || !modelSelect || !btnSaveKey) return;

        // --- Carga de Datos ---
        const settings = await window.api.getAllSettings();
        keyInput.value = settings.openai_key || '';
        modelSelect.value = settings.openai_model || 'gpt-4o-mini';

        // --- Handlers ---
        btnSaveKey.onclick = async () => {
            const apiKey = keyInput.value.trim();
            const model = modelSelect.value;

            // AISLAMIENTO: Solo guardamos API Key y Modelo
            await window.api.saveSetting('openai_key', apiKey);
            await window.api.saveSetting('openai_model', model);

            // Sincronizar con el motor principal
            await syncAISettings();
            
            alert('🔑 Credenciales y modelo actualizados correctamente.');
        };
    }
};
