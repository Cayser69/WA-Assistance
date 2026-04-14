import OpenAI from 'openai';

/**
 * Cliente Universal de IA para el asistente de ventas (Senior Refactored) 🤖✨
 * Soporta OpenAI, Groq y Google Gemini con sincronización reactiva.
 */
class UniversalAIClient {
    constructor() {
        this.client = null;
        this.provider = 'openai'; 
        this.model = 'gpt-4o-mini';
        this.apiKey = '';
        this.prompt = 'Actúa como un experto en cierres de ventas por WhatsApp. Tu misión es ser amable, profesional y altamente persuasivo. Reglas: 1. No des respuestas largas, usa un tono conversacional. 2. Enfócate en resolver dudas y guiar al cliente hacia la compra o reserva. 3. Si el cliente tiene dudas técnicas, usa la base de conocimiento adjunta. 4. Evita sonar como un robot, usa emojis de forma moderada pero efectiva.';
        this.knowledgeBase = '';
        this.isActive = false;
        this.initPromise = null;
    }

    /**
     * Obtiene el estado actual de la IA (Thread-safe con inicialización).
     */
    async getStatus() {
        if (this.initPromise) await this.initPromise;
        const hasClient = !!this.client || (this.provider === 'gemini' && !!this.apiKey);
        const status = {
            connected: hasClient,
            active: this.isActive && hasClient,
            model: this.model,
            provider: this.provider,
            hasKey: !!this.apiKey && this.apiKey !== 'no-key'
        };
        console.log('[AI-Client] 🛰️ Status Request:', status);
        return status;
    }

    /**
     * Aplica una nueva configuración al motor de IA.
     */
    config({ provider, apiKey, model, prompt, knowledgeBase, isActive }) {
        console.log('[AI-Client] ⚙️ Aplicando nueva configuración:', { provider, model, isActive });

        // Actualizar propiedades core
        if (provider) this.provider = provider;
        if (apiKey !== undefined) this.apiKey = apiKey;
        if (model) this.model = model;
        if (prompt) this.prompt = prompt;
        if (knowledgeBase !== undefined) this.knowledgeBase = knowledgeBase;
        
        if (typeof isActive === 'boolean') {
            this.isActive = isActive;
        }

        // Configurar cliente según el proveedor
        try {
            // Normalización de modelos según proveedor
            if (this.provider === 'groq' && (!this.model || this.model.startsWith('gpt-'))) {
                this.model = 'llama-3.3-70b-versatile';
            }
            if (this.provider === 'gemini' && (!this.model || this.model.startsWith('gpt-'))) {
                this.model = 'gemini-1.5-flash';
            }

            if (this.provider === 'openai' || this.provider === 'groq') {
                const config = { apiKey: this.apiKey || 'no-key' };
                if (this.provider === 'groq') {
                    config.baseURL = 'https://api.groq.com/openai/v1';
                }
                this.client = new OpenAI(config);
            } else {
                this.client = null; 
            }
        } catch (err) {
            console.error('[AI/Universal] ❌ Error configurando cliente:', err.message);
            this.client = null;
        }
    }

    /**
     * Carga la configuración inicial desde la base de datos.
     */
    async initialize() {
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                console.log('[AI-Client] 🤖 Iniciando proceso de autorecuperación...');
                const db = await import('../database/index.js');
                const s = await db.getAllSettings();
                
                const activeProvider = s.ai_provider || 'openai';
                let activeKey = s.openai_key;

                if (activeProvider === 'groq') activeKey = s.groq_key;
                if (activeProvider === 'gemini') activeKey = s.gemini_key;

                this.config({
                    provider: activeProvider,
                    apiKey: activeKey,
                    model: s.ai_model || s.openai_model || (activeProvider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini'),
                    prompt: s.ai_prompt || s.openai_prompt,
                    knowledgeBase: s.ai_kb_total || s.openai_knowledge_base,
                    isActive: s.ai_auto_reply === 'true'
                });

                console.log(`[AI/Universal] ✅ Motor listo: ${this.provider} (${this.model}).`);
                
                // Broadcast diferido para estabilidad del Renderer 🛰️
                setTimeout(async () => {
                    const { BrowserWindow } = await import('electron');
                    const wins = BrowserWindow.getAllWindows();
                    const status = await this.getStatus();
                    
                    console.log(`[AI/Universal] 📢 Sincronización proactiva enviada a ${wins.length} ventanas.`);
                    wins.forEach(w => {
                        if (!w.isDestroyed()) w.webContents.send('wa:ai-status', status);
                    });
                }, 1500);

            } catch (err) {
                console.error('[AI/Universal] ❌ Error en inicialización:', err.message);
            }
        })();
        
        return this.initPromise;
    }

    /**
     * Generación de respuestas sugeridas. 🛰️
     * Optimizada para diferenciar entre Reglas de Negocio e Instrucciones de Tarea.
     */
    async getReply(userMessage, history = [], force = false, systemInstructions = null) {
        if (!force && (!this.isActive || !this.apiKey)) return null;
        
        try {
            if (this.provider === 'gemini') {
                return await this.getGeminiReply(userMessage, history, systemInstructions);
            }

            // Construir un mensaje de sistema robusto que combine el ADN del negocio y la tarea actual
            const systemContent = [
                this.prompt,
                this.knowledgeBase ? `BASE DE CONOCIMIENTO:\n${this.knowledgeBase}` : '',
                systemInstructions ? `INSTRUCCIONES DE TAREA:\n${systemInstructions}` : ''
            ].filter(Boolean).join('\n\n--- \n\n');

            const messages = [
                { role: 'system', content: systemContent },
                ...history
            ];

            // Si hay un mensaje de usuario específico (fuera de las instrucciones), lo añadimos
            if (userMessage && !systemInstructions) {
                messages.push({ role: 'user', content: userMessage });
            } else if (userMessage && systemInstructions) {
                // Si hay instrucciones, el 'userMessage' suele ser parte del contexto o el último disparador
                messages.push({ role: 'user', content: `Contexto Adicional: ${userMessage}` });
            }

            const response = await this.client.chat.completions.create({
                model: this.model,
                messages,
                temperature: 0.6, // Bajamos la temperatura para mayor consistencia
                max_tokens: 500
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('[AI-Client] ❌ Error en generación:', error.message);
            return null;
        }
    }

    /**
     * Manejo específico para Google Gemini (REST API).
     */
    async getGeminiReply(userMessage, history = [], systemInstructions = null) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
            const contents = history.map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }]
            }));
            contents.push({ role: 'user', parts: [{ text: `${this.prompt}\n\nContexto:\n${this.knowledgeBase}\n\nMensaje:\n${userMessage}` }] });

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents })
            });

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('[AI-Client] ❌ Error Gemini:', error.message);
            return null;
        }
    }
}

// Exportar instancia única (Singleton) 🛰️
export const aiClient = new UniversalAIClient();
aiClient.initialize();
