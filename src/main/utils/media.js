import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carpeta de almacenamiento interna (Raíz del proyecto/assets/templates)
const ASSETS_PATH = path.join(process.cwd(), 'assets', 'templates');

/**
 * Gestor de Medios Físicos
 * Responsabilidad: Importar archivos externos a la carpeta interna del programa.
 */
export const MediaManager = {
    /**
     * Asegura que la carpeta de assets existe.
     */
    ensureDir() {
        if (!fs.existsSync(ASSETS_PATH)) {
            fs.mkdirSync(ASSETS_PATH, { recursive: true });
        }
    },

    /**
     * Copia un archivo externo a la carpeta interna y devuelve la nueva ruta.
     */
    importTemplateImage(sourcePath) {
        if (!sourcePath || !fs.existsSync(sourcePath)) return null;

        this.ensureDir();

        const ext = path.extname(sourcePath);
        const fileName = `template_${Date.now()}${ext}`;
        const targetPath = path.join(ASSETS_PATH, fileName);

        try {
            fs.copyFileSync(sourcePath, targetPath);
            // Devolvemos la ruta relativa para guardarla en la DB
            return path.join('assets', 'templates', fileName);
        } catch (error) {
            console.error('MediaManager: Error al copiar imagen:', error);
            return null;
        }
    },

    /**
     * Elimina un archivo de la carpeta interna.
     */
    deleteFile(relativePath) {
        if (!relativePath) return;
        const fullPath = path.join(process.cwd(), relativePath);
        if (fs.existsSync(fullPath)) {
            try {
                fs.unlinkSync(fullPath);
            } catch (e) {}
        }
    }
};
