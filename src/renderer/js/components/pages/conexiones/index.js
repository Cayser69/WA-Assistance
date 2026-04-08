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
                    const formattedNumber = appState.waNumber ? appState.formatPhoneNumber(appState.waNumber) : 'Dispositivo Vinculado';
                    qrContainer.innerHTML = `
                        <div class="success-message">
                            <span class="material-icons-outlined animate-pulse" style="font-size: 3rem; color: var(--neon-success);">verified</span>
                            <div style="margin-top: 15px;">
                                <p style="font-weight: 600; font-size: 1.1rem;">${appState.waStatus === 'connect' ? 'Conexión Activa' : 'Sincronizando...'}</p>
                                <p class="text-muted" style="font-size: 0.9rem; margin-top: 5px;">${formattedNumber}</p>
                            </div>
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

            // Ejecución inicial y actualización visual 🔄
            syncUI();

            // 5. Lógica de Sincronización de Contactos 👥
            const btnSync = document.getElementById('btn-sync-contacts');
            const syncStatusMsg = document.getElementById('sync-status-msg');

            if (btnSync) {
                btnSync.onclick = async () => {
                    const status = await window.api.invoke('wa:get-status');
                    if (status !== 'connect') {
                        return alert('WhatsApp debe estar conectado para sincronizar la agenda.');
                    }

                    btnSync.disabled = true;
                    btnSync.innerHTML = '<span class="material-icons-outlined animate-spin">sync</span> SINCRONIZANDO...';
                    
                    try {
                        const result = await window.api.invoke('wa:sync-contacts');
                        if (result.success) {
                            syncStatusMsg.style.display = 'block';
                            syncStatusMsg.innerHTML = `
                                <div style="color: var(--primary); font-weight: 600;">
                                    ¡Éxito! Se han importado ${result.imported} nuevos leads.
                                </div>
                                <div class="text-muted" style="margin-top: 5px;">
                                    Total contactos procesados: ${result.total}
                                </div>
                            `;
                            appState.pushLog({ text: `Sincronización completa: ${result.imported} nuevos leads añadidos.`, type: 'success' });
                        } else {
                            alert('Error: ' + result.error);
                        }
                    } catch (e) {
                        console.error('Error al sincronizar:', e);
                    } finally {
                        btnSync.disabled = false;
                        btnSync.innerHTML = '<span class="material-icons-outlined">group_add</span> SINCRONIZAR MIS CONTACTOS';
                    }
                };
            }

            console.log('[Conexiones] ✅ Portal operacional.');
        } catch (err) {
            console.error('[Conexiones] ❌ Fallo en inicialización modular:', err);
        }
    }
};
