import { TemplateLoader } from '../../../core/loader.js';

/**
 * Componente: Conexiones - Gestión de QR y Sesión de WhatsApp 📡✨
 */
export const Conexiones = {
    /**
     * Render inicial (Esqueleto)
     */
    render: () => `
        <div id="view-conexiones-container" class="animate-fade-in">
            <!-- Cargando portal de conexión... -->
        </div>
    `,

    /**
     * Inicialización asíncrona de recursos y sincronización de estado.
     */
    init: async (appState) => {
        console.log('[Conexiones] 📡 Iniciando portal de vinculación...');

        try {
            // 1. Cargar estructura y estilos
            const html = await TemplateLoader.loadHTML('conexiones');
            await TemplateLoader.loadCSS('conexiones');

            const container = document.getElementById('view-conexiones-container');
            if (!container) return;

            // Inyectamos el HTML modular
            container.innerHTML = html;

            // 2. Referencias del DOM inyectado
            const qrContainer = document.getElementById('qr-container');
            const logoutContainer = document.getElementById('logout-container');
            const btnLogout = document.getElementById('btn-logout');
            const qrTitle = document.getElementById('qr-title');
            const qrSubtitle = document.getElementById('qr-subtitle');

            // 3. Función de actualización reactiva
            const syncUI = () => {
                if (appState.qrBase64 && appState.waStatus === 'disconnect') {
                    qrContainer.innerHTML = `<img src="${appState.qrBase64}" alt="QR" class="qr-image animate-fade-in">`;
                    logoutContainer.style.display = 'none';
                    qrTitle.textContent = 'Vincular nuevo dispositivo';
                    qrSubtitle.style.display = 'block';
                } else if (appState.waStatus === 'connect' || appState.waStatus === 'authenticated') {
                    qrContainer.innerHTML = `
                        <div class="success-message">
                            <span class="material-icons-outlined animate-pulse">verified</span>
                            <p>${appState.waStatus === 'connect' ? 'Conectado con éxito' : 'Sincronizando...'}</p>
                        </div>
                    `;
                    logoutContainer.style.display = 'block';
                    qrTitle.textContent = 'Sesión Activa';
                    qrSubtitle.style.display = 'none';
                } else {
                    qrContainer.innerHTML = `<p class="animate-pulse">Esperando señal de WhatsApp...</p>`;
                    logoutContainer.style.display = 'none';
                }
            };

            // Ejecución inicial
            syncUI();

            // 4. Lógica de Logout con confirmación de usuario
            if (btnLogout) {
                btnLogout.onclick = async () => {
                    const confirmLogout = await confirm('¿Estás seguro de que deseas desvincular este dispositivo? Se cerrará la sesión actual.');
                    if (confirmLogout) {
                        btnLogout.disabled = true;
                        btnLogout.innerHTML = '<span class="material-icons-outlined animate-spin">sync</span> CERRANDO SESIÓN...';
                        await window.api.logout();
                        console.log('[Conexiones] 🚪 Logout solicitado.');
                    }
                };
            }

            console.log('[Conexiones] ✅ Portal operacional.');
        } catch (err) {
            console.error('[Conexiones] ❌ Fallo en inicialización modular:', err);
        }
    }
};
