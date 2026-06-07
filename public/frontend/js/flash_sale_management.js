document.addEventListener('DOMContentLoaded', () => {
    // State Management
    let sessionsList = [];
    let menuList = [];
    let editingId = null;

    // DOM Elements
    const searchInput = document.getElementById('search-flash-sale');
    const statusFilter = document.getElementById('status-filter');
    const sessionTableBody = document.getElementById('session-table-body');
    const addSessionBtn = document.getElementById('add-session-btn');
    const sessionModal = document.getElementById('session-modal');
    const closeModal = document.getElementById('close-modal');
    const sessionForm = document.getElementById('session-form');
    const modalTitle = document.getElementById('modal-title');
    const menuItemsRows = document.getElementById('menu-items-rows');
    const addMenuItemRowBtn = document.getElementById('add-menu-item-row');

    // Stats Elements
    const totalActiveSessionsEl = document.getElementById('total-active-sessions');
    const totalItemsSoldEl = document.getElementById('total-items-sold');
    const salesProgressEl = document.getElementById('sales-progress');
    const salesTextEl = document.getElementById('sales-text');
    const totalPromoItemsEl = document.getElementById('total-promo-items');
    const totalUpcomingSessionsEl = document.getElementById('total-upcoming-sessions');

    // Fetch and populate menu list for dropdowns
    async function loadMenuList() {
        try {
            const response = await fetch('../../api/menu/read.php');
            const result = await response.json();
            if (result.status === 'success') {
                menuList = result.data;
            } else {
                showToast('Failed to load menu list: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error loading menus:', error);
        }
    }

    // Generate dynamic item row inside modal
    function createMenuItemRow(data = null) {
        const row = document.createElement('div');
        row.className = 'flex gap-3 items-center bg-surface-container p-3 rounded-lg menu-item-row';
        
        // Select Menu Dropdown
        const menuSelect = document.createElement('select');
        menuSelect.required = true;
        menuSelect.className = 'flex-1 bg-surface-container-high border-none rounded-lg text-xs font-medium text-on-surface focus:ring-1 focus:ring-primary py-2 px-3';
        menuSelect.innerHTML = menuList.map(m => `
            <option value="${m.id_menu}">[${m.nama_kategori}] ${m.nama_menu} (Rp ${parseFloat(m.harga).toLocaleString('id-ID')})</option>
        `).join('');
        if (data) {
            menuSelect.value = data.id_menu;
        }

        // Promo Price Input
        const priceContainer = document.createElement('div');
        priceContainer.className = 'w-36 relative';
        const priceInput = document.createElement('input');
        priceInput.type = 'number';
        priceInput.placeholder = 'Promo Price';
        priceInput.required = true;
        priceInput.min = '1';
        priceInput.className = 'w-full bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface focus:ring-1 focus:ring-primary py-2 px-3 promo-price-input';
        if (data) {
            priceInput.value = data.harga_promo;
        }
        priceContainer.appendChild(priceInput);

        // Promo Stock Input
        const stockContainer = document.createElement('div');
        stockContainer.className = 'w-24';
        const stockInput = document.createElement('input');
        stockInput.type = 'number';
        stockInput.placeholder = 'Stock';
        stockInput.required = true;
        stockInput.min = '1';
        stockInput.className = 'w-full bg-surface-container-high border-none rounded-lg text-xs font-bold text-center text-on-surface focus:ring-1 focus:ring-primary py-2 px-3 promo-stock-input';
        stockInput.value = data ? data.stok_promo : 10;
        stockContainer.appendChild(stockInput);

        // Delete Row Button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'p-2 hover:bg-error-container/20 text-on-surface-variant hover:text-error rounded-full transition-colors flex items-center justify-center';
        removeBtn.innerHTML = '<span class="material-symbols-outlined text-sm">delete_outline</span>';
        removeBtn.onclick = () => row.remove();

        row.appendChild(menuSelect);
        row.appendChild(priceContainer);
        row.appendChild(stockContainer);
        row.appendChild(removeBtn);

        menuItemsRows.appendChild(row);
    }

    addMenuItemRowBtn.addEventListener('click', () => createMenuItemRow());

    // Fetch and populate sessions table and calculate overall dashboard stats
    async function fetchSessions() {
        const filterVal = statusFilter.value;
        try {
            const response = await fetch(`../../api/flash_sale/read.php?status=${filterVal}`);
            const result = await response.json();
            if (result.status === 'success') {
                sessionsList = result.data;
                renderSessions();
                calculateStats();
            } else {
                showToast('Failed to fetch sessions: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
            showToast('Connection error', 'error');
        }
    }

    function calculateStats() {
        let activeCount = 0;
        let upcomingCount = 0;
        let totalPromoItems = 0;
        let totalAllocatedStock = 0;
        let totalSoldStock = 0;

        sessionsList.forEach(session => {
            const status = session.computed_status;
            if (status === 'active') activeCount++;
            if (status === 'scheduled') upcomingCount++;
            
            totalPromoItems += session.item_count;
            totalAllocatedStock += session.total_stok;
            totalSoldStock += session.total_terjual;
        });

        totalActiveSessionsEl.textContent = activeCount;
        totalPromoItemsEl.textContent = totalPromoItems;
        totalUpcomingSessionsEl.textContent = upcomingCount;
        totalItemsSoldEl.textContent = totalSoldStock;

        const percentage = totalAllocatedStock > 0 ? Math.round((totalSoldStock / totalAllocatedStock) * 100) : 0;
        salesProgressEl.style.width = `${percentage}%`;
        salesTextEl.textContent = `${percentage}% of total allocated stock claimed (${totalSoldStock}/${totalAllocatedStock})`;
    }

    function renderSessions() {
        const query = searchInput.value.toLowerCase().trim();
        const filtered = sessionsList.filter(s => s.nama_flash_sale.toLowerCase().includes(query));

        sessionTableBody.innerHTML = '';

        if (filtered.length === 0) {
            sessionTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-8 py-10 text-center text-on-surface-variant font-medium">
                        No flash sale sessions found.
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(session => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-surface-container-low/30 transition-colors group';

            // Format date time
            const startFmt = new Date(session.waktu_mulai).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            const endFmt = new Date(session.waktu_selesai).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            // Dynamic Status Pill colors
            let statusPillClass = '';
            let statusLabel = '';
            
            switch (session.computed_status) {
                case 'active':
                    statusPillClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400';
                    statusLabel = 'Active';
                    break;
                case 'scheduled':
                    statusPillClass = 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400';
                    statusLabel = 'Scheduled';
                    break;
                case 'expired':
                    statusPillClass = 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
                    statusLabel = 'Expired';
                    break;
                case 'inactive':
                    statusPillClass = 'bg-neutral-100 text-neutral-500 line-through';
                    statusLabel = 'Inactive';
                    break;
            }

            // Sales percentage progress bar for this session
            const percent = session.total_stok > 0 ? Math.round((session.total_terjual / session.total_stok) * 100) : 0;

            tr.innerHTML = `
                <td class="px-8 py-6">
                    <div>
                        <p class="font-bold text-on-surface leading-tight">${session.nama_flash_sale}</p>
                        <p class="text-xs text-on-surface-variant font-medium mt-1">ID: FS-${session.id_flash_sale}</p>
                    </div>
                </td>
                <td class="px-6 py-6 text-sm font-medium text-on-surface">${startFmt}</td>
                <td class="px-6 py-6 text-sm font-medium text-on-surface">${endFmt}</td>
                <td class="px-6 py-6 text-sm font-bold text-primary">${session.item_count} items</td>
                <td class="px-6 py-6">
                    <div class="flex items-center gap-1.5 px-3 py-1 rounded-full w-fit ${statusPillClass}">
                        <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span class="text-xs font-bold">${statusLabel}</span>
                    </div>
                </td>
                <td class="px-6 py-6">
                    <div class="w-32">
                        <div class="flex justify-between items-center text-[10px] font-bold text-on-surface-variant mb-1">
                            <span>${percent}%</span>
                            <span>${session.total_terjual} / ${session.total_stok} sold</span>
                        </div>
                        <div class="h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div class="h-full bg-primary rounded-full transition-all duration-300" style="width: ${percent}%;"></div>
                        </div>
                    </div>
                </td>
                <td class="px-8 py-6 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button class="p-2 hover:bg-primary/10 hover:text-primary text-on-surface-variant rounded-full transition-all toggle-status-btn" data-id="${session.id_flash_sale}" title="${session.is_active == 1 ? 'Disable' : 'Enable'}">
                            <span class="material-symbols-outlined text-[20px]">${session.is_active == 1 ? 'visibility_off' : 'visibility'}</span>
                        </button>
                        <button class="p-2 hover:bg-primary/10 hover:text-primary text-on-surface-variant rounded-full transition-all edit-btn" data-id="${session.id_flash_sale}" title="Edit">
                            <span class="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button class="p-2 hover:bg-error-container/20 hover:text-error text-on-surface-variant rounded-full transition-all delete-btn" data-id="${session.id_flash_sale}" title="Delete">
                            <span class="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                    </div>
                </td>
            `;

            sessionTableBody.appendChild(tr);
        });

        attachRowActionListeners();
    }

    function attachRowActionListeners() {
        // Toggle Active Status
        document.querySelectorAll('.toggle-status-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                try {
                    const response = await fetch('../../api/flash_sale/toggle_status.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id_flash_sale: id })
                    });
                    const result = await response.json();
                    if (result.status === 'success') {
                        showToast(result.message);
                        fetchSessions();
                    } else {
                        showToast(result.message, 'error');
                    }
                } catch (error) {
                    console.error('Error toggling status:', error);
                    showToast('Connection error', 'error');
                }
            });
        });

        // Edit Sesi
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                try {
                    const response = await fetch(`../../api/flash_sale/read.php?id_flash_sale=${id}`);
                    const result = await response.json();
                    if (result.status === 'success') {
                        openEditModal(result.data);
                    } else {
                        showToast('Failed to load flash sale details', 'error');
                    }
                } catch (error) {
                    console.error('Error reading flash sale:', error);
                    showToast('Connection error', 'error');
                }
            });
        });

        // Delete Sesi
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (confirm('Are you absolutely sure you want to delete this Flash Sale campaign? All participation history will be archived.')) {
                    try {
                        const response = await fetch('../../api/flash_sale/delete.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id_flash_sale: id })
                        });
                        const result = await response.json();
                        if (result.status === 'success') {
                            showToast(result.message);
                            fetchSessions();
                        } else {
                            showToast(result.message, 'error');
                        }
                    } catch (error) {
                        console.error('Error deleting session:', error);
                        showToast('Connection error', 'error');
                    }
                }
            });
        });
    }

    // Modal Operations
    addSessionBtn.addEventListener('click', () => {
        editingId = null;
        modalTitle.textContent = 'Create New Flash Sale';
        sessionForm.reset();
        menuItemsRows.innerHTML = '';
        createMenuItemRow(); // start with one blank row
        
        sessionModal.classList.remove('hidden');
        sessionModal.classList.add('flex');
    });

    function closeSessionModal() {
        sessionModal.classList.add('hidden');
        sessionModal.classList.remove('flex');
        editingId = null;
        sessionForm.reset();
        menuItemsRows.innerHTML = '';
    }

    closeModal.addEventListener('click', closeSessionModal);
    sessionModal.addEventListener('click', (e) => {
        if (e.target === sessionModal) closeSessionModal();
    });

    function openEditModal(data) {
        editingId = data.id_flash_sale;
        modalTitle.textContent = 'Edit Flash Sale Session';
        
        document.getElementById('session-name').value = data.nama_flash_sale;
        
        // Format datetime string local for input type datetime-local (requires YYYY-MM-DDTHH:MM)
        const formatLocal = (str) => {
            const d = new Date(str);
            const pad = (n) => n.toString().padLeft(2, '0');
            const year = d.getFullYear();
            const month = pad(d.getMonth() + 1);
            const date = pad(d.getDate());
            const hours = pad(d.getHours());
            const minutes = pad(d.getMinutes());
            return `${year}-${month}-${date}T${hours}:${minutes}`;
        };

        // Custom string padLeft polyfill helper
        if (!String.prototype.padLeft) {
            String.prototype.padLeft = function(length, character) {
                return this.length >= length ? this.toString() : (new Array(length - this.length + 1).join(character || ' ') + this).toString();
            };
        }
        if (!Number.prototype.padLeft) {
            Number.prototype.padLeft = function(length, character) {
                return this.toString().padLeft(length, character);
            };
        }

        document.getElementById('session-start').value = formatLocal(data.waktu_mulai);
        document.getElementById('session-end').value = formatLocal(data.waktu_selesai);

        menuItemsRows.innerHTML = '';
        if (data.items && data.items.length > 0) {
            data.items.forEach(item => createMenuItemRow(item));
        } else {
            createMenuItemRow();
        }

        sessionModal.classList.remove('hidden');
        sessionModal.classList.add('flex');
    }

    // Submit Form
    sessionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Validate dates
        const startVal = document.getElementById('session-start').value;
        const endVal = document.getElementById('session-end').value;
        const startTime = new Date(startVal);
        const endTime = new Date(endVal);

        if (endTime <= startTime) {
            showToast('Waktu selesai harus setelah waktu mulai', 'warning');
            return;
        }

        // 2. Validate and compile items
        const rows = document.querySelectorAll('.menu-item-row');
        if (rows.length === 0) {
            showToast('Minimal harus menambahkan 1 menu ke dalam Flash Sale', 'warning');
            return;
        }

        const items = [];
        const selectedMenuIds = new Set();
        let hasDuplicate = false;

        rows.forEach(row => {
            const menuSelect = row.querySelector('select');
            const priceInput = row.querySelector('.promo-price-input');
            const stockInput = row.querySelector('.promo-stock-input');

            const id_menu = parseInt(menuSelect.value);
            const harga_promo = parseFloat(priceInput.value);
            const stok_promo = parseInt(stockInput.value);

            if (selectedMenuIds.has(id_menu)) {
                hasDuplicate = true;
            }
            selectedMenuIds.add(id_menu);

            items.push({
                id_menu,
                harga_promo,
                stok_promo
            });
        });

        if (hasDuplicate) {
            showToast('Ada duplikasi menu yang dipilih. Harap pilih menu yang berbeda.', 'warning');
            return;
        }

        // 3. Construct Payload
        const payload = {
            nama_flash_sale: document.getElementById('session-name').value.trim(),
            waktu_mulai: startVal.replace('T', ' ') + ':00',
            waktu_selesai: endVal.replace('T', ' ') + ':00',
            items
        };

        if (editingId) {
            payload.id_flash_sale = editingId;
        }

        const endpoint = editingId ? '../../api/flash_sale/update.php' : '../../api/flash_sale/create.php';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.status === 'success') {
                showToast(result.message);
                closeSessionModal();
                fetchSessions();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Error saving session:', error);
            showToast('Connection error', 'error');
        }
    });

    // Filtering & Searching
    statusFilter.addEventListener('change', fetchSessions);
    searchInput.addEventListener('input', renderSessions);

    // Toast feedback helper
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-6 left-6 z-[200] px-6 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-bottom duration-300 ${
            type === 'error' ? 'bg-error text-on-error' : 
            type === 'warning' ? 'bg-tertiary text-on-tertiary' : 
            'bg-on-surface text-surface'
        }`;
        
        let icon = 'check_circle';
        if (type === 'error') icon = 'error';
        else if (type === 'warning') icon = 'warning';

        toast.innerHTML = `
            <span class="material-symbols-outlined text-lg">${icon}</span>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('animate-out', 'fade-out', 'duration-300');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Initialize Page
    loadMenuList().then(() => {
        fetchSessions();
    });
});
