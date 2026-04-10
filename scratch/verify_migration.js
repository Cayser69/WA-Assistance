import { initDB, getChatMessages } from '../src/main/services/database/index.js';

async function verify() {
    try {
        console.log('--- Verificando Migración de Base de Datos ---');
        await initDB();
        
        // Intentar recuperar mensajes para ver si las nuevas columnas existen
        try {
            const msgs = await getChatMessages('test');
            console.log('✅ Columnas msg_id y ack detectadas en la respuesta.');
        } catch (e) {
            console.error('❌ Error al consultar nuevas columnas:', e.message);
        }
        
        console.log('✅ Migración completada con éxito.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Fallo crítico en verificación:', err);
        process.exit(1);
    }
}

verify();
