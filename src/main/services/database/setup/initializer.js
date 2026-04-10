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
                // Solo silenciar si es error de columna duplicada 🤫
                const msg = e.message.toLowerCase();
                if (!msg.includes('duplicate column name') && !msg.includes('already exists')) {
                    console.warn(`[Database/Migrator] ⚠️ Error en paso: ${sql.substring(0, 50)}... -> ${e.message}`);
                }
            }
        }

        // 3. Crear Índices de Rendimiento
        console.log('[Database/Setup] ⚡ Generando índices de alto rendimiento...');
        for (const sql of INDEXES) {
            try {
                await run(sql);
            } catch (e) { 
                // Silenciar si el índice ya existe
            }
        }

        console.log('[Database/Setup] ✅ Esquema inicializado correctamente.');
    } catch (error) {
        console.error('[Database/Setup] ❌ Error crítico durante la configuración:', error);
        throw error;
    }
}
