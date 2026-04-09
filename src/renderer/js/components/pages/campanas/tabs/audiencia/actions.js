import { AppOverlay } from '../../../../layout/loading-overlay/index.js';

/**
 * Sub-manejador: Acciones de Audiencia 👥⚡
 */

export const AudienciaActions = {
    setup: (context) => {
        const { appState, pagination, refresh } = context;

        // --- Añadir Contacto ---
        const btnAdd = document.getElementById('btn-add-lead');
        const inputPhone = document.getElementById('new-lead-phone');
        const inputName = document.getElementById('new-lead-name');

        if (btnAdd && inputPhone) {
            btnAdd.onclick = async () => {
                const tel = inputPhone.value.trim();
                const name = inputName ? inputName.value.trim() : null;

                if (!tel) return;

                // Estado de Carga Local
                const originalHTML = btnAdd.innerHTML;
                btnAdd.disabled = true;
                btnAdd.innerHTML = '<span class="material-icons-outlined animate-spin" style="font-size: 1.1rem;">sync</span>';

                try {
                    const res = await window.api.insertLead(tel, name);
                    inputPhone.value = '';
                    if (inputName) inputName.value = '';
                    await refresh();
                } catch (err) {
                    console.error('[Audiencia] Error al añadir lead:', err);
                } finally {
                    btnAdd.disabled = false;
                    btnAdd.innerHTML = originalHTML;
                }
            };
        }

        // --- Sincronizar WhatsApp ---
        const btnSync = document.getElementById('btn-sync-contacts');
        if (btnSync) {
            btnSync.onclick = async () => {
                await AppOverlay.show('Sincronizando contactos desde WhatsApp...');
                try {
                    const res = await window.api.syncContacts();
                    if (res.success) {
                        alert(`Sincronización lista: ${res.imported} nuevos contactos.`);
                        await refresh();
                    } else alert('Error: ' + res.error);
                } catch (err) {
                    console.error('[Audiencia] Error en sincronización:', err);
                } finally {
                    AppOverlay.hide();
                    appState.updateWAStatusUI(appState.waStatus);
                }
            };
        }

        // --- Eliminar Seleccionados ---
        const btnDeleteSelected = document.getElementById('btn-delete-selected');
        if (btnDeleteSelected) {
            btnDeleteSelected.onclick = async () => {
                const selectedIds = appState.selectedLeads.map(l => l.id);
                
                if (selectedIds.length === 0) {
                    alert('No has seleccionado ningún contacto para eliminar.');
                    return;
                }

                if (confirm(`¿Estás seguro de que quieres eliminar los ${selectedIds.length} contactos seleccionados?`)) {
                    await AppOverlay.show(`Eliminando ${selectedIds.length} contactos...`);
                    try {
                        await window.api.deleteLeads(selectedIds);
                        appState.selectedLeads = []; // Limpiar selección
                        context.updateCount();
                        await refresh();
                    } catch (err) {
                        console.error('[Audiencia] Error al eliminar:', err);
                    } finally {
                        AppOverlay.hide();
                    }
                }
            };
        }

        // --- Selección Global (Ubicada en el encabezado de la tabla) ---
        const masterCheckbox = document.getElementById('master-checkbox');
        if (masterCheckbox) {
            masterCheckbox.onchange = () => {
                const checked = masterCheckbox.checked;
                document.querySelectorAll('.lead-checkbox').forEach(cb => {
                    cb.checked = checked;
                    const id = parseInt(cb.dataset.id);
                    if (checked) {
                        if (!appState.selectedLeads.find(l => l.id === id)) {
                            appState.selectedLeads.push({ id, telefono: cb.dataset.phone });
                        }
                    } else {
                        appState.selectedLeads = appState.selectedLeads.filter(l => l.id !== id);
                    }
                });
                context.updateCount();
            };
        }

        const btnClear = document.getElementById('btn-select-none');
        if (btnClear) {
            btnClear.onclick = () => {
                document.querySelectorAll('.lead-checkbox').forEach(cb => cb.checked = false);
                appState.selectedLeads = []; // Limpiar selección GLOBAL
                if (masterCheckbox) masterCheckbox.checked = false;
                context.updateCount();
                alert('Toda la selección ha sido limpiada.');
            };
        }

        // --- Navegación ---
        document.getElementById('btn-go-to-message').onclick = () => {
            if (appState.selectedLeads.length === 0) {
                if (!confirm('No has seleccionado a nadie. ¿Ir a enviar a todos los pendientes?')) return;
            }
            window.router.navigate('campanas', { tab: 'mensaje' });
        };
    }
};
