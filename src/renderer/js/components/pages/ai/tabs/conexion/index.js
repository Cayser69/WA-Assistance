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
        const providerSelector = document.getElementById('ai-provider-selector');
        const openaiKeyInput = document.getElementById('openai-key');
        const groqKeyInput = document.getElementById('groq-key');
        const geminiKeyInput = document.getElementById('gemini-key');
        const modelSelector = document.getElementById('ai-model-selector');
        const btnSave = document.getElementById('btn-save-api');

        if (!providerSelector || !btnSave) return;

        // Definición de modelos por proveedor
        const modelsByProvider = {
            'openai': [
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Recomendado/Barato)' },
                { id: 'gpt-4o', name: 'GPT-4o (Más Inteligente)' }
            ],
            'groq': [
                { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Potente)' },
                { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (Rápido)' },
                { id: 'llama3-8b-8192', name: 'Llama 3 8B (Ultra-Rápido)' }
            ],
            'gemini': [
                { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Gratis y Veloz)' },
                { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Complejo)' }
            ]
        };

        // --- Carga de Datos ---
        let s = await window.api.getAllSettings();
        let savedProvider = s.ai_provider || 'openai';
        let savedModel = s.openai_model || '';

        providerSelector.value = savedProvider;
        openaiKeyInput.value = s.openai_key || '';
        groqKeyInput.value = s.groq_key || '';
        geminiKeyInput.value = s.gemini_key || '';

        // Función para actualizar modelos
        const updateModelOptions = (selectedModel = '') => {
            const provider = providerSelector.value;
            const models = modelsByProvider[provider] || [];
            
            modelSelector.innerHTML = models.map(m => 
                `<option value="${m.id}" ${m.id === selectedModel ? 'selected' : ''}>${m.name}</option>`
            ).join('');
        };

        // Función para alternar paneles de configuración
        const updatePanes = () => {
            const val = providerSelector.value;
            document.querySelectorAll('.provider-config-pane').forEach(p => p.style.display = 'none');
            const target = document.getElementById(`config-${val}`);
            if (target) target.style.display = 'block';

            // Actualizar lista de modelos
            updateModelOptions();
        };

        // --- Gestión de Cambios (Validación Inteligente) ---
        const checkChanges = () => {
            const hasChanged = 
                providerSelector.value !== savedProvider ||
                openaiKeyInput.value.trim() !== (s.openai_key || '') ||
                groqKeyInput.value.trim() !== (s.groq_key || '') ||
                geminiKeyInput.value.trim() !== (s.gemini_key || '') ||
                modelSelector.value !== savedModel;
            
            btnSave.disabled = !hasChanged;
            btnSave.style.opacity = hasChanged ? '1' : '0.5';
            btnSave.style.cursor = hasChanged ? 'pointer' : 'not-allowed';
        };

        // Escuchar cambios en todos los inputs
        [providerSelector, openaiKeyInput, groqKeyInput, geminiKeyInput].forEach(el => {
            el.addEventListener('input', checkChanges);
            el.addEventListener('change', () => {
                if (el === providerSelector) updatePanes();
                checkChanges();
            });
        });
        
        // El selector de modelos se actualiza dinámicamente, así que vigilamos también sus cambios
        modelSelector.addEventListener('change', checkChanges);

        // Estado inicial
        updatePanes();
        updateModelOptions(savedModel); // Restaurar modelo guardado si existe
        checkChanges(); // Bloquear botón al inicio

        // --- Guardado de Configuración ---
        btnSave.onclick = async () => {
            const originalText = btnSave.innerHTML;
            btnSave.disabled = true;
            btnSave.innerHTML = '<span class="material-icons-outlined animate-spin">sync</span> GUARDANDO...';

            try {
                // Guardado masivo consolidado (Evita saturación de IPC)
                await window.api.saveSettings({
                    'ai_provider': providerSelector.value,
                    'openai_key': openaiKeyInput.value.trim(),
                    'groq_key': groqKeyInput.value.trim(),
                    'gemini_key': geminiKeyInput.value.trim(),
                    'openai_model': modelSelector.value
                });

                // Sincronizar con el motor principal instantáneamente
                await syncAISettings();
                
                window.ui.showToast('✅ Configuración actualizada con éxito.');
                
                // --- Actualizar referencias locales para el bloqueador ---
                s = await window.api.getAllSettings();
                savedProvider = s.ai_provider;
                savedModel = s.openai_model;
                checkChanges();

            } catch (err) {
                console.error('Error al guardar:', err);
                window.ui.showToast('❌ Error al guardar la configuración.', 'error');
            } finally {
                btnSave.innerHTML = originalText;
                checkChanges();
            }
        };
    }
};
