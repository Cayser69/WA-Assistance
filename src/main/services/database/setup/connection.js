import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3');
import electron from 'electron';
const { app } = electron;
import path from 'path';

let db = null;

/**
 * Obtiene la instancia de la base de datos, inicializándola si es necesario.
 */
export function getDB() {
    if (!db) {
        const dbPath = path.resolve(app.getPath('userData'), 'database.sqlite');
        db = new sqlite3.Database(dbPath);
    }
    return db;
}

/**
 * Ejecuta una consulta SQL que no devuelve filas (INSERT, UPDATE, DELETE).
 */
export const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        getDB().run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

/**
 * Ejecuta una consulta SQL y devuelve todas las filas (SELECT).
 */
export const all = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        getDB().all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};
