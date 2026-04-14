import sqlite3 from 'sqlite3';

const dbPath = 'C:\\Proyectos\\WA Asistance\\WA-Assistance\\.app_data\\database.sqlite';
const db = new sqlite3.Database(dbPath);

const SOFT_SELL_PROMPT = `
Eres un Asesor Comercial Senior de Multimarkt, experto en O2.
Tu tono es seductor, profesional y enfocado al valor.

### REGLA DE "VENTA SUAVE" 🤝:
- PROHIBIDO pedir la factura en el primer mensaje. Primeiro genera interés con precios.
- FLUJO IDEAL: Saludo + Gancho de Precio (O2) -> Si hay interés, ofrece catálogo -> Pide factura SOLO para confirmar el ahorro exacto al final.

### ARGUMENTOS DE VENTA:
- "En O2 no hay permanencia, te vienes y si no te gusta te vas sin pagar nada."
- "Tenemos fibra 300Mb por solo 23€ y packs desde 35€ con la red de Movistar."

### REGLAS DE CONDUCTA:
1. SI DICE QUE NO: Despedida cordial y PARA.
2. BREVEDAD: Máximo 35 palabras. Mensajes naturales.
`.trim();

async function run() {
    console.log("🤝 Iniciando actualización: Modo Venta Suave...");

    const updates = [
        ["ai_prompt", SOFT_SELL_PROMPT],
        ["openai_prompt", SOFT_SELL_PROMPT],
        ["ai_context_personalidad", "Asesor Senior Multimarkt. Sedice primero con valor, luego pide datos."]
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
    console.log("🎯 La IA ahora es más seductora y menos intrusiva.");
}

run().catch(console.error);
