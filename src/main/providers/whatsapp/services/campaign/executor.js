import { waClient } from '../../core/client.js';
import * as db from '../../../../services/database/index.js';

/**
 * Gestor de Ejecución de Campañas de WhatsApp
 * Responsabilidad: Bucle de envío, interacción directa con el cliente de WhatsApp y registro en base de datos.
 */
export class CampaignExecutor {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
    }

    /**
     * Bucle principal de envío masivo.
     */
    async execute(params, scheduler, processor, statusCallback) {
        const { leads, mensaje, delayMin, delayMax, imagePath, useAI, ignoreHours = false } = params;
        
        // 1. Preparar recursos iniciales (Imagen)
        const media = await processor.prepareMedia(imagePath, this.log.bind(this));
        
        let sentCount = 0;
        
        for (const lead of leads) {
            // Verificar si el usuario detuvo la campaña
            if (statusCallback.isStopping()) break;

            try {
                // 2. Controladores de Horario Comercial (09:00 - 19:00)
                const interrupted = await scheduler.checkWorkingHours(
                    ignoreHours, 
                    statusCallback.isStopping,
                    this.log.bind(this),
                    statusCallback.sendStatus
                );
                if (interrupted || statusCallback.isStopping()) break;

                // 3. Procesar Contenido (IA)
                this.log(`Preparando envío a ${lead.telefono}...`, 'info');
                const finalMessage = await processor.getAIVariant(mensaje, useAI);

                // 4. ENVÍO REAL
                if (media) {
                    await waClient.client.sendMessage(`${lead.telefono}@c.us`, media, { caption: finalMessage });
                } else {
                    await waClient.sendMessage(lead.telefono, finalMessage);
                }

                // 5. Registro y Logs
                await db.saveMessageLog(lead.telefono, mensaje, 'enviado');
                await db.markLeadAsContacted(lead.id);
                this.log(`✅ Enviado a ${lead.telefono}`, 'success');
                
                // 5.2 Calcular y Emitir Progreso 📊
                const total = leads.length;
                const current = sentCount + 1;
                const percent = Math.round((current / total) * 100);
                if (this.mainWindow) {
                    this.mainWindow.webContents.send('wa:campaign-progress', {
                        percent,
                        current,
                        total,
                        phone: lead.telefono
                    });
                }

                // 5.5 Persistir progreso en tiempo real
                await db.savePersistence('campaign_active', {
                    params,
                    currentIndex: sentCount
                });

                sentCount++;

                // 6. Gestionar siguiente Delay o Pausa por Lotes (solo si hay más leads)
                const isLast = leads.indexOf(lead) === leads.length - 1;
                if (!isLast) {
                    const delayInterrupted = await scheduler.handleNextDelay(
                        sentCount, delayMin, delayMax, 
                        statusCallback.isStopping, 
                        this.log.bind(this)
                    );
                    if (delayInterrupted || statusCallback.isStopping()) break;
                }

            } catch (error) {
                this.log(`❌ Error con ${lead.telefono}: ${error.message}`, 'error');
            }
        }

        return statusCallback.isStopping();
    }

    log(text, type) {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('wa:log', { text, type });
        }
    }
}
