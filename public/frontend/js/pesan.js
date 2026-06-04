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

const menuDataStatic = {
    'original-flavour': { nama: 'Original Flavour', deskripsi: 'Cita rasa asli Burgerlicious dengan daging sapi juicy dan saus rahasia yang autentik.', harga: 45000, gambar: '../../assets/images/BestSeller_1.png' },
    'chicken-original': { nama: 'Chicken Original', deskripsi: 'Ayam krispi fillet tebal yang gurih dengan perpaduan selada segar dan roti lembut.', harga: 38000, gambar: '../../assets/images/BestSeller_2.png' },
    'spicy-chicken': { nama: 'Spicy Chicken', deskripsi: 'Sensasi pedas yang membakar semangat di tiap gigitan. Tantang diri Anda!', harga: 42000, gambar: '../../assets/images/BestSeller_3.png' },
    'double-meat-burger': { nama: 'Double Meat Burger', deskripsi: 'Double daging yang juicy dengan keju premium.', harga: 32999, gambar: '../../assets/images/menu_1.png' },
    'darth-vader-burger': { nama: 'Darth Vader Burger', deskripsi: 'Burger original edisi spesial kolaborasi dengan Star Wars.', harga: 40000, gambar: '../../assets/images/menu_2.png' },
    'egg-cheese-burger': { nama: 'Egg Cheese Burger', deskripsi: 'Daging dan telur yang nikmat dalam satu gigitan.', harga: 37000, gambar: '../../assets/images/menu_3.png' },
    'red-bun-burger': { nama: 'Red Bun Burger', deskripsi: 'Roti merah yang lezat dan pedas dengan daging sapi.', harga: 32499, gambar: '../../assets/images/menu_4.png' },
    'fried-fries': { nama: 'Fried Fries', deskripsi: 'Kentang goreng renyah dengan saus cocol favorit.', harga: 15900, gambar: '../../assets/images/menu_5.png' },
    'cheese-hot-dogs': { nama: 'Cheese Hot Dogs', deskripsi: 'Roti panjang dengan sosis daging sapi dan keju yang lezat.', harga: 20000, gambar: '../../assets/images/menu_6.png' },
    'fried-wings': { nama: 'Fried Wings', deskripsi: 'Sayap ayam goreng renyah dengan cita rasa yang lezat.', harga: 39000, gambar: '../../assets/images/menu_7.png' },
    'bucket-nugget': { nama: 'Bucket Nugget', deskripsi: 'Nugget ayam renyah dengan saus cocol favorit.', harga: 25000, gambar: '../../assets/images/menu_8.png' }
};

const ongkirData = { instant: 12000, hemat: 7000, pickup: 0 };
let promoList = {}; // Will be populated from the database

let menuDipilih = null;
let jumlah = 1;
let diskonAktif = null;
let isLoggedInGlobal = false;
let currentUserId = null;

// Cart Mode variables
let cartMode = false;
let cartItems = [];

function formatRupiah(angka) {
    return 'Rp ' + angka.toLocaleString('id-ID');
}

function getCartKey() {
    return currentUserId ? `burgerlicious_cart_${currentUserId}` : 'burgerlicious_cart';
}

// Custom Toast notification popup implementation
function showToast(title, message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = [
            'position:fixed', 'top:24px', 'right:24px', 'z-index:999999',
            'display:flex', 'flex-direction:column', 'gap:12px', 'pointer-events:none'
        ].join(';');
        document.body.appendChild(container);
    }

    const borderColor = type === 'warning' ? '#FEBB19' : '#BA0000';
    const icon = type === 'warning' ? '⚠️' : '🛒';
    const iconBg = type === 'warning' ? '#FEBB19' : '#BA0000';
    const iconColor = type === 'warning' ? '#5D0303' : 'white';

    const toast = document.createElement('div');
    toast.style.cssText = [
        'display:flex', 'align-items:center', 'gap:14px', 'padding:14px 20px',
        'background:#FFF8EE', `border-left:5px solid ${borderColor}`, 'border-radius:12px',
        'box-shadow:0 10px 30px rgba(0,0,0,0.12)', 'font-family:\'Baloo Bhaijaan 2\', sans-serif',
        'transform:translateX(120%)', 'transition:transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s',
        'opacity:0', 'pointer-events:auto', 'min-width:280px', 'max-width:360px'
    ].join(';');

    toast.innerHTML = `
        <div style="background:${iconBg};color:${iconColor};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">
            ${icon}
        </div>
        <div style="flex:1;">
            <p style="margin:0;font-size:14px;font-weight:700;color:#1c1e21;line-height:1.2;">${title}</p>
            <p style="margin:2px 0 0 0;font-size:12px;color:#555;line-height:1.3;">${message}</p>
        </div>
        <button style="border:none;background:none;font-size:18px;color:#888;cursor:pointer;padding:4px;line-height:1;margin-left:4px;" onclick="this.parentElement.remove()">&times;</button>
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
    }, 3500);
}

function getOngkir() {
    const val = document.querySelector('input[name="pengiriman"]:checked');
    return val ? ongkirData[val.value] : 12000;
}

// Map delivery selector values to localized description strings
function getPengirimanLabel() {
    const val = document.querySelector('input[name="pengiriman"]:checked');
    const labels = { instant: 'Kurir Instant (15–25 menit)', hemat: 'Kurir Hemat (30–45 menit)', pickup: 'Ambil Sendiri (Pickup)' };
    return val ? labels[val.value] : '-';
}

function hitungTotal() {
    let subtotal = 0;
    if (cartMode) {
        cartItems.forEach(item => {
            subtotal += item.harga * item.jumlah;
        });
    } else {
        if (!menuDipilih) return 0;
        subtotal = menuDipilih.harga * jumlah;
    }

    const ongkir = getOngkir();
    let diskon = 0;

    if (diskonAktif) {
        if (diskonAktif.persen !== null && diskonAktif.persen !== undefined) {
            if (diskonAktif.id_kategori_target !== null) {
                let totalTargetKat = 0;
                if (cartMode) {
                    cartItems.forEach(item => {
                        if (parseInt(item.id_kategori) === parseInt(diskonAktif.id_kategori_target)) {
                            totalTargetKat += item.harga * item.jumlah;
                        }
                    });
                } else {
                    if (menuDipilih && parseInt(menuDipilih.id_kategori) === parseInt(diskonAktif.id_kategori_target)) {
                        totalTargetKat = subtotal;
                    }
                }
                diskon = Math.round(totalTargetKat * diskonAktif.persen / 100);
            } else {
                diskon = Math.round(subtotal * diskonAktif.persen / 100);
            }
        } else if (diskonAktif.nominal !== null && diskonAktif.nominal !== undefined) {
            diskon = Math.min(diskonAktif.nominal, subtotal);
        } else if (diskonAktif.bogo) {
            let eligibleItems = [];
            if (cartMode) {
                cartItems.forEach(item => {
                    if (diskonAktif.id_kategori_target === null || parseInt(item.id_kategori) === parseInt(diskonAktif.id_kategori_target)) {
                        for (let i = 0; i < item.jumlah; i++) {
                            eligibleItems.push(item.harga);
                        }
                    }
                });
            } else {
                if (menuDipilih && (diskonAktif.id_kategori_target === null || parseInt(menuDipilih.id_kategori) === parseInt(diskonAktif.id_kategori_target))) {
                    for (let i = 0; i < jumlah; i++) {
                        eligibleItems.push(menuDipilih.harga);
                    }
                }
            }

            if (eligibleItems.length >= 2) {
                eligibleItems.sort((a, b) => a - b);
                const freeCount = Math.floor(eligibleItems.length / 2);
                for (let i = 0; i < freeCount; i++) {
                    diskon += eligibleItems[i];
                }
            }
        }
    }

    return Math.max(0, subtotal + ongkir - diskon);
}

function updateSummary() {
    let subtotal = 0;
    if (cartMode) {
        cartItems.forEach(item => {
            subtotal += item.harga * item.jumlah;
        });
    } else {
        if (!menuDipilih) return;
        subtotal = menuDipilih.harga * jumlah;
    }

    const ongkir = getOngkir();
    let diskon = 0;

    if (diskonAktif) {
        if (diskonAktif.persen !== null && diskonAktif.persen !== undefined) {
            if (diskonAktif.id_kategori_target !== null) {
                let totalTargetKat = 0;
                if (cartMode) {
                    cartItems.forEach(item => {
                        if (parseInt(item.id_kategori) === parseInt(diskonAktif.id_kategori_target)) {
                            totalTargetKat += item.harga * item.jumlah;
                        }
                    });
                } else {
                    if (menuDipilih && parseInt(menuDipilih.id_kategori) === parseInt(diskonAktif.id_kategori_target)) {
                        totalTargetKat = subtotal;
                    }
                }
                diskon = Math.round(totalTargetKat * diskonAktif.persen / 100);
            } else {
                diskon = Math.round(subtotal * diskonAktif.persen / 100);
            }
        } else if (diskonAktif.nominal !== null && diskonAktif.nominal !== undefined) {
            diskon = Math.min(diskonAktif.nominal, subtotal);
        } else if (diskonAktif.bogo) {
            let eligibleItems = [];
            if (cartMode) {
                cartItems.forEach(item => {
                    if (diskonAktif.id_kategori_target === null || parseInt(item.id_kategori) === parseInt(diskonAktif.id_kategori_target)) {
                        for (let i = 0; i < item.jumlah; i++) {
                            eligibleItems.push(item.harga);
                        }
                    }
                });
            } else {
                if (menuDipilih && (diskonAktif.id_kategori_target === null || parseInt(menuDipilih.id_kategori) === parseInt(diskonAktif.id_kategori_target))) {
                    for (let i = 0; i < jumlah; i++) {
                        eligibleItems.push(menuDipilih.harga);
                    }
                }
            }

            if (eligibleItems.length >= 2) {
                eligibleItems.sort((a, b) => a - b);
                const freeCount = Math.floor(eligibleItems.length / 2);
                for (let i = 0; i < freeCount; i++) {
                    diskon += eligibleItems[i];
                }
            }
        }
    }

    const total = Math.max(0, subtotal + ongkir - diskon);

    document.getElementById('s-harga').textContent = formatRupiah(subtotal);
    document.getElementById('s-ongkir').textContent = formatRupiah(ongkir);

    const diskonRow = document.getElementById('s-diskon-row');
    if (diskon > 0) {
        diskonRow.classList.remove('hidden');
        diskonRow.style.display = 'flex';
        document.getElementById('s-diskon').textContent = '- ' + formatRupiah(diskon);
    } else {
        diskonRow.classList.add('hidden');
        diskonRow.style.display = '';
    }

    document.getElementById('s-total').textContent = formatRupiah(total);
    document.getElementById('totalBottom').textContent = formatRupiah(total);
}

function ubahJumlah(delta) {
    if (!isLoggedInGlobal) {
        openLoginModal();
        return;
    }
    jumlah = Math.max(1, jumlah + delta);
    document.getElementById('jumlahDisplay').textContent = jumlah;
    
    // Validate promo requirements again on quantity change
    if (diskonAktif) {
        const subtotal = menuDipilih ? menuDipilih.harga * jumlah : 0;
        if (subtotal < diskonAktif.min_order || (diskonAktif.bogo && jumlah < 2)) {
            hapusPromo();
            showToast('Promo Dilepas', 'Kuantiti/syarat minimal belanja tidak terpenuhi.', 'warning');
        }
    }
    updateSummary();
}

function openLoginModal() {
    const currentUrl = window.location.pathname + window.location.search;
    window.location.href = 'login.html?redirect=' + encodeURIComponent(currentUrl);
}

function tambahKeKeranjang() {
    if (!isLoggedInGlobal) {
        openLoginModal();
        return;
    }
    if (!menuDipilih) {
        showToast('Peringatan', 'Pilih menu terlebih dahulu.', 'warning');
        return;
    }

    // Get current cart
    let cart = [];
    try {
        cart = JSON.parse(localStorage.getItem(getCartKey())) || [];
    } catch (e) {
        cart = [];
    }

    // Find if item already exists
    const existingIndex = cart.findIndex(item => item.id_menu === menuDipilih.id_menu);
    if (existingIndex > -1) {
        cart[existingIndex].jumlah += jumlah;
    } else {
        cart.push({
            id_menu: menuDipilih.id_menu,
            id_kategori: menuDipilih.id_kategori,
            nama: menuDipilih.nama,
            harga: menuDipilih.harga,
            gambar: menuDipilih.gambar,
            jumlah: jumlah
        });
    }

    // Save cart
    localStorage.setItem(getCartKey(), JSON.stringify(cart));

    // Dispatch update event to session.js
    window.dispatchEvent(new CustomEvent('burgerlicious_cart_updated'));

    // Show success toast notification
    showToast('Berhasil!', `Menambahkan ${jumlah} ${menuDipilih.nama} ke keranjang.`, 'success');
}

function ubahJumlahCart(idx, delta) {
    if (!isLoggedInGlobal) {
        openLoginModal();
        return;
    }
    if (cartItems[idx]) {
        cartItems[idx].jumlah = Math.max(1, cartItems[idx].jumlah + delta);
        // Save to localStorage
        localStorage.setItem(getCartKey(), JSON.stringify(cartItems));
        
        // Dispatch event to sync with navbar cart badge / drawer
        window.dispatchEvent(new CustomEvent('burgerlicious_cart_updated'));
        
        // Re-render cart list in checkout page
        renderCartList();
        
        // Validate promo again on quantity change
        if (diskonAktif) {
            let subtotal = 0;
            let targetKatCount = 0;
            let eligibleBogoItems = 0;
            cartItems.forEach(item => {
                subtotal += item.harga * item.jumlah;
                if (diskonAktif.id_kategori_target !== null && parseInt(item.id_kategori) === parseInt(diskonAktif.id_kategori_target)) {
                    targetKatCount += item.harga * item.jumlah;
                    eligibleBogoItems += item.jumlah;
                } else if (diskonAktif.id_kategori_target === null) {
                    eligibleBogoItems += item.jumlah;
                }
            });

            const hasCategory = diskonAktif.id_kategori_target === null || targetKatCount > 0;
            const validMinOrder = subtotal >= diskonAktif.min_order;
            const validBogo = !diskonAktif.bogo || eligibleBogoItems >= 2;

            if (!hasCategory || !validMinOrder || !validBogo) {
                hapusPromo();
                showToast('Promo Dilepas', 'Syarat minimal belanja tidak terpenuhi.', 'warning');
            }
        }
        updateSummary();
    }
}

function renderCartList() {
    const listContainer = document.getElementById('rincianPesananList');
    if (!listContainer) return;

    if (cartItems.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align:center;color:#9ca3af;padding:40px;">
                <div style="font-size:48px;margin-bottom:12px;">🛒</div>
                <p style="font-size:14px;font-weight:600;margin:0;">Keranjang belanja kosong.</p>
                <p style="font-size:12px;margin:4px 0 0 0;">Kembali ke beranda untuk memilih menu.</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = cartItems.map((item, idx) => {
        const itemImg = item.gambar || '../../assets/images/menu_placeholder.png';
        return `
            <div class="p-4 flex gap-4 items-start border-b border-gray-100 last:border-b-0">
                <img loading="lazy" src="${itemImg}" alt="${item.nama}" class="w-16 h-16 object-contain bg-gray-50 rounded-xl p-2 flex-shrink-0">
                <div class="flex-1">
                    <p class="font-bold text-[#1a1a1a] text-sm">${item.nama}</p>
                    <p class="text-[#5D0303] font-bold text-sm mt-1">${formatRupiah(item.harga)}</p>
                    <div class="flex items-center gap-3 mt-2">
                        <button class="qty-btn bg-gray-100 text-gray-600 hover:bg-gray-200" onclick="ubahJumlahCart(${idx}, -1)">−</button>
                        <span class="font-bold text-sm w-6 text-center">${item.jumlah}</span>
                        <button class="qty-btn bg-[#5D0303] text-white hover:bg-[#8F0919]" onclick="ubahJumlahCart(${idx}, 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function pakaiPromo() {
    if (!isLoggedInGlobal) {
        openLoginModal();
        return;
    }
    const kode = document.getElementById('kodePromo').value.trim().toUpperCase();
    const promoError = document.getElementById('promoError');
    const promoInfo = document.getElementById('promoInfo');

    promoError.classList.add('hidden');
    promoInfo.classList.add('hidden');

    if (!kode) {
        promoError.textContent = 'Masukkan kode promo terlebih dahulu.';
        promoError.classList.remove('hidden');
        return;
    }

    const promo = promoList[kode];
    if (promo) {
        // Validate min order
        let subtotal = 0;
        if (cartMode) {
            cartItems.forEach(item => {
                subtotal += item.harga * item.jumlah;
            });
        } else {
            subtotal = menuDipilih ? menuDipilih.harga * jumlah : 0;
        }

        if (subtotal < promo.min_order) {
            promoError.textContent = `Minimum pembelian Rp ${promo.min_order.toLocaleString('id-ID')} tidak terpenuhi.`;
            promoError.classList.remove('hidden');
            return;
        }

        // Validate category target
        if (promo.id_kategori_target !== null) {
            let hasCategory = false;
            if (cartMode) {
                hasCategory = cartItems.some(item => parseInt(item.id_kategori) === parseInt(promo.id_kategori_target));
            } else {
                hasCategory = menuDipilih && parseInt(menuDipilih.id_kategori) === parseInt(promo.id_kategori_target);
            }

            if (!hasCategory) {
                promoError.textContent = 'Promo hanya berlaku untuk kategori tertentu yang tidak ada di keranjang Anda.';
                promoError.classList.remove('hidden');
                return;
            }
        }
        
        // Validate BOGO quantity
        if (promo.bogo) {
            let totalQty = 0;
            if (cartMode) {
                cartItems.forEach(item => {
                    if (promo.id_kategori_target === null || parseInt(item.id_kategori) === parseInt(promo.id_kategori_target)) {
                        totalQty += item.jumlah;
                    }
                });
            } else {
                if (menuDipilih && (promo.id_kategori_target === null || parseInt(menuDipilih.id_kategori) === parseInt(promo.id_kategori_target))) {
                    totalQty = jumlah;
                }
            }

            if (totalQty < 2) {
                promoError.textContent = 'Promo BOGO memerlukan minimal pembelian 2 porsi.';
                promoError.classList.remove('hidden');
                return;
            }
        }

        diskonAktif = promo;
        document.getElementById('promoNama').textContent = diskonAktif.nama;
        document.getElementById('promoDesc').textContent = diskonAktif.desc;
        promoInfo.classList.remove('hidden');
        updateSummary();
    } else {
        promoError.textContent = 'Kode promo tidak valid atau sudah kadaluarsa.';
        promoError.classList.remove('hidden');
        diskonAktif = null;
        updateSummary();
    }
}

function hapusPromo() {
    diskonAktif = null;
    document.getElementById('kodePromo').value = '';
    document.getElementById('promoInfo').classList.add('hidden');
    document.getElementById('promoError').classList.add('hidden');
    updateSummary();
}

function validate() {
    let valid = true;
    const alamat = document.getElementById('alamat').value.trim();
    const alamatError = document.getElementById('alamatError');

    alamatError.classList.add('hidden');
    if (!alamat) {
        alamatError.textContent = 'Alamat pengiriman tidak boleh kosong.';
        alamatError.classList.remove('hidden');
        valid = false;
    }
    return valid;
}

async function submitPesanan() {
    if (!isLoggedInGlobal) {
        openLoginModal();
        return;
    }

    if (!validate()) {
        document.getElementById('alamat').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const btn = document.getElementById('btnPesan');
    btn.disabled = true;
    btn.textContent = 'Memproses...';

    const id_menu = menuDipilih ? menuDipilih.id_menu : null;
    const jumlah_val = jumlah;
    const alamat_val = document.getElementById('alamat').value.trim();
    const catatan_val = document.getElementById('catatan').value.trim();
    const pembayaran_val = document.querySelector('input[name="pembayaran"]:checked').value;
    const pengiriman_val = document.querySelector('input[name="pengiriman"]:checked').value;
    const kode_promo_val = diskonAktif ? diskonAktif.nama : '';

    try {
        const bodyData = {
            alamat: alamat_val,
            catatan: catatan_val,
            pembayaran: pembayaran_val,
            pengiriman: pengiriman_val,
            kode_promo: kode_promo_val
        };

        if (cartMode) {
            bodyData.items = cartItems.map(item => ({
                id_menu: item.id_menu,
                jumlah: item.jumlah
            }));
        } else {
            bodyData.id_menu = id_menu;
            bodyData.jumlah = jumlah_val;
        }

        const response = await fetch('../../api/order/checkout.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            if (cartMode) {
                const names = cartItems.map(item => `${item.nama} (${item.jumlah})`).join(', ');
                const totalQty = cartItems.reduce((acc, item) => acc + item.jumlah, 0);
                document.getElementById('r-menu').textContent = names;
                document.getElementById('r-jumlah').textContent = totalQty + ' porsi';
                
                // Clear cart from localStorage since order is placed
                localStorage.removeItem(getCartKey());
                window.dispatchEvent(new CustomEvent('burgerlicious_cart_updated'));
            } else {
                document.getElementById('r-menu').textContent       = menuDipilih ? menuDipilih.nama : '-';
                document.getElementById('r-jumlah').textContent     = jumlah + ' porsi';
            }

            document.getElementById('r-alamat').textContent     = alamat_val;
            document.getElementById('r-pengiriman').textContent = getPengirimanLabel();
            document.getElementById('r-pembayaran').textContent = pembayaran_val;
            document.getElementById('r-catatan').textContent    = catatan_val || '-';
            document.getElementById('r-total').textContent      = formatRupiah(hitungTotal());

            const hasil = document.getElementById('hasilPesanan');
            hasil.classList.remove('hidden');
            hasil.scrollIntoView({ behavior: 'smooth', block: 'start' });

            btn.textContent = 'Pesanan Dikirim ✓';
            
            // Disable order button to prevent duplicate submissions
            btn.disabled = true;
        } else {
            showToast('Gagal!', 'Gagal membuat pesanan: ' + result.message, 'warning');
            btn.disabled = false;
            btn.textContent = 'Pesan Sekarang';
        }
    } catch (error) {
        console.error('Checkout error:', error);
        showToast('Kesalahan Koneksi', 'Terjadi kesalahan koneksi saat memproses pesanan.', 'warning');
        btn.disabled = false;
        btn.textContent = 'Pesan Sekarang';
    }
}

function resetForm() {
    jumlah = 1;
    diskonAktif = null;
    document.getElementById('jumlahDisplay').textContent = '1';
    document.getElementById('alamat').value = '';
    document.getElementById('catatan').value = '';
    document.getElementById('kodePromo').value = '';
    document.getElementById('promoInfo').classList.add('hidden');
    document.getElementById('promoError').classList.add('hidden');
    document.getElementById('hasilPesanan').classList.add('hidden');
    document.querySelector('input[name="pengiriman"][value="instant"]').checked = true;
    document.querySelector('input[name="pembayaran"][value="Transfer Bank"]').checked = true;
    const btn = document.getElementById('btnPesan');
    btn.disabled = false;
    btn.textContent = 'Pesan Sekarang';
    
    if (cartMode) {
        // If we were checking out a cart, cart was cleared. Let's redirect to index.html
        window.location.href = '../../index.html';
        return;
    }
    
    updateSummary();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadPromos() {
    try {
        const basePath = '../../';
        const res = await fetch(basePath + 'api/promo/read_public.php');
        const data = await res.json();
        if (data.status === 'success') {
            data.data.forEach(promo => {
                promoList[promo.kode_promo.toUpperCase()] = {
                    id_promo: promo.id_promo,
                    nama: promo.kode_promo,
                    desc: promo.nama_promo + ' - ' + (promo.deskripsi || 'Diskon menarik'),
                    persen: promo.tipe_promo === 'percentage' ? parseFloat(promo.nilai_diskon) : null,
                    nominal: promo.tipe_promo === 'fixed' ? parseFloat(promo.nilai_diskon) : null,
                    bogo: promo.tipe_promo === 'bogo',
                    min_order: parseFloat(promo.min_order),
                    id_kategori_target: promo.id_kategori_target
                };
            });
        }
    } catch (err) {
        console.error('Failed to load promos:', err);
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    const basePath = '../../';
    
    // Verify login status
    try {
        const res = await fetch(basePath + 'auth/check_session.php');
        const data = await res.json();
        
        isLoggedInGlobal = data.loggedIn;
        
        if (!isLoggedInGlobal) {
            // Hide order form and sticky bottom bar completely
            const mainContent = document.getElementById('mainContent');
            if (mainContent) mainContent.classList.add('hidden');
            
            const stickyBottom = document.querySelector('.sticky-bottom');
            if (stickyBottom) stickyBottom.classList.add('hidden');
            
            // Show unauthorized page block warning
            const loginState = document.getElementById('loginRequiredState');
            if (loginState) {
                loginState.classList.remove('hidden');
                
                // Add redirect parameter to the login link
                const btnLoginReq = document.getElementById('btnLoginRequired');
                if (btnLoginReq) {
                    const currentUrl = window.location.pathname + window.location.search;
                    btnLoginReq.href = 'login.html?redirect=' + encodeURIComponent(currentUrl);
                }
            }
            return; // Halt further page setup
        }

        currentUserId = data.user_id;
    } catch (err) {
        console.error('Failed to verify session:', err);
    }

    // Load active promo list
    await loadPromos();

    // Parse requested menu or checkout state
    const params = new URLSearchParams(window.location.search);
    const isCartCheckout = params.get('checkout') === 'cart';

    if (isCartCheckout) {
        cartMode = true;
        try {
            cartItems = JSON.parse(localStorage.getItem(getCartKey())) || [];
        } catch (e) {
            cartItems = [];
        }

        // Hide "Tambah ke Keranjang" button during cart checkout
        const btnTambahKeranjang = document.getElementById('btnTambahKeranjang');
        if (btnTambahKeranjang) {
            btnTambahKeranjang.style.display = 'none';
        }

        renderCartList();

        // Adjust heading or title if needed
        const headerTitle = document.querySelector('header h1');
        if (headerTitle) {
            headerTitle.textContent = 'Checkout Keranjang';
        }
    } else {
        cartMode = false;
        const menuId = params.get('menu');

        if (menuId) {
            try {
                // Fetch latest menu list from database to verify and resolve menu details
                const menuRes = await fetch(basePath + 'api/menu/read.php');
                const menuResult = await menuRes.json();
                
                let dbMenu = null;
                if (menuResult.status === 'success') {
                    dbMenu = menuResult.data.find(m => {
                        if (m.id_menu == menuId) return true;
                        const slug = m.nama_menu.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        return slug === menuId;
                    });
                }

                if (dbMenu) {
                    menuDipilih = {
                        id_menu: dbMenu.id_menu,
                        id_kategori: dbMenu.id_kategori,
                        nama: dbMenu.nama_menu,
                        deskripsi: dbMenu.deskripsi || '',
                        harga: parseFloat(dbMenu.harga),
                        gambar: dbMenu.gambar_url ? '../../' + dbMenu.gambar_url : '../../assets/images/menu_placeholder.png'
                    };
                } else if (menuDataStatic[menuId]) {
                    // Fallback to static mock if not in database
                    menuDipilih = menuDataStatic[menuId];
                    menuDipilih.id_menu = null; // will fail FK constraints unless added to DB
                }

                if (menuDipilih) {
                    document.getElementById('menuNama').textContent      = menuDipilih.nama;
                    document.getElementById('menuDeskripsi').textContent = menuDipilih.deskripsi;
                    document.getElementById('menuHarga').textContent     = formatRupiah(menuDipilih.harga);
                    document.getElementById('menuGambar').src            = menuDipilih.gambar;
                    document.getElementById('menuGambar').alt            = menuDipilih.nama;
                }
            } catch (error) {
                console.error('Failed to load menu details:', error);
            }
        }
    }

    document.querySelectorAll('input[name="pengiriman"]').forEach(el => {
        el.addEventListener('change', updateSummary);
    });

    updateSummary();
});
