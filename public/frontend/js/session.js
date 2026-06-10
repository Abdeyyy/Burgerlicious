// Intercept fetch secara global untuk melampirkan X-XSRF-TOKEN header pada request mutasi (POST/PUT/DELETE/PATCH)
(function() {
    const originalFetch = window.fetch;
    window.fetch = function (url, options = {}) {
        const method = (options.method || 'GET').toUpperCase();
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
            // Dapatkan token CSRF dari cookie XSRF-TOKEN
            const xsrfToken = document.cookie
                .split('; ')
                .find(row => row.startsWith('XSRF-TOKEN='))
                ?.split('=')[1];

            if (xsrfToken) {
                options.headers = options.headers || {};
                if (options.headers instanceof Headers) {
                    options.headers.set('X-XSRF-TOKEN', decodeURIComponent(xsrfToken));
                } else if (Array.isArray(options.headers)) {
                    const hasToken = options.headers.some(h => h[0].toLowerCase() === 'x-xsrf-token');
                    if (!hasToken) {
                        options.headers.push(['X-XSRF-TOKEN', decodeURIComponent(xsrfToken)]);
                    }
                } else {
                    options.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
                }
            }
        }
        return originalFetch(url, options);
    };
})();
function formatRupiah(angka) {
    return 'Rp ' + (angka ? Number(angka).toLocaleString('id-ID') : '0');
}

function initializePublicMobileMenu() {
    const header = document.querySelector('header');
    if (!header) return;

    const nav = header.querySelector('nav');
    if (!nav) return; // Only run on public pages with navigation menu

    const container = header.querySelector('div');
    if (!container) return;

    // Get links from desktop nav
    const links = Array.from(nav.querySelectorAll('a')).map(a => {
        return {
            href: a.getAttribute('href'),
            text: a.textContent.trim(),
            isActive: a.classList.contains('text-white') || a.classList.contains('bg-[#8F0919]')
        };
    });

    // Find action element (usually Login or will be Profile)
    const allLinks = Array.from(header.querySelectorAll('a'));
    let actionEl = allLinks.find(a => a.textContent.trim().toLowerCase() === 'login' && a.href.includes('login.html')) || container.lastElementChild;

    // Create actions wrapper
    let actionsWrapper = document.getElementById('public-actions-wrapper');
    if (!actionsWrapper && actionEl) {
        actionsWrapper = document.createElement('div');
        actionsWrapper.id = 'public-actions-wrapper';
        actionsWrapper.className = 'flex items-center gap-3 z-50';
        actionEl.parentNode.insertBefore(actionsWrapper, actionEl);
        actionsWrapper.appendChild(actionEl);
    }

    // Create hamburger button
    let hamburger = document.getElementById('public-hamburger');
    if (!hamburger) {
        hamburger = document.createElement('button');
        hamburger.id = 'public-hamburger';
        hamburger.className = 'md:hidden flex flex-col justify-center items-center gap-1.5 w-10 h-10 border border-[#FEBB19] rounded-full bg-white text-black hover:text-white hover:bg-[#8F0919] transition-colors focus:outline-none cursor-pointer';
        hamburger.innerHTML = `
            <span class="w-5 h-0.5 bg-current transition-transform duration-300" id="pub-ham-line-1"></span>
            <span class="w-5 h-0.5 bg-current transition-opacity duration-300" id="pub-ham-line-2"></span>
            <span class="w-5 h-0.5 bg-current transition-transform duration-300" id="pub-ham-line-3"></span>
        `;
        if (actionsWrapper) {
            actionsWrapper.appendChild(hamburger);
        } else {
            container.appendChild(hamburger);
        }
    }

    // Create backdrop if not exists
    let backdrop = document.getElementById('pub-menu-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'pub-menu-backdrop';
        backdrop.className = 'fixed inset-0 bg-black/40 backdrop-blur-sm z-30 opacity-0 pointer-events-none transition-opacity duration-300';
        document.body.appendChild(backdrop);
    }

    // Create mobile menu drawer if not exists
    let mobileMenu = document.getElementById('pub-menu-drawer');
    if (!mobileMenu) {
        mobileMenu = document.createElement('div');
        mobileMenu.id = 'pub-menu-drawer';
        mobileMenu.className = 'fixed inset-y-0 right-0 w-64 bg-[#8F0919] shadow-2xl z-40 transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col pt-24 px-6 gap-6 font-semibold';
        
        // Populate links
        mobileMenu.innerHTML = links.map(l => {
            const activeClass = l.isActive ? 'text-yellow-400 font-extrabold border-b-2 border-yellow-400 pb-1' : 'text-white hover:text-yellow-300';
            return `
                <a href="${l.href}" class="text-xl uppercase tracking-wider transition-colors ${activeClass}">${l.text}</a>
            `;
        }).join('');
        
        document.body.appendChild(mobileMenu);
    }

    let isOpen = false;
    function toggleMenu() {
        isOpen = !isOpen;
        if (isOpen) {
            mobileMenu.classList.remove('translate-x-full');
            backdrop.classList.add('opacity-100');
            backdrop.classList.remove('pointer-events-none');
            document.getElementById('pub-ham-line-1').style.transform = 'translateY(8px) rotate(45deg)';
            document.getElementById('pub-ham-line-2').style.opacity = '0';
            document.getElementById('pub-ham-line-3').style.transform = 'translateY(-8px) rotate(-45deg)';
        } else {
            mobileMenu.classList.add('translate-x-full');
            backdrop.classList.remove('opacity-100');
            backdrop.classList.add('pointer-events-none');
            document.getElementById('pub-ham-line-1').style.transform = '';
            document.getElementById('pub-ham-line-2').style.opacity = '1';
            document.getElementById('pub-ham-line-3').style.transform = '';
        }
    }

    hamburger.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMenu();
    });
    backdrop.addEventListener('click', toggleMenu);
}

document.addEventListener('DOMContentLoaded', async function () {
    const basePath = window.location.pathname.includes('/public/pages/') ? '../../' : './';
    initializePublicMobileMenu();

    const currentPage = window.location.pathname.split('/').pop();
    const adminPages = ['dashboard.html', 'menu_management.html', 'order_queue.html', 'analytics.html', 'promo_management.html', 'pos.html'];
    const isCurrentPageAdmin = adminPages.includes(currentPage) || (currentPage === '' && window.location.pathname.includes('/public/pages/'));

    // Sembunyikan tombol Login SEGERA sebelum fetch, agar tidak ada glitch/flash
    const allLinks = document.querySelectorAll('a');
    const loginBtns = Array.from(allLinks).filter(a =>
        a.textContent.trim().toLowerCase() === 'login' &&
        a.href.includes('login.html')
    );
    loginBtns.forEach(btn => { btn.style.visibility = 'hidden'; });

    try {
        const res = await fetch(basePath + 'auth/check_session.php');
        const data = await res.json();

        if (!data.loggedIn) {
            loginBtns.forEach(btn => { btn.style.visibility = ''; });
            if (isCurrentPageAdmin) {
                window.location.href = basePath + 'public/pages/login.html';
            }
            return;
        }

        if (isCurrentPageAdmin && data.role !== 'admin') {
            alert('Akses Ditolak: Halaman ini hanya dapat diakses oleh Administrator!');
            window.location.href = basePath + 'index.html';
            return;
        }

        window.currentUserId = data.user_id;
        const profileImgUrl = data.foto_profil ? (basePath + data.foto_profil) : (basePath + 'assets/icon/profile.png');

        // Fetch order history to compute status update notifications
        let badgeCount = 0;
        try {
            const histRes = await fetch(basePath + 'api/user/order_history.php');
            const histData = await histRes.json();
            if (histData.status === 'success' && histData.data) {
                const orders = histData.data;
                const storageKey = `burgerlicious_notifications_${data.user_id}`;
                let state = JSON.parse(localStorage.getItem(storageKey)) || { orderStatuses: {}, notifications: {} };
                
                let stateUpdated = false;
                orders.forEach(order => {
                    const id = order.id_transaksi.toString();
                    const currentStatus = order.status_pesanan;
                    const savedStatus = state.orderStatuses[id];
                    
                    if (savedStatus !== undefined) {
                        if (savedStatus !== currentStatus) {
                            state.notifications[id] = true;
                            state.orderStatuses[id] = currentStatus;
                            stateUpdated = true;
                        }
                    } else {
                        // Initialize new order without notification flag
                        state.orderStatuses[id] = currentStatus;
                        stateUpdated = true;
                    }
                });
                
                if (stateUpdated) {
                    localStorage.setItem(storageKey, JSON.stringify(state));
                }
                
                badgeCount = Object.values(state.notifications).filter(val => val === true).length;
            }
        } catch (e) {
            console.error('Failed to process notifications:', e);
        }
        window.profileBadgeCount = badgeCount;
        window.dispatchEvent(new CustomEvent('burgerlicious_notifications_ready', {
            detail: { badgeCount: badgeCount, userId: data.user_id }
        }));


        const dropdown = document.createElement('div');
        dropdown.id = 'profile-dropdown';
        dropdown.style.cssText = [
            'position:fixed',
            'top:72px',
            'right:16px',
            'width:280px',
            'background:#fff',
            'border-radius:12px',
            'box-shadow:0 4px 24px rgba(0,0,0,0.18)',
            'z-index:9999',
            'display:none',
            'overflow:hidden',
            'font-family:inherit',
            'border:1px solid #e5e7eb'
        ].join(';');

        const menuItems = [];
        if (data.role === 'admin') {
            menuItems.push({ icon: 'fas fa-tachometer-alt', label: 'Dashboard Admin', link: basePath + 'public/pages/dashboard.html' });
        } else {
            menuItems.push(
                { icon: 'far fa-calendar-alt', label: 'Aktivitas', link: basePath + 'public/pages/profile.html?tab=history' },
                { icon: 'fas fa-coins', label: 'Promo dan Voucher', link: basePath + 'public/pages/profile.html?tab=promo' }
            );
        }
        menuItems.push({ icon: 'fas fa-shield-alt', label: 'Keamanan Akun', link: basePath + 'public/pages/profile.html?tab=security' });

        dropdown.innerHTML = `
            <!-- Header Profil -->
            <div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid #e5e7eb;gap:12px;">
                <img src="${profileImgUrl}" alt="Profile"
                    style="width:56px;height:56px;object-fit:cover;border-radius:50%;flex-shrink:0;">
                <div style="flex:1;min-width:0;">
                    <div style="font-size:17px;font-weight:700;color:#1c1e21;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${data.nama}</div>
                    <div style="font-size:13px;color:#65676b;margin-top:2px;">${data.role === 'admin' ? 'Admin' : 'Customer'}</div>
                </div>
                <button id="dd-edit-btn" style="background:none;border:none;cursor:pointer;color:#65676b;padding:6px;font-size:17px;border-radius:50%;line-height:1;">
                    <i class="fas fa-pencil-alt"></i>
                </button>
            </div>

            <!-- Menu Items -->
            <div style="padding:6px 0;">
                ${menuItems.map(item => `
                    <a href="${item.link}"
                        style="display:flex;align-items:center;padding:10px 16px;color:#1c1e21;text-decoration:none;gap:14px;transition:background 0.15s;"
                        onmouseover="this.style.background='#f0f2f5';"
                        onmouseout="this.style.background='';">
                        <span style="width:32px;height:32px;background:#e4e6eb;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                            <i class="${item.icon}" style="font-size:15px;color:#1c1e21;"></i>
                        </span>
                        <span style="font-size:14px;font-weight:500;">${item.label}</span>
                    </a>
                `).join('')}

                <!-- Divider -->
                <div style="height:1px;background:#e5e7eb;margin:6px 0;"></div>

                <!-- Logout -->
                <a href="${basePath}auth/logout.php"
                    style="display:flex;align-items:center;padding:10px 16px;color:#BA0000;text-decoration:none;gap:14px;transition:background 0.15s;"
                    onmouseover="this.style.background='#fff0f0';"
                    onmouseout="this.style.background='';">
                    <span style="width:32px;height:32px;background:#ffe0e0;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fas fa-sign-out-alt" style="font-size:15px;color:#BA0000;"></i>
                    </span>
                    <span style="font-size:14px;font-weight:700;">Logout</span>
                </a>
            </div>
        `;
        document.body.appendChild(dropdown);

        // Tambahkan event listener untuk tombol edit pensil di dropdown
        const editBtn = dropdown.querySelector('#dd-edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = basePath + 'public/pages/profile.html';
            });
        }

        // Toggle dropdown
        function openDropdown() {
            dropdown.style.display = 'block';
            const btnRect = profileBtn.getBoundingClientRect();
            // Kurangi padding transparan di bawah gambar profile.png
            const offset = window.innerWidth < 768 ? 5 : 14;
            dropdown.style.top = (btnRect.bottom - offset) + 'px';
            dropdown.style.right = (window.innerWidth - btnRect.right) + 'px';
        }

        function closeDropdown() {
            dropdown.style.display = 'none';
        }

        // Tutup dropdown saat klik di luar
        document.addEventListener('click', function (e) {
            if (!dropdown.contains(e.target) && (!profileBtn || (e.target !== profileBtn && !profileBtn.contains(e.target)))) {
                closeDropdown();
            }
        });

        // ── Ganti semua tombol Login dengan icon profile + keranjang ──────────────
        
        // Sinkronisasi Data Keranjang
        window.getCart = () => {
            try {
                const key = window.currentUserId ? `burgerlicious_cart_${window.currentUserId}` : 'burgerlicious_cart';
                return JSON.parse(localStorage.getItem(key)) || [];
            } catch (e) {
                return [];
            }
        };

        window.saveCart = (cart) => {
            const key = window.currentUserId ? `burgerlicious_cart_${window.currentUserId}` : 'burgerlicious_cart';
            localStorage.setItem(key, JSON.stringify(cart));
            window.dispatchEvent(new CustomEvent('burgerlicious_cart_updated'));
        };

        if (data.role !== 'admin') {
            // Buat Drawer Keranjang Belanja secara dinamis
            const drawer = document.createElement('div');
            drawer.id = 'cart-drawer';
            drawer.style.cssText = [
                'position:fixed', 'top:0', 'right:-400px', 'width:380px', 'height:100%',
                'background:white', 'box-shadow:-4px 0 24px rgba(0,0,0,0.15)', 'z-index:99999',
                'transition:right 0.3s ease-in-out', 'display:flex', 'flex-direction:column',
                'font-family:inherit', 'border-left:1px solid #e5e7eb'
            ].join(';');
            
            drawer.innerHTML = `
                <!-- Header -->
                <div style="padding:18px 20px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;background:#5D0303;color:white;">
                    <h3 style="margin:0;font-size:18px;font-weight:700;display:flex;align-items:center;gap:8px;">🛒 Keranjang Belanja</h3>
                    <button id="close-cart-drawer-btn" style="background:none;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:4px;display:flex;align-items:center;justify-content:center;">&times;</button>
                </div>
                <!-- Items Container -->
                <div id="cart-items-container" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px;">
                    <!-- Diisi via JS -->
                </div>
                <!-- Footer -->
                <div id="cart-drawer-footer" style="padding:20px;border-top:1px solid #e5e7eb;background:#f9fafb;display:none;flex-direction:column;gap:16px;">
                    <div style="display:flex;justify-content:space-between;font-weight:800;font-size:16px;color:#1a1a1a;">
                        <span>Total Pembayaran:</span>
                        <span id="cart-drawer-total">Rp 0</span>
                    </div>
                    <button id="checkout-cart-btn" style="background:#5D0303;color:white;border:none;padding:14px;border-radius:12px;font-weight:700;cursor:pointer;width:100%;transition:background 0.2s;font-size:14px;text-align:center;">
                        Checkout Pesanan
                    </button>
                </div>
            `;
            document.body.appendChild(drawer);

            const closeBtn = drawer.querySelector('#close-cart-drawer-btn');
            closeBtn.onclick = () => { window.closeCartDrawer(); };

            const checkoutBtn = drawer.querySelector('#checkout-cart-btn');
            checkoutBtn.onclick = () => {
                window.closeCartDrawer();
                window.location.href = basePath + 'public/pages/pesan.html?checkout=cart';
            };

            window.openCartDrawer = () => {
                drawer.style.right = '0px';
            };

            window.closeCartDrawer = () => {
                drawer.style.right = '-400px';
            };

            window.updateCartUI = () => {
                const cart = window.getCart();
                const badge = document.getElementById('cart-badge');
                const itemsContainer = document.getElementById('cart-items-container');
                const footer = document.getElementById('cart-drawer-footer');
                const totalEl = document.getElementById('cart-drawer-total');

                // Hitung total item & harga
                let totalCount = 0;
                let totalPrice = 0;
                cart.forEach(item => {
                    totalCount += item.jumlah;
                    totalPrice += item.harga * item.jumlah;
                });

                // Update Badge
                if (badge) {
                    if (totalCount > 0) {
                        badge.textContent = totalCount;
                        badge.style.display = 'flex';
                    } else {
                        badge.style.display = 'none';
                    }
                }

                // Render Items
                if (cart.length === 0) {
                    itemsContainer.innerHTML = `
                        <div style="text-align:center;color:#9ca3af;margin-top:40px;">
                            <div style="font-size:48px;margin-bottom:12px;">🛒</div>
                            <p style="font-size:14px;font-weight:600;margin:0;">Keranjang belanja kosong.</p>
                            <p style="font-size:12px;margin:4px 0 0 0;">Yuk, pilih burger favoritmu sekarang!</p>
                        </div>
                    `;
                    if (footer) footer.style.display = 'none';
                } else {
                    itemsContainer.innerHTML = cart.map((item, idx) => {
                        const itemImg = item.gambar || (basePath + 'assets/images/menu_placeholder.png');
                        return `
                            <div style="display:flex;gap:12px;align-items:center;border-bottom:1px solid #f3f4f6;padding-bottom:12px;">
                                <img src="${itemImg}" alt="${item.nama}" style="width:60px;height:60px;object-fit:contain;background:#f9fafb;border-radius:8px;padding:4px;flex-shrink:0;">
                                <div style="flex:1;min-width:0;">
                                    <h4 style="margin:0;font-size:14px;font-weight:700;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.nama}</h4>
                                    <p style="margin:2px 0 0 0;font-size:12px;font-weight:700;color:#BA0000;">${formatRupiah(item.harga)}</p>
                                    
                                    <div style="display:flex;align-items:center;gap:10px;margin-top:8px;">
                                        <!-- Qty Control -->
                                        <div style="display:flex;align-items:center;gap:6px;background:#f3f4f6;border-radius:99px;padding:2px 6px;">
                                            <button onclick="changeCartQty(${idx}, -1)" style="border:none;background:none;font-weight:bold;cursor:pointer;padding:0 4px;font-size:14px;color:#4b5563;">−</button>
                                            <span style="font-size:12px;font-weight:700;min-width:14px;text-align:center;color:#1f2937;">${item.jumlah}</span>
                                            <button onclick="changeCartQty(${idx}, 1)" style="border:none;background:none;font-weight:bold;cursor:pointer;padding:0 4px;font-size:14px;color:#BA0000;">+</button>
                                        </div>
                                    </div>
                                </div>
                                <button onclick="removeFromCart(${idx})" style="border:none;background:none;cursor:pointer;color:#ba0000;padding:6px;font-size:16px;transition:opacity 0.2s;" onmouseover="this.style.opacity=0.7;" onmouseout="this.style.opacity=1;">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        `;
                    }).join('');

                    if (footer) {
                        footer.style.display = 'flex';
                        totalEl.textContent = formatRupiah(totalPrice);
                    }
                }
            };

            window.changeCartQty = (idx, delta) => {
                const cart = window.getCart();
                if (cart[idx]) {
                    cart[idx].jumlah = Math.max(1, cart[idx].jumlah + delta);
                    window.saveCart(cart);
                }
            };

            window.removeFromCart = (idx) => {
                const cart = window.getCart();
                cart.splice(idx, 1);
                window.saveCart(cart);
            };

            // Listen update event
            window.addEventListener('burgerlicious_cart_updated', () => {
                window.updateCartUI();
            });

            // Create Floating Cart Button in the bottom-right corner
            const cartBtn = document.createElement('button');
            cartBtn.id = 'floating-cart-btn';
            cartBtn.title = 'Keranjang Belanja';
            cartBtn.style.cssText = [
                'position:fixed', 'bottom:24px', 'right:24px', 'z-index:99998',
                'width:60px', 'height:60px', 'border:none', 'cursor:pointer',
                'background:#BA0000', 'border-radius:50%', 'display:flex',
                'align-items:center', 'justify-content:center', 'transition:all 0.3s ease',
                'color:white', 'box-shadow:0 8px 24px rgba(186,0,0,0.3)', 'outline:none'
            ].join(';');

            cartBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" style="width:28px;height:28px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span id="cart-badge" style="display:none;position:absolute;top:-4px;right:-4px;background:#FEBB19;color:#5D0303;font-size:11px;font-weight:900;border-radius:50%;width:22px;height:22px;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.2);border:2px solid white;">0</span>
            `;

            cartBtn.addEventListener('mouseenter', () => {
                cartBtn.style.transform = 'scale(1.1) translateY(-4px)';
                cartBtn.style.boxShadow = '0 12px 28px rgba(186,0,0,0.45)';
            });
            cartBtn.addEventListener('mouseleave', () => {
                cartBtn.style.transform = 'scale(1) translateY(0)';
                cartBtn.style.boxShadow = '0 8px 24px rgba(186,0,0,0.3)';
            });
            cartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.openCartDrawer();
            });

            document.body.appendChild(cartBtn);

            // Initialize UI
            window.updateCartUI();
        } else {
            // No-op definition for admin
            window.openCartDrawer = () => {};
            window.closeCartDrawer = () => {};
            window.updateCartUI = () => {};
        }

        loginBtns.forEach(loginBtn => {
            // Profile Button
            profileBtn = document.createElement('button');
            profileBtn.title = 'Profil Saya';
            const isMobile = window.innerWidth < 768;
            const size = isMobile ? '50px' : '90px';
            const badgeTop = isMobile ? '4px' : '14px';
            const badgeRight = isMobile ? '4px' : '14px';
            
            profileBtn.style.cssText = [
                `width:${size}`, `height:${size}`,
                'border:none', 'cursor:pointer',
                'background:transparent', 'padding:0',
                'display:flex', 'align-items:center', 'justify-content:center',
                'transition:opacity 0.2s,transform 0.2s', 'flex-shrink:0',
                'position:relative'
            ].join(';');

            const showNavBadge = window.profileBadgeCount > 0 ? 'flex' : 'none';
            profileBtn.innerHTML = `
                <img src="${profileImgUrl}" alt="Profile" style="width:${size};height:${size};object-fit:cover;display:block;border-radius:50%;">
                <span id="profile-nav-badge" style="position:absolute;top:${badgeTop};right:${badgeRight};background:#BA0000;color:white;font-size:11px;font-weight:900;border-radius:50%;width:22px;height:22px;display:${showNavBadge};align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2);z-index:10;">${window.profileBadgeCount}</span>
            `;

            profileBtn.addEventListener('mouseenter', () => {
                profileBtn.style.opacity = '0.8';
                profileBtn.style.transform = 'scale(1.05)';
            });
            profileBtn.addEventListener('mouseleave', () => {
                profileBtn.style.opacity = '1';
                profileBtn.style.transform = 'scale(1)';
            });
            profileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (dropdown.style.display === 'none' || dropdown.style.display === '') {
                    openDropdown();
                } else {
                    closeDropdown();
                }
            });

            loginBtn.replaceWith(profileBtn);
        });

    } catch (error) {
        loginBtns.forEach(btn => { btn.style.visibility = ''; });
        console.error('Gagal memverifikasi status login:', error);
    }
});
