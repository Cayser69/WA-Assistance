import { WhatsAppBubble } from '../../../components/wa-bubble/index.js';

export const PlantillasTab = {
    render: () => `
        <div id="section-plantillas" class="animate-fade-in">
            <div class="template-console-grid">
                
                <!-- Columna 1: Librería de Plantillas (Estrecha) -->
                <nav class="left-panel">
                    <div class="card glass-card">
                        <div class="template-header">
                            <h4 style="margin:0; font-size: 0.95rem;">
                                <span class="material-icons-outlined" style="vertical-align: middle; font-size: 1.1rem;">fact_check</span> Librería
                            </h4>
                            <button id="btn-new-template" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;">
                                <span class="material-icons-outlined" style="font-size: 0.9rem;">add</span> Nueva
                            </button>
                        </div>
                        <p class="text-muted" style="font-size: 0.7rem; margin: 10px 0;">Tus mensajes guardados.</p>
                        
                        <div id="templates-list-container" class="template-list-scroll" style="max-height: 550px;">
                            <!-- Inyectado dinámicamente -->
                        </div>
                    </div>
                </nav>

                <!-- Columna 2: Vista Previa Central (WhatsApp Mockup) -->
                <div class="preview-panel">
                    <div class="card glass-card" style="padding: 15px; background: rgba(0,0,0,0.4);">
                        <h4 style="margin-bottom: 15px; font-size: 0.9rem; text-align: center; color: var(--text-muted);">
                            <span class="material-icons-outlined" style="font-size: 1rem; vertical-align: middle;">visibility</span> Vista Previa
                        </h4>
                        
                        <div class="whatsapp-preview-container">
                            <div class="wa-bubble-wrapper">
                                <div class="wa-bubble" id="wa-preview-bubble">
                                    <div id="wa-msg-container">
                                        Escribe algo a la derecha...
                                    </div>
                                    <span class="wa-time">12:00 <span class="material-icons-outlined wa-check">done_all</span></span>
                                </div>
                            </div>
                        </div>
                        
                        <div style="margin-top: 20px; padding: 10px; border-top: 1px solid var(--glass-border); text-align:center;">
                           <p class="text-muted" style="font-size: 0.7rem;">Así lo verá el cliente en su dispositivo.</p>
                        </div>
                    </div>
                </div>

                <!-- Columna 3: Editor Lateral (Completo) -->
                <main class="right-panel">
                    <div class="card glass-card">
                        <div class="form-group-col">
                            <input type="hidden" id="edit-template-id" value="">
                            
                            <div class="form-group">
                                <label>Nombre identificativo</label>
                                <input type="text" id="template-name" placeholder="p.ej. Campaña Oferta Black Friday">
                            </div>

                            <div class="form-group">
                                <label>Imagen de la Plantilla</label>
                                <div id="template-image-area" class="image-selector-row" style="cursor: pointer; position: relative; min-height: 100px;">
                                    <div id="img-preview-placeholder">
                                        <span class="material-icons-outlined" style="font-size: 2rem; color: var(--glass-border);">add_photo_alternate</span>
                                        <p style="font-size: 0.75rem; margin-top: 5px;">Añadir Imagen</p>
                                    </div>
                                    <img id="img-preview-full" src="" style="display: none; max-height: 80px; border-radius: 8px;">
                                    
                                    <button id="btn-remove-image" class="btn-icon" style="display: none; position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.5); border-radius: 50%;">
                                        <span class="material-icons-outlined" style="color: white; font-size: 1rem;">close</span>
                                    </button>
                                </div>
                                <input type="hidden" id="template-image-path" value="">
                            </div>

                            <div class="form-group">
                                <label>Contenido del Mensaje</label>
                                <textarea id="template-content" placeholder="Introduce el texto aquí. Recuerda que puedes usar *negrita* y _cursiva_." style="min-height: 180px;"></textarea>
                            </div>

                            <div style="display: flex; gap: 15px; margin-top: 20px;">
                                <button id="btn-save-template" class="btn btn-primary" style="flex: 1; padding: 12px !important;">
                                    <span class="material-icons-outlined">offline_pin</span> GUARDAR PLANTILLA
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `,

    init: async (appState) => {
        // Inicializar el componente modular (Carga HTML/CSS)
        await WhatsAppBubble.init();

        const listContainer = document.getElementById('templates-list-container');
        const nameInput = document.getElementById('template-name');
        const contentInput = document.getElementById('template-content');
        const idInput = document.getElementById('edit-template-id');
        const imagePathInput = document.getElementById('template-image-path');
        const imgArea = document.getElementById('template-image-area');
        const imgFull = document.getElementById('img-preview-full');
        const imgPlaceholder = document.getElementById('img-preview-placeholder');
        const btnRemoveImg = document.getElementById('btn-remove-image');
        const waMsgContainer = document.getElementById('wa-msg-container');
        const btnSave = document.getElementById('btn-save-template');
        const btnNew = document.getElementById('btn-new-template');

        let currentTemplates = [];

        const updatePreview = () => {
            const text = contentInput.value;
            const imagePath = imagePathInput.value;
            
            // Usamos el componente centralizado
            waMsgContainer.innerHTML = WhatsAppBubble.render(text, imagePath);
        };

        contentInput.addEventListener('input', updatePreview);

        imgArea.onclick = async (e) => {
            if (e.target.closest('#btn-remove-image')) return;
            const selectedPath = await window.api.openFileDialog({
                filters: [{ name: 'Imágenes', extensions: ['jpg', 'png', 'jpeg', 'webp'] }]
            });
            if (selectedPath) {
                const internalPath = await window.api.importTemplateImage(selectedPath);
                if (internalPath) {
                    imagePathInput.value = internalPath;
                    imgFull.src = `file://${window.api.getAppPath()}/${internalPath}`;
                    imgFull.style.display = 'block';
                    imgPlaceholder.style.display = 'none';
                    btnRemoveImg.style.display = 'block';
                    updatePreview();
                }
            }
        };

        btnRemoveImg.onclick = (e) => {
            e.stopPropagation();
            imagePathInput.value = '';
            imgFull.src = '';
            imgFull.style.display = 'none';
            imgPlaceholder.style.display = 'block';
            btnRemoveImg.style.display = 'none';
            updatePreview();
        };

        const refreshList = async () => {
            currentTemplates = await window.api.getTemplates();
            if (!listContainer) return;

            listContainer.innerHTML = currentTemplates.length ? currentTemplates.map(t => `
                <div class="template-item" data-id="${t.id}" style="padding: 10px;">
                    <div class="info" style="max-width: 150px;">
                        <span class="name" style="font-size: 0.85rem;">${t.nombre}</span>
                        <span class="snippet" style="font-size: 0.7rem; display: flex; align-items: center; gap: 3px;">
                            ${t.image_path ? '<span class="material-icons-outlined" style="font-size: 0.75rem; color: var(--primary);">image</span>' : ''}
                            ${t.contenido.substring(0, 20)}...
                        </span>
                    </div>
                    <div class="actions">
                        <button class="btn-icon btn-delete" data-id="${t.id}">
                            <span class="material-icons-outlined" style="color: #ef4444; font-size: 1rem;">delete</span>
                        </button>
                    </div>
                </div>
            `).join('') : '<div class="text-center p-20 text-muted" style="font-size: 0.8rem;">Vacio.</div>';

            listContainer.querySelectorAll('.template-item').forEach(item => {
                item.onclick = (e) => {
                    if (e.target.closest('.btn-delete')) return;
                    listContainer.querySelectorAll('.template-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    const template = currentTemplates.find(t => t.id == item.dataset.id);
                    if (template) {
                        idInput.value = template.id;
                        nameInput.value = template.nombre;
                        contentInput.value = template.contenido;
                        imagePathInput.value = template.image_path || '';
                        if (template.image_path) {
                            imgFull.src = `file://${window.api.getAppPath()}/${template.image_path}`;
                            imgFull.style.display = 'block'; imgPlaceholder.style.display = 'none'; btnRemoveImg.style.display = 'block';
                        } else {
                            imgFull.style.display = 'none'; imgPlaceholder.style.display = 'block'; btnRemoveImg.style.display = 'none';
                        }
                        updatePreview();
                        btnSave.innerHTML = '<span class="material-icons-outlined">save</span> ACTUALIZAR';
                    }
                };
            });

            listContainer.querySelectorAll('.btn-delete').forEach(btn => {
                btn.onclick = async (e) => {
                    e.stopPropagation();
                    if (confirm('¿Eliminar?')) {
                        await window.api.deleteTemplate(btn.dataset.id);
                        if (idInput.value == btn.dataset.id) resetForm();
                        await refreshList();
                    }
                };
            });
        };

        const resetForm = () => {
            idInput.value = ''; nameInput.value = ''; contentInput.value = '';
            imagePathInput.value = ''; imgFull.src = ''; imgFull.style.display = 'none';
            imgPlaceholder.style.display = 'block'; btnRemoveImg.style.display = 'none';
            updatePreview();
            btnSave.innerHTML = '<span class="material-icons-outlined">save</span> GUARDAR';
            listContainer.querySelectorAll('.template-item').forEach(i => i.classList.remove('active'));
        };

        btnNew.onclick = resetForm;
        btnSave.onclick = async () => {
            const nombre = nameInput.value.trim();
            const contenido = contentInput.value.trim();
            const id = idInput.value;
            const imagePath = imagePathInput.value;
            if (!nombre || !contenido) return alert('Campos obligatorios.');

            await window.api.saveTemplate({ id, nombre, contenido, imagePath });
            
            // Refresco inmediato de la librería
            await refreshList();
            
            appState.log(`Plantilla "${nombre}" ${id ? 'actualizada' : 'creada'} con éxito.`, 'success');
            
            // Limpiamos y preparamos para la siguiente acción
            resetForm();
        };
        await refreshList();
    }
};
