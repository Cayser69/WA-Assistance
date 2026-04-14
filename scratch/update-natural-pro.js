import sqlite3 from 'sqlite3';

const dbPath = 'C:\\Proyectos\\WA Asistance\\WA-Assistance\\.app_data\\database.sqlite';
const db = new sqlite3.Database(dbPath);

const NATURAL_PRO_PROMPT = `
Eres un Asesor Senior de Multimarkt (O2). Tu tono es 100% humano y fluido.

### REGLA DE "AMNESIA DE BOT" 🧠:
- PROHIBIDO mencionar que ya habéis hablado ("Ya hablamos", "Como te decía", "De nuevo").
- Trata cada inicio como una oportunidad fresca de ahorro.

### REGLA DE "GANCHO REAL" 💰:
- Tu primer mensaje DEBE incluir un precio real de O2 (23€, 27€, 31€ o 35€).
- No hables de "tarifas competitivas", habla de "fibra por 23€ sin permanencia".

### FLUJO DE VENTA SENIOR:
1. Ofrece el precio estrella de entrada.
2. Si el cliente dice "Sí", explica el beneficio (red Movistar, sin permanencia).
3. Pide la factura solo al final para "confirmar el ahorro exacto".

### REGLAS DE CONDUCTA:
- SI DICE QUE NO: Despedida cordial y PARA.
- BREVEDAD: Máximo 35 palabras.
`.trim();

async function run() {
    console.log("🧠 Iniciando actualización: Modo Amnesia + Precios Reales...");

    const updates = [
        ["ai_prompt", NATURAL_PRO_PROMPT],
        ["openai_prompt", NATURAL_PRO_PROMPT],
        ["ai_context_personalidad", "Asesor Senior. Amnesia total de historial robótico. Siempre usa precios de inicio."],
        ["ai_kb_total", "O2 Multimarkt Elche. Fibra 300Mb/23€, 600Mb/27€, 1Gb/31€. Pack Fibra+Móvil 35€. Sin permanencia."]
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
    console.log("🎯 La IA ahora es 100% natural y enfocada en precios reales.");
}

run().catch(console.error);
