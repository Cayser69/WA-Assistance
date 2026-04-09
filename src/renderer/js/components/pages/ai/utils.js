/**
 * Utilidades compartidas para el módulo de Inteligencia Artificial.
 */

/**
 * Sincroniza la configuración global almacenada en la base de datos 
 * con el proceso principal (motor de IA).
 */
export async function syncAISettings() {
    console.log('[AI-Utils] Sincronizando configuración con el Main...');
    
    // 1. Obtener todos los ajustes actuales
    const s = await window.api.getAllSettings();

    // 2. Consolidar Base de Conocimiento
    const knowledgeBase = `
### PRODUCTOS Y SERVICIOS:
${s.ai_kb_catalogo || ''}

### PREGUNTAS FRECUENTES (FAQs):
${s.ai_kb_faqs || ''}

### OPERATIVA Y POLÍTICAS:
${s.ai_kb_operativa || ''}
`.trim();

    // 3. Invocar al proceso principal
    await window.api.invoke('ai:config', {
        apiKey: s.openai_key,
        model: s.openai_model,
        prompt: s.openai_prompt,
        knowledgeBase: knowledgeBase,
        isActive: s.ai_auto_reply === 'true'
    });

    console.log('[AI-Utils] Motor de IA actualizado correctamente.');
}
