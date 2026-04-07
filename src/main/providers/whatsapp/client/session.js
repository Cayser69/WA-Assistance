import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const debugLog = (...args) => { if (process.env.DEBUG === 'true') console.log(...args); };

/**
 * Gestor de Sesiones de WhatsApp (Subcomponente de Cliente)
 * Responsabilidad: Limpieza de bloqueos, reparación de carpetas y creación del cliente.
 */
export class SessionManager {
    /**
     * Mata procesos zombi de Chrome que bloquean la carpeta de sesión.
     * Estrategia "Tierra Quemada" para Windows.
     */
    static async killZombies(sessionPath) {
        if (process.platform !== 'win32') return;
        
        console.log('WhatsApp Session: Ejecutando purga quirúrgica de procesos...');
        const commands = [
            // 1. Matar procesos específicos de esta sesión por CommandLine (PowerShell CimInstance)
            `powershell "Get-CimInstance Win32_Process -Filter \\"Name LIKE '%chrome%' AND CommandLine LIKE '%session-sales-assistant%'\\" | %{ Stop-Process $_.ProcessId -Force }"`,
            // 2. Matar cualquier proceso Chrome/Chromium sin ventana (típico de Puppeteer colgado)
            `taskkill /F /IM chrome.exe /FI "WINDOWTITLE eq about:blank" /T`,
            `taskkill /F /IM chromium.exe /FI "WINDOWTITLE eq about:blank" /T`,
            // 3. Matar procesos huérfanos de Electron que puedan estar bloqueando
            `taskkill /F /IM electron.exe /FI "STATUS eq not responding" /T`
        ];

        for (const cmd of commands) {
            try {
                debugLog(`[Zombie-Killer] 🔪 Ejecutando: ${cmd}`);
                const { stdout, stderr } = await execAsync(cmd);
                if (stdout) debugLog(`[Zombie-Killer] 📝 Salida: ${stdout.trim()}`);
                if (stderr) console.warn(`[Zombie-Killer] ⚠️ Error STDERR: ${stderr}`);
            } catch (err) {
                // Silenciamos si no encuentra procesos
                debugLog(`[Zombie-Killer] ℹ️ Sin procesos encontrados para este comando.`);
            }
        }
        console.log('[Zombie-Killer] ✅ Fin de la purga de procesos.');
    }

    /**
     * Crea una nueva instancia del cliente de WhatsApp con la configuración optimizada.
     */
    static create(authPath) {
        return new Client({
            authStrategy: new LocalAuth({
                clientId: 'sales-assistant',
                dataPath: authPath
            }),
            takeover: true,
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-js/main/dist/wppconnect-wa.js',
            },
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
            }
        });
    }

    /**
     * Limpieza selectiva de caché (Soft Reset)
     * Borra archivos temporales pesados SIN perder la sesión (Cookies/LocalStorage).
     */
    static async clearSoftCache(sessionPath) {
        if (!fs.existsSync(sessionPath)) return;

        const foldersToPurge = [
            'Cache',
            'Code Cache',
            'GPUCache',
            'Service Worker',
            'GrShaderCache',
            'ShaderCache',
            'Blob Storage',
            'Default/Cache',
            'Default/Code Cache',
            'Default/GPUCache',
            'Default/Service Worker'
        ];

        console.log('WhatsApp Session: Iniciando mantenimiento proactivo de caché...');

        for (const folder of foldersToPurge) {
            const folderPath = path.join(sessionPath, folder);
            if (fs.existsSync(folderPath)) {
                try {
                    fs.rmSync(folderPath, { recursive: true, force: true });
                    debugLog(`WhatsApp Session: Purga de caché exitosa en ${folder}`);
                } catch (e) {
                    // Silenciar si no se puede borrar (posiblemente en uso parcial)
                }
            }
        }
    }

    /**
     * Limpia archivos de bloqueo de Puppeteer/Chrome para evitar el error 'Browser already running'.
     * Limpieza profunda con Bucle de Reintentos (Retry Loop).
     */
    static async repair(authPath) {
        const sessionPath = path.join(authPath, 'session-sales-assistant');
        if (!fs.existsSync(sessionPath)) return false;

        // 1. ELIMINAR PROCESOS ZOMBI (Fuerza Bruta)
        await this.killZombies(sessionPath);

        // 2. LIMPIEZA DE CACHÉ ELECTIVA (Soft Reset)
        await this.clearSoftCache(sessionPath);

        // 3. LIMPIAR ARCHIVOS DE BLOQUEO (Retry Loop)
        const filesToClean = [
            'SingletonLock', 
            'lockfile', 
            'DevToolsActivePort', 
            'SingletonCookie', 
            'SingletonSocket',
            'SingletonContext'
        ];
        
        let allCleaned = false;

        // BUCLE DE REINTENTO (5 intentos, 1.5s entre cada uno)
        for (let attempt = 1; attempt <= 5; attempt++) {
            let filesFound = 0;
            let filesDeleted = 0;

            for (const file of filesToClean) {
                const filePath = path.join(sessionPath, file);
                if (!fs.existsSync(filePath)) {
                    debugLog(`[Repair-Loop] 🔍 No existe (Limpiado): ${file}`);
                    continue;
                }
                
                filesFound++;
                try {
                    debugLog(`[Repair-Loop] 🗑️ Intentando borrar: ${filePath}`);
                    // Usar rmSync recursivo por si 'lockfile' se comporta como directorio (raro pero ocurre)
                    fs.rmSync(filePath, { recursive: true, force: true });
                    debugLog(`[Repair-Loop] ✅ Eliminado ${file} (Intento ${attempt})`);
                    filesDeleted++;
                } catch (err) {
                    console.warn(`[Repair-Loop] ❌ FALLÓ borrar ${file}. Razón: ${err.message}`);
                }
            }

            if (filesFound === filesDeleted) {
                allCleaned = true;
                break;
            }

            console.log(`WhatsApp Session: Archivos aún bloqueados. Reintentando liberación (Intento ${attempt}/5)...`);
            await new Promise(r => setTimeout(r, 2000));
        }

        if (!allCleaned) {
            console.error('WhatsApp Session: ERROR FATAL. No se pudo liberar el archivo lockfile tras 5 intentos.');
            console.info('Sugerencia: Cierra cualquier otra instancia de la app o reinicia el PC.');
        }
        
        return allCleaned;
    }

    /**
     * Borrado completo de la sesión (Logout duro)
     */
    static async delete(authPath) {
        const sessionPath = path.join(authPath, 'session-sales-assistant');
        if (fs.existsSync(sessionPath)) {
            try {
                fs.rmSync(sessionPath, { recursive: true, force: true });
                return true;
            } catch (e) {
                console.error('WhatsApp Session: Error al borrar carpeta de sesión:', e.message);
                return false;
            }
        }
        return true;
    }

    /**
     * Proceso de Logout completo: Desconexión de Puppeteer y limpieza de archivos.
     */
    static async logout(client, authPath) {
        if (!client) return;
        
        try {
            console.log('WhatsApp Session: Intentando logout oficial...');
            await client.logout();
        } catch (err) {
            console.warn('WhatsApp Session: Error en logout, forzando destrucción del cliente...');
            try {
                await client.destroy();
            } catch (e) {}
        } finally {
            // Limpieza física de la carpeta de sesión
            await this.delete(authPath);
        }
    }
}
