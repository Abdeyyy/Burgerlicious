document.addEventListener('DOMContentLoaded', () => {
    // === Element References ===
    const totalRevenueEl = document.getElementById('total-revenue');
    const revenueChangeEl = document.getElementById('revenue-change');
    const totalOrdersEl = document.getElementById('total-orders');
    const ordersChangeEl = document.getElementById('orders-change');
    const totalCustomersEl = document.getElementById('total-customers');
    const customersChangeEl = document.getElementById('customers-change');
    const newCustomersEl = document.getElementById('new-customers');
    const avgOrderValueEl = document.getElementById('avg-order-value');
    const aovChangeEl = document.getElementById('aov-change');
    const topItemsContainer = document.getElementById('top-items-container');
    const insightsContainer = document.getElementById('insights-container');
    const categoryBreakdownEl = document.getElementById('category-breakdown');
    const dateRangeSelect = document.getElementById('date-range-select');
    const kategoriFilter = document.getElementById('kategori-filter');
    const tipeFilter = document.getElementById('tipe-filter');
    const exportBtn = document.getElementById('export-btn');

    let revenueChart = null;
    let categoryChart = null;
    let refreshInterval = null;

    // === Format Currency ===
    const formatRupiah = (value) => {
        if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `Rp ${(value / 1000).toFixed(1)}k`;
        return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
    };

    const formatFullRupiah = (value) => {
        return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
    };

    // === Get current filter values ===
    const getFilters = () => {
        const params = new URLSearchParams();
        params.set('range', dateRangeSelect?.value || '7');
        if (kategoriFilter?.value) params.set('kategori', kategoriFilter.value);
        if (tipeFilter?.value) params.set('tipe', tipeFilter.value);
        return params.toString();
    };

    // === Style change badge ===
    const styleChangeBadge = (el, changeStr) => {
        if (!el) return;
        el.textContent = changeStr;
        el.className = 'text-xs font-bold px-2 py-1 rounded-full';
        if (changeStr.startsWith('+') && changeStr !== '+0%' && changeStr !== '+0.0%') {
            el.classList.add('text-green-600', 'bg-green-50');
        } else if (changeStr.startsWith('-')) {
            el.classList.add('text-red-600', 'bg-red-50');
        } else {
            el.classList.add('text-on-surface-variant', 'bg-on-surface-variant/10');
        }
    };

    // === Load kategori options ===
    const loadKategoriOptions = async () => {
        try {
            const res = await fetch('../../api/kategori/read.php');
            const data = await res.json();
            if (data.status === 'success' && kategoriFilter) {
                data.data.forEach(k => {
                    const opt = document.createElement('option');
                    opt.value = k.id_kategori;
                    opt.textContent = k.nama_kategori;
                    kategoriFilter.appendChild(opt);
                });
            }
        } catch (e) {
            console.error('Failed to load categories:', e);
        }
    };

    // === Fetch Analytics Data ===
    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`../../api/order/analytics.php?${getFilters()}`);
            const result = await res.json();

            if (result.status !== 'success') {
                console.error('Analytics API error:', result.message);
                return;
            }

            const d = result.data;

            // === 1. Populate KPI Cards ===
            if (totalRevenueEl) totalRevenueEl.textContent = formatRupiah(d.kpi.total_revenue);
            styleChangeBadge(revenueChangeEl, d.kpi.revenue_change);

            if (totalOrdersEl) totalOrdersEl.textContent = d.kpi.total_orders.toLocaleString('id-ID');
            styleChangeBadge(ordersChangeEl, d.kpi.orders_change);

            if (totalCustomersEl) totalCustomersEl.textContent = d.kpi.unique_customers.toLocaleString('id-ID');
            styleChangeBadge(customersChangeEl, d.kpi.customers_change);
            if (newCustomersEl) newCustomersEl.textContent = `New: ${d.kpi.new_customers} customers`;

            if (avgOrderValueEl) avgOrderValueEl.textContent = formatRupiah(d.kpi.avg_order_value);
            styleChangeBadge(aovChangeEl, d.kpi.aov_change);

            // === 2. Revenue Trend Chart ===
            renderRevenueChart(d.revenue_trend);

            // === 3. Category Breakdown Chart ===
            renderCategoryChart(d.category_breakdown);

            // === 4. Top Selling Items ===
            renderTopItems(d.top_items);

            // === 5. Customer Insights ===
            renderInsights(d.customer_insights);

        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
    };

    // === Revenue Trend Chart (Line Chart) ===
    const renderRevenueChart = (trendData) => {
        const canvas = document.getElementById('revenue-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Format labels based on date range
        const labels = trendData.map(d => {
            const date = new Date(d.label);
            const range = parseInt(dateRangeSelect?.value || '7');
            if (range <= 7) {
                return date.toLocaleDateString('id-ID', { weekday: 'short' });
            } else if (range <= 30) {
                return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            } else {
                return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            }
        });
        const values = trendData.map(d => d.value);

        if (revenueChart) {
            revenueChart.destroy();
        }

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 250);
        gradient.addColorStop(0, 'rgba(220, 38, 38, 0.25)');
        gradient.addColorStop(1, 'rgba(220, 38, 38, 0.02)');

        revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Revenue',
                    data: values,
                    borderColor: '#dc2626',
                    backgroundColor: gradient,
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#dc2626',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    pointHoverBackgroundColor: '#dc2626',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(28, 25, 23, 0.9)',
                        titleFont: { family: "'Be Vietnam Pro', sans-serif", weight: '600' },
                        bodyFont: { family: "'Be Vietnam Pro', sans-serif" },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: (ctx) => `Revenue: ${formatFullRupiah(ctx.parsed.y)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { family: "'Be Vietnam Pro', sans-serif", size: 11 },
                            color: '#78716c'
                        }
                    },
                    y: {
                        grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
                        ticks: {
                            font: { family: "'Be Vietnam Pro', sans-serif", size: 11 },
                            color: '#78716c',
                            callback: (val) => formatRupiah(val)
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    };

    // === Category Breakdown Chart (Doughnut) ===
    const renderCategoryChart = (categoryData) => {
        const canvas = document.getElementById('category-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        const colors = [
            '#dc2626', '#f97316', '#eab308', '#22c55e',
            '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'
        ];

        const labels = categoryData.map(c => c.nama_kategori);
        const values = categoryData.map(c => c.total_revenue);

        if (categoryChart) {
            categoryChart.destroy();
        }

        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 3,
                    borderColor: '#fafaf9',
                    hoverBorderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(28, 25, 23, 0.9)',
                        titleFont: { family: "'Be Vietnam Pro', sans-serif", weight: '600' },
                        bodyFont: { family: "'Be Vietnam Pro', sans-serif" },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: (ctx) => {
                                const cat = categoryData[ctx.dataIndex];
                                return `${cat.nama_kategori}: ${formatFullRupiah(cat.total_revenue)} (${cat.percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Render custom legend below chart
        if (categoryBreakdownEl) {
            categoryBreakdownEl.innerHTML = categoryData.map((cat, i) => `
                <div class="flex items-center justify-between p-2 hover:bg-surface-container rounded-lg transition-colors">
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full inline-block" style="background-color: ${colors[i % colors.length]}"></span>
                        <span class="font-medium text-on-surface">${cat.nama_kategori}</span>
                    </div>
                    <div class="text-right">
                        <span class="font-bold text-on-surface">${cat.percentage}%</span>
                        <span class="text-on-surface-variant ml-2">(${cat.total_sales} items)</span>
                    </div>
                </div>
            `).join('');
        }
    };

    // === Top Selling Items ===
    const renderTopItems = (items) => {
        if (!topItemsContainer) return;

        if (items.length === 0) {
            topItemsContainer.innerHTML = `
                <div class="text-center py-8 text-on-surface-variant">
                    <span class="material-symbols-outlined text-4xl mb-2 block">inventory_2</span>
                    <p class="text-sm italic">No sales data in this period</p>
                </div>
            `;
            return;
        }

        const medals = ['🥇', '🥈', '🥉'];

        topItemsContainer.innerHTML = items.map((item, i) => `
            <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container transition-colors group">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-black ${i < 3 ? 'bg-amber-50' : 'bg-surface-container'}">
                    ${i < 3 ? medals[i] : `<span class="text-sm text-on-surface-variant">#${i + 1}</span>`}
                </div>
                <div class="w-10 h-10 rounded-lg bg-surface-container overflow-hidden flex-shrink-0">
                    <img src="../../${item.gambar_url || 'assets/images/menu_placeholder.png'}" 
                         class="w-full h-full object-cover" alt="${item.nama_menu}" 
                         onerror="this.src='../../assets/images/menu_placeholder.png'" />
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-sm truncate">${item.nama_menu}</p>
                    <p class="text-[10px] text-on-surface-variant uppercase tracking-wider">${item.nama_kategori}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="font-black text-sm">${item.total_sold} sold</p>
                    <p class="text-[10px] text-on-surface-variant">${formatRupiah(item.total_revenue)}</p>
                </div>
            </div>
        `).join('');
    };

    // === Customer Insights ===
    const renderInsights = (insights) => {
        if (!insightsContainer) return;

        const cards = [
            {
                icon: 'replay',
                color: 'text-blue-600 bg-blue-50',
                label: 'Repeat Rate',
                value: `${insights.repeat_rate}%`,
                sub: 'Returning customers'
            },
            {
                icon: 'shopping_cart',
                color: 'text-purple-600 bg-purple-50',
                label: 'Avg Items/Order',
                value: insights.avg_items_per_order,
                sub: 'Items per transaction'
            },
            {
                icon: 'schedule',
                color: 'text-orange-600 bg-orange-50',
                label: 'Peak Hour',
                value: insights.peak_hour,
                sub: 'Busiest time'
            },
            {
                icon: 'restaurant',
                color: 'text-green-600 bg-green-50',
                label: 'Dine-in',
                value: `${insights.dine_in_ratio}%`,
                sub: `Takeaway: ${insights.takeaway_ratio}%`
            },
            {
                icon: 'person',
                color: 'text-red-600 bg-red-50',
                label: 'Registered',
                value: `${insights.registered_percentage}%`,
                sub: `Guest: ${insights.guest_percentage}%`
            }
        ];

        insightsContainer.innerHTML = cards.map(card => `
            <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container transition-colors">
                <div class="p-2.5 ${card.color} rounded-xl">
                    <span class="material-symbols-outlined text-sm">${card.icon}</span>
                </div>
                <div class="flex-1">
                    <p class="text-[10px] text-on-surface-variant uppercase tracking-wider font-medium">${card.label}</p>
                    <p class="font-black text-lg leading-tight">${card.value}</p>
                </div>
                <p class="text-[10px] text-on-surface-variant text-right">${card.sub}</p>
            </div>
        `).join('');
    };

    // === Event Listeners ===
    if (dateRangeSelect) {
        dateRangeSelect.addEventListener('change', () => {
            fetchAnalytics();
        });
    }

    if (kategoriFilter) {
        kategoriFilter.addEventListener('change', () => {
            fetchAnalytics();
        });
    }

    if (tipeFilter) {
        tipeFilter.addEventListener('change', () => {
            fetchAnalytics();
        });
    }

    // === Export Button ===
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const url = `../../api/order/export_report.php?${getFilters()}`;
            window.location.href = url;
        });
    }

    // === Delete All Data ===
    const deleteAllBtn = document.getElementById('delete-all-btn');
    const deleteModal = document.getElementById('delete-modal');
    const deleteModalBackdrop = document.getElementById('delete-modal-backdrop');
    const deleteModalContent = document.getElementById('delete-modal-content');
    const deleteCancelBtn = document.getElementById('delete-cancel-btn');
    const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
    const deleteConfirmInput = document.getElementById('delete-confirm-input');

    const showDeleteModal = () => {
        if (!deleteModal) return;
        deleteModal.classList.remove('hidden');
        // Reset state
        if (deleteConfirmInput) deleteConfirmInput.value = '';
        if (deleteConfirmBtn) deleteConfirmBtn.disabled = true;
        // Animate in
        requestAnimationFrame(() => {
            deleteModalBackdrop.style.opacity = '1';
            deleteModalContent.style.transform = 'scale(1)';
            deleteModalContent.style.opacity = '1';
        });
        deleteModalContent.style.transform = 'scale(0.95)';
        deleteModalContent.style.opacity = '0';
        deleteModalContent.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                deleteModalContent.style.transform = 'scale(1)';
                deleteModalContent.style.opacity = '1';
            });
        });
    };

    const hideDeleteModal = () => {
        if (!deleteModal) return;
        deleteModalContent.style.transform = 'scale(0.95)';
        deleteModalContent.style.opacity = '0';
        deleteModalBackdrop.style.opacity = '0';
        setTimeout(() => {
            deleteModal.classList.add('hidden');
        }, 200);
    };

    // Enable confirm button only when "HAPUS" is typed
    if (deleteConfirmInput) {
        deleteConfirmInput.addEventListener('input', () => {
            const isValid = deleteConfirmInput.value.trim() === 'HAPUS';
            deleteConfirmBtn.disabled = !isValid;
        });

        // Allow Enter key to confirm
        deleteConfirmInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !deleteConfirmBtn.disabled) {
                executeDeleteAll();
            }
        });
    }

    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', showDeleteModal);
    }

    if (deleteCancelBtn) {
        deleteCancelBtn.addEventListener('click', hideDeleteModal);
    }

    if (deleteModalBackdrop) {
        deleteModalBackdrop.addEventListener('click', hideDeleteModal);
    }

    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && deleteModal && !deleteModal.classList.contains('hidden')) {
            hideDeleteModal();
        }
    });

    const executeDeleteAll = async () => {
        if (!deleteConfirmBtn) return;

        // Show loading state
        const originalText = deleteConfirmBtn.innerHTML;
        deleteConfirmBtn.innerHTML = `
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Menghapus...
        `;
        deleteConfirmBtn.disabled = true;

        try {
            const res = await fetch('../../api/order/delete_all.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirm: 'DELETE_ALL_ANALYTICS' })
            });
            const result = await res.json();

            hideDeleteModal();

            if (result.status === 'success') {
                showAlertToast('success', 'Data Berhasil Dihapus', result.message);
                // Refresh analytics data to show empty state
                fetchAnalytics();
            } else {
                showAlertToast('error', 'Gagal Menghapus', result.message);
            }
        } catch (error) {
            hideDeleteModal();
            showAlertToast('error', 'Error', 'Terjadi kesalahan koneksi. Silakan coba lagi.');
            console.error('Delete all error:', error);
        }

        // Restore button (in case modal is reopened)
        deleteConfirmBtn.innerHTML = originalText;
    };

    if (deleteConfirmBtn) {
        deleteConfirmBtn.addEventListener('click', executeDeleteAll);
    }

    // === Alert Toast System ===
    let toastTimeout = null;

    const showAlertToast = (type, title, message) => {
        const toast = document.getElementById('alert-toast');
        const content = document.getElementById('alert-toast-content');
        const icon = document.getElementById('alert-toast-icon');
        const titleEl = document.getElementById('alert-toast-title');
        const messageEl = document.getElementById('alert-toast-message');

        if (!toast || !content) return;

        // Clear previous timeout
        if (toastTimeout) clearTimeout(toastTimeout);

        // Set content
        titleEl.textContent = title;
        messageEl.textContent = message;

        // Style based on type
        if (type === 'success') {
            icon.textContent = 'check_circle';
            content.className = 'flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border min-w-[320px] transition-all duration-300 transform bg-green-50 border-green-200 text-green-900';
            icon.className = 'material-symbols-outlined text-xl text-green-600';
        } else {
            icon.textContent = 'error';
            content.className = 'flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border min-w-[320px] transition-all duration-300 transform bg-red-50 border-red-200 text-red-900';
            icon.className = 'material-symbols-outlined text-xl text-red-600';
        }

        // Show toast
        toast.classList.remove('hidden');
        // Force reflow then animate in
        content.style.transform = 'translateX(120%)';
        content.style.opacity = '0';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                content.style.transform = 'translateX(0)';
                content.style.opacity = '1';
            });
        });

        // Auto-hide after 5 seconds
        toastTimeout = setTimeout(() => {
            hideAlertToast();
        }, 5000);
    };

    // Make globally accessible for inline onclick
    window.hideAlertToast = () => {
        const toast = document.getElementById('alert-toast');
        const content = document.getElementById('alert-toast-content');
        if (!toast || !content) return;

        content.style.transform = 'translateX(120%)';
        content.style.opacity = '0';
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    };

    // === Init ===
    loadKategoriOptions();
    fetchAnalytics();

    // Auto-refresh every 20 seconds
    refreshInterval = setInterval(fetchAnalytics, 20000);

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (refreshInterval) clearInterval(refreshInterval);
    });
});
