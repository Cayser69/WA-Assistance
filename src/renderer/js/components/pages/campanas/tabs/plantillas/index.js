import { TemplateLoader } from '../../../../../core/loader.js';
import { WhatsAppBubble } from '../../../../layout/wa-bubble/index.js';

/**
 * Sub-componente Modular: Biblioteca y Editor de Plantillas
 */
export const PlantillasTab = {
    /**
     * Carga el fragmento HTML dinámicamente.
     */
    render: async () => {
        return await TemplateLoader.loadHTML('campanas/tabs/plantillas');
    },

    /**
     * Inicialización de la lógica y eventos.
     */
    init: async (appState) => {
        // Cargar estilos (si existen específicos, de lo contrario los genéricos de campanas bastan)
        await TemplateLoader.loadCSS('campanas/tabs/plantillas').catch(() => {});

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

        // Obtener ruta de userData para las URLs de galería.
        const getUserDataPath = async () => {
            if (WhatsAppBubble._userDataPath) return WhatsAppBubble._userDataPath;
            return await window.api.getUserDataPath();
        };

        const updatePreview = () => {
            if (waPreviewRoot && contentInput) {
                const text = contentInput.value;
                const imagePath = imagePathInput.value;
                waPreviewRoot.innerHTML = WhatsAppBubble.render(text, imagePath);
            }
        };

        const refreshGallery = async () => {
            if (!galleryRoot) return;
            currentImages = await window.api.invoke('media:listImages');
            const userDataPath = await getUserDataPath();
            const baseUrl = userDataPath.replace(/\\/g, '/');

            galleryRoot.innerHTML = currentImages.map(imgName => {
                const relativePath = `media/${imgName}`;
                const isSelected = imagePathInput.value === relativePath;
                const imgUrl = `file:///${baseUrl}/media/${imgName}`;
                return `
                    <img src="${imgUrl}" 
                         class="gallery-item ${isSelected ? 'selected' : ''}" 
                         data-path="${relativePath}"
                         title="${imgName}">
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
            if (!listContainer) return;
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
            btnSave.innerHTML = '<span class="material-icons-outlined">save</span> GUARDAR CAMBIOS';
            updatePreview();
            refreshGallery();
            refreshTemplatesList();
        };

        btnUpload.onclick = async () => {
            const selectedPath = await window.api.openFileDialog(
                [{ name: 'Imágenes', extensions: ['jpg', 'png', 'jpeg', 'webp'] }]
            );
            if (selectedPath) {
                const internalPath = await window.api.importTemplateImage(selectedPath);
                if (internalPath) {
                    imagePathInput.value = internalPath;
                    await refreshGallery();
                    updatePreview();
                } else {
                    alert('Error al importar la imagen.');
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
                if (appState && typeof appState.log === 'function') {
                    appState.log(`Plantilla "${data.nombre}" guardada.`, 'success');
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

        // Carga inicial
        await refreshTemplatesList();
        await refreshGallery();
        updatePreview();
    }
};
