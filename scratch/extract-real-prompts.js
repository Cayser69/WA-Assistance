import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = 'C:\\Proyectos\\WA Asistance\\WA-Assistance\\.app_data\\database.sqlite';
const db = new sqlite3.Database(dbPath);

async function run() {
    console.log("### SETTINGS TABLE ###");
    const settings = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM settings", (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
    settings.forEach(s => {
        console.log(`Key: ${s.key}`);
        console.log(`Value: ${s.value}\n`);
    });

    console.log("\n### TEMPLATES TABLE ###");
    const templates = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM templates", (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
    console.log(JSON.stringify(templates, null, 2));

    db.close();
}

run().catch(console.error);
