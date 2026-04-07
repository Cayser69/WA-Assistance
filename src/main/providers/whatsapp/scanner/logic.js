import { waClient } from '../client.js';
import * as db from '../../../services/database/index.js';

/**
 * Gestor de Lógica de Validación del Scanner
 * Responsabilidad: Verificar existencia en WhatsApp y capturar pushname (nombre de perfil).
 */
export class ScannerLogic {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
    }

    /**
     * Valida si un número existe y lo inserta en la base de datos con su nombre.
     */
    async validateAndSave(phone) {
        const exists = await db.isLeadExists(phone);
        if (exists) return false;

        try {
            const isReg = await waClient.isRegistered(phone);
            if (isReg) {
                // Capturar nombre si es posible (Pushname de WhatsApp)
                const pushname = await waClient.getContactName(phone);
                await db.insertLead(phone, pushname);
                
                this.log(`✅ Encontrado válido ${phone}${pushname ? ` (${pushname})` : ''}`, 'success');
                return true;
            }
        } catch (err) {
            this.log(`❌ Error validando ${phone}: ${err.message}`, 'error');
        }
        return false;
    }

    /**
     * Intenta reparar un lead existente (capturar su nombre si no lo tenía).
     */
    async repairLead(lead) {
        try {
            const pushname = await waClient.getContactName(lead.telefono);
            if (pushname) {
                await db.updateLeadName(lead.id, pushname);
                this.log(`🛠️ Reparado: ${lead.telefono} -> ${pushname}`, 'success');
                return true;
            }
        } catch (err) {
            this.log(`❌ Fallo al reparar ${lead.telefono}`, 'error');
        }
        return false;
    }

    log(text, type) {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('wa:log', { text, type });
        }
    }
}
