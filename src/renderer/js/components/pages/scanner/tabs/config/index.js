import { TemplateLoader } from '../../../../../core/loader.js';
import { Toast } from '../../../../shared/toast.js';

/**
 * Sub-Componente de Scanner: Lanzar Escaneo (Configuración)
 */
export const ConfigTab = {
    render: async () => {
        return await TemplateLoader.loadHTML('scanner/tabs/config');
    },

    init: async (appState) => {
        const btnStart = document.getElementById('btn-start-scanner');
        const btnStop = document.getElementById('btn-stop-scanner');
        
        if (!btnStart || !btnStop) return;

        // --- Sincronización Inicial de Botones ---
        if (appState.scannerStatus === 'RUNNING' || appState.scannerStatus === 'PAUSED') {
            btnStart.style.display = 'none';
            btnStop.style.display = 'flex';
        } else {
            btnStart.style.display = 'flex';
            btnStop.style.display = 'none';
        }

        // --- Eventos de Usuario ---

        btnStart.onclick = async () => {
            if (appState.waStatus !== 'connect') {
                return Toast.error('Debes conectar WhatsApp primero.');
            }

            const countryCode = document.getElementById('scan-country-code').value;
            const baseNumber = document.getElementById('scan-base-number').value;
            const endNumber = document.getElementById('scan-end-number').value;

            if (!baseNumber || !endNumber) {
                return Toast.info('Por favor, indica tanto el número inicial como el número final del rango.');
            }

            const startBig = BigInt(baseNumber);
            const endBig = BigInt(endNumber);
            const diff = endBig - startBig;

            if (diff < 0n) {
                return Toast.error('El número final debe ser igual o mayor al número inicial.');
            }

            const range = Number(diff) + 1;

            if (range > 1000) {
                const proceed = confirm(`Vas a escanear ${range} números. Esto puede tardar bastante debido a los tiempos de seguridad. ¿Continuar?`);
                if (!proceed) return;
            }

            const data = { countryCode, baseNumber, range };
            await window.api.startScanner(data);
        };

        btnStop.onclick = async () => {
            if (confirm('¿Detener el escaneo de números ahora?')) {
                await window.api.stopScanner();
            }
        };
    }
};
