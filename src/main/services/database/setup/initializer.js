import { run } from './connection.js';
import { SCHEMAS, MIGRATIONS, INDEXES } from './schema.js';

/**
 * Orquestador de Inicialización y Migraciones de Base de Datos 🛠️
 */
export async function initDB() {
    try {
        console.log('[Database/Setup] 🤖 Inicializando tablas nucleares...');
        
        // 1. Crear Tablas Base
        for (const sql of Object.values(SCHEMAS)) {
            await run(sql);
        }

        // 2. Ejecutar Migraciones (Seguridad)
        console.log('[Database/Setup] ⚙️ Verificando integridad estructural...');
        for (const sql of MIGRATIONS) {
            try {
                await run(sql);
            } catch (e) {
                // Silenciamos errores de columnas ya existentes
            }
        }

        // 3. Crear Índices de Rendimiento
        for (const sql of INDEXES) {
            try {
                await run(sql);
            } catch (e) { }
        }

        console.log('[Database/Setup] ✅ Esquema inicializado correctamente.');
    } catch (error) {
        console.error('[Database/Setup] ❌ Error crítico durante la configuración:', error);
        throw error;
    }
}
