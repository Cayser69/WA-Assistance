import { SessionProcesses } from './processes.js';
import { SessionLauncher } from './launcher.js';
import { SessionMaintenance } from './maintenance.js';

/**
 * Gestor de Sesiones de WhatsApp (Orquestador Modular) 📻🏢
 * Mantiene la compatibilidad con la API anterior.
 */
export class SessionManager {
    static killZombies() {
        return SessionProcesses.killZombies();
    }

    static getBrowserExecutablePath() {
        return SessionLauncher.getBrowserExecutablePath();
    }

    static create(authPath) {
        return SessionLauncher.create(authPath);
    }

    static clearSoftCache(sessionPath) {
        return SessionMaintenance.clearSoftCache(sessionPath);
    }

    static repair(authPath) {
        return SessionMaintenance.repair(authPath);
    }

    static delete(authPath) {
        return SessionMaintenance.delete(authPath);
    }

    static logout(client, authPath) {
        return SessionMaintenance.logout(client, authPath);
    }
}
