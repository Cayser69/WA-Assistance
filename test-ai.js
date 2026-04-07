/**
 * Test AI Connection
 * Ejecutar con: node test-ai.js
 * Asegúrate de tener una API Key configurada en la DB o pasarla por ENV.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const path = require('path');
const fs = require('fs');

// Mock de Electron app para que los servicios no fallen
const mockApp = {
    getPath: (name) => {
        if (name === 'userData') return path.join(process.cwd(), '.app_data');
        return '.';
    }
};

// Sobrescribir el require de electron para el mock
require.cache[require.resolve('electron')] = {
    exports: { app: mockApp }
};

import { aiClient } from './src/main/services/ai/client.js';
import { initDB, getAllSettings } from './src/main/services/database/index.js';

async function testAI() {
    console.log('--- Iniciando Prueba de IA ---');
    
    try {
        // 1. Inicializar DB local (en .app_data)
        await initDB();
        const settings = await getAllSettings();
        
        const apiKey = process.env.OPENAI_API_KEY || settings.openai_api_key;
        
        if (!apiKey) {
            console.error('❌ Error: No se encontró OPENAI_API_KEY en la DB ni en el entorno.');
            return;
        }

        console.log(`🔎 Usando Modelo: ${settings.openai_model || 'gpt-4o-mini'}`);
        
        // 2. Configurar Cliente
        aiClient.config({
            apiKey: apiKey,
            model: settings.openai_model || 'gpt-4o-mini',
            prompt: settings.openai_prompt || 'Eres un asistente de ventas.',
            isActive: true
        });

        console.log('🚀 Enviando mensaje de prueba a OpenAI...');
        const response = await aiClient.getReply('Hola, esto es una prueba de conexión desde WA-Assistance. ¿Me escuchas?');
        
        if (response) {
            console.log('✅ IA RESPONDE CORRECTAMENTE:');
            console.log('------------------------------');
            console.log(response);
            console.log('------------------------------');
        } else {
            console.error('❌ La IA no devolvió ninguna respuesta.');
        }

    } catch (error) {
        console.error('❌ Error fatal en la prueba:', error.message);
    }
}

testAI();
