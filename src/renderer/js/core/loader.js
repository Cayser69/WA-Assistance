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
        const subfolders = ['', 'pages/', 'layout/', 'shared/'];
        
        for (const sub of subfolders) {
            const relativePath = `src/renderer/js/components/${sub}${componentName}/${fileName}`;
            if (this.cache[relativePath]) return this.cache[relativePath];

            try {
                const html = await window.api.readTemplate(relativePath);
                if (html) {
                    this.cache[relativePath] = html;
                    console.log(`[Loader] ✅ Cargado: ${relativePath}`);
                    return html;
                }
            } catch (err) {
                // Si llegamos aquí y es la última subcarpeta, avisar
                if (sub === 'shared/') console.warn(`[Loader] ⚠️ No se encontró en ${sub}`);
            }
        }

        console.error(`[Loader] ❌ No se pudo encontrar HTML para ${componentName}`);
        return `<div class="error-load">Error cargando componente ${componentName}</div>`;
    },

    /**
     * Inyecta dinámicamente un archivo CSS en el head si no existe ya.
     */
    async loadCSS(componentName) {
        const id = `style-${componentName}`;
        if (document.getElementById(id)) return;

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
                    console.log(`[Loader] 🎨 Estilo cargado: ${relativePath}`);
                    return; 
                }
            } catch (err) { }
        }
    }
};
