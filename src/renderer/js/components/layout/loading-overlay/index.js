import { TemplateLoader } from '../../../core/loader.js';

/**
 * Componente: AppOverlay - Orquestador Global de Estados de Carga 🛡️✨🔄
 * Singleton que permite bloquear la interfaz con feedback visual premium.
 */
export const AppOverlay = {
    _isInitialized: false,
    _element: null,
    _messageEl: null,

    /**
     * Inicializa el componente en el DOM. Se llama automáticamente al usar show().
     */
    init: async function() {
        if (this._isInitialized) return;

        try {
            const html = await TemplateLoader.loadHTML('layout/loading-overlay');
            await TemplateLoader.loadCSS('layout/loading-overlay');

            // Inyectar en el body para que sea global
            const wrapper = document.createElement('div');
            wrapper.innerHTML = html;
            this._element = wrapper.firstElementChild;
            document.body.appendChild(this._element);

            this._messageEl = this._element.querySelector('#loading-overlay-message');
            this._isInitialized = true;
            console.log('[AppOverlay] ✅ Inicializado correctamente en el body.');
        } catch (err) {
            console.error('[AppOverlay] ❌ Error de inicialización:', err);
        }
    },

    /**
     * Muestra el overlay de carga con un mensaje personalizado.
     * @param {string} message - El mensaje a mostrar.
     */
    show: async function(message = 'Procesando...') {
        if (!this._isInitialized) await this.init();
        
        if (this._messageEl) this._messageEl.textContent = message;
        if (this._element) {
            this._element.style.display = 'flex';
            document.body.classList.add('overlay-active');
        }
    },

    /**
     * Oculta el overlay y libera la interfaz.
     */
    hide: function() {
        if (this._element) {
            this._element.style.display = 'none';
            document.body.classList.remove('overlay-active');
        }
    }
};
