/**
 * Gestor de Tiempos y Seguridad del Scanner
 * Responsabilidad: Horario comercial (09:00-19:00), pausas forzadas y retardos de seguridad (2-3 min).
 */
export class ScannerScheduler {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
    }

    /**
     * Verifica el horario comercial y pausa el proceso si es necesario.
     */
    async checkWorkingHours(statusUpdateCallback) {
        const now = new Date();
        const hour = now.getHours();

        if (hour < 9 || hour >= 19) {
            statusUpdateCallback({ 
                paused: true, 
                currentNumber: 'FUERA DE HORARIO (Pausado hasta las 09:00)' 
            });
            
            // Re-revisar cada minuto
            await new Promise(resolve => setTimeout(resolve, 60000));
            return true; // Indicador de que hubo pausa
        }
        
        statusUpdateCallback({ paused: false });
        return false;
    }

    /**
     * Calcula y espera el retardo de seguridad entre validaciones.
     * Tiempos hardcodeados para evitar baneos: 1 min base + (1-2 min extra) = 2 a 3 min total.
     */
    async waitSafetyDelay(statusUpdateCallback, isRunningChecker) {
        if (!isRunningChecker()) return;

        const minExtra = 60000;
        const maxExtra = 120000;
        const randomExtra = Math.floor(Math.random() * (maxExtra - minExtra + 1) + minExtra);
        const totalDelay = 60000 + randomExtra;

        const nextCheck = new Date(Date.now() + totalDelay);
        statusUpdateCallback({ nextCheck });

        // Esperar el delay total en bloques de 1s para permitir interrupción
        const iterations = totalDelay / 1000;
        for (let i = 0; i < iterations; i++) {
            if (!isRunningChecker()) break;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}
