import { TemplateLoader } from '../../../core/loader.js';

/**
 * Componente: WhatsAppBubble - Lógica de Renderizado ✨💬
 */
export const WhatsAppBubble = {
    template: null,
    // ✅ Cacheamos la ruta de userData para no hacer IPC en cada render
    _userDataPath: null,

    /**
     * Pre-carga los recursos del componente (HTML y CSS).
     */
    init: async () => {
        WhatsAppBubble.template = await TemplateLoader.loadHTML('wa-bubble');
        await TemplateLoader.loadCSS('wa-bubble');
        // ✅ Resolvemos la ruta de userData UNA sola vez (es async)
        WhatsAppBubble._userDataPath = await window.api.getUserDataPath();
    },

    /**
     * Construye la URL file:// correcta para una imagen guardada en userData.
     * @param {string} relativePath - Ej: "media/template_12345.jpg"
     * @returns {string} URL completa tipo file:///C:/.../.app_data/media/template_12345.jpg
     */
    buildImageUrl: (relativePath) => {
        if (!WhatsAppBubble._userDataPath || !relativePath) return null;
        // Normalizamos separadores para Windows/Mac/Linux
        const normalized = relativePath.replace(/\\/g, '/');
        const base = WhatsAppBubble._userDataPath.replace(/\\/g, '/');
        return `file:///${base}/${normalized}`;
    },

    /**
     * Procesa el texto y la imagen para generar el HTML final.
     * @param {string} text - Contenido del mensaje.
     * @param {string} imagePath - Ruta relativa de la imagen (ej: "media/template_xxx.jpg").
     * @returns {string} HTML renderizado.
     */
    render: (text = '', imagePath = null) => {
        if (!WhatsAppBubble.template) return '<div class="loading">Cargando preview...</div>';

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // 1. Procesar Imagen
        let imageHtml = '';
        if (imagePath && imagePath.trim() !== '') {
            const fullUrl = WhatsAppBubble.buildImageUrl(imagePath);
            if (fullUrl) {
                imageHtml = `<img src="${fullUrl}" class="wa-bubble-image" onerror="this.style.display='none'">`;
            }
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