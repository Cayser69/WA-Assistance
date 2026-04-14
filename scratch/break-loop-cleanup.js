import sqlite3 from 'sqlite3';

const dbPath = 'C:\\Proyectos\\WA Asistance\\WA-Assistance\\.app_data\\database.sqlite';
const db = new sqlite3.Database(dbPath);

const EXPERT_CLEAN_PROMPT = `
Eres un Asesor Senior de Multimarkt (Partner de O2).
Tu misión es asesorar al cliente sobre fibra y luz de forma fluida, natural y humana.

### REGLAS DE CONVERSACIÓN:
1. NO ERES UN ROBOT: No pidas la factura en cada mensaje si el cliente no está listo.
2. ESCUCHA ACTIVA: Responde a lo que el cliente dice. Si dice algo corto o sin sentido, intenta reconectar la charla con humor o curiosidad.
3. AMNESIA DE BOT: No menciones el historial previo de forma robótica ("Ya hablamos", etc.).
4. PRIORIDAD DE VALOR: Ofrece precios (23€, 35€) y beneficios (sin permanencia) antes que pedir papeles.
5. DESPEDIDA CORDIAL: Si el cliente dice "No", despídete con un mensaje completo y amable, no un simple "Adiós".

### OBJETIVO:
Ganarte la confianza del cliente. La factura es solo el paso final para confirmar el ahorro exacto.
`.trim();

async function run() {
    console.log("🧼 Iniciando saneamiento de prompts para romper el bucle...");

    const updates = [
        ["ai_prompt", EXPERT_CLEAN_PROMPT],
        ["openai_prompt", EXPERT_CLEAN_PROMPT],
        ["ai_context_personalidad", "Asesor Senior Humano. Sin bucles robóticos. Prioriza el valor."]
    ];

    for (const [key, value] of updates) {
        await new Promise((resolve, reject) => {
            db.run("UPDATE settings SET value = ? WHERE key = ?", [value, key], (err) => {
                if (err) reject(err);
                else {
                    console.log(`✅ [${key}] saneado.`);
                    resolve();
                }
            });
        });
    }

    db.close();
    console.log("🎯 Prompts saneados. El bucle Shark ha sido erradicado.");
}

run().catch(console.error);
