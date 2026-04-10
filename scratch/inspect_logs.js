import { getDB } from '../src/main/services/database/setup/connection.js';

async function inspect() {
    try {
        const db = getDB();
        db.all("PRAGMA table_info(logs)", (err, rows) => {
            if (err) {
                console.error('Error PRAGMA:', err);
            } else {
                console.log('--- ESTRUCTURA DE TABLA LOGS ---');
                console.table(rows);
            }
            process.exit(0);
        });
    } catch (err) {
        console.error('Fallo:', err);
        process.exit(1);
    }
}

inspect();
