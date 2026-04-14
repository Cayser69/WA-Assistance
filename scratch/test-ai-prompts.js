
import { aiClient } from '../src/main/services/ai/client.js';

async function testPrompts() {
    console.log('--- TEST 1: Respuesta Automática (Base Prompt) ---');
    const reply1 = await aiClient.getReply('Hola, me gustaría ahorrar en mi recibo de luz.', [], true);
    console.log('Respuesta:', reply1);
    console.log('\n');

    console.log('--- TEST 2: Variante de Campaña ---');
    // Simulamos el prompt que usa el processor.js
    const variantPrompt = `Reescribe este mensaje de oferta de forma profesional y vendedora. 
    IMPORTANTE: No cierres la venta en el texto; el objetivo es generar interés para que el cliente quiera ser contactado. 
    Menciona siempre que la gestión final la realiza un "especialista del equipo".
    MENSAJE A REESCRIBIR: "Tenemos una oferta de fibra por 23€ al mes. ¿La quieres?"`;
    const reply2 = await aiClient.getReply(variantPrompt, [], true);
    console.log('Variante:', reply2);
    console.log('\n');

    console.log('--- TEST 3: Sugerencia Manual (System Instructions) ---');
    const systemInstructions = `
        ### ROL: ASESOR CUALIFICADOR (HUMANO) 🎓
        - Tu misión es acompañar al cliente y CUALIFICAR su interés antes de pasarle con el comercial.
        - ESCUCHA ANTES DE VENDER. Si el cliente tiene dudas, resuélvelas pero deja claro que la oferta final la valida un "Asesor Comercial Especializado".
        
        ### GUÍA DE CONVERSACIÓN:
        1. Seduce con los precios de O2 (23€, 35€) y menciona la falta de permanencia.
        2. Si el cliente muestra interés, dile que le vas a pasar con un compañero comercial para que revise su caso personalmente y le aplique el mejor descuento.
        3. NUNCA prometas la activación inmediata de servicios; siempre es el comercial quien lo hace.
        
        ### RESTRICCIONES:
        - Máximo 35 palabras. Fluido y humano.
        - El objetivo es conseguir que el cliente acepte la llamada o visita del comercial.
    `.trim();
    const reply3 = await aiClient.getReply('¿Cómo puedo contratar esto?', [], true, systemInstructions);
    console.log('Sugerencia:', reply3);
}

// Nota: Para que esto funcione, necesitamos que las API Keys estén configuradas en las variables de entorno o mockear el cliente.
// Dado que es una prueba en el entorno del usuario, intentaremos correrlo si tiene las llaves.
testPrompts().catch(console.error);
