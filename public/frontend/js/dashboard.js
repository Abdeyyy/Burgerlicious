document.addEventListener('DOMContentLoaded', () => {
    const queueContainer = document.getElementById('order-queue-container');
    const statsContainer = document.querySelector('.grid-cols-1.md\\:grid-cols-4');
    
    // Stats elements
    const totalOrdersEl = document.getElementById('orders-today');
    const revenueEl = document.getElementById('daily-revenue');
    const trendingItemEl = document.getElementById('trending-item-name');
    const trendingSalesEl = document.getElementById('trending-item-sales');

    const fetchDashboardData = async () => {
        try {
            // Fetch stats
            const statsRes = await fetch('../../api/order/stats.php');
            const statsData = await statsRes.json();
            if (statsData.status === 'success') {
                const s = statsData.data;
                if (totalOrdersEl) totalOrdersEl.textContent = s.total_orders;
                if (revenueEl) {
                    const rev = s.revenue;
                    if (rev >= 1000000) {
                        revenueEl.textContent = `Rp ${(rev / 1000000).toFixed(1)}M`;
                    } else if (rev >= 1000) {
                        revenueEl.textContent = `Rp ${(rev / 1000).toFixed(1)}k`;
                    } else {
                        revenueEl.textContent = `Rp ${rev}`;
                    }
                }
            }

            // Fetch live queue (recent 5)
            const queueRes = await fetch('../../api/order/read.php?limit=5');
            const queueData = await queueRes.json();
            if (queueData.status === 'success') {
                renderQueue(queueData.data);
            }

            // Fetch Stock (Menu)
            const menuRes = await fetch('../../api/menu/read.php');
            const menuData = await menuRes.json();
            if (menuData.status === 'success') {
                renderStock(menuData.data);
            }
        } catch (error) {
            console.error('Dashboard error:', error);
        }
    };

    const renderStock = (menus) => {
        const container = document.getElementById('stock-monitor-container');
        if (!container) return;

        // Show out of stock first, then available
        const sorted = [...menus].sort((a, b) => parseInt(a.status_tersedia) - parseInt(b.status_tersedia)).slice(0, 6);

        container.innerHTML = sorted.map(m => `
            <div class="p-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center overflow-hidden">
                        <img src="../../${m.gambar_url || 'assets/images/menu_placeholder.png'}" class="w-full h-full object-contain" />
                    </div>
                    <div>
                        <p class="text-xs font-bold truncate w-24 md:w-32">${m.nama_menu}</p>
                        <p class="text-[10px] text-on-surface-variant">${m.nama_kategori}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${parseInt(m.status_tersedia) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} uppercase">
                        ${parseInt(m.status_tersedia) ? 'In Stock' : 'OOS'}
                    </span>
                </div>
            </div>
        `).join('');
    };

    const renderQueue = (orders) => {
        if (!queueContainer) return;

        // Filter out completed and cancelled for the dashboard live queue
        const activeOrders = orders.filter(o => o.status_pesanan !== 'completed' && o.status_pesanan !== 'cancelled');

        if (activeOrders.length === 0) {
            queueContainer.innerHTML = `
                <div class="bg-surface-container-lowest p-8 rounded-lg border border-dashed border-outline-variant/30 text-center text-on-surface-variant italic text-sm">
                    No active orders at the moment.
                </div>
            `;
            return;
        }

        queueContainer.innerHTML = activeOrders.map(order => {
            let statusColor = 'bg-orange-100 text-orange-600';
            if (order.status_pesanan === 'preparing') statusColor = 'bg-blue-100 text-blue-600';
            if (order.status_pesanan === 'ready') statusColor = 'bg-green-100 text-green-600';

            return `
            <div class="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/10 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center font-black text-xs text-on-surface-variant">
                        #${order.id_transaksi}
                    </div>
                    <div>
                        <h4 class="font-bold text-sm">${order.nama_pelanggan}</h4>
                        <p class="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">${order.tipe_pesanan} • ${order.items.length} items</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-[10px] font-black px-2.5 py-1 rounded-full ${statusColor} uppercase tracking-widest">${order.status_pesanan}</span>
                    <a href="order_queue.html" class="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant">
                        <span class="material-symbols-outlined text-sm">arrow_forward</span>
                    </a>
                </div>
            </div>
            `;
        }).join('');
    };

    fetchDashboardData();
    setInterval(fetchDashboardData, 20000); // Refresh every 20s
});
