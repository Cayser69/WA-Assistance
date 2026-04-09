import { TemplateLoader } from '../../../../core/loader.js';
import { WhatsAppBubble } from '../../../layout/wa-bubble/index.js';

/**
 * Sub-componente Modular: Redacción de Mensaje y Lanzamiento 🚀✨📱
 */
export const MensajeTab = {
    /**
     * Carga el fragmento HTML dinámicamente. 🧱
     */
    render: async () => {
        return await TemplateLoader.loadHTML('campanas/tabs/mensaje');
    },

    /**
     * Inicialización de la lógica y eventos. 🧠
     */
    init: async (appState, { refreshTemplates }) => {
        // Cargar estilos de la pestaña
        await TemplateLoader.loadCSS('campanas/tabs/mensaje');

        // Referencias al DOM
        const btnIniciar = document.getElementById('btn-iniciar-campana');
        const btnDetener = document.getElementById('btn-detener-campana');
        const textareaMessage = document.getElementById('campana-mensaje');
        const selectTemplates = document.getElementById('select-templates');
        const checkAIVariation = document.getElementById('check-ai-variation');
        const previewRoot = document.getElementById('wa-preview-root');
        const inputImagePath = document.getElementById('campana-image-path');
        const countLabel = document.getElementById('mensaje-selected-count');

        // Inicializar componente de burbuja de WhatsApp
        await WhatsAppBubble.init();

        /**
         * Actualiza el indicador visual de contactos seleccionados 📊
         */
        const updateLeadsCount = () => {
            const count = (appState.selectedLeads || []).length;
            if (countLabel) {
                countLabel.textContent = count > 0 
                    ? `${count} contactos seleccionados` 
                    : 'Enviar a TODOS los pendientes';
                
                const bar = document.getElementById('mensaje-selected-count-bar');
                if (bar) {
                    bar.style.borderColor = count > 0 ? 'rgba(34, 197, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)';
                    bar.style.background = count > 0 ? 'rgba(34, 197, 94, 0.05)' : 'rgba(245, 158, 11, 0.05)';
                    
                    // Añadir un pequeño efecto de brillo si hay selección 💎
                    if (count > 0) {
                        bar.style.boxShadow = '0 0 15px rgba(34, 197, 94, 0.1)';
                    } else {
                        bar.style.boxShadow = 'none';
                    }
                }
            }
        };

        /**
         * Actualiza la burbuja de previsualización 💬
         */
        const updatePreview = () => {
            if (previewRoot && textareaMessage) {
                const text = textareaMessage.value;
                const path = inputImagePath.value;
                
                if (!text && !path) {
                    previewRoot.innerHTML = `
                        <div class="loading-placeholder">
                            Selecciona una plantilla para ver el resultado final...
                        </div>`;
                    return;
                }

                previewRoot.innerHTML = WhatsAppBubble.render(text, path);
            }
        };

        // 1. Cargar configuración persistente
        const settings = await window.api.getAllSettings();
        
        // 2. Sincronizar estado inicial de los botones según la campaña activa
        const currentStatus = appState.campaignStatus;
        if (currentStatus === 'EJECUTANDO' || (currentStatus && currentStatus.includes('PAUSADO'))) {
            if (btnIniciar) btnIniciar.style.display = 'none';
            if (btnDetener) btnDetener.style.display = 'flex';
        }

        if (textareaMessage && settings.last_campaign_message) {
            textareaMessage.value = settings.last_campaign_message;
        }

        if (checkAIVariation) {
            checkAIVariation.checked = settings.use_ai_variation === 'true';
        }

        // 3. Cargar plantillas y datos iniciales
        await refreshTemplates();
        updatePreview();
        updateLeadsCount();

        // --- Eventos de Usuario ---

        if (selectTemplates) {
            selectTemplates.onchange = (e) => {
                const opt = e.target.options[e.target.selectedIndex];
                if (opt.value) {
                    textareaMessage.value = decodeURIComponent(opt.dataset.content);
                    inputImagePath.value = opt.dataset.image || '';
                    updatePreview();
                }
            };
        }

        // Iniciar Envío 🚀
        if (btnIniciar) {
            btnIniciar.onclick = async () => {
                const mensaje = textareaMessage.value.trim();
                if (!mensaje) {
                    alert('Por favor, selecciona una plantilla primero.');
                    return;
                }

                const selectedLeads = appState.selectedLeads || [];
                if (selectedLeads.length === 0) {
                    const confirmAll = confirm('No hay contactos seleccionados en "Audiencia". ¿Quieres enviar a TODOS los pendientes de la base de datos?');
                    if (!confirmAll) return;
                }

                const useAI = checkAIVariation ? checkAIVariation.checked : false;
                const imagePath = inputImagePath.value;

                // Guardar preferencias
                await window.api.saveSetting('last_campaign_message', mensaje);
                await window.api.saveSetting('use_ai_variation', useAI ? 'true' : 'false');

                // Arrancar campaña en el proceso Main
                const res = await window.api.startCampaign({
                    mensaje,
                    useAI,
                    imagePath,
                    delayMin: 15,
                    delayMax: 60,
                    leads: selectedLeads
                });

                if (res.success) {
                    btnIniciar.style.display = 'none';
                    btnDetener.style.display = 'flex';
                    alert('Campaña iniciada. Sigue el progreso en la consola superior.');
                } else {
                    alert('Error: ' + res.error);
                }
            };
        }

        // Detener Envío 🛑
        if (btnDetener) {
            btnDetener.onclick = async () => {
                if (confirm('¿Detener el envío masivo ahora?')) {
                    await window.api.stopCampaign();
                }
            };
        }
    }
};
