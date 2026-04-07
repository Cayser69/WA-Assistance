/**
 * Sub-Componente de Scanner: Progreso en Vivo
 */
export const ProgresoTab = {
    render: () => `
        <div class="scanner-status">
            <div class="card glass-card">
                <h3><span class="material-icons-outlined">analytics</span> Progreso en Tiempo Real</h3>
                
                <div class="stats-grid">
                    <div class="stat-box">
                        <span class="stat-value" id="stat-total">0</span>
                        <span class="stat-label">Total</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value" id="stat-checked">0</span>
                        <span class="stat-label">Revisados</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value" id="stat-valid" style="color: var(--primary)">0</span>
                        <span class="stat-label">Válidos</span>
                    </div>
                </div>

                <div class="progress-container">
                    <div id="scan-progress-bar" class="progress-bar"></div>
                </div>

                <div class="current-status-box" id="scan-current-info" style="display: none;">
                    <strong id="scan-current-label">VALIDANDO AHORA:</strong>
                    <span id="scan-current-number">---</span>
                    <div id="scan-next-timer" style="font-size: 0.7rem; color: var(--text-muted); margin-top: 5px;"></div>
                </div>

                <div id="scanner-idle-msg" style="text-align: center; margin-top: 40px; color: var(--text-muted);">
                    <span class="material-icons-outlined" style="font-size: 3rem; opacity: 0.2;">search</span>
                    <p>No hay un escaneo activo en este momento.</p>
                </div>

                <div class="scanner-footer" style="margin-top: 30px;">
                    <button id="btn-stop-scanner" class="btn btn-danger btn-stop" style="display: none; width: 100%;">
                        <span class="material-icons-outlined">stop</span> DETENER ESCANEO ACTUAL
                    </button>
                </div>
            </div>
        </div>
    `,

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

        // Escuchar actualizaciones
        window.api.onScannerUpdate((status) => {
            updateUI(status);
        });

        // Cargar estado inicial
        const initialStatus = await window.api.getScannerStatus();
        updateUI(initialStatus);

        if (btnStop) {
            btnStop.onclick = async () => {
                const confirmed = confirm('¿Seguro que quieres detener el escaneo?');
                if (confirmed) {
                    await window.api.stopScanner();
                }
            };
        }
    }
};
