/**
 * Sub-Componente de Scanner: Lanzar Escaneo (Configuración)
 */
export const ConfigTab = {
    render: () => `
        <div class="card glass-card">
            <h3><span class="material-icons-outlined">settings</span> Configuración de Escaneo</h3>
            
            <!-- BANNER DE PERSISTENCIA ✨ -->
            <div id="scanner-persistence-banner" class="status-row animate-fade-in" style="display: none; background: rgba(30, 64, 175, 0.1); border: 1px solid rgba(30, 64, 175, 0.2); margin-top: 15px;">
                <span class="material-icons-outlined" style="color: #60a5fa">history</span>
                <div style="flex: 1; font-size: 0.8rem;">
                    <strong>Tarea Pendiente Detectada</strong><br>
                    Último número procesado: <span id="persist-last-number" style="font-weight: 700;">---</span>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button id="btn-discard-scanner" class="btn btn-icon" title="Descartar y empezar de cero">
                        <span class="material-icons-outlined" style="color: #ef4444; font-size: 1.1rem;">delete_sweep</span>
                    </button>
                    <button id="btn-resume-scanner" class="btn btn-primary" style="padding: 6px 12px; font-size: 0.75rem;">
                        <span class="material-icons-outlined" style="font-size: 1rem;">play_arrow</span> REANUDAR
                    </button>
                </div>
            </div>
            
            <div class="scanner-input-group">
                <label>Número Inicial (Prefijo + Número)</label>
                <div class="scanner-input-row">
                    <input type="text" id="scan-country-code" placeholder="p.ej. 34" value="34" style="width: 80px;">
                    <input type="number" id="scan-base-number" placeholder="600123456" style="flex: 1;">
                </div>
            </div>

            <div class="scanner-input-group">
                <label>Número Final (Tope del Rango)</label>
                <input type="number" id="scan-end-number" placeholder="600123999">
                <p class="text-muted" style="font-size: 0.7rem; margin-top: 5px;">
                    El sistema calculará automáticamente la cantidad de números a escanear entre el inicio y el fin.
                </p>
            </div>

            <div class="scanner-footer" style="margin-top: 25px;">
                <button id="btn-start-scanner" class="btn btn-primary" style="flex: 1;">
                    <span class="material-icons-outlined">play_arrow</span> INICIAR ESCANEO SEGURO
                </button>
            </div>
            <p class="text-muted" style="font-size: 0.75rem; text-align: center; margin-top: 15px;">
                <span class="material-icons-outlined" style="font-size: 1rem; vertical-align: middle;">security</span> 
                Tiempos de seguridad y horario comercial (09:00 - 19:00) activados por defecto.
            </p>
        </div>
    `,

    init: async (appState) => {
        const btnStart = document.getElementById('btn-start-scanner');
        const persistenceBanner = document.getElementById('scanner-persistence-banner');
        
        if (!btnStart) return;

        // --- Chequeo de Persistencia ---
        const savedTask = await window.api.checkPersistence('scanner_active');
        if (savedTask && persistenceBanner) {
            persistenceBanner.style.display = 'block';
            const lastNum = document.getElementById('persist-last-number');
            if (lastNum) lastNum.textContent = savedTask.lastPhone || `(Index ${savedTask.currentIndex})`;

            document.getElementById('btn-resume-scanner').onclick = async () => {
                if (appState.waStatus !== 'connect') return alert('Debes conectar WhatsApp primero.');
                
                // Iniciar con el startIndex guardado
                await window.api.startScanner(savedTask.config, savedTask.currentIndex);
                alert('Escaneo reanudado con éxito.');
                persistenceBanner.style.display = 'none';
            };

            document.getElementById('btn-discard-scanner').onclick = async () => {
                if (confirm('¿Seguro que quieres descartar esta tarea guardada?')) {
                    await window.api.clearPersistence('scanner_active');
                    persistenceBanner.style.display = 'none';
                }
            };
        }

        btnStart.onclick = async () => {
            if (appState.waStatus !== 'connect') {
                return alert('Debes conectar WhatsApp primero.');
            }

            const countryCode = document.getElementById('scan-country-code').value;
            const baseNumber = document.getElementById('scan-base-number').value;
            const endNumber = document.getElementById('scan-end-number').value;

            if (!baseNumber || !endNumber) {
                return alert('Por favor, indica tanto el número inicial como el número final del rango.');
            }

            // Calcular el rango usando BigInt para evitar problemas con números grandes
            const startBig = BigInt(baseNumber);
            const endBig = BigInt(endNumber);
            const diff = endBig - startBig;

            if (diff < 0n) {
                return alert('El número final debe ser igual o mayor al número inicial.');
            }

            // El rango incluye ambos extremos
            const range = Number(diff) + 1;

            if (range > 1000) {
                const proceed = confirm(`Vas a escanear ${range} números. Esto puede tardar bastante debido a los tiempos de seguridad. ¿Continuar?`);
                if (!proceed) return;
            }

            const data = {
                countryCode,
                baseNumber,
                range
            };

            await window.api.startScanner(data);
            alert('Escaneo seguro iniciado. Revisa la pestaña de Progreso.');
        };
    }
};
