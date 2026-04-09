/**
 * Sub-componente: Gestión Multimedia
 */

export const MultimediaTab = {
    render: () => `
        <div id="section-multimedia" class="campaign-grid animate-fade-in" style="display: flex; justify-content: center;">
            <div class="card glass-card text-center" style="max-width: 600px; width: 100%;">
                <h3><span class="material-icons-outlined">image</span> Gestión Multimedia</h3>
                <p class="text-muted">Selecciona la imagen que se enviará junto con el mensaje.</p>
                
                <div class="image-selector-row" style="margin-top: 30px;">
                    <button id="btn-select-image" class="btn btn-secondary" style="margin: 0 auto;">
                        <span class="material-icons-outlined">add_photo_alternate</span> Seleccionar Imagen de Campaña
                    </button>
                    <div id="selected-image-preview" style="margin-top: 20px;">
                         <span id="selected-image-path" class="text-muted">Ninguna imagen seleccionada.</span>
                    </div>
                    <button id="btn-clear-image" class="btn btn-danger" style="margin: 15px auto 0; display: none;">
                         <span class="material-icons-outlined">delete</span> Eliminar Imagen
                    </button>
                </div>
            </div>
        </div>
    `,

    init: async (appState) => {
        const btnSelectImage = document.getElementById('btn-select-image');
        const btnClearImage = document.getElementById('btn-clear-image');
        const imagePathDisplay = document.getElementById('selected-image-path');

        const settings = await window.api.getAllSettings();
        if (settings.last_campaign_image) {
            imagePathDisplay.textContent = settings.last_campaign_image.split('\\').pop().split('/').pop();
            btnClearImage.style.display = 'block';
        }

        btnSelectImage.onclick = async () => {
            // ✅ Usamos openFileDialog (nombre correcto en el preload)
            const path = await window.api.openFileDialog(
                [{ name: 'Imágenes', extensions: ['jpg', 'png', 'jpeg', 'webp'] }]
            );
            if (path) {
                imagePathDisplay.textContent = path.split('\\').pop().split('/').pop();
                btnClearImage.style.display = 'block';
                await window.api.saveSetting('last_campaign_image', path);
            }
        };

        btnClearImage.onclick = async () => {
            imagePathDisplay.textContent = 'Ninguna imagen seleccionada.';
            btnClearImage.style.display = 'none';
            await window.api.saveSetting('last_campaign_image', '');
        };
    }
};