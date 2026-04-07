import { WhatsAppBubble } from '../../../components/wa-bubble/index.js';

/**
 * Sub-componente: Redacción de Mensaje y Lanzamiento 🚀✨📱
 */
export const MensajeTab = {
    render: () => `
        <div id="section-mensaje" class="campaign-grid animate-fade-in">
            <div class="template-console-grid">
                <!-- Columna Izquierda: Editor -->
                <div class="left-panel">
                    <div class="card glass-card">
                        <div class="template-header">
                            <h3><span class="material-icons-outlined">send</span> Redactar Campaña</h3>
                            <div class="header-actions">
                                 <select id="select-templates" class="template-select">
                                    <option value="">Cargar Plantilla...</option>
                                 </select>
                            </div>
                        </div>

                        <div class="safety-notice" style="margin-bottom: 20px; background: rgba(34, 197, 94, 0.05); border-color: rgba(34, 197, 94, 0.2);">
                            <span class="material-icons-outlined" style="color: var(--primary)">security</span>
                            <p style="font-size: 0.8rem;">Protección Extrema: **Min 1 min + aleatorio**, horario comercial (09:00-19:00) y descansos automáticos cada 50 mensajes.</p>
                        </div>
                        
                        <div class="form-group-col">
                            <div class="form-group">
                                <label>Mensaje Base</label>
                                <textarea id="campana-mensaje" placeholder="Escribe tu mensaje... Puedes usar {{nombre}}." style="min-height: 250px;"></textarea>
                                <div style="display:flex; justify-content: flex-end; gap: 8px; margin-top: 10px;">
                                    <button id="btn-save-message-template" class="btn" style="font-size: 0.75rem; padding: 6px 12px; background: rgba(255,255,255,0.08);">
                                        <span class="material-icons-outlined" style="font-size: 1rem">bookmark_add</span> GUARDAR COMO PLANTILLA
                                    </button>
                                </div>
                            </div>

                            <div class="ai-switch-row" style="margin-top: 5px;">
                                <div class="header-left">
                                    <span class="material-icons-outlined" style="color: var(--primary); font-size: 2rem;">auto_awesome</span>
                                    <div>
                                        <strong style="font-size: 1rem;">Variación Anti-Spam (IA)</strong>
                                        <div class="text-muted" style="font-size: 0.8rem">Generar versiones únicas de este mensaje por cada lead.</div>
                                    </div>
                                </div>
                                <input type="checkbox" id="check-ai-variation" style="width: 24px; height: 24px; cursor: pointer;">
                            </div>

                            <div class="delay-row" style="margin-top: 10px;">
                                <div class="input-field">
                                    <label>Retardo Mínimo (seg)</label>
                                    <input type="number" id="delay-min" value="10" min="1">
                                </div>
                                <div class="input-field">
                                    <label>Retardo Máximo (seg)</label>
                                    <input type="number" id="delay-max" value="25" min="2">
                                </div>
                            </div>

                            <button id="btn-iniciar-campana" class="btn btn-success btn-large" style="margin-top: 15px;">
                                <span class="material-icons-outlined">rocket_launch</span> INICIAR ENVÍO INTELIGENTE
                            </button>

                            <button id="btn-detener-campana" class="btn btn-stop btn-large" style="margin-top: 15px; display: none;">
                                <span class="material-icons-outlined">stop_circle</span> DETENER ENVÍO AHORA
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Columna Derecha: Previsualización Realista -->
                <div class="preview-panel">
                    <div class="card glass-card" style="padding: 15px; min-height: 500px; display: flex; flex-direction: column;">
                        <h4 style="margin-bottom: 20px; font-size: 0.95rem; text-align: center; color: var(--text-muted);">
                            <span class="material-icons-outlined" style="font-size: 1.1rem; vertical-align: middle;">visibility</span> Vista Previa del Cliente
                        </h4>
                        
                        <div class="whatsapp-preview-container" id="wa-msg-preview-root" style="flex: 1; display: flex; align-items: center; justify-content: center;">
                            <!-- Inyectado dinámicamente -->
                        </div>
                        
                        <div style="margin-top: 20px; padding: 15px; background: rgba(34, 197, 94, 0.03); border-radius: 12px; font-size: 0.75rem; color: var(--text-muted); border: 1px dashed var(--glass-border);">
                            <p style="margin-bottom: 5px;"><strong style="color: var(--primary);">Tip Pro:</strong> Usa *negrita* o _cursiva_ para resaltar ganchos de venta.</p>
                            <p>El nombre se inyectará automáticamente donde pongas {{nombre}}.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    init: async (appState, { refreshTemplates }) => {
        // 1. Inicializar el componente modular de la burbuja
        await WhatsAppBubble.init();

        const btnIniciar = document.getElementById('btn-iniciar-campana');
        const btnDetener = document.getElementById('btn-detener-campana');
        const textareaMessage = document.getElementById('campana-mensaje');
        const btnSaveTemplate = document.getElementById('btn-save-message-template');
        const selectTemplates = document.getElementById('select-templates');
        const checkAIVariation = document.getElementById('check-ai-variation');
        const previewRoot = document.getElementById('wa-msg-preview-root');

        // Cargar ajustes previos
        const settings = await window.api.getAllSettings();
        
        // 2. Lógica de Previsualización Real-Time
        const updatePreview = () => {
             if (previewRoot) {
                previewRoot.innerHTML = WhatsAppBubble.render(textareaMessage.value, settings.last_campaign_image);
             }
        };

        if (textareaMessage) {
            if (settings.last_campaign_message) textareaMessage.value = settings.last_campaign_message;
            textareaMessage.addEventListener('input', updatePreview);
            updatePreview();
        }

        if (checkAIVariation) checkAIVariation.checked = settings.use_ai_variation === 'true';

        // Cargar plantillas en el select
        await refreshTemplates();

        // Eventos
        btnSaveTemplate.onclick = async () => {
            const nombre = prompt('Nombre de la nueva plantilla:');
            const contenido = textareaMessage.value.trim();
            if (nombre && contenido) {
                await window.api.saveTemplate({ nombre, contenido });
                await refreshTemplates();
                alert('Plantilla guardada con éxito.');
            }
        };

        selectTemplates.onchange = (e) => {
            const opt = e.target.options[e.target.selectedIndex];
            if (opt.value) {
                textareaMessage.value = decodeURIComponent(opt.dataset.content);
                updatePreview();
            }
        };

        btnIniciar.onclick = async () => {
            const message = textareaMessage.value.trim();
            const minDelay = parseInt(document.getElementById('delay-min').value);
            const maxDelay = parseInt(document.getElementById('delay-max').value);
            const useAI = checkAIVariation.checked;
            
            if (!message) return alert('Por favor, escribe un mensaje.');

            let leadsToSend = [];
            if (appState.selectedLeads && appState.selectedLeads.length > 0) {
                leadsToSend = [...appState.selectedLeads];
            } else {
                const confirmAll = confirm('No has seleccionado contactos específicos. ¿Enviar a TODOS los pendientes?');
                if (!confirmAll) return;
                leadsToSend = await window.api.getPendingLeads();
            }

            if (leadsToSend.length === 0) return alert('No hay contactos pendientes.');

            await window.api.saveSetting('last_campaign_message', message);
            await window.api.saveSetting('use_ai_variation', useAI.toString());

            const data = {
                leads: leadsToSend,
                message,
                minDelay,
                maxDelay,
                imagePath: settings.last_campaign_image || null,
                useAI
            };

            appState.pushLog({ text: `Lanzando campaña para ${leadsToSend.length} contactos...`, type: 'info' });
            try {
                await window.api.startCampaign(data);
            } catch (err) {
                appState.pushLog({ text: `❌ Error en campaña: ${err.message}`, type: 'error' });
            }
        };

        btnDetener.onclick = async () => {
            if (confirm('¿Detener el envío ahora?')) {
                await window.api.stopCampaign();
            }
        };
    }
};
