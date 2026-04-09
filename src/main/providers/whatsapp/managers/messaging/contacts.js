/**
 * Sub-manejador: Gestión de Contactos 📱
 */

export async function getContactName(client, phone) {
    if (!client) return null;
    try {
        const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
        const contact = await client.getContactById(chatId);
        return contact.pushname || contact.name || null;
    } catch (err) {
        return null;
    }
}

export async function getContacts(client) {
    if (!client) return [];
    try {
        return await client.getContacts();
    } catch (err) {
        console.error('[MessagingManager/Contacts] Error al obtener contactos:', err);
        return [];
    }
}
