import { CampaignScheduler } from './campaign/scheduler.js';
import { CampaignProcessor } from './campaign/processor.js';
import { CampaignExecutor } from './campaign/executor.js';
import * as db from '../../../services/database/index.js';

/**
 * Orquestador de Campañas de WhatsApp
 * Responsabilidad: Coordinar el flujo de envíos masivos delegando en subcomponentes especializados.
 */
class WhatsAppCampaign {
    constructor() {
        this.mainWindow = null;
        this.isStopping = false;
        this.isRunning = false;
        
        // Sub-gestores modularizados
        this.scheduler = null;
        this.processor = null;
        this.executor = null;
    }

    /**
     * Inicializa los componentes de la campaña.
     */
    init(mainWindow) {
        this.mainWindow = mainWindow;
        this.scheduler = new CampaignScheduler(mainWindow);
        this.processor = new CampaignProcessor(mainWindow);
        this.executor = new CampaignExecutor(mainWindow);
    }

    /**
     * Obtiene el estado actual legible de la campaña.
     */
    getStatus() {
        return this.isRunning ? 'EJECUTANDO' : 'INACTIVO';
    }

    /**
     * Consulta si hay una campaña pendiente.
     */
    async checkPersistence() {
        return await db.getPersistence('campaign_active');
    }

    /**
     * Inicia el proceso de envío masivo.
     */
    async start(params, startIndex = 0) {
        if (this.isRunning) {
            return this.log('❌ Ya hay una campaña en curso.', 'error');
        }
        
        try {
            this.isRunning = true;
            this.isStopping = false;
            this.sendStatus('EJECUTANDO');
            
            // Ajustar leads si estamos reanudando
            const runParams = { ...params };
            if (startIndex > 0) {
                runParams.leads = params.leads.slice(startIndex);
                this.log(`🔄 Reanudando campaña desde el contacto ${startIndex + 1}...`, 'info');
            }

            // Delegar la ejecución al motor especializado
            const wasInterrupted = await this.executor.execute(
                runParams, 
                this.scheduler, 
                this.processor, 
                {
                    isStopping: () => this.isStopping,
                    sendStatus: (s) => this.sendStatus(s)
                }
            );

            if (wasInterrupted) {
                this.log('🛑 Campaña interrumpida. El progreso se ha guardado.', 'warning');
            } else {
                this.log('🎊 Campaña completada con éxito.', 'success');
                // Solo limpiamos si terminó sin interrupciones
                if (!this.isStopping) {
                    await db.clearPersistence('campaign_active');
                }
            }

        } catch (fatalError) {
            this.log(`❌ Error crítico en campaña: ${fatalError.message}`, 'error');
        } finally {
            this.isRunning = false;
            this.isStopping = false;
            this.sendStatus('INACTIVO');
        }
    }

    /**
     * Envía una señal de parada para interrumpir el bucle actual.
     */
    stop() {
        if (this.isRunning) {
            this.isStopping = true;
            this.log('⏳ Solicitud de parada enviada. Esperando a que termine el mensaje actual...', 'warning');
        }
    }

    /**
     * Envía un log al Renderer para visualización en consola.
     */
    log(text, type) {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('wa:log', { text, type });
        }
    }

    /**
     * Actualiza el estado visual de la campaña en la interfaz.
     */
    sendStatus(status) {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('wa:campaign-status', status);
        }
    }
}

export const waCampaign = new WhatsAppCampaign();
