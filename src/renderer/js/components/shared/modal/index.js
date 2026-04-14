import { TemplateLoader } from '../../../core/loader.js';

/**
 * Componente: AppModal - Sistema de Diálogos Modales Premium 🛡️✨
 * Permite mostrar ventanas emergentes con contenido dinámico y acciones.
 */
export const AppModal = {
    _isInitialized: false,
    _element: null,
    _contentEl: null,
    _titleEl: null,
    _footerEl: null,

    /**
     * Inicializa la estructura base de la modal en el DOM.
     */
    init: async function() {
        if (this._isInitialized) return;

        try {
            const html = await TemplateLoader.loadHTML('shared/modal');
            await TemplateLoader.loadCSS('shared/modal');

            const wrapper = document.createElement('div');
            wrapper.innerHTML = html;
            this._element = wrapper.firstElementChild;
            document.body.appendChild(this._element);

            this._contentEl = this._element.querySelector('#modal-content');
            this._titleEl = this._element.querySelector('#modal-title');
            this._footerEl = this._element.querySelector('#modal-footer');

            // Evento cerrar
            this._element.querySelector('#modal-close').onclick = () => this.hide();
            this._element.onclick = (e) => {
                if (e.target === this._element) this.hide();
            };

            this._isInitialized = true;
            console.log('[AppModal] ✅ Sistema de modales inicializado.');
        } catch (err) {
            console.error('[AppModal] ❌ Error de inicialización:', err);
        }
    },

    /**
     * Muestra una nueva modal.
     * @param {Object} config - Configuración de la modal { title, contentHTML, onInit, footerActions }
     */
    show: async function(config) {
        if (!this._isInitialized) await this.init();

        const { title, contentHTML, onInit, footerActions, maxWidth = '600px' } = config;

        // Solo actualizar si se provee nuevo contenido
        if (contentHTML !== undefined) {
            this._contentEl.innerHTML = contentHTML || '';
        }
        
        if (title !== undefined) {
            this._titleEl.textContent = title || 'Ventana';
        }

        this._footerEl.innerHTML = '';
        this._footerEl.style.display = footerActions ? 'flex' : 'none';
        
        // Ajuste de tamaño
        this._element.querySelector('.modal-container').style.maxWidth = maxWidth;

        // Inyectar acciones del footer si existen
        if (footerActions && Array.isArray(footerActions)) {
            footerActions.forEach(action => {
                const btn = document.createElement('button');
                btn.className = `btn ${action.class || 'btn-secondary'}`;
                btn.textContent = action.text;
                btn.onclick = () => action.onClick(this);
                this._footerEl.appendChild(btn);
            });
        }

        // Ejecutar inicialización del contenido si se provee
        if (onInit && typeof onInit === 'function') {
            onInit(this._contentEl, this);
        }

        this._element.style.display = 'flex';
        document.body.classList.add('modal-active');
    },

    /**
     * Oculta la modal activa.
     */
    hide: function() {
        if (this._element) {
            this._element.style.display = 'none';
            document.body.classList.remove('modal-active');
        }
    },

    /**
     * Helper: Obtiene una referencia a un elemento dentro de la modal activa.
     */
    querySelector: function(selector) {
        return this._contentEl ? this._contentEl.querySelector(selector) : null;
    }
};
