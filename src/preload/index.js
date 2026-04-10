const { contextBridge, ipcRenderer } = require('electron');

/**
 * Puente para exponer funciones de la DB de manera segura hacia el frontend.
 */
contextBridge.exposeInMainWorld('api', {
    // Funciones de base de datos
    getPendingLeads: () => ipcRenderer.invoke('db:getPendingLeads'),
    getLeads: (filter, limit, offset, search) => ipcRenderer.invoke('db:getLeads', filter, limit, offset, search),
    getLeadsCount: (filter, search) => ipcRenderer.invoke('db:getLeadsCount', filter, search),
    insertLead: (telefono, nombre) => ipcRenderer.invoke('db:insertLead', telefono, nombre),
    deleteLeads: (ids) => ipcRenderer.invoke('db:deleteLeads', ids),
    markAsContacted: (id) => ipcRenderer.invoke('db:markAsContacted', id),
    saveLog: (data) => ipcRenderer.invoke('db:saveLog', data),
    getChats: () => ipcRenderer.invoke('db:get-chats'),
    getChatMessages: (tel) => ipcRenderer.invoke('db:get-chat-messages', tel),
    truncateLeads: () => ipcRenderer.invoke('db:truncate-leads'),

    // Campaña
    startCampaign: (data) => ipcRenderer.invoke('wa:start-campaign', data),
    stopCampaign: () => ipcRenderer.invoke('wa:stop-campaign'),

    // Eventos WhatsApp
    onQRUpdate: (callback) => ipcRenderer.on('wa:qr-update', (event, qr) => callback(qr)),
    onWAStatus: (callback) => ipcRenderer.on('wa:status', (event, status) => callback(status)),
    onCampaignStatus: (callback) => ipcRenderer.on('wa:campaign-status', (e, status) => callback(status)),
    onCampaignProgress: (callback) => ipcRenderer.on('wa:campaign-progress', (e, data) => callback(data)),
    onMessageLog: (callback) => ipcRenderer.on('wa:log', (e, log) => callback(log)),
    logout: () => ipcRenderer.invoke('wa:logout'),
    getWAStatus: () => ipcRenderer.invoke('wa:get-status'),
    getCampaignStatus: () => ipcRenderer.invoke('wa:get-campaign-status'),
    syncContacts: () => ipcRenderer.invoke('wa:sync-contacts'),

    // ✅ Evento: sincronización de chats completada (para recargar la lista)
    onChatsSynced: (callback) => ipcRenderer.on('wa:chats-synced', () => callback()),

    // ✅ Evento: mensaje entrante recibido en tiempo real
    onMessageReceived: (callback) => ipcRenderer.on('wa:message-received', (event, data) => callback(data)),

    // ✅ Evento: actualización de estado de entrega (Ack) 🛰️
    onMessageAck: (callback) => ipcRenderer.on('wa:message-ack', (event, data) => callback(data)),

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
    getAISuggestion: (phone) => ipcRenderer.invoke('ai:get-suggestion', { phone }),

    // WhatsApp Direct
    sendMessage: (phone, message) => ipcRenderer.invoke('wa:send-message', { phone, message }),

        // Configuración Persistente (SQLite)
    saveSetting: (key, value) => ipcRenderer.invoke('db:saveSetting', { key, value }),
    saveSettings: (settings) => ipcRenderer.invoke('db:saveSettings', settings),
    getSetting: (key) => ipcRenderer.invoke('db:getSetting', key),
    getAllSettings: () => ipcRenderer.invoke('db:getAllSettings'),

    // Plantillas
    saveTemplate: (data) => ipcRenderer.invoke('db:saveTemplate', data),
    getTemplates: () => ipcRenderer.invoke('db:getTemplates'),
    deleteTemplate: (id) => ipcRenderer.invoke('db:deleteTemplate', id),

    // Multimedia y Sistema
    importTemplateImage: (path) => ipcRenderer.invoke('media:importTemplateImage', path),

    // Ruta base del proyecto (para HTML/CSS del renderer)
    getAppPath: () => ipcRenderer.invoke('app:getPath'),

    // Ruta de userData (donde están las imágenes y la DB)
    getUserDataPath: () => ipcRenderer.invoke('app:getUserDataPath'),

    openFileDialog: (filters) => ipcRenderer.invoke('dialog:openFile', { filters }),

    // Alias para compatibilidad con multimedia.js
    openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),

    // Cargador de Plantillas (IPC)
    readTemplate: (relativePath) => ipcRenderer.invoke('app:read-template', relativePath),

    // Puente Genérico (Para compatibilidad con módulos existentes) 🛠️
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
});