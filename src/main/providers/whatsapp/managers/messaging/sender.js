/**
 * Sub-manejador: Envío de Mensajes ✉️
 */

export async function send(client, phone, msg) {
    if (!client) throw new Error('Cliente no inicializado');
    const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
    
    // El registro en BD se delega automáticamente al evento message_create
    return await client.sendMessage(chatId, msg);
}

export async function isRegistered(client, phone) {
    if (!client) return false;
    const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
    try {
        return await client.isRegisteredUser(chatId);
    } catch (err) {
        return false;
    }
}
