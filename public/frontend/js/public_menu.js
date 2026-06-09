document.addEventListener('DOMContentLoaded', () => {
    const categoryContainer = document.getElementById('category-container');
    const menuContainer = document.getElementById('menu-container');
    const searchInput = document.getElementById('search-input');

    let allMenus = [];
    let currentCategoryId = null;

    // Load Categories
    async function loadCategories() {
        try {
            const response = await fetch('../../api/kategori/read.php');
            const data = await response.json();

            // Render "Semua Menu" button
            categoryContainer.innerHTML = `
                <a href="#" data-id="all"
                    class="category-link bg-[#FEBB19] text-[#BA0000] font-extrabold py-3.5 px-5 rounded-lg shadow-[0_4px_15px_rgba(254,187,25,0.4)] transition-all hover:translate-x-1">
                    Semua Menu
                </a>
            `;

            if (data.status === 'success') {
                data.data.forEach(category => {
                    const a = document.createElement('a');
                    a.href = '#';
                    a.dataset.id = category.id_kategori;
                    // Default style for inactive category
                    a.className = 'category-link bg-white/95 text-gray-800 font-bold py-3.5 px-5 rounded-lg shadow-md hover:bg-white hover:text-[#BA0000] transition-all hover:translate-x-1';
                    a.textContent = category.nama_kategori;
                    categoryContainer.appendChild(a);
                });
            }

            // Add event listeners to category links
            document.querySelectorAll('.category-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Update active styles
                    document.querySelectorAll('.category-link').forEach(l => {
                        l.className = 'category-link bg-white/95 text-gray-800 font-bold py-3.5 px-5 rounded-lg shadow-md hover:bg-white hover:text-[#BA0000] transition-all hover:translate-x-1';
                    });
                    e.target.className = 'category-link bg-[#FEBB19] text-[#BA0000] font-extrabold py-3.5 px-5 rounded-lg shadow-[0_4px_15px_rgba(254,187,25,0.4)] transition-all hover:translate-x-1';

                    currentCategoryId = e.target.dataset.id === 'all' ? null : e.target.dataset.id;
                    filterAndRenderMenus();
                });
            });

        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    // Load Menus
    async function loadMenus() {
        try {
            const response = await fetch('../../api/menu/read.php');
            const data = await response.json();

            if (data.status === 'success') {
                // Parse int for status if it comes as string, just to be safe
                allMenus = data.data.filter(menu => parseInt(menu.status_tersedia) === 1);
                filterAndRenderMenus();
            }
        } catch (error) {
            console.error('Error loading menus:', error);
            menuContainer.innerHTML = `<p class="text-white">Gagal memuat menu.</p>`;
        }
    }

    // Filter and Render
    function filterAndRenderMenus() {
        const searchTerm = searchInput.value.toLowerCase();
        
        const filteredMenus = allMenus.filter(menu => {
            const matchesCategory = currentCategoryId ? menu.id_kategori == currentCategoryId : true;
            const matchesSearch = menu.nama_menu.toLowerCase().includes(searchTerm) || (menu.deskripsi && menu.deskripsi.toLowerCase().includes(searchTerm));
            return matchesCategory && matchesSearch;
        });

        renderMenus(filteredMenus);
    }

    // Render HTML for menus
    function renderMenus(menus) {
        if (menus.length === 0) {
            menuContainer.innerHTML = `
                <div class="col-span-full text-center py-10">
                    <p class="text-white text-xl">Tidak ada menu yang ditemukan.</p>
                </div>
            `;
            return;
        }

        menuContainer.innerHTML = menus.map(menu => {
            const isSpicy = menu.nama_menu.toLowerCase().includes('spicy') || (menu.deskripsi && menu.deskripsi.toLowerCase().includes('pedas'));
            const badgeHtml = isSpicy 
                ? `<div class="absolute top-4 left-4 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-md z-10">Spicy 🔥</div>` 
                : `<div class="absolute top-4 left-4 bg-gradient-to-r from-[#FEBB19] to-yellow-400 text-[#BA0000] text-xs font-black px-3 py-1.5 rounded-lg shadow-md z-10">${menu.nama_kategori}</div>`;
                
            // Check image source, fallback to placeholder if not exists
            let imgSrc = menu.gambar_url ? `../../${menu.gambar_url}` : '../../assets/images/menu_placeholder.png';

            return `
            <a href="pesan.html?menu=${menu.id_menu}"
                class="bg-white rounded-xl p-5 shadow-2xl hover:shadow-[0_15px_30px_rgba(254,187,25,0.2)] transition-all duration-300 hover:-translate-y-2 flex flex-col items-center group relative border-2 border-transparent hover:border-[#FEBB19]">
                ${badgeHtml}
                <div class="w-40 h-40 sm:w-48 sm:h-48 mb-4 relative flex justify-center items-center">
                    <img loading="lazy" src="${imgSrc}" alt="${menu.nama_menu}"
                        class="w-full h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500 ease-out"
                        onerror="this.onerror=null;this.src='../../assets/images/menu_placeholder.png';">
                </div>
                <h3
                    class="font-extrabold text-xl text-center text-[#BA0000] mb-1 group-hover:text-[#8F0919] transition-colors leading-snug">
                    ${menu.nama_menu}</h3>
                <div class="mt-auto font-black text-[#FFAD5B] text-lg pt-4 mb-2">Rp ${parseInt(menu.harga).toLocaleString('id-ID')}</div>
                
                <!-- Tombol Keranjang Cepat -->
                <button type="button" data-id="${menu.id_menu}" class="add-to-cart-btn absolute bottom-4 right-4 bg-[#BA0000] hover:bg-[#8F0919] text-white p-2.5 rounded-full transition-all duration-300 shadow-md hover:scale-110 flex items-center justify-center z-20" title="Tambah ke Keranjang">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </button>
            </a>
            `;
        }).join('');

        // Hubungkan event click untuk tombol keranjang cepat
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const menuId = btn.dataset.id;
                const menu = menus.find(m => m.id_menu == menuId);
                if (menu) {
                    tambahKeKeranjang(menu);
                }
            });
        });
    }

    // Periksa status login
    async function checkLogin() {
        try {
            const response = await fetch('../../auth/check_session.php');
            const data = await response.json();
            return data.loggedIn ? data : null;
        } catch (e) {
            return null;
        }
    }

    // Tambah ke Keranjang
    async function tambahKeKeranjang(menu) {
        const loginData = await checkLogin();
        if (!loginData) {
            // Redirect ke halaman login jika belum login
            const currentUrl = window.location.pathname + window.location.search;
            window.location.href = 'login.html?redirect=' + encodeURIComponent(currentUrl);
            return;
        }

        const userId = loginData.user_id;
        const cartKey = userId ? `burgerlicious_cart_${userId}` : 'burgerlicious_cart';

        let cart = [];
        try {
            cart = JSON.parse(localStorage.getItem(cartKey)) || [];
        } catch (e) {
            cart = [];
        }

        const existingIndex = cart.findIndex(item => item.id_menu == menu.id_menu);
        if (existingIndex > -1) {
            cart[existingIndex].jumlah += 1;
        } else {
            let imgSrc = menu.gambar_url ? `../../${menu.gambar_url}` : '../../assets/images/menu_placeholder.png';
            cart.push({
                id_menu: menu.id_menu,
                id_kategori: menu.id_kategori,
                nama: menu.nama_menu,
                harga: parseFloat(menu.harga),
                gambar: imgSrc,
                jumlah: 1
            });
        }

        localStorage.setItem(cartKey, JSON.stringify(cart));

        // Memicu sinkronisasi navbar cart badge / drawer (session.js)
        window.dispatchEvent(new CustomEvent('burgerlicious_cart_updated'));

        // Tampilkan pesan toast berhasil
        showToast('Berhasil!', `${menu.nama_menu} telah ditambahkan ke keranjang.`, 'success');
    }

    // Custom Toast notification popup
    function showToast(title, message, type = 'success') {
        if (!document.getElementById('toast-style')) {
            const style = document.createElement('style');
            style.id = 'toast-style';
            style.innerHTML = `
                @keyframes toastProgress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `;
            document.head.appendChild(style);
        }

        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = [
                'position:fixed', 'top:24px', 'right:24px', 'z-index:999999',
                'display:flex', 'flex-direction:column', 'gap:16px', 'pointer-events:none'
            ].join(';');
            document.body.appendChild(container);
        }

        const borderColor = type === 'warning' ? '#FEBB19' : '#BA0000';
        const icon = type === 'warning' ? '⚠️' : '🛒';
        const iconBg = type === 'warning' ? '#FEBB19' : '#BA0000';
        const iconColor = type === 'warning' ? '#5D0303' : 'white';

        const toast = document.createElement('div');
        toast.style.cssText = [
            'display:flex', 'align-items:center', 'gap:14px', 'padding:16px 20px',
            'background:#FFF8EE', 'border-radius:12px',
            'box-shadow:0 10px 30px rgba(0,0,0,0.12)', 'font-family:\'Baloo Bhaijaan 2\', sans-serif',
            'transform:translateX(120%)', 'transition:transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s',
            'opacity:0', 'pointer-events:auto', 'min-width:280px', 'max-width:90vw', 'width:380px',
            'position:relative', 'overflow:hidden'
        ].join(';');

        toast.innerHTML = `
            <div style="background:${iconBg};color:${iconColor};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;box-shadow:0 2px 6px rgba(0,0,0,0.08);">
                ${icon}
            </div>
            <div style="flex:1;">
                <p style="margin:0;font-size:15px;font-weight:800;color:#1c1e21;line-height:1.2;">${title}</p>
                <p style="margin:4px 0 0 0;font-size:12px;color:#4a4a4a;line-height:1.3;font-weight:500;">${message}</p>
            </div>
            <button style="border:none;background:none;font-size:20px;color:#999;cursor:pointer;padding:4px;line-height:1;margin-left:4px;transition:color 0.2s;" onmouseover="this.style.color='#BA0000'" onmouseout="this.style.color='#999'" onclick="this.parentElement.remove()">&times;</button>
            <div style="position:absolute;bottom:0;left:0;height:4px;background:${borderColor};width:100%;animation:toastProgress 4000ms linear forwards;"></div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 50);

        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
                if (container.children.length === 0) {
                    container.remove();
                }
            }, 300);
        }, 4000);
    }

    // Search input listener
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterAndRenderMenus();
        });
    }

    // Initialize
    loadCategories();
    loadMenus();
});
