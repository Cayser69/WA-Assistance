import { TemplateLoader } from '../../../../../core/loader.js';

/**
 * Sub-Componente de Scanner: Progreso en Vivo
 */
export const ProgresoTab = {
    render: async () => {
        return await TemplateLoader.loadHTML('scanner/tabs/progreso');
    },

    init: async (appState) => {
        const btnStop = document.getElementById('btn-stop-scanner');
        const currentInfo = document.getElementById('scan-current-info');
        const idleMsg = document.getElementById('scanner-idle-msg');

        const updateUI = (status) => {
            if (!status) return;

            const titleIcon = status.isRepairing ? 'auto_fix_high' : 'analytics';
            const titleText = status.isRepairing ? 'Reparación de Contactos' : 'Progreso en Tiempo Real';
            
            const titleH3 = document.querySelector('.scanner-status h3');
            if (titleH3) titleH3.innerHTML = `<span class="material-icons-outlined">${titleIcon}</span> ${titleText}`;

            if (status.isRunning || status.checked > 0) {
                if (idleMsg) idleMsg.style.display = 'none';
                if (currentInfo) currentInfo.style.display = 'block';
                
                const currentLabel = document.getElementById('scan-current-label');
                if (currentLabel) currentLabel.textContent = status.isRepairing ? 'REPARANDO AHORA:' : 'VALIDANDO AHORA:';
                
                const totalEl = document.getElementById('stat-total');
                const checkedEl = document.getElementById('stat-checked');
                const validEl = document.getElementById('stat-valid');
                const progressBar = document.getElementById('scan-progress-bar');
                const currentNumberEl = document.getElementById('scan-current-number');

                if (totalEl) totalEl.textContent = status.total;
                if (checkedEl) checkedEl.textContent = status.checked;
                if (validEl) validEl.textContent = status.valid;

                if (progressBar) {
                    const percent = (status.checked / (status.total || 1)) * 100;
                    progressBar.style.width = `${percent}%`;
                }
                
                if (currentNumberEl) currentNumberEl.textContent = status.currentNumber || '---';
                
                if (btnStop) {
                    btnStop.style.display = status.isRunning ? 'flex' : 'none';
                }

                const nextTimerEl = document.getElementById('scan-next-timer');
                if (nextTimerEl) {
                    if (status.nextCheck) {
                        const next = new Date(status.nextCheck);
                        nextTimerEl.textContent = `Próximo chequeo aprox: ${next.toLocaleTimeString()}`;
                    } else {
                        nextTimerEl.textContent = '';
                    }
                }
            } else {
                if (idleMsg) idleMsg.style.display = 'block';
                if (currentInfo) currentInfo.style.display = 'none';
                if (btnStop) btnStop.style.display = 'none';
            }
        };

        // Escuchar actualizaciones dinámicas
        window.api.onScannerUpdate((status) => {
            updateUI(status);
        });

        // Cargar estado inicial al entrar en la pestaña
        const initialStatus = await window.api.getScannerStatus();
        updateUI(initialStatus);

        if (btnStop) {
            btnStop.onclick = async () => {
                if (confirm('¿Seguro que quieres detener el escaneo?')) {
                    await window.api.stopScanner();
                }
            };
        }
    }
};
