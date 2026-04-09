import { WhatsAppBubble } from '../../../layout/wa-bubble/index.js';

export const PlantillasTab = {
    render: () => `
        <div id="section-plantillas" class="animate-fade-in template-console-layout">
            
            <!-- 1. LIBRERÍA SUPERIOR (Horizontal) -->
            <section class="template-library-top">
                <div class="template-header">
                    <h4 style="margin:0; font-size: 0.95rem;">
                        <span class="material-icons-outlined" style="vertical-align: middle; font-size: 1.1rem;">fact_check</span> Mis Plantillas Guardadas
                    </h4>
                    <button id="btn-new-template" class="btn btn-secondary" style="padding: 4px 12px;">
                        <span class="material-icons-outlined" style="font-size: 1.1rem;">add</span> Crear Nueva
                    </button>
                </div>
                <div id="templates-list-container" class="library-scroll">
                    <!-- Cards inyectadas dinámicamente -->
                </div>
            </section>

            <!-- 2. GRID INFERIOR (Preview | Editor) -->
            <section class="template-editor-grid">
                
                <!-- Columna Izquierda: Vista Previa -->
                <div class="preview-column">
                    <div class="card glass-card" style="padding: 20px; background: rgba(0,0,0,0.4); height: 100%;">
                        <h4 style="margin-bottom: 20px; font-size: 0.9rem; color: var(--text-muted); text-align: center;">
                            <span class="material-icons-outlined" style="font-size: 1.1rem; vertical-align: middle;">visibility</span> Vista Previa del Chat
                        </h4>
                        
                        <div class="whatsapp-preview-container" id="wa-preview-root">
                            <!-- Burbuja inyectada -->
                        </div>
                        
                        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid var(--glass-border); text-align:center;">
                           <p class="text-muted" style="font-size: 0.75rem;">Visualización exacta de cómo lo recibirá el cliente.</p>
                        </div>
                    </div>
                </div>

                <!-- Columna Derecha: Formulario Editor -->
                <div class="editor-column">
                    <div class="card glass-card">
                        <div class="form-group-col">
                            <input type="hidden" id="edit-template-id" value="">
                            
                            <div class="form-group">
                                <label>Nombre de la Plantilla</label>
                                <input type="text" id="template-name" placeholder="p.ej. Bienvenida Clientes Nuevos">
                            </div>

                            <!-- GALERÍA DE IMÁGENES -->
                            <div class="form-group">
                                <label>Seleccionar Imagen de la Galería</label>
                                <div class="image-gallery-selector" id="image-gallery-root">
                                    <!-- Miniaturas inyectadas -->
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                                    <span class="text-muted" style="font-size: 0.7rem;">Clica una imagen para usarla o sube una nueva:</span>
                                    <button id="btn-upload-new-img" class="btn btn-secondary" style="font-size: 0.7rem; padding: 2px 8px;">
                                        <span class="material-icons-outlined" style="font-size: 0.9rem;">upload</span> Subir Foto
                                    </button>
                                </div>
                                <input type="hidden" id="template-image-path" value="">
                            </div>

                            <div class="form-group">
                                <label>Contenido del Mensaje (Soporta Markdown)</label>
                                <textarea id="template-content" placeholder="Escribe aquí tu mensaje... Puedes usar *negrita* y _cursiva_." style="min-height: 150px;"></textarea>
                            </div>

                            <div style="display: flex; gap: 15px; margin-top: 10px;">
                                <button id="btn-save-template" class="btn btn-primary" style="flex: 1; padding: 15px !important;">
                                    <span class="material-icons-outlined">save</span> GUARDAR CAMBIOS
                                </button>
                                <button id="btn-delete-current" class="btn btn-icon" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); display: none;">
                                    <span class="material-icons-outlined" style="color: #ef4444;">delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </section>
        </div>
    `,

    init: async (appState) => {
        await WhatsAppBubble.init();

        const listContainer = document.getElementById('templates-list-container');
        const galleryRoot = document.getElementById('image-gallery-root');
        const nameInput = document.getElementById('template-name');
        const contentInput = document.getElementById('template-content');
        const idInput = document.getElementById('edit-template-id');
        const imagePathInput = document.getElementById('template-image-path');
        const waPreviewRoot = document.getElementById('wa-preview-root');
        const btnSave = document.getElementById('btn-save-template');
        const btnNew = document.getElementById('btn-new-template');
        const btnUpload = document.getElementById('btn-upload-new-img');
        const btnDelete = document.getElementById('btn-delete-current');

        let currentTemplates = [];
        let currentImages = [];

        // ✅ Obtenemos la ruta de userData UNA sola vez para construir las URLs de galería.
        // WhatsAppBubble.init() ya la cachea en _userDataPath, reutilizamos esa.
        const getUserDataPath = async () => {
            if (WhatsAppBubble._userDataPath) return WhatsAppBubble._userDataPath;
            return await window.api.getUserDataPath();
        };

        const updatePreview = () => {
            const text = contentInput.value;
            const imagePath = imagePathInput.value;
            waPreviewRoot.innerHTML = WhatsAppBubble.render(text, imagePath);
        };

        const refreshGallery = async () => {
            currentImages = await window.api.invoke('media:listImages');
            const userDataPath = await getUserDataPath();
            // ✅ Ruta correcta: userData + /media/nombreArchivo
            const baseUrl = userDataPath.replace(/\\/g, '/');

            galleryRoot.innerHTML = currentImages.map(imgName => {
                const relativePath = `media/${imgName}`;
                const isSelected = imagePathInput.value === relativePath;
                // ✅ file:/// con tres barras para rutas absolutas en Windows
                const imgUrl = `file:///${baseUrl}/media/${imgName}`;
                return `
                    <img src="${imgUrl}" 
                         class="gallery-item ${isSelected ? 'selected' : ''}" 
                         data-path="${relativePath}"
                         title="${imgName}"
                         onerror="this.style.opacity='0.3'; this.title='Error al cargar: ${imgName}'">
                `;
            }).join('') || '<p class="text-muted" style="grid-column: 1/-1; padding: 20px; font-size: 0.75rem;">No hay imágenes aún.</p>';

            galleryRoot.querySelectorAll('.gallery-item').forEach(img => {
                img.onclick = () => {
                    galleryRoot.querySelectorAll('.gallery-item').forEach(i => i.classList.remove('selected'));
                    img.classList.add('selected');
                    imagePathInput.value = img.dataset.path;
                    updatePreview();
                };
            });
        };

        const refreshTemplatesList = async () => {
            currentTemplates = await window.api.getTemplates();
            listContainer.innerHTML = currentTemplates.map(t => `
                <div class="template-card ${idInput.value == t.id ? 'active' : ''}" data-id="${t.id}">
                    <div class="card-title">${t.nombre}</div>
                    <div class="card-snippet">
                        ${t.image_path ? '🖼️ con imagen • ' : ''}
                        ${t.contenido.substring(0, 30)}...
                    </div>
                </div>
            `).join('') || '<div class="text-muted" style="padding: 20px;">Sin plantillas.</div>';

            listContainer.querySelectorAll('.template-card').forEach(card => {
                card.onclick = () => {
                    const template = currentTemplates.find(t => t.id == card.dataset.id);
                    if (template) fillForm(template);
                };
            });
        };

        const fillForm = (t) => {
            idInput.value = t.id;
            nameInput.value = t.nombre;
            contentInput.value = t.contenido;
            imagePathInput.value = t.image_path || '';
            btnDelete.style.display = 'block';
            btnSave.innerHTML = '<span class="material-icons-outlined">save</span> ACTUALIZAR PLANTILLA';
            updatePreview();
            refreshGallery();
            refreshTemplatesList();
        };

        const resetForm = () => {
            idInput.value = '';
            nameInput.value = '';
            contentInput.value = '';
            imagePathInput.value = '';
            btnDelete.style.display = 'none';
            btnSave.innerHTML = '<span class="material-icons-outlined">offline_pin</span> GUARDAR PLANTILLA';
            updatePreview();
            refreshGallery();
            refreshTemplatesList();
        };

        btnUpload.onclick = async () => {
            const selectedPath = await window.api.openFileDialog(
                [{ name: 'Imágenes', extensions: ['jpg', 'png', 'jpeg', 'webp'] }]
            );
            if (selectedPath) {
                // ✅ Copiamos la imagen a la carpeta interna y guardamos la ruta relativa
                const internalPath = await window.api.importTemplateImage(selectedPath);
                if (internalPath) {
                    imagePathInput.value = internalPath;
                    await refreshGallery();
                    updatePreview();
                } else {
                    alert('Error al importar la imagen. Comprueba los permisos del archivo.');
                }
            }
        };

        btnSave.onclick = async () => {
            const data = {
                id: idInput.value,
                nombre: nameInput.value.trim(),
                contenido: contentInput.value.trim(),
                imagePath: imagePathInput.value
            };
            if (!data.nombre || !data.contenido) return alert('Nombre y contenido obligatorios.');

            try {
                await window.api.saveTemplate(data);

                // Verificación de seguridad para el log
                if (appState && typeof appState.log === 'function') {
                    appState.log(`Plantilla "${data.nombre}" guardada.`, 'success');
                } else {
                    alert('Plantilla guardada correctamente'); // Fallback visual
                }

                resetForm();
            } catch (err) {
                console.error("Error al guardar:", err);
            }
        };

        btnDelete.onclick = async () => {
            if (confirm('¿Eliminar esta plantilla definitivamente?')) {
                await window.api.deleteTemplate(idInput.value);
                resetForm();
            }
        };

        btnNew.onclick = resetForm;
        contentInput.oninput = updatePreview;

        // Init
        await refreshTemplatesList();
        await refreshGallery();
        updatePreview();
    }
};