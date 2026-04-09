/**
 * Gestión del Estado Global de la Aplicación
 */
export const AppState = {
    currentView: 'dashboard',
    waStatus: 'disconnect',
    campaignStatus: 'INACTIVO',
    waNumber: null,
    qrBase64: null,
    logs: [],
    selectedLeads: [],

    /**
     * Añade un log al sistema y actualiza el DOM de la consola si existe.
     */
    pushLog: (log) => {
        const time = new Date().toLocaleTimeString();
        const fullLog = { ...log, time };
        AppState.logs.push(fullLog);
        
        // Delegar la visualización a la consola modular
        const ConsoleComponent = window.ConsoleComponent;
        if (ConsoleComponent) ConsoleComponent.appendLog(fullLog);
    },

    /**
     * Limpia el registro local de memoria para evitar saturación de la UI
     */
    clearLogs: () => {
        AppState.logs = [];
    },

    /**
     * Formatea un número de teléfono para legibilidad (ej: +34 664 33 69 39)
     */
    formatPhoneNumber: (num) => {
        if (!num) return '';
        // Caso específico España (34)
        if (num.startsWith('34') && num.length === 11) {
            return `+34 ${num.substring(2, 5)} ${num.substring(5, 7)} ${num.substring(7, 9)} ${num.substring(9, 11)}`;
        }
        // Genérico para otros prefijos
        return `+${num.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1 $2 $3 $4')}`;
    },

    /**
     * Actualiza el estado de WhatsApp en el Hub Global y la Sidebar.
     */
    updateWAStatusUI: (data) => {
        const status = typeof data === 'object' ? data.status : data;
        const number = typeof data === 'object' ? data.number : null;
        
        AppState.waStatus = status;
        if (number) AppState.waNumber = number;
        
        const statusMap = {
            'connect': { text: 'Conectado', color: 'connect' },
            'authenticated': { text: 'Sincronizando...', color: 'authenticated' },
            'disconnect': { text: 'Desconectado', color: 'disconnect' },
            'error': { text: 'Reintentar/Reiniciar', color: 'disconnect' }
        };
        const current = statusMap[status] || { text: status, color: status };

        // 1. Actualizar Sidebar Footer
        const elNumber = document.getElementById('sidebar-wa-number');
        if (elNumber) {
            elNumber.textContent = status === 'error' ? 'Error Crítico' : (number ? AppState.formatPhoneNumber(number) : 'No conectado');
        }
        
        const elStatus = document.getElementById('sidebar-wa-status');
        if (elStatus) {
            elStatus.textContent = current.text;
            elStatus.className = `wa-status-label ${current.color}`;
        }

        // 2. Delegar al componente Hub (Nav superior)
        if (window.Hub) window.Hub.updateWhatsApp(current);

        // 3. Control dinámico de botones de acción dependientes de conexión
        const btnSync = document.getElementById('btn-sync-contacts');
        if (btnSync) {
            if (status === 'connect') {
                btnSync.disabled = false;
                btnSync.style.opacity = '1';
                btnSync.style.cursor = 'pointer';
                btnSync.title = 'Sincronizar contactos ahora';
            } else {
                btnSync.disabled = true;
                btnSync.style.opacity = '0.5';
                btnSync.style.cursor = 'not-allowed';
                btnSync.title = 'Debes estar conectado a WhatsApp para sincronizar';
            }
        }
    },

    /**
     * Actualiza el estado de Campaña en el Hub Global.
     */
    updateCampaignStatusUI: (status) => {
        AppState.campaignStatus = status;
        const isActive = status !== 'INACTIVO' && status;

        // Delegar al componente Hub
        if (window.Hub) window.Hub.updateCampaign(status, isActive);
    },

    /**
     * Actualiza el estado del Scanner en el Hub Global.
     */
    updateScannerStatusUI: (status) => {
        const isRunning = status && !status.paused && (status.checked < status.total || status.total > 0);
        const isPaused = status && status.paused;
        const isActive = isRunning || isPaused;

        // Delegar al componente Hub
        if (window.Hub) window.Hub.updateScanner(isActive, isPaused);
    },

    /**
     * Actualiza el estado de la IA en el Hub Global.
     */
    updateAIStatusUI: (enabled) => {
        // Delegar al componente Hub
        if (window.Hub) window.Hub.updateAI(enabled);
    }
};
