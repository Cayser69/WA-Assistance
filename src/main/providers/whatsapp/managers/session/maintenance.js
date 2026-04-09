import fs from 'fs';
import path from 'path';
import { SessionProcesses } from './processes.js';

const debugLog = (...args) => { if (process.env.DEBUG === 'true') console.log(...args); };

/**
 * Gestor de Verificación, Reparación y Limpieza de Sesiones 🧼
 */
export const SessionMaintenance = {
    /**
     * Limpieza selectiva de caché (Soft Reset)
     */
    async clearSoftCache(sessionPath) {
        if (!fs.existsSync(sessionPath)) return;

        const foldersToPurge = [
            'Cache', 'Code Cache', 'GPUCache', 'Service Worker',
            'GrShaderCache', 'ShaderCache', 'Blob Storage',
            'Default/Cache', 'Default/Code Cache', 'Default/GPUCache', 'Default/Service Worker'
        ];

        console.log('WhatsApp Session: Iniciando mantenimiento proactivo de caché...');
        for (const folder of foldersToPurge) {
            const folderPath = path.join(sessionPath, folder);
            if (fs.existsSync(folderPath)) {
                try {
                    fs.rmSync(folderPath, { recursive: true, force: true });
                } catch (e) { }
            }
        }
    },

    /**
     * Limpia archivos de bloqueo y repara la carpeta de sesión.
     */
    async repair(authPath) {
        const sessionPath = path.join(authPath, 'session-sales-assistant');
        if (!fs.existsSync(sessionPath)) return false;

        // 1. Matar procesos zombi
        await SessionProcesses.killZombies();

        // 2. Limpieza de caché
        await this.clearSoftCache(sessionPath);

        // 3. Limpiar archivos de bloqueo (Retry Loop)
        const filesToClean = [
            'SingletonLock', 'lockfile', 'DevToolsActivePort', 
            'SingletonCookie', 'SingletonSocket', 'SingletonContext'
        ];
        
        let allCleaned = false;
        for (let attempt = 1; attempt <= 5; attempt++) {
            let filesFound = 0;
            let filesDeleted = 0;

            for (const file of filesToClean) {
                const filePath = path.join(sessionPath, file);
                if (!fs.existsSync(filePath)) continue;
                
                filesFound++;
                try {
                    fs.rmSync(filePath, { recursive: true, force: true });
                    filesDeleted++;
                } catch (err) { }
            }

            if (filesFound === filesDeleted) {
                allCleaned = true;
                break;
            }

            console.log(`WhatsApp Session: Reintentando liberación de archivos (Intento ${attempt}/5)...`);
            await new Promise(r => setTimeout(r, 2000));
        }
        
        return allCleaned;
    },

    /**
     * Borrado físico de la carpeta de sesión.
     */
    async delete(authPath) {
        const sessionPath = path.join(authPath, 'session-sales-assistant');
        if (fs.existsSync(sessionPath)) {
            try {
                fs.rmSync(sessionPath, { recursive: true, force: true });
                return true;
            } catch (e) {
                return false;
            }
        }
        return true;
    },

    /**
     * Cierre de sesión y limpieza.
     */
    async logout(client, authPath) {
        if (!client) return;
        try {
            console.log('WhatsApp Session: Logout oficial...');
            await client.logout();
        } catch (err) {
            try { await client.destroy(); } catch (e) {}
        } finally {
            await this.delete(authPath);
        }
    }
};
