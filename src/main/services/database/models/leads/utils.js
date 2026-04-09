/**
 * Utilidades de Normalización y Validación para Leads 🛠️
 */

/**
 * Normaliza un número de teléfono al formato estándar de WhatsApp (solo dígitos).
 * Ej: +34 600 000 000 -> 34600000000
 */
export function normalizePhone(phone) {
    if (!phone) return null;
    // Eliminar todo lo que no sea dígito
    let clean = phone.toString().replace(/\D/g, '');
    
    // Estandarización: Si tiene 9 dígitos (España), anteponer el 34
    if (clean.length === 9) {
        clean = '34' + clean;
    }
    
    return clean;
}

/**
 * Determina si una cadena parece ser un ID interno de Meta (WhatsApp) en lugar de un teléfono humano.
 * Generalmente los IDs internos son mucho más largos (> 13 dígitos).
 */
export function isInternalID(phone) {
    if (!phone) return false;
    const digits = phone.toString().replace(/\D/g, '');
    return digits.length >= 13;
}
