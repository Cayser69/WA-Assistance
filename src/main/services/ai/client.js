import OpenAI from 'openai';

/**
 * Cliente de OpenAI para el asistente de ventas.
 */
class OpenAIClient {
    constructor() {
        this.client = null;
        this.model = 'gpt-4o-mini';
        this.prompt = 'Eres un asistente de ventas profesional.';
        this.knowledgeBase = ''; // Nueva base de conocimiento de negocio 🧠
        this.isActive = false;
    }

    /**
     * Obtiene el estado actual de la IA.
     */
    getStatus() {
        return {
            enabled: this.isActive && !!this.client,
            model: this.model
        };
    }

    /**
     * Actualiza la configuración de la IA.
     */
    config({ apiKey, model, prompt, knowledgeBase, isActive }) {
        if (apiKey) {
            this.client = new OpenAI({ apiKey });
        }
        if (model) this.model = model;
        if (prompt) this.prompt = prompt;
        if (knowledgeBase !== undefined) this.knowledgeBase = knowledgeBase;
        this.isActive = isActive;
    }

    /**
     * Inicializa la configuración desde la base de datos (Persistencia al arranque) 🛰️
     */
    async initialize() {
        try {
            const db = await import('../database/index.js');
            const settings = await db.getAllSettings();
            
            this.config({
                apiKey: settings.openai_key,
                model: settings.openai_model,
                prompt: settings.openai_prompt,
                knowledgeBase: settings.openai_knowledge_base,
                isActive: settings.ai_auto_reply === 'true'
            });
            console.log(`[AI/Client] ✅ Motor inicializado (${this.model}). Estado: ${this.isActive ? 'Activo' : 'Inactivo'}`);
        } catch (err) {
            console.error('[AI/Client] ❌ Error cargando configuración inicial:', err.message);
        }
    }

    /**
     * Genera una respuesta inteligente incorporando el historial del chat si está disponible.
     * @param {string} userMessage - El mensaje actual del usuario.
     * @param {Array} history - Array de mensajes previos [{ role, content }].
     */
    async getReply(userMessage, history = []) {
        if (!this.client || !this.isActive) return null;

        try {
            const messages = [
                { 
                    role: "system", 
                    content: `${this.prompt}\n\nCONTEXTO DEL NEGOCIO:\n${this.knowledgeBase}` 
                },
                ...history, // Inyectar historial previo 📜
                { role: "user", content: userMessage }
            ];

            const response = await this.client.chat.completions.create({
                model: this.model,
                messages,
                temperature: 0.7,
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('[AI/Client] OpenAI Error:', error.message);
            return null;
        }
    }
}

export const aiClient = new OpenAIClient();
// Auto-ejecutar inicialización si ya estamos en runtime
aiClient.initialize();
