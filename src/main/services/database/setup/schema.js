/**
 * Definiciones de Esquema SQL para las Tablas Nucleares 🗄️
 */
export const SCHEMAS = {
    LEADS: `
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telefono TEXT NOT NULL UNIQUE,
            meta_id TEXT,
            estado TEXT DEFAULT 'pendiente',
            tipo TEXT DEFAULT 'manual',
            fecha_contacto DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            nombre TEXT,
            reparado INTEGER DEFAULT 0
        )
    `,
    LOGS: `
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telefono TEXT NOT NULL,
            mensaje TEXT,
            tipo TEXT CHECK(tipo IN ('enviado', 'recibido')),
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(telefono, mensaje, tipo, fecha)
        )
    `,
    SETTINGS: `
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `,
    TEMPLATES: `
        CREATE TABLE IF NOT EXISTS templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            contenido TEXT NOT NULL,
            image_path TEXT
        )
    `,
    PERSISTENCE: `
        CREATE TABLE IF NOT EXISTS persistence (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `
};

/**
 * Consultas de Migración y Optimización 🚀
 */
export const MIGRATIONS = [
    'ALTER TABLE templates ADD COLUMN image_path TEXT',
    'ALTER TABLE leads ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP',
    'ALTER TABLE leads ADD COLUMN nombre TEXT',
    "ALTER TABLE leads ADD COLUMN tipo TEXT DEFAULT 'manual'",
    "ALTER TABLE leads ADD COLUMN meta_id TEXT",
    "ALTER TABLE leads ADD COLUMN reparado INTEGER DEFAULT 0"
];

/**
 * Índices de Alto Rendimiento ⚡
 */
export const INDEXES = [
    'CREATE INDEX IF NOT EXISTS idx_leads_nombre ON leads(nombre)',
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_logs_unique ON logs(telefono, mensaje, tipo, fecha)'
];
