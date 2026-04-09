import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import electron from 'electron';
const { app } = electron;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carpeta de almacenamiento interna (Raíz de datos de usuario/media)
const ASSETS_PATH = path.join(app.getPath('userData'), 'media');

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
            return path.join('media', fileName);
        } catch (error) {
            console.error('MediaManager: Error al copiar imagen:', error);
            return null;
        }
    },

    /**
     * Guarda un archivo multimedia de WhatsApp (Base64) en la carpeta de chat. 📥
     */
    saveChatMedia(mediaData, sender) {
        if (!mediaData || !mediaData.data) return null;

        const chatMediaDir = path.join(ASSETS_PATH, 'chat');
        if (!fs.existsSync(chatMediaDir)) {
            fs.mkdirSync(chatMediaDir, { recursive: true });
        }

        const ext = this.getExtFromMime(mediaData.mimetype);
        const fileName = `chat_${sender}_${Date.now()}${ext}`;
        const targetPath = path.join(chatMediaDir, fileName);

        try {
            const buffer = Buffer.from(mediaData.data, 'base64');
            fs.writeFileSync(targetPath, buffer);
            // Devolvemos la ruta relativa consistente
            return path.join('media', 'chat', fileName);
        } catch (error) {
            console.error('MediaManager: Error al guardar media de chat:', error);
            return null;
        }
    },

    /**
     * Mapeo inteligente de extensiones según MimeType.
     */
    getExtFromMime(mime) {
        const map = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
            'audio/ogg; codecs=opus': '.ogg',
            'audio/mpeg': '.mp3',
            'audio/mp4': '.m4a',
            'audio/ogg': '.ogg',
            'video/mp4': '.mp4',
            'application/pdf': '.pdf'
        };
        return map[mime] || '.bin';
    },

    /**
     * Elimina un archivo de la carpeta interna.
     */
    deleteFile(relativePath) {
        if (!relativePath) return;
        const fullPath = path.join(app.getPath('userData'), relativePath);
        if (fs.existsSync(fullPath)) {
            try {
                fs.unlinkSync(fullPath);
            } catch (e) {}
        }
    },

    /**
     * Lista todas las imágenes en la carpeta de medios.
     */
    listImages() {
        this.ensureDir();
        try {
            const files = fs.readdirSync(ASSETS_PATH);
            // Filtrar solo imágenes comunes y devolver nombres
            return files.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
        } catch (error) {
            console.error('MediaManager: Error al listar imágenes:', error);
            return [];
        }
    }
};
