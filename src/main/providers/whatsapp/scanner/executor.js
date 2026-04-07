import { waClient } from '../client.js';
import * as db from '../../../services/database/index.js';

/**
 * Gestor de Ejecución del Scanner
 * Responsabilidad: Bucle de escaneo por rango y bucle de reparación de leads.
 */
export class ScannerExecutor {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
    }

    /**
     * Bucle principal de escaneo de números por rango.
     */
    async execute(config, scheduler, logic, statusUpdate) {
        const { countryCode, baseNumber, range } = config;
        let currentString = baseNumber.toString();
        let currentBigInt = BigInt(currentString);
        const count = parseInt(range);

        for (let i = 0; i < count; i++) {
            if (!statusUpdate.isRunning()) break;

            // 1. Horario Comercial (09:00 - 19:00)
            const paused = await scheduler.checkWorkingHours(statusUpdate.update);
            if (paused) {
                i--; // No contar esta iteración
                continue;
            }

            // 2. Preparar número actual
            const phone = `${countryCode}${currentBigInt.toString()}`;
            statusUpdate.update({ 
                currentNumber: phone,
                checked: i + 1
            });

            // 3. Ejecutar Validación (Logic)
            const isValid = await logic.validateAndSave(phone);
            if (isValid) statusUpdate.updateValid();

            // 3.5 Persistir progreso en tiempo real
            await db.savePersistence('scanner_active', {
                config,
                currentIndex: i,
                lastPhone: phone,
                type: 'range'
            });

            // 4. Siguiente número
            currentBigInt++;

            // 5. Esperar Delay de Seguridad (2-3 min) - Excepto el último
            if (i < count - 1 && statusUpdate.isRunning()) {
                await scheduler.waitSafetyDelay(statusUpdate.update, statusUpdate.isRunning);
            }
        }
    }

    /**
     * Bucle de reparación de nombres para leads existentes.
     */
    async repair(leads, scheduler, logic, statusUpdate) {
        for (let i = 0; i < leads.length; i++) {
            if (!statusUpdate.isRunning()) break;

            // 1. Horario Comercial
            const paused = await scheduler.checkWorkingHours(statusUpdate.update);
            if (paused) {
                i--;
                continue;
            }

            const lead = leads[i];
            statusUpdate.update({ 
                currentNumber: `REPARANDO: ${lead.telefono}`,
                checked: i + 1
            });

            // 2. Ejecutar Reparación
            const repaired = await logic.repairLead(lead);
            if (repaired) statusUpdate.updateValid();

            // 3. Esperar Delay de Seguridad
            if (i < leads.length - 1 && statusUpdate.isRunning()) {
                await scheduler.waitSafetyDelay(statusUpdate.update, statusUpdate.isRunning);
            }
        }
    }
}
