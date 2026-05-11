document.addEventListener('DOMContentLoaded', () => {
    const menuGrid = document.getElementById('menu-grid');
    const categoryTabs = document.getElementById('category-tabs');
    const searchInput = document.getElementById('search-menu');
    const cartContainer = document.getElementById('cart-items');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const clearCartBtn = document.getElementById('clear-cart');
    const customerNameInput = document.getElementById('customer-name');
    const orderTypeBtns = document.querySelectorAll('.order-type-btn');
    const clockElement = document.getElementById('clock');

    let allMenu = [];
    let cart = [];
    let selectedCategory = 'all';
    let orderType = 'dine-in';

    // Clock
    setInterval(() => {
        const now = new Date();
        clockElement.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }, 1000);

    // Initial styles for order type
    const updateOrderTypeUI = () => {
        orderTypeBtns.forEach(btn => {
            if (btn.dataset.type === orderType) {
                btn.className = 'order-type-btn flex-1 py-2.5 rounded-lg font-bold text-xs bg-primary text-on-primary shadow-md shadow-primary/20 transition-all duration-200';
            } else {
                btn.className = 'order-type-btn flex-1 py-2.5 rounded-lg font-bold text-xs bg-transparent text-on-surface-variant hover:bg-surface-container-high transition-all duration-200';
            }
        });
    };
    updateOrderTypeUI();

    // Load Categories & Menu
    const fetchData = async () => {
        try {
            const [catRes, menuRes] = await Promise.all([
                fetch('../../api/kategori/read.php'),
                fetch('../../api/menu/read.php')
            ]);
            
            const catData = await catRes.json();
            const menuData = await menuRes.json();

            if (catData.status === 'success') renderCategories(catData.data);
            if (menuData.status === 'success') {
                allMenu = menuData.data.filter(m => parseInt(m.status_tersedia) === 1);
                renderMenu();
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    const renderCategories = (categories) => {
        categoryTabs.innerHTML = `
            <button data-id="all" class="cat-tab px-6 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high shadow-sm'}">
                All Items
            </button>
        `;
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `cat-tab px-6 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory == cat.id_kategori ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high shadow-sm'}`;
            btn.dataset.id = cat.id_kategori;
            btn.textContent = cat.nama_kategori;
            btn.onclick = () => {
                selectedCategory = cat.id_kategori;
                document.querySelectorAll('.cat-tab').forEach(t => {
                    t.className = 'cat-tab px-6 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high shadow-sm';
                });
                btn.className = 'cat-tab px-6 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all bg-primary text-on-primary shadow-lg shadow-primary/20';
                renderMenu();
            };
            categoryTabs.appendChild(btn);
        });

        document.querySelector('[data-id="all"]').onclick = (e) => {
            selectedCategory = 'all';
            document.querySelectorAll('.cat-tab').forEach(t => {
                t.className = 'cat-tab px-6 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high shadow-sm';
            });
            e.target.className = 'cat-tab px-6 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all bg-primary text-on-primary shadow-lg shadow-primary/20';
            renderMenu();
        };
    };

    const renderMenu = () => {
        const search = searchInput.value.toLowerCase();
        const filtered = allMenu.filter(m => {
            const matchesCat = selectedCategory === 'all' || m.id_kategori == selectedCategory;
            const matchesSearch = m.nama_menu.toLowerCase().includes(search);
            return matchesCat && matchesSearch;
        });

        if (filtered.length === 0) {
            menuGrid.innerHTML = `
                <div class="col-span-full py-20 text-center opacity-30">
                    <span class="material-symbols-outlined text-6xl mb-4">search_off</span>
                    <p class="font-bold">No menu items found</p>
                </div>
            `;
            return;
        }

        menuGrid.innerHTML = filtered.map(m => `
            <div class="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/10 hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer group active:scale-95 flex flex-col h-full" onclick="addToCart(${m.id_menu})">
                <div class="aspect-square rounded-xl bg-stone-100 mb-4 overflow-hidden relative">
                    <img src="../../${m.gambar_url || 'assets/images/menu_placeholder.png'}" class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                    <div class="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors"></div>
                </div>
                <div class="flex-1">
                    <h4 class="font-bold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">${m.nama_menu}</h4>
                    <p class="text-[10px] text-on-surface-variant font-medium mt-1 uppercase tracking-wider">${m.nama_kategori}</p>
                </div>
                <div class="mt-4 flex items-center justify-between">
                    <p class="text-primary font-black text-base">Rp ${parseInt(m.harga).toLocaleString('id-ID')}</p>
                    <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center scale-0 group-hover:scale-100 transition-transform">
                        <span class="material-symbols-outlined text-sm font-black">add</span>
                    </div>
                </div>
            </div>
        `).join('');
    };

    window.addToCart = (id) => {
        const menu = allMenu.find(m => m.id_menu == id);
        const existing = cart.find(c => c.id_menu == id);
        if (existing) {
            existing.jumlah++;
        } else {
            cart.push({ ...menu, jumlah: 1 });
        }
        updateCart();
    };

    const updateCart = () => {
        if (cart.length === 0) {
            cartContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full opacity-20 italic py-20">
                    <span class="material-symbols-outlined text-6xl mb-4">shopping_basket</span>
                    <p class="font-bold">Empty cart</p>
                </div>
            `;
            cartSubtotal.textContent = 'Rp 0';
            cartTotal.textContent = 'Rp 0';
            checkoutBtn.disabled = true;
            return;
        }

        cartContainer.innerHTML = cart.map((c, i) => `
            <div class="flex items-center gap-4 bg-surface-container-low/50 p-3 rounded-2xl group hover:bg-surface-container-low transition-all">
                <div class="w-14 h-14 rounded-xl bg-white p-1 shadow-sm overflow-hidden flex-shrink-0">
                    <img src="../../${c.gambar_url || 'assets/images/menu_placeholder.png'}" class="w-full h-full object-contain" />
                </div>
                <div class="flex-1 min-w-0">
                    <h5 class="text-xs font-bold truncate">${c.nama_menu}</h5>
                    <p class="text-[10px] text-primary font-black mt-0.5">Rp ${(parseInt(c.harga) * c.jumlah).toLocaleString('id-ID')}</p>
                </div>
                <div class="flex flex-col items-end gap-1">
                    <div class="flex items-center gap-2.5 bg-white rounded-lg p-1 shadow-sm">
                        <button onclick="changeQty(${c.id_menu}, -1)" class="w-6 h-6 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 transition-colors">
                            <span class="material-symbols-outlined text-xs font-black">remove</span>
                        </button>
                        <span class="text-xs font-black w-4 text-center">${c.jumlah}</span>
                        <button onclick="changeQty(${c.id_menu}, 1)" class="w-6 h-6 flex items-center justify-center rounded-md text-green-500 hover:bg-green-50 transition-colors">
                            <span class="material-symbols-outlined text-xs font-black">add</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        const total = cart.reduce((acc, curr) => acc + (curr.harga * curr.jumlah), 0);
        cartSubtotal.textContent = `Rp ${total.toLocaleString('id-ID')}`;
        cartTotal.textContent = `Rp ${total.toLocaleString('id-ID')}`;
        checkoutBtn.disabled = false;
    };

    window.changeQty = (id, delta) => {
        const item = cart.find(c => c.id_menu == id);
        item.jumlah += delta;
        if (item.jumlah <= 0) {
            cart = cart.filter(c => c.id_menu != id);
        }
        updateCart();
    };

    clearCartBtn.onclick = () => {
        if (cart.length > 0 && confirm('Clear all items from cart?')) {
            cart = [];
            updateCart();
        }
    };

    orderTypeBtns.forEach(btn => {
        btn.onclick = () => {
            orderType = btn.dataset.type;
            updateOrderTypeUI();
        };
    });

    searchInput.oninput = renderMenu;

    checkoutBtn.onclick = async () => {
        const name = customerNameInput.value || 'Pelanggan';
        const items = cart.map(c => ({ id_menu: c.id_menu, jumlah: c.jumlah }));

        checkoutBtn.disabled = true;
        const originalBtnText = checkoutBtn.innerHTML;
        checkoutBtn.innerHTML = `
            <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            PROCESSING...
        `;

        try {
            const res = await fetch('../../api/order/create.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama_pelanggan: name, tipe_pesanan: orderType, items })
            });
            const result = await res.json();
            
            if (result.status === 'success') {
                const modal = document.getElementById('success-modal');
                const modalContent = modal.querySelector('div');
                modal.classList.remove('hidden');
                setTimeout(() => {
                    modalContent.classList.add('scale-100', 'opacity-100');
                    modalContent.classList.remove('scale-90', 'opacity-0');
                }, 10);
                cart = [];
                updateCart();
                customerNameInput.value = 'Pelanggan';
            } else {
                alert('Checkout failed: ' + result.message);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = originalBtnText;
        }
    };

    document.getElementById('modal-close').onclick = () => {
        document.getElementById('success-modal').classList.add('hidden');
        document.getElementById('success-modal').querySelector('div').classList.add('scale-90', 'opacity-0');
        document.getElementById('success-modal').querySelector('div').classList.remove('scale-100', 'opacity-100');
    };

    document.getElementById('modal-print').onclick = () => {
        alert('Printing receipt feature coming soon!');
    };

    fetchData();
});
