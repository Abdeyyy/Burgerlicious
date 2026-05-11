document.addEventListener('DOMContentLoaded', () => {
    const orderContainer = document.getElementById('order-cards-container');
    const filterBtns = document.querySelectorAll('header .flex.gap-2 button');
    const statsElements = {
        pending: document.getElementById('pending-count'),
        preparing: document.getElementById('preparing-count'),
        ready: document.getElementById('ready-count'),
        completed: document.getElementById('completed-count')
    };

    let currentFilter = 'all';

    const fetchOrders = async () => {
        try {
            const response = await fetch('../../api/order/read.php');
            const data = await response.json();

            if (data.status === 'success') {
                renderOrders(data.data);
                updateStats(data.data);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    const updateStats = (orders) => {
        const counts = {
            pending: orders.filter(o => o.status_pesanan === 'pending').length,
            preparing: orders.filter(o => o.status_pesanan === 'preparing').length,
            ready: orders.filter(o => o.status_pesanan === 'ready').length,
            completed: orders.filter(o => o.status_pesanan === 'completed').length
        };

        if (statsElements.pending) statsElements.pending.textContent = counts.pending;
        if (statsElements.preparing) statsElements.preparing.textContent = counts.preparing;
        if (statsElements.ready) statsElements.ready.textContent = counts.ready;
        if (statsElements.completed) statsElements.completed.textContent = counts.completed;
    };

    const renderOrders = (orders) => {
        const filtered = currentFilter === 'all' 
            ? orders.filter(o => o.status_pesanan !== 'completed' && o.status_pesanan !== 'cancelled')
            : orders.filter(o => o.status_pesanan === currentFilter);

        if (filtered.length === 0) {
            orderContainer.innerHTML = `
                <div class="bg-surface-container-lowest p-12 rounded-xl text-center border border-outline-variant/10 shadow-sm">
                    <span class="material-symbols-outlined text-4xl text-on-surface-variant mb-2">inbox</span>
                    <p class="text-on-surface-variant font-medium">No active orders in this queue.</p>
                </div>
            `;
            return;
        }

        orderContainer.innerHTML = filtered.map(order => {
            const date = new Date(order.tanggal_transaksi);
            const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            
            let statusColor = 'text-orange-600 bg-orange-50';
            let actionBtn = '';

            if (order.status_pesanan === 'pending') {
                statusColor = 'text-orange-600 bg-orange-100';
                actionBtn = `<button onclick="updateStatus(${order.id_transaksi}, 'preparing')" class="px-6 py-2 bg-primary text-on-primary rounded-full font-bold text-xs shadow-lg shadow-primary/20 hover:bg-primary-dim transition-all">START PREPARING</button>`;
            } else if (order.status_pesanan === 'preparing') {
                statusColor = 'text-blue-600 bg-blue-100';
                actionBtn = `<button onclick="updateStatus(${order.id_transaksi}, 'ready')" class="px-6 py-2 bg-blue-600 text-white rounded-full font-bold text-xs shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">MARK AS READY</button>`;
            } else if (order.status_pesanan === 'ready') {
                statusColor = 'text-green-600 bg-green-100';
                actionBtn = `<button onclick="updateStatus(${order.id_transaksi}, 'completed')" class="px-6 py-2 bg-green-600 text-white rounded-full font-bold text-xs shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all">COMPLETE ORDER</button>`;
            } else if (order.status_pesanan === 'completed') {
                statusColor = 'text-gray-600 bg-gray-100';
            }

            return `
            <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div class="flex-1 flex gap-6">
                        <div class="w-16 h-16 bg-surface-container rounded-2xl flex flex-col items-center justify-center border border-outline-variant/10">
                            <span class="text-xs font-black text-on-surface-variant">#${order.id_transaksi}</span>
                            <span class="text-[10px] font-bold text-on-surface-variant opacity-60">${time}</span>
                        </div>
                        <div>
                            <div class="flex items-center gap-3 mb-2">
                                <h4 class="font-black text-lg text-on-surface">${order.nama_pelanggan}</h4>
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor} uppercase tracking-widest">${order.status_pesanan}</span>
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant uppercase tracking-widest">${order.tipe_pesanan}</span>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                ${order.items.map(item => `
                                    <div class="bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/5 flex items-center gap-2">
                                        <span class="text-xs font-black text-primary">${item.jumlah}x</span>
                                        <span class="text-xs font-bold text-on-surface">${item.nama_menu}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="text-right hidden md:block">
                            <p class="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">Total Amount</p>
                            <p class="text-lg font-black text-on-surface">Rp ${parseInt(order.total_harga).toLocaleString('id-ID')}</p>
                        </div>
                        ${actionBtn}
                        ${order.status_pesanan !== 'completed' ? `
                        <button onclick="updateStatus(${order.id_transaksi}, 'cancelled')" class="p-2 text-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded-full transition-all" title="Cancel Order">
                            <span class="material-symbols-outlined text-xl">cancel</span>
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
            `;
        }).join('');
    };

    window.updateStatus = async (id, status) => {
        try {
            const res = await fetch('../../api/order/update_status.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_transaksi: id, status_pesanan: status })
            });
            const result = await res.json();
            if (result.status === 'success') {
                fetchOrders();
            } else {
                alert('Update failed: ' + result.message);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    filterBtns.forEach(btn => {
        btn.onclick = () => {
            const filterText = btn.textContent.trim().toLowerCase();
            if (filterText === 'all orders') currentFilter = 'all';
            else currentFilter = filterText;
            
            filterBtns.forEach(b => b.className = 'px-4 py-2 rounded-full text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors');
            btn.className = 'px-4 py-2 rounded-full text-sm font-bold bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors';
            
            fetchOrders();
        };
    });

    // Initial fetch
    fetchOrders();

    // Auto refresh every 15 seconds for queue
    setInterval(fetchOrders, 15000);
});
