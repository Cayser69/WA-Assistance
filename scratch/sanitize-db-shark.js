import sqlite3 from 'sqlite3';

const dbPath = 'C:\\Proyectos\\WA Asistance\\WA-Assistance\\.app_data\\database.sqlite';
const db = new sqlite3.Database(dbPath);

const MASTER_PROMPT = `
Eres Alex, el vendedor estrella TIBURÓN de Multimarkt. No eres una IA, eres un cerrador humano de élite.
MISIÓN: Cerrar ventas de fibra y luz pidiendo la FACTURA del cliente.
REGLAS DE ORO:
- Prohibido saludar si ya hay historial.
- Prohibido decir "ayuda", "asistir", "entender" o "pruebas".
- Prohibido pedir disculpas. Si el cliente se queja, redirige al ahorro.
- Cada mensaje debe terminar con una pregunta de cierre dirigida a conseguir la factura.
- Brevedad absoluta: Máximo 15-20 palabras por mensaje.
`.trim();

const KB_CLEANUP = {
    ai_kb_total: "Multimarkt Elche. Servicios: Fibra (O2) y Electricidad. Requisitos para contratar: DNI/NIE, IBAN y última factura. Sin permanencia.",
    ai_kb_catalogo: "FIBRA: 300Mb (23€), 600Mb (27€), 1Gb (31€). PACKS: Fibra+Móvil desde 35€. LUZ: Ahorro garantizado del 10-30% comparado con la competencia.",
    ai_kb_faqs: "Permanencia: 0 meses. Precio: Final para siempre. Instalación: Gratis. Portabilidad: Gratis. Cobertura: Movistar (Máxima de España)."
};

async function run() {
    console.log("🚀 Iniciando desinfección de Base de Datos...");

    const updates = [
        ["ai_prompt", MASTER_PROMPT],
        ["openai_prompt", MASTER_PROMPT],
        ["ai_context_personalidad", "Alex, Cerrador de Élite de Multimarkt. Vende luz y fibra rápido."],
        ["ai_kb_total", KB_CLEANUP.ai_kb_total],
        ["ai_kb_catalogo", KB_CLEANUP.ai_kb_catalogo],
        ["ai_kb_faqs", KB_CLEANUP.ai_kb_faqs],
        ["ai_auto_reply", "true"]
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

    // Limpiar notas de templates si hubiera
    await new Promise((resolve, reject) => {
        db.run("DELETE FROM templates", (err) => {
            if (err) reject(err);
            else {
                console.log("✅ Templates reseteados para evitar ruido.");
                resolve();
            }
        });
    });

    db.close();
    console.log("🎯 Desinfección completada con éxito. El Tiburón está listo.");
}

run().catch(console.error);
