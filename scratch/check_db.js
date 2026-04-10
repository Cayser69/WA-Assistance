import { getAllSettings } from '../src/main/services/database/index.js';

async function check() {
    try {
        console.log('--- DIAGNOSTICO DE BASE DE DATOS ---');
        const settings = await getAllSettings();
        console.log('Provider:', settings.ai_provider);
        console.log('OpenAI Key:', settings.openai_key ? 'DEFINED' : 'EMPTY');
        console.log('Groq Key:', settings.groq_key ? 'DEFINED' : 'EMPTY');
        console.log('Gemini Key:', settings.gemini_key ? 'DEFINED' : 'EMPTY');
        console.log('Auto Reply:', settings.ai_auto_reply);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();
