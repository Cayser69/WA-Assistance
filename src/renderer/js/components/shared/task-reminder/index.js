import { TemplateLoader } from '../../../core/loader.js';

/**
 * Componente: TaskReminder - Aviso Global de Tareas Pendientes
 */
export const TaskReminder = {
    /**
     * Comprueba tareas pendientes e inyecta el aviso si existen.
     */
    init: async () => {
        const scannerTask = await window.api.checkPersistence('scanner_active');
        const campaignTask = await window.api.checkPersistence('campaign_active');

        if (scannerTask || campaignTask) {
            const taskType = scannerTask ? 'escaneo de números' : 'envío de campaña';
            const mount = document.body; // Inyectar directo al body para que sea global
            
            const div = document.createElement('div');
            div.id = 'global-task-reminder-container';
            div.innerHTML = await TemplateLoader.loadHTML('task-reminder');
            mount.appendChild(div);

            // Ajustar texto dinámico
            const label = document.getElementById('reminder-task-type');
            if (label) label.textContent = taskType;

            // Vincular Eventos
            TaskReminder.bindEvents(scannerTask ? 'scanner' : 'campanas', scannerTask || campaignTask);
        }
    },

    /**
     * Gestiona la interactividad de la tarjeta.
     */
    bindEvents: (targetView, taskData) => {
        const widget = document.getElementById('task-reminder-widget');
        const btnResume = document.getElementById('btn-reminder-resume');
        const btnDiscard = document.getElementById('btn-reminder-discard');
        const btnClose = document.getElementById('btn-reminder-close');

        const hide = () => {
            if (widget) {
                widget.style.animation = 'slide-out-bottom 0.5s ease-in forwards';
                setTimeout(() => widget.parentElement?.remove(), 500);
            }
        };

        if (btnResume) {
            btnResume.onclick = async () => {
                // Desaparecer inmediatamente para feedback instantáneo 🚀
                hide();
                
                try {
                    if (targetView === 'scanner') {
                        // Reanudación Directa de Escáner
                        const nextIndex = (taskData.currentIndex || 0) + 1;
                        await window.api.startScanner(taskData.config, nextIndex);
                    } else {
                        // Reanudación Directa de Campaña
                        const nextIndex = (taskData.currentIndex || 0) + 1;
                        await window.api.startCampaign(taskData.params, nextIndex);
                    }
                } catch (err) {
                    console.error('[TaskReminder] Error al reanudar:', err);
                    // Si falla, al menos dejamos el log, pero el widget ya se fue para no estorbar
                }
            };
        }

        if (btnDiscard) {
            btnDiscard.onclick = async () => {
                if (confirm('¿Seguro que quieres descartar esta tarea permanentemente?')) {
                    const key = targetView === 'scanner' ? 'scanner_active' : 'campaign_active';
                    await window.api.clearPersistence(key);
                    hide();
                }
            };
        }

        if (btnClose) {
            btnClose.onclick = hide;
        }
    }
};
