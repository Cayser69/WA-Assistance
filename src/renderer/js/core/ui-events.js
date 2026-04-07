/**
 * Inicialización de Eventos de la UI y Listeners de WhatsApp
 */
import { AppState } from './state.js';
import { Router } from './router.js';

export const UIEvents = {
    /**
     * Registra todos los eventos de la UI global (resize, colapsos, etc.)
     */
    initGlobal: () => {
        // Toggle grupos sidebar
        window.ui = {
            toggleNavGroup: (groupId) => {
                const group = document.getElementById(groupId);
                if (group) {
                    const header = group.previousElementSibling;
                    group.classList.toggle('expanded');
                    if (header) header.classList.toggle('expanded-header');
                }
            }
        };

        // Router global
        window.router = Router;
    },

    /**
     * Registra los listeners que vienen desde el Proceso Principal (IPC)
     */
    initIPC: () => {
        window.api.onQRUpdate((qr) => {
            AppState.qrBase64 = qr;
            if (AppState.waStatus === 'disconnect') {
                AppState.pushLog({ text: 'Nuevo código QR generado.', type: 'info' });
            }
            // Refrescar si estamos en Conexiones sin reconstruir el DOM (Lag Fix)
            if (AppState.currentView === 'conexiones') {
                const qrContainer = document.getElementById('qr-container');
                if (qrContainer && AppState.waStatus === 'disconnect') {
                    const img = qrContainer.querySelector('img.qr-image');
                    if (img) img.src = qr;
                    else qrContainer.innerHTML = `<img src="${qr}" alt="QR" class="qr-image animate-fade-in">`;
                }
            }
        });

        window.api.onWAStatus((status) => {
            AppState.updateWAStatusUI(status);
            if (AppState.currentView === 'conexiones') {
                Router.navigate('conexiones'); 
            }
        });

        window.api.onScannerUpdate((status) => {
            // Actualización global (Sidebar)
            AppState.updateScannerStatusUI(status);
        });

        window.api.onAIStatus((status) => {
            // Actualización global (Hub)
            AppState.updateAIStatusUI(status.enabled);
        });

        window.api.onCampaignStatus((status) => {
            // Actualización global (Sidebar)
            AppState.updateCampaignStatusUI(status);

            const banner = document.getElementById('global-pause-banner');
            const btnIniciar = document.getElementById('btn-iniciar-campana');
            const btnDetener = document.getElementById('btn-detener-campana');

            if (banner) {
                banner.style.display = status.includes('PAUSADO') ? 'flex' : 'none';
            }

            // Control de botones de acción
            if (btnIniciar && btnDetener) {
                if (status === 'EJECUTANDO' || status.includes('PAUSADO')) {
                    btnIniciar.style.display = 'none';
                    btnDetener.style.display = 'flex';
                } else {
                    btnIniciar.style.display = 'flex';
                    btnDetener.style.display = 'none';
                }
            }
        });

        window.api.onMessageLog((log) => {
            AppState.pushLog(log);
        });
    }
};
