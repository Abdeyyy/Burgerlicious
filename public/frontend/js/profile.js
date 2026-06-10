document.addEventListener('DOMContentLoaded', function () {
    const basePath = window.location.pathname.includes('/public/pages/') ? '../../' : './';

    // ── ELEMEN AKUN & DASHBOARD ──────────────
    const userNameHeader = document.getElementById('userNameHeader');
    const userEmailHeader = document.getElementById('userEmailHeader');
    const userAvatar = document.getElementById('userAvatar');
    const avatarContainer = document.getElementById('avatarContainer');
    const avatarInput = document.getElementById('avatarInput');
    const loyaltyBadge = document.getElementById('loyaltyBadge');

    // ── ELEMEN STATISTIK ──────────────
    const statTotalOrders = document.getElementById('statTotalOrders');
    const statTotalSpend = document.getElementById('statTotalSpend');
    const statFavoriteMenu = document.getElementById('statFavoriteMenu');

    // ── ELEMEN FORM PROFIL ──────────────
    const profileForm = document.getElementById('profileForm');
    const inputNama = document.getElementById('inputNama');
    const inputEmail = document.getElementById('inputEmail');
    const inputTelepon = document.getElementById('inputTelepon');
    const inputAlamat = document.getElementById('inputAlamat');
    const btnSaveProfile = document.getElementById('btnSaveProfile');

    // ── ELEMEN RIWAYAT & VOUCHER ──────────────
    const orderHistoryContainer = document.getElementById('orderHistoryContainer');
    const vouchersGrid = document.getElementById('vouchersGrid');

    // ── ELEMEN FORM PASSWORD ──────────────
    const passwordForm = document.getElementById('passwordForm');
    const inputOldPassword = document.getElementById('inputOldPassword');
    const inputNewPassword = document.getElementById('inputNewPassword');
    const inputConfirmPassword = document.getElementById('inputConfirmPassword');
    const showPasswordCheck = document.getElementById('showPasswordCheck');
    const btnSavePassword = document.getElementById('btnSavePassword');

    // ── ELEMEN NOTIFIKASI GLOBAL ──────────────
    const globalNotification = document.getElementById('globalNotification');

    let currentProfileData = null;
    let isRequesting = false; // Pengunci asinkron agar tidak double klik/request

    // ── UTILITIES: FORMAT RUPIAH & TANGGAL ──────────────
    function formatRupiah(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Umpan balik notifikasi global
    function showNotification(message, type = 'success') {
        globalNotification.textContent = message;
        globalNotification.className = 'mb-6 text-sm text-center px-5 py-3 rounded-2xl shadow-sm font-semibold transition-all duration-300 ';
        if (type === 'success') {
            globalNotification.className += 'bg-green-100 text-green-700 border border-green-200';
        } else {
            globalNotification.className += 'bg-red-100 text-red-700 border border-red-200';
        }
        globalNotification.classList.remove('hidden');

        // Scroll ke atas halaman agar notifikasi terlihat jelas
        window.scrollTo({ top: 0, behavior: 'smooth' });

        setTimeout(() => {
            globalNotification.classList.add('hidden');
        }, 5000);
    }

    // ── 1. FUNGSI NAVIGASI TAB (Tugas 4.1) ──────────────
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(targetTabId) {
        // Hapus kelas aktif dari seluruh tombol tab & sembunyikan semua tab konten
        tabButtons.forEach(btn => btn.classList.remove('active-tab'));
        tabContents.forEach(content => content.classList.add('hidden'));

        // Aktifkan tombol & konten yang cocok
        const activeBtn = document.querySelector(`.tab-btn[data-tab="${targetTabId}"]`);
        const activeContent = document.getElementById(`content-${targetTabId}`);

        if (activeBtn && activeContent) {
            activeBtn.classList.add('active-tab');
            activeContent.classList.remove('hidden');

            // Muat data khusus tab saat dipindahkan (Lazy loading agar hemat request)
            if (targetTabId === 'history') {
                loadOrderHistory();
                clearNotifications();
            } else if (targetTabId === 'promo') {
                loadVouchers();
            }
        }
    }

    function clearNotifications() {
        const userId = window.currentUserId;
        if (userId) {
            const storageKey = `burgerlicious_notifications_${userId}`;
            let state = JSON.parse(localStorage.getItem(storageKey)) || { orderStatuses: {}, notifications: {} };
            state.notifications = {};
            localStorage.setItem(storageKey, JSON.stringify(state));
            
            // Sembunyikan badge di tab riwayat
            const historyBadge = document.getElementById('history-tab-badge');
            if (historyBadge) historyBadge.style.display = 'none';

            // Sembunyikan badge di logo profil navigasi atas
            const profileBadgeEl = document.getElementById('profile-nav-badge');
            if (profileBadgeEl) profileBadgeEl.style.display = 'none';
        }
    }

    // Dengarkan event notifikasi selesai dimuat dari session.js
    window.addEventListener('burgerlicious_notifications_ready', function (e) {
        const userId = e.detail.userId;
        const badgeCount = e.detail.badgeCount;
        
        const currentTab = new URLSearchParams(window.location.search).get('tab') || 'dashboard';
        if (currentTab !== 'history' && badgeCount > 0) {
            const historyBadge = document.getElementById('history-tab-badge');
            if (historyBadge) {
                historyBadge.textContent = badgeCount;
                historyBadge.style.display = 'inline-block';
            }
        } else if (currentTab === 'history') {
            clearNotifications();
        }
    });

    tabButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const targetTab = this.getAttribute('data-tab');
            switchTab(targetTab);
            // Simpan state tab aktif di parameter URL
            const url = new URL(window.location);
            url.searchParams.set('tab', targetTab);
            window.history.pushState({}, '', url);
        });
    });

    // Periksa tab parameter saat pertama kali dibuka (e.g., ?tab=history dari dropdown navigasi)
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab') || 'dashboard';
    switchTab(initialTab);


    // ── 2. BACA DETAIL PROFIL & STATS (Tugas 4.2) ──────────────
    async function loadUserProfile() {
        try {
            const res = await fetch(basePath + 'api/user/profile.php');
            if (res.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            const result = await res.json();
            if (result.status === 'success') {
                const user = result.data;
                currentProfileData = user;

                // Set header profil
                userNameHeader.textContent = user.nama;
                userEmailHeader.textContent = user.email;
                if (user.foto_profil) {
                    userAvatar.src = basePath + user.foto_profil;
                } else {
                    userAvatar.src = basePath + 'assets/icon/profile.png';
                }

                // Render Loyalty Tier Badge dengan gradasi warna premium
                renderLoyaltyBadge(user.stats.loyalty_tier);

                // Set statistik dinamis
                statTotalOrders.textContent = user.stats.total_orders;
                statTotalSpend.textContent = formatRupiah(user.stats.total_spend);
                statFavoriteMenu.textContent = user.stats.favorite_menu;

                // Isi data ke formulir input
                inputNama.value = user.nama;
                inputEmail.value = user.email;
                inputTelepon.value = user.telepon;
                inputAlamat.value = user.alamat;
            }
        } catch (error) {
            console.error('Gagal mengambil data profil:', error);
            showNotification('Koneksi internet lambat atau server bermasalah saat memuat profil.', 'error');
        }
    }

    function renderLoyaltyBadge(tier) {
        loyaltyBadge.className = 'hidden w-full py-2.5 px-4 rounded-2xl border flex items-center justify-center gap-2 mb-2 ';
        let iconHtml = '';
        if (tier === 'Gold Member') {
            loyaltyBadge.className += 'bg-yellow-400 border-yellow-500/30 text-yellow-950';
            iconHtml = '<i class="fas fa-crown text-yellow-900 text-lg animate-pulse"></i>';
        } else if (tier === 'Silver Member') {
            loyaltyBadge.className += 'bg-gray-200 border-gray-300/30 text-gray-800';
            iconHtml = '<i class="fas fa-medal text-slate-800 text-lg"></i>';
        } else {
            // Bronze Member
            loyaltyBadge.className += 'bg-amber-700 border-amber-800/30 text-white';
            iconHtml = '<i class="fas fa-award text-amber-300 text-lg"></i>';
        }
        loyaltyBadge.innerHTML = `${iconHtml}<span class="text-xs font-extrabold uppercase tracking-widest">${tier}</span>`;
    }

    loadUserProfile();


    // ── 3. UPDATE DETAIL PROFIL & UNGGAH FOTO (Tugas 4.3 & 4.4) ──────────────
    
    // a. Edit Foto Profil
    avatarContainer.addEventListener('click', () => {
        avatarInput.click();
    });

    avatarInput.addEventListener('change', async function () {
        const file = this.files[0];
        if (!file) return;

        // Validasi ekstensi
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            showNotification('Hanya menerima format gambar JPEG, PNG, WEBP, atau GIF.', 'error');
            return;
        }

        // Validasi ukuran (2MB)
        if (file.size > 2 * 1024 * 1024) {
            showNotification('Ukuran berkas gambar maksimal 2MB.', 'error');
            return;
        }

        if (isRequesting) return;
        isRequesting = true;
        
        const originalAvatarSrc = userAvatar.src;
        userAvatar.src = basePath + 'assets/icon/wired-lineal-1927-food-truck-hover-pinch.gif'; // loading gif

        const formData = new FormData();
        formData.append('foto_profil', file);
        formData.append('nama', inputNama.value.trim());
        formData.append('telepon', inputTelepon.value.trim());
        formData.append('alamat', inputAlamat.value.trim());

        try {
            const res = await fetch(basePath + 'api/user/update.php', {
                method: 'POST',
                body: formData
            });
            const result = await res.json();
            
            if (result.status === 'success') {
                showNotification('Foto profil berhasil diubah!', 'success');
                // Perbarui gambar di page
                userAvatar.src = basePath + result.data.foto_profil;
                // Sinkronkan gambar di header profile (jika ada)
                const headerAvatar = document.querySelector('button[title="Profil Saya"] img');
                if (headerAvatar) headerAvatar.src = basePath + result.data.foto_profil;
                const ddAvatar = document.querySelector('#profile-dropdown img');
                if (ddAvatar) ddAvatar.src = basePath + result.data.foto_profil;
            } else {
                showNotification(result.message || 'Gagal mengunggah foto profil.', 'error');
                userAvatar.src = originalAvatarSrc;
            }
        } catch (error) {
            console.error(error);
            showNotification('Terjadi kegagalan koneksi saat mengunggah foto.', 'error');
            userAvatar.src = originalAvatarSrc;
        } finally {
            isRequesting = false;
        }
    });

    // b. Simpan Informasi Profil Dasar
    profileForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        const nama = inputNama.value.trim();
        const telepon = inputTelepon.value.trim();
        const alamat = inputAlamat.value.trim();

        if (!nama) {
            showNotification('Nama lengkap tidak boleh kosong.', 'error');
            return;
        }

        if (isRequesting) return;
        isRequesting = true;
        btnSaveProfile.disabled = true;
        btnSaveProfile.innerHTML = '<i class="fas fa-spinner animate-spin"></i> Memproses...';

        const formData = new FormData();
        formData.append('nama', nama);
        formData.append('telepon', telepon);
        formData.append('alamat', alamat);

        try {
            const res = await fetch(basePath + 'api/user/update.php', {
                method: 'POST',
                body: formData
            });
            const result = await res.json();

            if (result.status === 'success') {
                showNotification(result.message, 'success');
                // Perbarui nama di header profil & dropdown menu
                userNameHeader.textContent = result.data.nama;
                const ddName = document.querySelector('#profile-dropdown div[style*="font-size:17px"]');
                if (ddName) ddName.textContent = result.data.nama;
            } else {
                showNotification(result.message || 'Gagal menyimpan perubahan.', 'error');
            }
        } catch (error) {
            console.error(error);
            showNotification('Koneksi terputus saat menyimpan perubahan data.', 'error');
        } finally {
            btnSaveProfile.disabled = false;
            btnSaveProfile.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
            isRequesting = false;
        }
    });


    // ── 4. VERIFIKASI & PERBARUI PASSWORD (Tugas 4.5) ──────────────
    if (showPasswordCheck) {
        showPasswordCheck.addEventListener('change', function () {
            const type = this.checked ? 'text' : 'password';
            document.querySelectorAll('.password-field').forEach(el => el.type = type);
        });
    }

    passwordForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const oldPass = inputOldPassword.value;
        const newPass = inputNewPassword.value;
        const confPass = inputConfirmPassword.value;

        if (!oldPass || !newPass || !confPass) {
            showNotification('Semua kolom password wajib diisi.', 'error');
            return;
        }

        if (newPass.length < 6) {
            showNotification('Password baru minimal 6 karakter.', 'error');
            return;
        }

        if (newPass !== confPass) {
            showNotification('Konfirmasi password baru tidak cocok.', 'error');
            return;
        }

        if (isRequesting) return;
        isRequesting = true;
        btnSavePassword.disabled = true;
        btnSavePassword.innerHTML = '<i class="fas fa-spinner animate-spin"></i> Memproses...';

        const formData = new FormData();
        formData.append('oldPassword', oldPass);
        formData.append('newPassword', newPass);
        formData.append('confirmPassword', confPass);

        try {
            const res = await fetch(basePath + 'api/user/update_password.php', {
                method: 'POST',
                body: formData
            });
            const result = await res.json();

            if (result.status === 'success') {
                showNotification(result.message, 'success');
                passwordForm.reset();
                if (showPasswordCheck) showPasswordCheck.checked = false;
                document.querySelectorAll('.password-field').forEach(el => el.type = 'password');
            } else {
                showNotification(result.message || 'Gagal memperbarui password.', 'error');
            }
        } catch (error) {
            console.error(error);
            showNotification('Terjadi kegagalan komunikasi saat memperbarui password.', 'error');
        } finally {
            btnSavePassword.disabled = false;
            btnSavePassword.innerHTML = '<i class="fas fa-lock"></i> Perbarui Password';
            isRequesting = false;
        }
    });


    // ── 5. RIWAYAT BELANJA INTERAKTIF (Tugas 4.5) ──────────────
    async function loadOrderHistory() {
        try {
            const res = await fetch(basePath + 'api/user/order_history.php');
            const result = await res.json();

            if (result.status === 'success') {
                const orders = result.data;
                if (orders.length === 0) {
                    orderHistoryContainer.innerHTML = `
                        <div class="text-center py-12 text-gray-400 font-semibold flex flex-col items-center gap-3">
                            <div class="w-16 h-16 rounded-full bg-gray-100 text-gray-300 flex items-center justify-center text-3xl"><i class="fas fa-shopping-bag"></i></div>
                            Anda belum pernah melakukan pemesanan burger.
                            <a href="menu.html" class="mt-2 text-xs bg-[#5D0303] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#8F0919] transition">Pesan Sekarang!</a>
                        </div>
                    `;
                    return;
                }

                // Render list riwayat
                let historyHtml = '';
                orders.forEach(order => {
                    // Status Badge colors
                    let badgeClass = '';
                    if (order.status_pesanan === 'completed') {
                        badgeClass = 'bg-green-100 text-green-700 border-green-200';
                    } else if (order.status_pesanan === 'cancelled') {
                        badgeClass = 'bg-red-100 text-red-700 border-red-200';
                    } else if (order.status_pesanan === 'ready') {
                        badgeClass = 'bg-blue-100 text-blue-700 border-blue-200';
                    } else if (order.status_pesanan === 'preparing') {
                        badgeClass = 'bg-amber-100 text-amber-700 border-amber-200';
                    } else {
                        badgeClass = 'bg-gray-100 text-gray-700 border-gray-200';
                    }

                    // Menyiapkan HTML untuk item yang dipesan
                    let itemsListHtml = '';
                    order.items.forEach(item => {
                        const imgPath = item.gambar_url ? basePath + item.gambar_url : basePath + 'assets/images/placeholder.jpg';
                        itemsListHtml += `
                            <div class="flex items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
                                <img src="${imgPath}" alt="${item.nama_menu}" class="w-14 h-14 object-cover rounded-xl border border-gray-200 flex-shrink-0">
                                <div class="flex-1 min-width-0">
                                    <h4 class="font-bold text-gray-800 text-sm truncate">${item.nama_menu}</h4>
                                    <p class="text-xs text-gray-400 mt-0.5">${item.jumlah} x ${formatRupiah(item.harga_satuan)}</p>
                                </div>
                                <span class="font-bold text-gray-800 text-sm">${formatRupiah(item.subtotal)}</span>
                            </div>
                        `;
                    });

                    // Siapkan informasi potongan diskon kupon jika ada
                    let promoInfoHtml = '';
                    if (order.nama_promo && order.nilai_diskon > 0) {
                        promoInfoHtml = `
                            <div class="flex justify-between text-xs text-green-700 bg-green-50 p-2.5 rounded-xl font-bold">
                                <span>Promo: ${order.nama_promo}</span>
                                <span>-${formatRupiah(order.nilai_diskon)}</span>
                            </div>
                        `;
                    }

                    historyHtml += `
                        <div class="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm scale-hover">
                            <!-- Header Card -->
                            <div class="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50/70 border-b border-gray-100">
                                <div class="flex flex-col">
                                    <span class="text-xs text-gray-400 font-bold uppercase">ID TRANSAKSI</span>
                                    <span class="font-mono font-bold text-sm text-[#5D0303]">#${order.id_transaksi}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-xs text-gray-400 font-bold uppercase">TANGGAL</span>
                                    <span class="text-xs text-gray-600 font-medium">${formatDate(order.tanggal_transaksi)}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-xs font-bold uppercase px-3 py-1 rounded-full border ${badgeClass}">${order.status_pesanan}</span>
                                    <button class="toggle-detail-btn w-8 h-8 rounded-xl bg-gray-200/50 hover:bg-gray-200 text-gray-700 transition flex items-center justify-center cursor-pointer" data-id="${order.id_transaksi}">
                                        <i class="fas fa-chevron-down text-xs transition-transform duration-200"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Detail Card (Lipat-Bawah / Accordion) -->
                            <div id="detail-${order.id_transaksi}" class="hidden p-5 space-y-4">
                                <div class="space-y-1">
                                    <div class="flex justify-between text-xs text-gray-500 font-medium">
                                        <span>Tipe Pesanan</span>
                                        <span class="font-bold text-gray-700 uppercase">${order.tipe_pesanan}</span>
                                    </div>
                                    <div class="flex justify-between text-xs text-gray-500 font-medium">
                                        <span>Penerima</span>
                                        <span class="font-bold text-gray-700">${order.nama_pelanggan}</span>
                                    </div>
                                </div>

                                <div class="border-t border-b border-gray-100 py-2">
                                    ${itemsListHtml}
                                </div>

                                ${promoInfoHtml}

                                <div class="flex justify-between items-center pt-2">
                                    <span class="text-sm font-bold text-gray-700">Total Harga</span>
                                    <span class="text-lg font-extrabold text-[#5D0303]">${formatRupiah(order.total_harga)}</span>
                                </div>
                            </div>
                        </div>
                    `;
                });

                orderHistoryContainer.innerHTML = historyHtml;

                // Tambahkan fungsionalitas accordion
                const toggleButtons = orderHistoryContainer.querySelectorAll('.toggle-detail-btn');
                toggleButtons.forEach(btn => {
                    btn.addEventListener('click', function () {
                        const transactionId = this.getAttribute('data-id');
                        const detailPanel = document.getElementById('detail-' + transactionId);
                        const icon = this.querySelector('i');

                        if (detailPanel) {
                            const isHidden = detailPanel.classList.toggle('hidden');
                            if (isHidden) {
                                icon.style.transform = 'rotate(0deg)';
                            } else {
                                icon.style.transform = 'rotate(180deg)';
                            }
                        }
                    });
                });

            } else {
                orderHistoryContainer.innerHTML = `<div class="text-center py-6 text-red-600 font-semibold">${result.message || 'Gagal memuat riwayat.'}</div>`;
            }
        } catch (error) {
            console.error(error);
            orderHistoryContainer.innerHTML = '<div class="text-center py-6 text-red-600 font-semibold">Kesalahan Server saat menarik riwayat belanja.</div>';
        }
    }


    // ── 6. VOUCHER & SALIN KODE KUPON (Tugas 4.6) ──────────────
    async function loadVouchers() {
        try {
            const res = await fetch(basePath + 'api/promo/read_public.php');
            const result = await res.json();

            if (result.status === 'success') {
                const promos = result.data;
                if (promos.length === 0) {
                    vouchersGrid.innerHTML = `
                        <div class="col-span-full text-center py-12 text-gray-400 font-semibold flex flex-col items-center gap-3">
                            <div class="w-16 h-16 rounded-full bg-gray-100 text-gray-300 flex items-center justify-center text-3xl"><i class="fas fa-ticket-alt"></i></div>
                            Maaf, saat ini belum ada promo aktif yang tersedia.
                        </div>
                    `;
                    return;
                }

                let voucherHtml = '';
                promos.forEach(promo => {
                    let discountValue = '';
                    if (promo.tipe_promo === 'percentage') {
                        discountValue = `${parseInt(promo.nilai_diskon)}% OFF`;
                    } else if (promo.tipe_promo === 'fixed') {
                        discountValue = `${formatRupiah(promo.nilai_diskon)} OFF`;
                    } else {
                        discountValue = 'BOGO (Buy 1 Get 1)';
                    }

                    voucherHtml += `
                        <div class="ticket-card flex border border-gray-100 shadow-sm scale-hover">
                            <!-- Sisi Kiri: Nilai Diskon -->
                            <div class="w-1/3 bg-[#5D0303] text-white p-4 flex flex-col items-center justify-center text-center relative border-r-2 border-dashed border-gray-100">
                                <span class="text-xl font-black font-baloo tracking-tight leading-tight">${discountValue}</span>
                                <span class="text-[10px] uppercase font-bold text-yellow-300 mt-1.5 tracking-widest">${promo.nama_kategori || 'Semua Menu'}</span>
                            </div>
                            
                            <!-- Sisi Kanan: Detail & Aksi -->
                            <div class="w-2/3 bg-white p-5 flex flex-col justify-between">
                                <div>
                                    <h4 class="font-bold text-gray-800 text-base line-clamp-1 mb-1">${promo.nama_promo}</h4>
                                    <p class="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">${promo.deskripsi || 'Nikmati promo hemat lezat hanya di Burgerlicious.'}</p>
                                </div>

                                <div class="flex items-center justify-between gap-2 pt-2 border-t border-gray-50 mt-1">
                                    <div class="flex flex-col">
                                        <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider">KODE PROMO</span>
                                        <span class="font-mono font-extrabold text-sm text-[#5D0303] select-all">${promo.kode_promo}</span>
                                    </div>
                                    <button class="copy-promo-btn px-4 py-2 bg-yellow-400 hover:bg-[#5D0303] hover:text-white text-[#5D0303] rounded-xl text-xs font-black transition-colors duration-200 cursor-pointer flex items-center gap-1.5" data-code="${promo.kode_promo}">
                                        <i class="far fa-copy"></i> Salin
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });

                vouchersGrid.innerHTML = voucherHtml;

                // Fungsionalitas Salin Kode Kupon
                const copyButtons = vouchersGrid.querySelectorAll('.copy-promo-btn');
                copyButtons.forEach(btn => {
                    btn.addEventListener('click', function () {
                        const code = this.getAttribute('data-code');
                        
                        // Gunakan Clipboard API untuk menyalin
                        navigator.clipboard.writeText(code).then(() => {
                            const originalText = this.innerHTML;
                            this.innerHTML = '<i class="fas fa-check"></i> Tersalin';
                            this.classList.remove('bg-yellow-400', 'text-[#5D0303]');
                            this.classList.add('bg-green-600', 'text-white');
                            
                            setTimeout(() => {
                                this.innerHTML = originalText;
                                this.classList.remove('bg-green-600', 'text-white');
                                this.classList.add('bg-yellow-400', 'text-[#5D0303]');
                            }, 2000);
                        }).catch(err => {
                            console.error('Gagal menyalin:', err);
                            showNotification('Gagal menyalin kode secara otomatis.', 'error');
                        });
                    });
                });

            } else {
                vouchersGrid.innerHTML = `<div class="col-span-full text-center py-6 text-red-600 font-semibold">${result.message || 'Gagal memuat kupon.'}</div>`;
            }
        } catch (error) {
            console.error(error);
            vouchersGrid.innerHTML = '<div class="col-span-full text-center py-6 text-red-600 font-semibold">Gagal memuat promo dari server.</div>';
        }
    }
});
