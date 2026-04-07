import { TemplateLoader } from '../../../core/loader.js';

/**
 * Componente: WhatsAppBubble - Lógica de Renderizado ✨💬
 */
export const WhatsAppBubble = {
    template: null,

    /**
     * Pre-carga los recursos del componente (HTML y CSS).
     */
    init: async () => {
        WhatsAppBubble.template = await TemplateLoader.loadHTML('wa-bubble');
        await TemplateLoader.loadCSS('wa-bubble');
    },

    /**
     * Procesa el texto y la imagen para generar el HTML final.
     * @param {string} text - Contenido del mensaje.
     * @param {string} imagePath - Ruta de la imagen (opcional).
     * @returns {string} HTML renderizado.
     */
    render: (text = '', imagePath = null) => {
        if (!WhatsAppBubble.template) return '<div class="loading">Cargando preview...</div>';

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // 1. Procesar Imagen
        let imageHtml = '';
        if (imagePath && imagePath.trim() !== '') {
            const fullPath = `file://${window.api.getAppPath()}/${imagePath}`;
            imageHtml = `<img src="${fullPath}" class="wa-bubble-image">`;
        }

        // 2. Procesar Texto (con placeholder si está vacío)
        let msgHtml = '';
        const cleanText = text ? text.trim() : '';

        if (!cleanText && !imageHtml) {
            msgHtml = '<span style="opacity: 0.5; font-style: italic;">Escribe tu mensaje para previsualizar...</span>';
        } else {
            msgHtml = cleanText
                .replace(/\*(.*?)\*/g, '<b>$1</b>')
                .replace(/_(.*?)_/g, '<i>$1</i>')
                .replace(/~(.*?)~/g, '<strike>$1</strike>')
                .replace(/\n/g, '<br>');
        }

        // 3. Inyectar en el Template base
        return WhatsAppBubble.template
            .replace('{{image}}', imageHtml)
            .replace('{{text}}', msgHtml)
            .replace('{{time}}', time);
    }
};
