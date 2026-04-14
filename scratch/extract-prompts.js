import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('database.sqlite');

async function run() {
    console.log("### SETTINGS TABLE ###");
    const settings = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM settings", (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
    console.log(JSON.stringify(settings, null, 2));

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
