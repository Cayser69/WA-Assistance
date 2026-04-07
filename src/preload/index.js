const { contextBridge, ipcRenderer } = require('electron');

/**
 * Puente para exponer funciones de la DB de manera segura hacia el frontend.
 */
contextBridge.exposeInMainWorld('api', {
    // Funciones de base de datos
    getPendingLeads: () => ipcRenderer.invoke('db:getPendingLeads'),
    getLeads: (filter, limit, offset, search) => ipcRenderer.invoke('db:getLeads', filter, limit, offset, search),
    getLeadsCount: (filter, search) => ipcRenderer.invoke('db:getLeadsCount', filter, search),
    insertLead: (telefono) => ipcRenderer.invoke('db:insertLead', telefono),
    markAsContacted: (id) => ipcRenderer.invoke('db:markAsContacted', id),
    saveLog: (data) => ipcRenderer.invoke('db:saveLog', data),

    // Campaña
    startCampaign: (data) => ipcRenderer.invoke('wa:start-campaign', data),
    stopCampaign: () => ipcRenderer.invoke('wa:stop-campaign'),

    // Eventos WhatsApp
    onQRUpdate: (callback) => ipcRenderer.on('wa:qr-update', (event, qr) => callback(qr)),
    onWAStatus: (callback) => ipcRenderer.on('wa:status', (event, status) => callback(status)),
    onMessageLog: (callback) => ipcRenderer.on('wa:log', (event, log) => callback(log)),
    logout: () => ipcRenderer.invoke('wa:logout'),
    getWAStatus: () => ipcRenderer.invoke('wa:get-status'),
    getCampaignStatus: () => ipcRenderer.invoke('wa:get-campaign-status'),
    onCampaignStatus: (callback) => ipcRenderer.on('wa:campaign-status', (event, status) => callback(status)),

    // Scanner
    startScanner: (data, startIndex) => ipcRenderer.invoke('wa:startScanner', data, startIndex),
    stopScanner: () => ipcRenderer.invoke('wa:stopScanner'),
    getScannerStatus: () => ipcRenderer.invoke('wa:getScannerStatus'),
    onScannerUpdate: (callback) => ipcRenderer.on('scanner:status', (event, status) => callback(status)),
    startRepair: () => ipcRenderer.invoke('wa:startRepair'),

    // Tareas Persistentes
    checkPersistence: (key) => ipcRenderer.invoke('wa:check-persistence', key),
    clearPersistence: (key) => ipcRenderer.invoke('wa:clear-persistence', key),

    // Inteligencia Artificial
    setAIConfig: (config) => ipcRenderer.invoke('ai:config', config),
    onAIStatus: (callback) => ipcRenderer.on('wa:ai-status', (event, status) => callback(status)),
    canUseAI: () => ipcRenderer.invoke('ai:get-status'),

    // Configuración Persistente (SQLite)

    // Configuración Persistente (SQLite)
    saveSetting: (key, value) => ipcRenderer.invoke('db:saveSetting', { key, value }),
    getSetting: (key) => ipcRenderer.invoke('db:getSetting', key),
    getAllSettings: () => ipcRenderer.invoke('db:getAllSettings'),

    // Plantillas
    saveTemplate: (data) => ipcRenderer.invoke('db:saveTemplate', data),
    getTemplates: () => ipcRenderer.invoke('db:getTemplates'),
    deleteTemplate: (id) => ipcRenderer.invoke('db:deleteTemplate', id),

    // Multimedia y Sistema
    importTemplateImage: (path) => ipcRenderer.invoke('media:importTemplateImage', path),
    getAppPath: () => ipcRenderer.invoke('app:getPath'),
    openFile: (filters) => ipcRenderer.invoke('dialog:openFile', { filters }),
    
    // Nuevo: Cargador de Plantillas (IPC)
    readTemplate: (relativePath) => ipcRenderer.invoke('app:read-template', relativePath),
});
