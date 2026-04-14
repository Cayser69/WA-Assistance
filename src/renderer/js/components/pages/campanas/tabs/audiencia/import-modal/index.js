/**
 * Lógica de Negocio: Importación de Leads desde CSV 📊⚙️
 */
export const LeadImportModal = {
    _data: [],
    _headers: [],

    /**
     * Inicializa la lógica de la modal inyectada.
     */
    init: async function(container, modal, onComplete) {
        const dropZone = container.querySelector('#drop-zone');
        const fileInput = container.querySelector('#csv-file-input');
        
        const stepSelect = container.querySelector('#step-select');
        const stepMapping = container.querySelector('#step-mapping');
        const stepProcessing = container.querySelector('#step-processing');
        const stepResults = container.querySelector('#step-results');

        // 1. Manejo de Selección de Archivo
        dropZone.onclick = () => fileInput.click();
        
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                // Estado de carga visual inicial
                dropZone.innerHTML = '<span class="material-icons-outlined animate-spin" style="font-size: 3rem; color: var(--primary);">sync</span><p>Leyendo archivo...</p>';
                await this.processFile(file.path, container, modal, stepMapping);
            }
        };

        // Drag & Drop support
        dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); };
        dropZone.ondragleave = () => dropZone.classList.remove('drag-over');
        dropZone.ondrop = async (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.csv')) {
                await this.processFile(file.path, container, modal, stepMapping);
            } else {
                alert('Por favor, selecciona un archivo .csv válido.');
            }
        };

        // Botón final de cerrar
        container.querySelector('#btn-import-close').onclick = () => {
            modal.hide();
            if (typeof onComplete === 'function') onComplete();
        };

        this._showStep = (step) => {
            [stepSelect, stepMapping, stepProcessing, stepResults].forEach(s => s.style.display = 'none');
            step.style.display = 'block';
        };

        this._executeImport = async () => {
            const phoneIdx = container.querySelector('#select-phone-col').value;
            const nameIdx = container.querySelector('#select-name-col').value;

            if (phoneIdx === "") return alert('Debes seleccionar al menos la columna del teléfono.');

            this._showStep(stepProcessing);
            
            // Ocultar botones del footer mientras procesa
            modal.show({ title: 'Procesando importación...', footerActions: null });

            const leadsToImport = this._data.map(row => ({
                telefono: row[phoneIdx],
                nombre: nameIdx !== "" ? row[nameIdx] : null
            })).filter(l => l.telefono && l.telefono.trim().length > 5);

            try {
                // Llamada optimizada al backend (Fase 1)
                const result = await window.api.insertLeadsBatch(leadsToImport);
                
                container.querySelector('#import-summary-text').innerHTML = `
                    Se han importado <b style="color: var(--primary); font-size: 1.4rem;">${result.imported}</b> nuevos leads.<br>
                    <span style="color: var(--text-muted); font-size: 0.9rem;">${result.skipped} duplicados o inválidos fueron omitidos.</span>
                `;
                
                this._showStep(stepResults);
                modal.show({ title: 'Importación Completada', footerActions: null });
            } catch (err) {
                console.error('[Import] Error:', err);
                alert('Ocurrió un error al guardar los leads en la base de datos.');
                this._showStep(stepMapping);
            }
        };
    },

    /**
     * Procesa el archivo CSV físico.
     */
    processFile: async function(filePath, container, modal, nextStep) {
        try {
            const content = await window.api.readFile(filePath);
            if (!content) throw new Error('No se pudo leer el archivo.');

            this.parseCSV(content, container);
            this._showStep(nextStep);
            this.renderPreview(container);

            // Actualizar modal con botones de acción
            modal.show({
                title: 'Mapeo de Datos CSV',
                footerActions: [
                    { text: 'CANCELAR', class: 'btn-clear-selection', onClick: (m) => m.hide() },
                    { text: 'CONFIRMAR E IMPORTAR', class: 'btn-primary', onClick: () => this._executeImport() }
                ]
            });
        } catch (err) {
            alert('Error: ' + err.message);
            console.error(err);
        }
    },

    /**
     * Parser de CSV simple pero efectivo.
     */
    parseCSV: function(text, container) {
        // Separar por líneas y limpiar vacías
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(line => line.length > 0);
        if (lines.length < 1) return alert('El archivo está vacío.');

        // Detectar delimitador inteligente (, o ;)
        const firstLine = lines[0];
        let delimiter = ',';
        if (firstLine.includes(';')) delimiter = ';';
        else if (firstLine.includes(',')) delimiter = ',';
        else if (lines[1] && lines[1].includes(';')) delimiter = ';';
        else if (lines[1] && lines[1].includes(',')) delimiter = ',';
        
        console.log(`[CSV-Parse] Delimitador detectado: "${delimiter}"`);

        // Extraer cabeceras
        this._headers = firstLine.split(delimiter).map(h => this.cleanValue(h));
        console.log(`[CSV-Parse] Cabeceras:`, this._headers);
        
        // Extraer datos (max 10,000 para seguridad del frontend)
        this._data = lines.slice(1, 10001).map(line => {
            return line.split(delimiter).map(v => this.cleanValue(v));
        });

        // Configurar selectores de mapeo
        const phoneSelect = container.querySelector('#select-phone-col');
        const nameSelect = container.querySelector('#select-name-col');
        
        const optionsHtml = this._headers.map((h, i) => `<option value="${i}">${h || `Columna ${i+1}`}</option>`).join('');
        phoneSelect.innerHTML = `<option value="">-- Seleccionar --</option>` + optionsHtml;
        nameSelect.innerHTML = `<option value="">-- Ignorar --</option>` + optionsHtml;

        // Pre-selección inteligente por palabras clave
        this._headers.forEach((h, i) => {
            const header = h.toLowerCase();
            if (/tel|phone|cel|movil|whatsapp/i.test(header)) phoneSelect.value = i;
            if (/nom|name|lead|user|cliente/i.test(header)) nameSelect.value = i;
        });
    },

    renderPreview: function(container) {
        const headerRow = container.querySelector('#preview-header');
        const body = container.querySelector('#preview-body');
        
        headerRow.innerHTML = this._headers.map(h => `<th>${h}</th>`).join('');
        
        // Mostrar solo las primeras 5 filas en la previsualización
        body.innerHTML = this._data.slice(0, 5).map(row => `
            <tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>
        `).join('');
    },

    cleanValue: function(val) {
        if (!val) return '';
        return val.trim().replace(/^["']|["']$/g, '');
    }
};
