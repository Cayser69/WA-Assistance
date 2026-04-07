/**
 * Core: TemplateLoader 🧱✨
 * Responsabilidad: Carga dinámica de fragmentos HTML y CSS para componentes modulares.
 */
export const TemplateLoader = {
    cache: {},

    /**
     * Carga el contenido de un archivo HTML de forma asíncrona.
     * Intenta buscar en subcarpetas (pages, layout, shared) si no está en la raíz.
     */
    async loadHTML(componentName, fileName = 'template.html') {
        const cacheKey = `html-${componentName}-${fileName}`;
        if (this.cache[cacheKey]) return this.cache[cacheKey];

        const subfolders = ['', 'pages/', 'layout/', 'shared/'];
        
        for (const sub of subfolders) {
            const relativePath = `src/renderer/js/components/${sub}${componentName}/${fileName}`;

            try {
                const html = await window.api.readTemplate(relativePath);
                if (html) {
                    this.cache[cacheKey] = html; // Cacheamos usando el nombre raíz para saltarnos el for en el futuro
                    return html;
                }
            } catch (err) { }
        }

        return `<div class="error-load">Error cargando componente ${componentName}</div>`;
    },

    /**
     * Inyecta dinámicamente un archivo CSS en el head si no existe ya.
     */
    async loadCSS(componentName) {
        const cacheKey = `css-${componentName}`;
        if (this.cache[cacheKey]) return;

        const id = `style-${componentName}`;
        if (document.getElementById(id)) {
            this.cache[cacheKey] = true;
            return;
        }

        const subfolders = ['', 'pages/', 'layout/', 'shared/'];
        for (const sub of subfolders) {
            try {
                const relativePath = `src/renderer/js/components/${sub}${componentName}/style.css`;
                const css = await window.api.readTemplate(relativePath);
                
                if (css) {
                    const style = document.createElement('style');
                    style.id = id;
                    style.textContent = css;
                    document.head.appendChild(style);
                    this.cache[cacheKey] = true; // Cacheamos usando el nombre raíz
                    return; 
                }
            } catch (err) { }
        }
        
        // Si no se encontró ningún CSS para este componente, marcamos en caché igual para no volver a intentar en el futuro.
        this.cache[cacheKey] = true;
    }
};
