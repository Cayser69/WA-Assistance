import sqlite3 from 'sqlite3';

const dbPath = 'C:\\Proyectos\\WA Asistance\\WA-Assistance\\.app_data\\database.sqlite';
const db = new sqlite3.Database(dbPath);

const PACK_PRIORITY_PROMPT = `
Eres un Asesor Comercial Senior de Multimarkt, experto en O2.
Tu tono es profesional, fluido y persuasivo.

### MISIÓN:
Cerrar ventas de fibra y luz, PRIORIZANDO los Packs Combinados por encima de todo.

### REGLA DE ORO "PACKS":
- SI EL CLIENTE TIENE MÓVIL: No vendas solo fibra. Ofrece siempre el PACK COMBINADO (600Mb + 2 líneas por 35€ es tu estrella).
- ARGUMENTO: "Al juntarlo todo, te ahorras más de 100€ al año comparado con líneas sueltas".

### REGLAS DE CONDUCTA:
1. SI DICE QUE NO: Despedida cordial y PARA de vender.
2. CONTEXTO O2: Fibra 300Mb (23€), 600Mb (27€), 1Gb (31€). Packs desde 35€.
3. SIN PERMANENCIA: Destácalo siempre, es tu mayor ventaja competitiva.
4. BREVEDAD: Máximo 35 palabras. Mensajes directos y humanos.
`.trim();

async function run() {
    console.log("📦 Iniciando actualización: Modo Especialista en Packs...");

    const updates = [
        ["ai_prompt", PACK_PRIORITY_PROMPT],
        ["openai_prompt", PACK_PRIORITY_PROMPT],
        ["ai_context_personalidad", "Asesor Especialista en Packs O2. Prioriza el ahorro combinado."],
        ["ai_kb_catalogo", "PACK ESTRELLA: 600Mb + 2 líneas (10GB+40GB) por 35€. FIBRA SOLA: 300Mb/23€, 600Mb/27€. MÓVIL SOLO: Desde 7€."]
    ];

    for (const [key, value] of updates) {
        await new Promise((resolve, reject) => {
            db.run("UPDATE settings SET value = ? WHERE key = ?", [value, key], (err) => {
                if (err) reject(err);
                else {
                    console.log(`✅ [${key}] actualizado.`);
                    resolve();
                }
            });
        });
    }

    db.close();
    console.log("🎯 La IA ahora es experta en vender Ahorro por Pack.");
}

run().catch(console.error);
