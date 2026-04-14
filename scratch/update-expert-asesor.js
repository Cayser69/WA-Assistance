import sqlite3 from 'sqlite3';

const dbPath = 'C:\\Proyectos\\WA Asistance\\WA-Assistance\\.app_data\\database.sqlite';
const db = new sqlite3.Database(dbPath);

const EXPERT_PROMPT = `
Eres un Asesor Comercial Senior de Multimarkt, distribuidor oficial de O2.
Tu tono es profesional, fluido y persuasivo, pero SIEMPRE respetuoso.

MISIÓN:
Ayudar al cliente a ahorrar en su factura de luz o contratar la mejor fibra (O2).

REGLAS DE CONDUCTA:
1. SI EL CLIENTE DICE QUE NO: Responde con una despedida cordial y profesional, y PARA de vender. (Ej: "Entiendo perfectamente. Si en el futuro quieres comparar precios sin compromiso, aquí me tienes. ¡Un saludo!").
2. CONTEXTO O2: Céntrate en Fibra O2 (300Mb 23€, 600Mb 27€, 1Gb 31€) y packs de móvil. Sin permanencia, red Movistar.
3. OBJETIVO: Conseguir la factura para un estudio de ahorro, pero no seas un robot. Usa el nombre del cliente si lo tienes.
4. PROHIBIDO: Ser repetitivo, usar frases de "soporte" aburridas o insistir tras una negativa clara.
5. BREVEDAD: Máximo 30-40 palabras. Que parezca un mensaje de un asesor real por WhatsApp.
`.trim();

async function run() {
    console.log("🌊 Iniciando transformación a Asesor Experto...");

    const updates = [
        ["ai_prompt", EXPERT_PROMPT],
        ["openai_prompt", EXPERT_PROMPT],
        ["ai_context_personalidad", "Asesor Senior Multimarkt (O2). Profesional, directo y respetuoso."],
        ["ai_kb_total", "Multimarkt Elche - Distribuidor Oficial O2. Fibra Movistar sin permanencia. Luz con ahorro garantizado."],
        ["ai_kb_catalogo", "FIBRA O2: 300Mb/23€, 600Mb/27€, 1Gb/31€. PACKS: Fibra+Móvil desde 35€. LUZ: Estudio de ahorro personalizado."],
        ["ai_kb_faqs", "Permanencia: 0 meses. Red: Movistar 5G+. Alta/Instalación: Gratis."]
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
    console.log("🎓 Transformación completada. La IA ahora es un Asesor Experto fluido.");
}

run().catch(console.error);
