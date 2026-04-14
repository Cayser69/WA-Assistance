import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve('.app_data/database.sqlite');
console.log('--- DIAGNOSTICO DE BASE DE DATOS (REPARADO) ---');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error('Error abriendo DB:', err.message);
    
    db.all(`
        SELECT l.telefono, l.mensaje, l.fecha as last_msg_date, le.nombre 
        FROM (
            SELECT telefono, mensaje, fecha
            FROM logs
            WHERE id IN (SELECT MAX(id) FROM logs GROUP BY telefono)
        ) l
        LEFT JOIN leads le ON l.telefono = le.telefono
        ORDER BY l.fecha DESC LIMIT 5
    `, [], (err, rows) => {
        if (err) return console.error('Error chats:', err.message);
        console.log('\nÚltimos chats activos:');
        rows.forEach(r => console.log(`- ${r.telefono} (${r.nombre || 'Sin nombre'}): ${r.mensaje} [${r.last_msg_date}]`));
        
        if (rows.length > 0) {
            const lastTel = rows[0].telefono;
            console.log(`\nHistorial de: ${lastTel}`);
            db.all('SELECT mensaje, tipo, fecha, ack FROM logs WHERE telefono = ? ORDER BY fecha DESC LIMIT 15', [lastTel], (err, msgs) => {
                if (err) return console.error('Error msgs:', err.message);
                msgs.slice().reverse().forEach(m => console.log(`[${m.fecha}] ${m.tipo === 'enviado' ? '>> ' : '<< '} ${m.mensaje} (ACK: ${m.ack})`));
                db.close();
            });
        } else {
            db.close();
        }
    });
});
