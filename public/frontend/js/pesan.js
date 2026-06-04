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

function formatRupiah(angka) {
    return 'Rp ' + angka.toLocaleString('id-ID');
}

function getOngkir() {
    const val = document.querySelector('input[name="pengiriman"]:checked');
    return val ? ongkirData[val.value] : 12000;
}

function getPengirimanLabel() {
    const val = document.querySelector('input[name="pengiriman"]:checked');
    const labels = { instant: 'Kurir Instant (15–25 menit)', hemat: 'Kurir Hemat (30–45 menit)', pickup: 'Ambil Sendiri (Pickup)' };
    return val ? labels[val.value] : '-';
}

function hitungTotal() {
    if (!menuDipilih) return 0;
    const subtotal = menuDipilih.harga * jumlah;
    const ongkir = getOngkir();
    let diskon = 0;
    if (diskonAktif) {
        if (diskonAktif.persen) {
            diskon = Math.round(subtotal * diskonAktif.persen / 100);
        } else if (diskonAktif.nominal) {
            diskon = diskonAktif.nominal;
        } else if (diskonAktif.bogo) {
            const freeCount = Math.floor(jumlah / 2);
            diskon = freeCount * menuDipilih.harga;
        }
    }
    return Math.max(0, subtotal + ongkir - diskon);
}

function updateSummary() {
    if (!menuDipilih) return;
    const subtotal = menuDipilih.harga * jumlah;
    const ongkir = getOngkir();
    let diskon = 0;
    if (diskonAktif) {
        if (diskonAktif.persen) {
            diskon = Math.round(subtotal * diskonAktif.persen / 100);
        } else if (diskonAktif.nominal) {
            diskon = diskonAktif.nominal;
        } else if (diskonAktif.bogo) {
            const freeCount = Math.floor(jumlah / 2);
            diskon = freeCount * menuDipilih.harga;
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
            alert('Promo dilepas karena kuantiti/syarat minimal belanja tidak terpenuhi.');
        }
    }
    updateSummary();
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
        const subtotal = menuDipilih ? menuDipilih.harga * jumlah : 0;
        if (subtotal < promo.min_order) {
            promoError.textContent = `Minimum pembelian Rp ${promo.min_order.toLocaleString('id-ID')} tidak terpenuhi.`;
            promoError.classList.remove('hidden');
            return;
        }

        // Validate category target
        if (promo.id_kategori_target !== null && menuDipilih) {
            if (menuDipilih.id_kategori && parseInt(menuDipilih.id_kategori) !== parseInt(promo.id_kategori_target)) {
                promoError.textContent = 'Promo ini tidak berlaku untuk menu yang Anda pilih.';
                promoError.classList.remove('hidden');
                return;
            }
        }
        
        // Validate BOGO quantity
        if (promo.bogo && jumlah < 2) {
            promoError.textContent = 'Promo BOGO memerlukan minimal pembelian 2 porsi.';
            promoError.classList.remove('hidden');
            return;
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
        const response = await fetch('../../api/order/checkout.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_menu: id_menu,
                jumlah: jumlah_val,
                alamat: alamat_val,
                catatan: catatan_val,
                pembayaran: pembayaran_val,
                pengiriman: pengiriman_val,
                kode_promo: kode_promo_val
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            document.getElementById('r-menu').textContent       = menuDipilih ? menuDipilih.nama : '-';
            document.getElementById('r-jumlah').textContent     = jumlah + ' porsi';
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
            alert('Gagal membuat pesanan: ' + result.message);
            btn.disabled = false;
            btn.textContent = 'Pesan Sekarang';
        }
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Terjadi kesalahan koneksi saat memproses pesanan.');
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
    } catch (err) {
        console.error('Failed to verify session:', err);
    }

    // Load active promo list
    await loadPromos();

    // Parse requested menu
    const params = new URLSearchParams(window.location.search);
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

    document.querySelectorAll('input[name="pengiriman"]').forEach(el => {
        el.addEventListener('change', updateSummary);
    });

    updateSummary();
});
