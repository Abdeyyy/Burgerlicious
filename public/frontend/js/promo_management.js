document.addEventListener('DOMContentLoaded', () => {
    // State management
    let promosList = [];
    let editingId = null;

    // DOM Elements
    const searchInput = document.getElementById('search-promo');
    const statusFilter = document.getElementById('status-filter');
    const promoTableBody = document.getElementById('promo-table-body');
    const addPromoBtn = document.getElementById('add-promo-btn');
    const promoModal = document.getElementById('promo-modal');
    const closeModal = document.getElementById('close-modal');
    const promoForm = document.getElementById('promo-form');
    const modalTitle = document.getElementById('modal-title');
    const promoType = document.getElementById('promo-type');
    const discountValContainer = document.getElementById('discount-val-container');
    const discountValLabel = document.getElementById('discount-val-label');
    const promoTargetCategory = document.getElementById('promo-target-category');
    
    // Bundling Elements
    const bundlingContainer = document.getElementById('bundling-container');
    const bundlingRows = document.getElementById('bundling-rows');
    const addBundlingRowBtn = document.getElementById('add-bundling-row-btn');
    
    // State lists for bundling requirements
    let categoriesList = [];
    let menusList = [];

    // Stats elements
    const totalActivePromosEl = document.getElementById('total-active-promos');
    const totalRedemptionsEl = document.getElementById('total-redemptions');
    const targetProgressEl = document.getElementById('target-progress');
    const targetTextEl = document.getElementById('target-text');
    const promoDiscountValueEl = document.getElementById('promo-discount-value');
    const activePromoUsersEl = document.getElementById('active-promo-users');

    // Dynamic field toggle based on promo type
    promoType.addEventListener('change', () => {
        const val = promoType.value;
        
        // Hide target category if bundling
        const targetCategoryContainer = promoTargetCategory.closest('.space-y-1');
        if (val === 'bundling') {
            if (targetCategoryContainer) targetCategoryContainer.style.display = 'none';
            if (bundlingContainer) bundlingContainer.classList.remove('hidden');
        } else {
            if (targetCategoryContainer) targetCategoryContainer.style.display = 'block';
            if (bundlingContainer) bundlingContainer.classList.add('hidden');
        }

        if (val === 'bogo') {
            discountValContainer.style.display = 'none';
            document.getElementById('promo-discount').required = false;
        } else {
            discountValContainer.style.display = 'block';
            document.getElementById('promo-discount').required = true;
            if (val === 'percentage') {
                discountValLabel.textContent = 'Discount Value (%)';
                document.getElementById('promo-discount').placeholder = 'e.g. 15';
            } else if (val === 'bundling') {
                discountValLabel.textContent = 'Special Bundle Price (Rp)';
                document.getElementById('promo-discount').placeholder = 'e.g. 40000';
            } else {
                discountValLabel.textContent = 'Discount Value (Rp)';
                document.getElementById('promo-discount').placeholder = 'e.g. 20000';
            }
        }
    });

    // Load category dropdown options
    async function loadCategories() {
        try {
            const response = await fetch('../../api/kategori/read.php');
            const result = await response.json();
            if (result.status === 'success') {
                categoriesList = result.data;
                promoTargetCategory.innerHTML = '<option value="">All Categories</option>';
                result.data.forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat.id_kategori;
                    opt.textContent = cat.nama_kategori;
                    promoTargetCategory.appendChild(opt);
                });
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    // Load menu options
    async function loadMenus() {
        try {
            const response = await fetch('../../api/menu/read.php');
            const result = await response.json();
            if (result.status === 'success') {
                menusList = result.data;
            }
        } catch (error) {
            console.error('Failed to load menus:', error);
        }
    }

    // Generate bundling requirement input row
    function createBundlingRow(data = null) {
        const row = document.createElement('div');
        row.className = 'flex gap-2 items-center bg-surface-container-highest p-2 rounded-lg bundling-row';
        
        const typeSelect = document.createElement('select');
        typeSelect.name = 'bundling_types[]';
        typeSelect.className = 'bg-surface-container border-none rounded-lg text-xs font-bold text-on-surface focus:ring-1 focus:ring-primary py-1.5 px-2';
        typeSelect.innerHTML = `
            <option value="menu">Specific Menu</option>
            <option value="category">Category</option>
        `;
        if (data) {
            typeSelect.value = data.id_menu ? 'menu' : 'category';
        }

        const valueContainer = document.createElement('div');
        valueContainer.className = 'flex-1';
        
        function renderSelectors() {
            valueContainer.innerHTML = '';
            if (typeSelect.value === 'menu') {
                const menuSelect = document.createElement('select');
                menuSelect.name = 'bundling_menu_ids[]';
                menuSelect.className = 'w-full bg-surface-container border-none rounded-lg text-xs text-on-surface focus:ring-1 focus:ring-primary py-1.5 px-2';
                menuSelect.innerHTML = menusList.map(m => `
                    <option value="${m.id_menu}">${m.nama_menu}</option>
                `).join('');
                if (data && data.id_menu) {
                    menuSelect.value = data.id_menu;
                }
                valueContainer.appendChild(menuSelect);
                
                const hiddenCat = document.createElement('input');
                hiddenCat.type = 'hidden';
                hiddenCat.name = 'bundling_category_ids[]';
                hiddenCat.value = '';
                valueContainer.appendChild(hiddenCat);
            } else {
                const catSelect = document.createElement('select');
                catSelect.name = 'bundling_category_ids[]';
                catSelect.className = 'w-full bg-surface-container border-none rounded-lg text-xs text-on-surface focus:ring-1 focus:ring-primary py-1.5 px-2';
                catSelect.innerHTML = categoriesList.map(c => `
                    <option value="${c.id_kategori}">${c.nama_kategori}</option>
                `).join('');
                if (data && data.id_kategori) {
                    catSelect.value = data.id_kategori;
                }
                valueContainer.appendChild(catSelect);

                const hiddenMenu = document.createElement('input');
                hiddenMenu.type = 'hidden';
                hiddenMenu.name = 'bundling_menu_ids[]';
                hiddenMenu.value = '';
                valueContainer.appendChild(hiddenMenu);
            }
        }
        
        typeSelect.addEventListener('change', renderSelectors);
        renderSelectors();

        const qtyInput = document.createElement('input');
        qtyInput.type = 'number';
        qtyInput.name = 'bundling_qtys[]';
        qtyInput.value = data ? data.jumlah : 1;
        qtyInput.min = 1;
        qtyInput.className = 'w-16 bg-surface-container border-none rounded-lg text-xs font-bold text-center text-on-surface focus:ring-1 focus:ring-primary py-1.5 px-1';
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'p-1 hover:bg-error-container/20 text-on-surface-variant hover:text-error rounded-full transition-colors';
        removeBtn.innerHTML = '<span class="material-symbols-outlined text-sm">delete_outline</span>';
        removeBtn.onclick = () => row.remove();

        row.appendChild(typeSelect);
        row.appendChild(valueContainer);
        row.appendChild(qtyInput);
        row.appendChild(removeBtn);

        bundlingRows.appendChild(row);
    }
    
    if (addBundlingRowBtn) {
        addBundlingRowBtn.addEventListener('click', () => createBundlingRow());
    }

    // Fetch and display dashboard stats
    async function fetchStats() {
        try {
            const response = await fetch('../../api/promo/stats.php');
            const result = await response.json();
            if (result.status === 'success') {
                const stats = result.data;
                totalActivePromosEl.textContent = stats.total_active_promos;
                totalRedemptionsEl.textContent = stats.total_redemptions.toLocaleString('id-ID');
                targetProgressEl.style.width = `${stats.target_percentage}%`;
                targetTextEl.textContent = `${stats.target_percentage}% of monthly target achieved (${stats.monthly_redemptions}/1000)`;
                promoDiscountValueEl.textContent = formatRupiah(stats.total_discount_given);
                activePromoUsersEl.textContent = stats.active_promo_users.toLocaleString('id-ID');
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    // Fetch and display promo table lists
    async function fetchPromos() {
        const filterVal = statusFilter.value;
        try {
            const response = await fetch(`../../api/promo/read.php?status=${filterVal}`);
            const result = await response.json();
            if (result.status === 'success') {
                promosList = result.data;
                renderPromos();
            } else {
                showToast('Failed to fetch promos: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Failed to load promos:', error);
            showToast('Connection error', 'error');
        }
    }

    // Format Rupiah helper
    function formatRupiah(value) {
        return 'Rp ' + parseFloat(value).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    // Render table rows
    function renderPromos() {
        const searchQuery = searchInput.value.toLowerCase().trim();
        const filtered = promosList.filter(promo => {
            const nameMatch = promo.nama_promo.toLowerCase().includes(searchQuery);
            const codeMatch = promo.kode_promo ? promo.kode_promo.toLowerCase().includes(searchQuery) : false;
            return nameMatch || codeMatch;
        });

        promoTableBody.innerHTML = '';

        if (filtered.length === 0) {
            promoTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-8 py-10 text-center text-on-surface-variant font-medium">
                        No promotional campaigns found.
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(promo => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-surface-container-low/30 transition-colors group';

            // Image placeholder if empty
            const imgPath = promo.gambar_url ? `../../${promo.gambar_url}` : 'https://placehold.co/400x300/e0e0e0/666666?text=Burgerlicious+Promo';
            
            // Format Type Pill
            let typeLabel = '';
            if (promo.tipe_promo === 'percentage') typeLabel = 'Percentage';
            else if (promo.tipe_promo === 'fixed') typeLabel = 'Fixed Amount';
            else if (promo.tipe_promo === 'bogo') typeLabel = 'BOGO';
            else if (promo.tipe_promo === 'bundling') typeLabel = 'Bundling';

            // Format Discount Value Display
            let discountDisplay = '';
            if (promo.tipe_promo === 'percentage') {
                discountDisplay = `${parseFloat(promo.nilai_diskon)}%`;
            } else if (promo.tipe_promo === 'fixed') {
                discountDisplay = formatRupiah(promo.nilai_diskon);
            } else if (promo.tipe_promo === 'bundling') {
                discountDisplay = `Pkg: ${formatRupiah(promo.nilai_diskon)}`;
            } else {
                discountDisplay = 'Free Item';
            }

            // Target Category / Bundling Details
            let catTarget = '';
            if (promo.nama_kategori) {
                catTarget = `<p class="text-[10px] text-primary font-bold uppercase mt-0.5">Target: ${promo.nama_kategori}</p>`;
            } else if (promo.tipe_promo === 'bundling' && promo.bundling_items && promo.bundling_items.length > 0) {
                const reqStrings = promo.bundling_items.map(item => {
                    const name = item.nama_menu || item.nama_kategori;
                    const typeName = item.id_menu ? 'Menu' : 'Kategori';
                    return `${item.jumlah}x ${name} (${typeName})`;
                });
                catTarget = `<p class="text-[10px] text-primary font-bold uppercase mt-0.5">Bundling: ${reqStrings.join(' + ')}</p>`;
            }

            // Dynamic Status Pill colors
            let statusPillClass = '';
            let statusLabel = '';
            
            switch (promo.computed_status) {
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
                case 'maxed':
                    statusPillClass = 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400';
                    statusLabel = 'Limit Reached';
                    break;
                case 'inactive':
                    statusPillClass = 'bg-neutral-100 text-neutral-500 line-through';
                    statusLabel = 'Inactive';
                    break;
            }

            // Date Range Formatter
            const startFmt = new Date(promo.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            const endFmt = new Date(promo.tanggal_selesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

            // Active Days Formatter
            let daysLabel = '';
            if (promo.hari_aktif) {
                const dayTranslations = {
                    'Monday': 'Senin',
                    'Tuesday': 'Selasa',
                    'Wednesday': 'Rabu',
                    'Thursday': 'Kamis',
                    'Friday': 'Jumat',
                    'Saturday': 'Sabtu',
                    'Sunday': 'Minggu'
                };
                const translatedDays = promo.hari_aktif.split(',').map(d => dayTranslations[d.trim()] || d.trim());
                daysLabel = `<p class="text-xs text-primary font-bold mt-1">Hari: ${translatedDays.join(', ')}</p>`;
            } else {
                daysLabel = '<p class="text-xs text-on-surface-variant font-medium mt-1">Hari: Setiap Hari</p>';
            }

            // Max Usage Display
            const limitText = promo.max_usage ? `${promo.current_usage} / ${promo.max_usage} limit` : `${promo.current_usage} uses`;

            tr.innerHTML = `
                <td class="px-8 py-6">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-md overflow-hidden bg-surface-container flex-shrink-0 relative">
                            <img alt="${promo.nama_promo}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="${imgPath}">
                        </div>
                        <div>
                            <p class="font-bold text-on-surface leading-tight">${promo.nama_promo}</p>
                            <p class="text-xs text-on-surface-variant font-mono mt-0.5">${promo.kode_promo ? 'Voucher: ' + promo.kode_promo : 'Automatic Promo'}</p>
                            ${catTarget}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-6">
                    <span class="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full text-xs font-bold">${typeLabel}</span>
                </td>
                <td class="px-6 py-6 text-center">
                    <span class="text-lg font-black text-primary">${discountDisplay}</span>
                </td>
                <td class="px-6 py-6">
                    <div class="text-sm">
                        <p class="text-on-surface font-medium">${startFmt} - ${endFmt}</p>
                        ${daysLabel}
                        <p class="text-xs text-on-surface-variant">Min. Order: ${formatRupiah(promo.min_order)}</p>
                    </div>
                </td>
                <td class="px-6 py-6">
                    <div class="flex items-center gap-1.5 px-3 py-1 rounded-full w-fit ${statusPillClass}">
                        <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span class="text-xs font-bold">${statusLabel}</span>
                    </div>
                </td>
                <td class="px-6 py-6">
                    <div class="space-y-1">
                        <p class="text-sm font-bold text-on-surface">${limitText}</p>
                    </div>
                </td>
                <td class="px-8 py-6 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button class="p-2 hover:bg-primary/10 hover:text-primary text-on-surface-variant rounded-full transition-all copy-code-btn" data-code="${promo.kode_promo || ''}" title="Copy Code">
                            <span class="material-symbols-outlined text-[20px]">content_copy</span>
                        </button>
                        <button class="p-2 hover:bg-primary/10 hover:text-primary text-on-surface-variant rounded-full transition-all toggle-status-btn" data-id="${promo.id_promo}" title="${promo.is_active == 1 ? 'Disable' : 'Enable'}">
                            <span class="material-symbols-outlined text-[20px]">${promo.is_active == 1 ? 'visibility_off' : 'visibility'}</span>
                        </button>
                        <button class="p-2 hover:bg-primary/10 hover:text-primary text-on-surface-variant rounded-full transition-all edit-btn" data-id="${promo.id_promo}" title="Edit">
                            <span class="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button class="p-2 hover:bg-error-container/20 hover:text-error text-on-surface-variant rounded-full transition-all delete-btn" data-id="${promo.id_promo}" title="Delete">
                            <span class="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                    </div>
                </td>
            `;

            promoTableBody.appendChild(tr);
        });

        // Add action listeners
        attachRowActionListeners();
    }

    function attachRowActionListeners() {
        // Copy Code
        document.querySelectorAll('.copy-code-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.getAttribute('data-code');
                if (code) {
                    navigator.clipboard.writeText(code);
                    showToast(`Voucher code '${code}' copied!`);
                } else {
                    showToast('This promo does not have a voucher code', 'warning');
                }
            });
        });

        // Toggle Status
        document.querySelectorAll('.toggle-status-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                try {
                    const response = await fetch('../../api/promo/toggle_status.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id_promo: id })
                    });
                    const result = await response.json();
                    if (result.status === 'success') {
                        showToast(result.message);
                        fetchPromos();
                        fetchStats();
                    } else {
                        showToast(result.message, 'error');
                    }
                } catch (error) {
                    console.error('Error toggling status:', error);
                    showToast('Connection error', 'error');
                }
            });
        });

        // Edit Promo Action
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const promo = promosList.find(p => p.id_promo === id);
                if (promo) {
                    openEditModal(promo);
                }
            });
        });

        // Delete Promo Action
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (confirm('Are you absolutely sure you want to delete this promo campaign? This action is permanent!')) {
                    try {
                        const response = await fetch('../../api/promo/delete.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id_promo: id })
                        });
                        const result = await response.json();
                        if (result.status === 'success') {
                            showToast(result.message);
                            fetchPromos();
                            fetchStats();
                        } else {
                            showToast(result.message, 'error');
                        }
                    } catch (error) {
                        console.error('Error deleting promo:', error);
                        showToast('Connection error', 'error');
                    }
                }
            });
        });
    }

    // Open Add Modal
    addPromoBtn.addEventListener('click', () => {
        editingId = null;
        modalTitle.textContent = 'Add New Promo';
        promoForm.reset();
        
        // Reset checkboxes
        document.querySelectorAll('input[name="hari_aktif[]"]').forEach(cb => cb.checked = false);
        
        // Clear bundling rows
        if (bundlingRows) bundlingRows.innerHTML = '';
        
        // Default to percentage
        promoType.value = 'percentage';
        promoType.dispatchEvent(new Event('change'));

        promoModal.classList.remove('hidden');
        promoModal.classList.add('flex');
    });

    // Close Modal Action
    function closePromoModal() {
        promoModal.classList.add('hidden');
        promoModal.classList.remove('flex');
        editingId = null;
        promoForm.reset();
    }
    
    closeModal.addEventListener('click', closePromoModal);
    promoModal.addEventListener('click', (e) => {
        if (e.target === promoModal) closePromoModal();
    });

    // Open Edit Modal Form
    function openEditModal(promo) {
        editingId = promo.id_promo;
        modalTitle.textContent = 'Edit Promo Campaign';
        
        document.getElementById('promo-name').value = promo.nama_promo;
        document.getElementById('promo-code').value = promo.kode_promo || '';
        document.getElementById('promo-type').value = promo.tipe_promo;
        
        // Trigger select type layout adjustments
        promoType.dispatchEvent(new Event('change'));
        
        if (promo.tipe_promo !== 'bogo') {
            document.getElementById('promo-discount').value = parseFloat(promo.nilai_diskon);
        }
        
        document.getElementById('promo-min-order').value = parseFloat(promo.min_order);
        document.getElementById('promo-max-usage').value = promo.max_usage || '';
        document.getElementById('promo-target-category').value = promo.id_kategori_target || '';
        document.getElementById('promo-start-date').value = promo.tanggal_mulai;
        document.getElementById('promo-end-date').value = promo.tanggal_selesai;
        document.getElementById('promo-description').value = promo.deskripsi || '';

        // Populate active days checkboxes
        document.querySelectorAll('input[name="hari_aktif[]"]').forEach(cb => cb.checked = false);
        if (promo.hari_aktif) {
            const days = promo.hari_aktif.split(',').map(d => d.trim());
            days.forEach(day => {
                const cb = document.querySelector('input[name="hari_aktif[]"][value="' + day + '"]');
                if (cb) cb.checked = true;
            });
        }

        // Populate bundling items if type is bundling
        if (bundlingRows) bundlingRows.innerHTML = '';
        if (promo.tipe_promo === 'bundling' && promo.bundling_items) {
            promo.bundling_items.forEach(item => {
                createBundlingRow(item);
            });
        }

        promoModal.classList.remove('hidden');
        promoModal.classList.add('flex');
    }

    // Submit Add/Edit Form
    promoForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(promoForm);
        
        // Append ID if we are editing
        if (editingId) {
            formData.append('id_promo', editingId);
        }

        // Validate dates
        const start = new Date(formData.get('tanggal_mulai'));
        const end = new Date(formData.get('tanggal_selesai'));
        if (end < start) {
            showToast('End date cannot be earlier than start date', 'warning');
            return;
        }

        const endpoint = editingId ? '../../api/promo/update.php' : '../../api/promo/create.php';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            
            if (result.status === 'success') {
                showToast(result.message);
                closePromoModal();
                fetchPromos();
                fetchStats();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Error saving promo:', error);
            showToast('Connection error', 'error');
        }
    });

    // Listeners for filters
    statusFilter.addEventListener('change', fetchPromos);
    searchInput.addEventListener('input', renderPromos);

    // Toast feedback helper
    function showToast(message, type = 'success') {
        // Simple elegant toast notification
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

    // Bootstrap loading
    loadCategories();
    loadMenus();
    fetchStats();
    fetchPromos();
});
