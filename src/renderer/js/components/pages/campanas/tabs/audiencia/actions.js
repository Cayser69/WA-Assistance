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

                if (tel) {
                    const res = await window.api.insertLead(tel, name);
                    if (res.isDuplicate) {
                        // Si era duplicado, simplemente refrescamos para mostrar los datos actualizados (nombre, etc)
                        inputPhone.value = '';
                        if (inputName) inputName.value = '';
                        refresh();
                    } else if (res.error) {
                        alert('Error: ' + res.error);
                    } else {
                        inputPhone.value = '';
                        if (inputName) inputName.value = '';
                        refresh();
                    }
                }
            };
        }

        // --- Sincronizar WhatsApp ---
        const btnSync = document.getElementById('btn-sync-contacts');
        if (btnSync) {
            btnSync.onclick = async () => {
                btnSync.disabled = true;
                btnSync.innerHTML = '<span class="material-icons-outlined animate-spin" style="font-size: 1rem; vertical-align: middle;">sync</span> SINCRONIZANDO...';
                try {
                    const res = await window.api.syncContacts();
                    if (res.success) {
                        alert(`Sincronización lista: ${res.imported} nuevos contacts.`);
                        refresh();
                    } else alert('Error: ' + res.error);
                } finally {
                    btnSync.disabled = false;
                    btnSync.innerHTML = '<span class="material-icons-outlined" style="font-size: 1rem; vertical-align: middle;">sync</span> SINCRONIZAR AHORA';
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
                    await window.api.deleteLeads(selectedIds);
                    appState.selectedLeads = []; // Limpiar selección
                    context.updateCount();
                    refresh();
                }
            };
        }

        // --- Selección Global ---
        document.getElementById('btn-select-all').onclick = () => {
            document.querySelectorAll('.lead-checkbox').forEach(cb => {
                cb.checked = true;
                const id = parseInt(cb.dataset.id);
                if (!appState.selectedLeads.find(l => l.id === id)) {
                    appState.selectedLeads.push({ id, telefono: cb.dataset.phone });
                }
            });
            document.getElementById('master-checkbox').checked = true;
            context.updateCount();
        };

        document.getElementById('btn-select-none').onclick = () => {
            document.querySelectorAll('.lead-checkbox').forEach(cb => cb.checked = false);
            appState.selectedLeads = [];
            document.getElementById('master-checkbox').checked = false;
            context.updateCount();
        };

        // --- Navegación ---
        document.getElementById('btn-go-to-message').onclick = () => {
            if (appState.selectedLeads.length === 0) {
                if (!confirm('No has seleccionado a nadie. ¿Ir a enviar a todos los pendientes?')) return;
            }
            window.router.navigate('campanas', { tab: 'mensaje' });
        };
    }
};
