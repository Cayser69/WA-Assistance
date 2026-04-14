import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('database.sqlite');

db.all("SELECT key, value FROM settings", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});
