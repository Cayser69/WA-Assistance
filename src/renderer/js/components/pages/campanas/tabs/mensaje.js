import { WhatsAppBubble } from '../../../layout/wa-bubble/index.js';

/**
 * Sub-componente: Redacción de Mensaje y Lanzamiento 🚀✨📱
 */
export const MensajeTab = {
    render: () => `
        <div id="section-mensaje" class="animate-fade-in" style="margin-top: 50px;">
            <div class="form-container">
                <!-- Bloque 1: Consola de Lanzamiento -->
                <div class="card glass-card">
                    <div class="template-header">
                        <h3><span class="material-icons-outlined">send</span> Lanzar Nueva Campaña</h3>
                        <div class="header-actions">
                             <select id="select-templates" class="template-select">
                                <option value="">Elegir Plantilla Guardada...</option>
                             </select>
                        </div>
                    </div>

                    <div class="safety-notice" style="margin-bottom: 20px; background: rgba(34, 197, 94, 0.05); border-color: rgba(34, 197, 94, 0.2);">
                        <span class="material-icons-outlined" style="color: var(--primary)">security</span>
                        <p style="font-size: 0.8rem;">Protección: **Retardo Inteligente Activado** (15-60s + 60s base), horario comercial (09:00-19:00).</p>
                    </div>
                    
                    <div class="form-group-col">
                        <div class="form-group">
                            <label>Mensaje Seleccionado (Solo lectura)</label>
                            <textarea id="campana-mensaje" readonly placeholder="Selecciona una de tus plantillas para empezar..." style="min-height: 250px; background: rgba(0,0,0,0.15); cursor: not-allowed; border-color: rgba(255,255,255,0.05);"></textarea>
                            <input type="hidden" id="campana-image-path" value="">
                        </div>

                        <div class="ai-switch-row" style="margin-top: 10px;">
                            <div class="header-left">
                                <span class="material-icons-outlined" style="color: var(--primary); font-size: 2rem;">auto_awesome</span>
                                <div>
                                    <strong style="font-size: 1rem;">Variación Anti-Spam (IA)</strong>
                                    <div class="text-muted" style="font-size: 0.8rem">Generar versiones únicas de este mensaje por cada lead.</div>
                                </div>
                            </div>
                            <input type="checkbox" id="check-ai-variation" style="width: 24px; height: 24px; cursor: pointer;">
                        </div>

                        <div class="actions-footer" style="display: flex; flex-direction: column; align-items: center; margin-top: 30px; gap: 15px;">
                            <button id="btn-iniciar-campana" class="btn btn-success btn-large" style="width: 400px !important;">
                                <span class="material-icons-outlined" style="font-size: 1.4rem;">rocket_launch</span> INICIAR ENVÍO MASIVO
                            </button>

                            <button id="btn-detener-campana" class="btn btn-stop btn-large" style="width: 400px !important; display: none;">
                                <span class="material-icons-outlined" style="font-size: 1.4rem;">stop_circle</span> DETENER ENVÍO AHORA
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    init: async (appState, { refreshTemplates }) => {
        const btnIniciar = document.getElementById('btn-iniciar-campana');
        const btnDetener = document.getElementById('btn-detener-campana');
        const textareaMessage = document.getElementById('campana-mensaje');
        const selectTemplates = document.getElementById('select-templates');
        const checkAIVariation = document.getElementById('check-ai-variation');

        // Cargar ajustes previos
        const settings = await window.api.getAllSettings();
        
        if (textareaMessage) {
            if (settings.last_campaign_message) textareaMessage.value = settings.last_campaign_message;
        }

        if (checkAIVariation) checkAIVariation.checked = settings.use_ai_variation === 'true';

        // Cargar plantillas en el select
        await refreshTemplates();

        // Eventos
        selectTemplates.onchange = (e) => {
            const opt = e.target.options[e.target.selectedIndex];
            if (opt.value) {
                textareaMessage.value = decodeURIComponent(opt.dataset.content);
                document.getElementById('campana-image-path').value = opt.dataset.image || '';
            }
        };

        // Iniciar Campaña
        btnIniciar.onclick = async () => {
            const mensaje = textareaMessage.value.trim();
            if (!mensaje) {
                alert('Por favor, selecciona una plantilla primero.');
                return;
            }

            const useAI = checkAIVariation.checked;
            const imagePath = document.getElementById('campana-image-path').value;

            // Retardos fijados por código: 15 a 60 segundos (Protección Premium)
            const dMin = 15;
            const dMax = 60;

            const selectedLeads = appState.selectedLeads || [];
            
            if (selectedLeads.length === 0) {
                const confirmAll = confirm('No hay leads seleccionados en "Audiencia". ¿Quieres enviar a TODOS los contactos pendientes de la base de datos?');
                if (!confirmAll) return;
            }

            // Guardar último mensaje usado
            await window.api.setSetting('last_campaign_message', mensaje);
            await window.api.setSetting('use_ai_variation', useAI ? 'true' : 'false');

            // Lanzar proceso en Main
            const res = await window.api.startCampaign({
                mensaje,
                useAI,
                imagePath,
                delayMin: dMin,
                delayMax: dMax,
                leads: selectedLeads
            });

            if (res.success) {
                btnIniciar.style.display = 'none';
                btnDetener.style.display = 'flex';
                alert('Campaña iniciada correctamente. Puedes ver el progreso en tiempo real en la consola.');
            } else {
                alert('Error al iniciar campaña: ' + res.error);
            }
        };

        btnDetener.onclick = async () => {
            if (confirm('¿Detener el envío ahora?')) {
                await window.api.stopCampaign();
            }
        };
    }
};
