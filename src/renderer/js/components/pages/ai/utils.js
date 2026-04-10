/**
 * Utilidades compartidas para el módulo de Inteligencia Artificial.
 */

/**
 * Sincroniza la configuración global almacenada en la base de datos 
 * con el proceso principal (motor de IA).
 */
export async function syncAISettings() {
    console.log('[AI-Utils] 🔍 INICIANDO llamada a syncAISettings...');
    
    // 1. Obtener todos los ajustes actuales
    const s = await window.api.getAllSettings();
    console.log('[AI-Utils] 📥 Ajustes recuperados para sincronizar:', s.ai_provider);

    // 2. Consolidar Base de Conocimiento
    const knowledgeBase = `
### PRODUCTOS Y SERVICIOS:
${s.ai_kb_catalogo || ''}

### PREGUNTAS FRECUENTES (FAQs):
${s.ai_kb_faqs || ''}

### OPERATIVA Y POLÍTICAS:
${s.ai_kb_operativa || ''}
`.trim();

    // 3. Detectar Proveedor y Clave Activa
    const provider = s.ai_provider || 'openai';
    let apiKey = s.openai_key;

    if (provider === 'groq') apiKey = s.groq_key;
    if (provider === 'gemini') apiKey = s.gemini_key;

    // 4. Determinar estado de activación (Validación estricta)
    const isActive = s.ai_auto_reply === 'true' ? true : (s.ai_auto_reply === 'false' ? false : undefined);

    // 5. Invocar al proceso principal con la configuración correcta
    await window.api.invoke('ai:config', {
        provider: provider,
        apiKey: apiKey,
        model: s.openai_model,
        prompt: s.openai_prompt,
        knowledgeBase: knowledgeBase,
        isActive: isActive
    });

    console.log('[AI-Utils] Motor de IA actualizado correctamente.');
}
