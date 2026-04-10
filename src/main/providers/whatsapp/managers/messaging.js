import * as sender from './messaging/sender.js';
import * as contacts from './messaging/contacts.js';
import * as handler from './messaging/handler.js';

/**
 * Gestor de Mensajería y Contactos de WhatsApp (Orquestador Modular) 📂🏗️🧼
 * Responsabilidad: Envío de mensajes, búsqueda de contactos e integración con IA.
 */
export class MessagingManager {
    constructor(client, mainWindow) {
        this.client = client;
        this.mainWindow = mainWindow;
    }

    /**
     * Envia un mensaje a un número específico.
     */
    async send(phone, msg) {
        return await sender.send(this.client, phone, msg);
    }

    /**
     * Verifica si un número está registrado en WhatsApp.
     */
    async isRegistered(phone) {
        return await sender.isRegistered(this.client, phone);
    }

    /**
     * Obtiene el nombre público (pushname) de un contacto.
     */
    async getContactName(phone) {
        return await contacts.getContactName(this.client, phone);
    }

    /**
     * Obtiene todos los contactos registrados en el teléfono.
     */
    async getContacts() {
        return await contacts.getContacts(this.client);
    }

    /**
     * Lógica de respuesta automática con IA y registro de historial.
     */
    async handleMessage(msg) {
        await handler.handleMessage(msg, {
            client: this.client,
            mainWindow: this.mainWindow
        });
    }

    /**
     * Gestiona las confirmaciones de lectura/entrega. 🛰️
     */
    async handleMessageAck(msg, ack) {
        await handler.handleMessageAck(msg, ack, {
            mainWindow: this.mainWindow
        });
    }
}
