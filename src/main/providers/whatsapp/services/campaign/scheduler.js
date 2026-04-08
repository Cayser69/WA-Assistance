/**
 * Gestor de Tiempos y Horarios de Campaña
 * Responsabilidad: SmartWait, validación de horario comercial (09:00-19:00) y cálculo de pausas.
 */
export class CampaignScheduler {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
    }

    /**
     * Espera de forma inteligente pudiendo ser interrumpida por 'isStopping'.
     */
    async smartWait(ms, statusChecker) {
        const checkInterval = 500;
        let waited = 0;
        while (waited < ms) {
            if (statusChecker()) return true; // Interrumpido
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waited += checkInterval;
        }
        return false;
    }

    /**
     * Verifica y espera si estamos fuera de horario comercial (09:00 - 19:00).
     */
    async checkWorkingHours(ignoreHours, statusChecker, logger, statusSender) {
        if (ignoreHours) return false;

        let hour = new Date().getHours();
        if (hour < 9 || hour >= 19) {
            statusSender('PAUSADO (HORARIO)');
            logger(`💤 Fuera de horario comercial (09:00-19:00). Pausando...`, 'info');
            
            while (new Date().getHours() < 9 || new Date().getHours() >= 19) {
                if (statusChecker()) return true; // Interrumpido
                await new Promise(resolve => setTimeout(resolve, 5000)); // Revisar cada 5s
            }
            
            if (statusChecker()) return true;
            statusSender('EJECUTANDO');
            logger(`🌅 Reanudando campaña...`, 'success');
        }
        return false;
    }

    /**
     * Calcula el retardo para el siguiente envío.
     * Incluye pausa larga cada 50 mensajes.
     */
    async handleNextDelay(sentCount, min, max, statusChecker, logger) {
        if (statusChecker()) return true;

        if (sentCount > 0 && sentCount % 50 === 0) {
            const longPause = Math.floor(Math.random() * (15 - 8 + 1) + 8) * 60000;
            logger(`☕ Descanso largo tras 50 envíos (${Math.round(longPause/60000)} min)...`, 'info');
            return await this.smartWait(longPause, statusChecker);
        } else {
            const randomDelay = Math.floor(Math.random() * (max - min + 1) + min) * 1000;
            const totalWait = 60000 + randomDelay; // Base de 60s + aleatorio
            logger(`⏳ Esperando ${Math.round(totalWait/1000)}s para el siguiente...`, 'info');
            return await this.smartWait(totalWait, statusChecker);
        }
    }
}
