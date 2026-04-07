import OpenAI from 'openai';

/**
 * Cliente de OpenAI para el asistente de ventas.
 */
class OpenAIClient {
    constructor() {
        this.client = null;
        this.model = 'gpt-4o-mini';
        this.prompt = 'Eres un asistente de ventas profesional.';
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
    config({ apiKey, model, prompt, isActive }) {
        if (apiKey) {
            this.client = new OpenAI({ apiKey });
        }
        if (model) this.model = model;
        if (prompt) this.prompt = prompt;
        this.isActive = isActive;
    }

    /**
     * Genera una respuesta inteligente para un mensaje entrante.
     */
    async getReply(userMessage) {
        if (!this.client || !this.isActive) return null;

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: "system", content: this.prompt },
                    { role: "user", content: userMessage }
                ],
                temperature: 0.7,
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI Error:', error);
            return null;
        }
    }
}

export const aiClient = new OpenAIClient();
