import { ScannerScheduler } from './scanner/scheduler.js';
import { ScannerLogic } from './scanner/logic.js';
import { ScannerExecutor } from './scanner/executor.js';
import * as db from '../../services/database/index.js';

/**
 * Orquestador del Scanner de WhatsApp
 * Responsabilidad: Coordinar el escaneo por rango y la reparación de leads delegando en subcomponentes especializados.
 */
class WhatsAppScanner {
    constructor() {
        this.isRunning = false;
        this.status = this.getInitialStatus();
        this.mainWindow = null;
        
        // Sub-gestores modularizados
        this.scheduler = null;
        this.logic = null;
        this.executor = null;
    }

    /**
     * Define el estado inicial limpio del scanner.
     */
    getInitialStatus() {
        return {
            total: 0,
            checked: 0,
            valid: 0,
            currentNumber: '',
            startTime: null,
            nextCheck: null,
            paused: false,
            isRepairing: false
        };
    }

    /**
     * Inicializa los componentes del scanner.
     */
    init(mainWindow) {
        this.mainWindow = mainWindow;
        this.scheduler = new ScannerScheduler(mainWindow);
        this.logic = new ScannerLogic(mainWindow);
        this.executor = new ScannerExecutor(mainWindow);
    }

    /**
     * Consulta si existe una tarea de escaneo pendiente en la base de datos.
     */
    async checkPersistence() {
        return await db.getPersistence('scanner_active');
    }

    /**
     * Inicia un escaneo masivo por rango de números.
     */
    async start(config, startIndex = 0) {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.status = { 
            ...this.getInitialStatus(), 
            total: config.range, 
            checked: startIndex,
            startTime: new Date() 
        };

        this.broadcastStatus();
        this.log(`Scanner: Iniciado para ${config.range} números...`, 'info');

        // Modificamos config para el reintento
        const runConfig = { ...config };
        if (startIndex > 0) {
            const startBigInt = BigInt(config.baseNumber) + BigInt(startIndex);
            runConfig.baseNumber = startBigInt.toString();
            runConfig.range = config.range - startIndex;
        }

        try {
            // Ejecución delegada al motor especializado
            await this.executor.execute(
                runConfig, this.scheduler, this.logic,
                {
                    isRunning: () => this.isRunning,
                    update: (data) => this.updateStatus(data),
                    updateValid: () => { 
                        this.status.valid++; 
                        this.broadcastStatus(); 
                    }
                }
            );

            // Solo si termina por completado real (no interrumpido)
            if (!this.isRunning && !this.isStopping) {
                await db.clearPersistence('scanner_active');
            }

        } catch (fatalError) {
            this.log(`❌ Error crítico en scanner: ${fatalError.message}`, 'error');
        } finally {
            this.isRunning = false;
            this.sendStatus('INACTIVO');
        }
    }

    /**
     * Inicia el proceso de reparación para leads capturados sin nombre.
     */
    async startRepair() {
        if (this.isRunning) return;

        const leads = await db.getLeadsWithoutName();
        if (!leads.length) {
            return this.log('Scanner: No hay números con nombre desconocido para reparar.', 'warning');
        }

        this.isRunning = true;
        this.status = { 
            ...this.getInitialStatus(), 
            total: leads.length, 
            isRepairing: true, 
            startTime: new Date() 
        };

        this.broadcastStatus();
        this.log(`Scanner: Iniciando motor de reparación para ${leads.length} leads...`, 'info');

        // Ejecución delegada al motor de reparación
        await this.executor.repair(
            leads, this.scheduler, this.logic,
            {
                isRunning: () => this.isRunning,
                update: (data) => this.updateStatus(data),
                updateValid: () => { 
                    this.status.valid++; 
                    this.broadcastStatus(); 
                }
            }
        );

        this.stop();
        this.log('Scanner: Proceso de reparación completado.', 'success');
    }

    /**
     * Detiene cualquier proceso del scanner en curso.
     */
    stop() {
        this.isRunning = false;
        this.status.paused = false;
        this.status.nextCheck = null;
        this.broadcastStatus();
    }

    /**
     * Actualiza el estado interno y lo sincroniza con la UI.
     */
    updateStatus(data) {
        this.status = { ...this.status, ...data };
        this.broadcastStatus();
    }

    /**
     * Envía el estado actual al Renderer.
     */
    broadcastStatus() {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('scanner:status', this.status);
        }
    }

    /**
     * Envía un mensaje a la consola de la interfaz.
     */
    log(text, type) {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('wa:log', { text, type });
        }
    }

    /**
     * Consulta el estado actual.
     */
    getStatus() {
        return this.status;
    }
}

export const waScanner = new WhatsAppScanner();
