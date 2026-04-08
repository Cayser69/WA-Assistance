import { TemplateLoader } from '../../../core/loader.js';

/**
 * Componente: AI (Inteligencia Artificial) - Orquestador Modular
 * Responsabilidad: Gestión de configuración, personalidad y automatización.
 */
export const AI = {
    render: () => `
        <div id="ai-content-root" class="animate-fade-in" style="width: 100%;">
            <!-- El contenido dinámico se inyecta aquí -->
        </div>
    `,

    /**
     * Lógica de inicialización.
     */
    init: async (appState, params = {}) => {
        console.log('[AI] 🧠 Iniciando módulo de inteligencia...');

        try {
            // 1. Cargar HTML y Estilos
            const html = await TemplateLoader.loadHTML('ai');
            await TemplateLoader.loadCSS('ai');

            const root = document.getElementById('ai-content-root');
            if (!root) return;

            // Inyectamos la plantilla
            root.innerHTML = html;

            // 2. Determinar la sección activa
            const activeTab = params.tab || 'conexion';

            // --- Gestión de Pestañas (Sub-secciones) ---
            document.querySelectorAll('.tab-content').forEach(s => s.classList.add('hidden'));
            const targetSection = document.getElementById(`section-ai-${activeTab}`);
            if (targetSection) targetSection.classList.remove('hidden');

            const titles = { 
                'conexion': 'Conexión IA', 
                'personalidad': 'Personalidad IA', 
                'automatizacion': 'Automatización' 
            };
            const titleEl = document.getElementById('ai-view-title');
            if (titleEl) titleEl.textContent = titles[activeTab] || 'Configuración IA';

            // --- Referencias de UI ---
            const keyInput = document.getElementById('openai-key');
            const modelSelect = document.getElementById('openai-model');
            const promptArea = document.getElementById('ai-system-prompt');
            const knowledgeArea = document.getElementById('ai-knowledge-base');
            const autoReplyCheck = document.getElementById('ai-auto-reply');
            const btnSaveKey = document.getElementById('btn-save-key');
            const btnSavePrompt = document.getElementById('btn-save-prompt');
            const btnSaveAutomation = document.getElementById('btn-save-automation');

            // --- Carga de Datos Iniciales ---
            const settings = await window.api.getAllSettings();
            if (keyInput) keyInput.value = settings.openai_key || '';
            if (modelSelect) modelSelect.value = settings.openai_model || 'gpt-4o-mini';
            if (promptArea) promptArea.value = settings.openai_prompt || 'Eres un asistente experto.';
            if (knowledgeArea) knowledgeArea.value = settings.openai_knowledge_base || '';
            if (autoReplyCheck) autoReplyCheck.checked = settings.ai_auto_reply === 'true';

            /**
             * Sincroniza la configuración con el motor de IA en el proceso principal.
             */
            const syncAI = async () => {
                if (window.api && window.api.invoke) {
                    await window.api.invoke('ai:config', {
                        apiKey: keyInput ? keyInput.value.trim() : settings.openai_key,
                        model: modelSelect ? modelSelect.value : settings.openai_model,
                        prompt: promptArea ? promptArea.value : settings.openai_prompt,
                        knowledgeBase: knowledgeArea ? knowledgeArea.value : settings.openai_knowledge_base,
                        isActive: autoReplyCheck ? autoReplyCheck.checked : (settings.ai_auto_reply === 'true')
                    });
                }
            };

            // --- Handlers de Guardado ---
            if (btnSaveKey) {
                btnSaveKey.onclick = async () => {
                    await window.api.saveSetting('openai_key', keyInput.value.trim());
                    await window.api.saveSetting('openai_model', modelSelect.value);
                    await syncAI();
                    alert('🔑 Credenciales y modelo actualizados.');
                };
            }

            if (btnSavePrompt) {
                btnSavePrompt.onclick = async () => {
                    await window.api.saveSetting('openai_prompt', promptArea.value);
                    await window.api.saveSetting('openai_knowledge_base', knowledgeArea.value);
                    await syncAI();
                    alert('🧠 Personalidad y Contexto guardados con éxito.');
                };
            }

            if (btnSaveAutomation) {
                btnSaveAutomation.onclick = async () => {
                    await window.api.saveSetting('ai_auto_reply', autoReplyCheck.checked.toString());
                    await syncAI();
                    alert('⚡ Ajustes de automatización aplicados.');
                };
            }

            console.log(`[AI] ✅ Sección '${activeTab}' cargada.`);
        } catch (err) {
            console.error('[AI] ❌ Error crítico en inicialización:', err);
        }
    }
};
