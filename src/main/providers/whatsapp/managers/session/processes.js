import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const debugLog = (...args) => { if (process.env.DEBUG === 'true') console.log(...args); };

/**
 * Gestor de Procesos del Sistema para WhatsApp 🖥️
 */
export const SessionProcesses = {
    /**
     * Mata procesos zombi de Chrome que bloquean la carpeta de sesión.
     * Estrategia "Tierra Quemada" para Windows.
     */
    async killZombies() {
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
};
