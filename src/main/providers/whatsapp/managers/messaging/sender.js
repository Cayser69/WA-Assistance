import { normalizePhone } from '../../../../services/database/models/leads/utils.js';

/**
 * Sub-manejador: Envío de Mensajes ✉️
 * Responsabilidad: Asegurar que el formato del destinatario sea 100% compatible con WA-Web.js.
 * ✅ Soporte para LIDs (No LID for user error fix)
 */
export async function send(client, phone, msg) {
    if (!client) throw new Error('Cliente de WhatsApp no inicializado');
    
    let chatId;
    
    // 1. Si ya es un JID completo (Grupo o ID resuelto), lo usamos directo 🎯
    if (phone.includes('@')) {
        chatId = phone;
    } else {
        // 2. Si es un número, intentamos resolver el JID oficial (maneja @c.us y @lid) 🛰️
        try {
            const cleanPhone = normalizePhone(phone);
            if (!cleanPhone) throw new Error('Número de teléfono inválido');

            console.log(`[WhatsApp/Sender] 🔍 Resolviendo ID oficial para: ${cleanPhone}...`);
            const idInfo = await client.getNumberId(cleanPhone);
            
            if (idInfo && idInfo._serialized) {
                chatId = idInfo._serialized;
                console.log(`[WhatsApp/Sender] ✅ ID Resuelto: ${chatId}`);
            } else {
                // Fallback clásico si la resolución falla pero el número parece válido
                chatId = `${cleanPhone}@c.us`;
                console.warn(`[WhatsApp/Sender] ⚠️ No se pudo resolver ID oficial, usando fallback: ${chatId}`);
            }
        } catch (err) {
            console.error('[WhatsApp/Sender] ❌ Error en resolución de ID:', err.message);
            // Fallback final
            const cleanPhone = normalizePhone(phone);
            chatId = `${cleanPhone}@c.us`;
        }
    }
    
    console.log(`[WhatsApp/Sender] 📤 Enviando mensaje a: ${chatId}`);
    
    try {
        return await client.sendMessage(chatId, msg);
    } catch (err) {
        console.error(`[WhatsApp/Sender] ❌ Error en sendMessage (${chatId}):`, err.message);
        throw err;
    }
}

/**
 * Verifica si un número está registrado en WhatsApp.
 */
export async function isRegistered(client, phone) {
    if (!client) return false;
    
    try {
        let chatId;
        if (phone.includes('@')) {
            chatId = phone;
        } else {
            const cleanPhone = normalizePhone(phone);
            if (!cleanPhone) return false;
            
            const idInfo = await client.getNumberId(cleanPhone);
            chatId = idInfo ? idInfo._serialized : `${cleanPhone}@c.us`;
        }
        
        return await client.isRegisteredUser(chatId);
    } catch (err) {
        return false;
    }
}
