import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import fs from 'fs';
import path from 'path';

/**
 * Gestor de Lanzamiento y Configuración de Navegador 🌐
 */
export const SessionLauncher = {
    /**
     * Busca la ruta de Chrome o Edge en el sistema para evitar depender del Chromium interno de Puppeteer.
     */
    getBrowserExecutablePath() {
        if (process.platform === 'win32') {
            const paths = [
                path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
                path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
                path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Microsoft\\Edge\\Application\\msedge.exe'),
                path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe')
            ];
            for (const p of paths) {
                if (fs.existsSync(p)) return p;
            }
        }
        return undefined;
    },

    /**
     * Crea una nueva instancia del cliente de WhatsApp con la configuración optimizada.
     */
    create(authPath) {
        const execPath = this.getBrowserExecutablePath();
        const puppeteerConfig = {
            headless: true,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-extensions', 
                '--disable-dev-shm-usage', 
                '--disable-accelerated-2d-canvas', 
                '--no-first-run', 
                '--no-zygote', 
                '--disable-gpu'
            ]
        };

        if (execPath) {
            console.log(`[WhatsApp] 🌐 Usando navegador local encontrado en: ${execPath}`);
            puppeteerConfig.executablePath = execPath;
        } else {
            console.warn(`[WhatsApp] ⚠️ No se encontró Chrome/Edge local. Usando Chromium interno.`);
        }

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
            puppeteer: puppeteerConfig
        });
    }
};
