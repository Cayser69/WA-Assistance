/**
 * Sub-manejador: Paginación y Scroll Infinito 📟
 */

export class AudienciaPagination {
    constructor(config) {
        this.api = window.api;
        this.tbody = config.tbody;
        this.onRowsAdded = config.onRowsAdded;
        this.renderRow = config.renderRow;
        this.isSelected = config.isSelected;
        
        this.reset();
    }

    reset() {
        this.offset = 0;
        this.limit = 50;
        this.isLoading = false;
        this.hasMore = true;
    }

    async loadNextPage(filter, isAppend = false) {
        if (this.isLoading || (isAppend && !this.hasMore)) return;

        this.isLoading = true;
        if (!isAppend) {
            this.reset();
            this.tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Cargando...</td></tr>';
        }

        try {
            const leads = await this.api.getLeads(filter, this.limit, this.offset);
            
            if (leads.length < this.limit) this.hasMore = false;
            if (!isAppend) this.tbody.innerHTML = '';

            if (leads.length === 0 && !isAppend) {
                this.tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px; color: var(--text-muted);">Sin registros</td></tr>';
            } else {
                const rowsHtml = leads.map(l => this.renderRow(l, this.isSelected(l.id))).join('');
                
                if (isAppend) {
                    this.tbody.insertAdjacentHTML('beforeend', rowsHtml);
                } else {
                    this.tbody.innerHTML = rowsHtml;
                }

                if (this.hasMore) {
                    this.setupSentinel(filter);
                }
            }

            this.offset += leads.length;
            if (this.onRowsAdded) this.onRowsAdded();
            
        } catch (err) {
            console.error('[Pagination] Error:', err);
        } finally {
            this.isLoading = false;
        }
    }

    setupSentinel(filter) {
        const sentinel = document.createElement('tr');
        sentinel.className = 'load-more-sentinel';
        sentinel.innerHTML = `
            <td colspan="5" style="text-align:center; padding: 15px; color: var(--primary); font-size: 0.8rem;">
                <span class="animate-spin material-icons-outlined" style="font-size: 1rem; vertical-align: middle;">sync</span> 
                Cargando más contactos...
            </td>
        `;
        this.tbody.appendChild(sentinel);

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                observer.unobserve(sentinel);
                sentinel.remove();
                this.loadNextPage(filter, true);
            }
        }, { threshold: 0.1 });
        
        observer.observe(sentinel);
    }
}
