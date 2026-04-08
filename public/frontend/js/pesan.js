const menuData = {
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
const promoList = {
    'BURGER10': { nama: 'BURGER10', desc: 'Diskon 10% untuk semua menu', persen: 10 },
    'HEMAT5K':  { nama: 'HEMAT5K',  desc: 'Potongan Rp 5.000',          nominal: 5000 },
    'NEWUSER':  { nama: 'NEWUSER',  desc: 'Diskon 15% pengguna baru',    persen: 15 }
};

let menuDipilih = null;
let jumlah = 1;
let diskonAktif = null;

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
        if (diskonAktif.persen) diskon = Math.round(subtotal * diskonAktif.persen / 100);
        if (diskonAktif.nominal) diskon = diskonAktif.nominal;
    }
    return subtotal + ongkir - diskon;
}

function updateSummary() {
    if (!menuDipilih) return;
    const subtotal = menuDipilih.harga * jumlah;
    const ongkir = getOngkir();
    let diskon = 0;
    if (diskonAktif) {
        if (diskonAktif.persen) diskon = Math.round(subtotal * diskonAktif.persen / 100);
        if (diskonAktif.nominal) diskon = diskonAktif.nominal;
    }
    const total = subtotal + ongkir - diskon;

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
    jumlah = Math.max(1, jumlah + delta);
    document.getElementById('jumlahDisplay').textContent = jumlah;
    updateSummary();
}

function pakaiPromo() {
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

    if (promoList[kode]) {
        diskonAktif = promoList[kode];
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

function submitPesanan() {
    if (!validate()) {
        document.getElementById('alamat').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const btn = document.getElementById('btnPesan');
    btn.disabled = true;
    btn.textContent = 'Memproses...';

    setTimeout(() => {
        const alamat     = document.getElementById('alamat').value.trim();
        const catatan    = document.getElementById('catatan').value.trim();
        const pembayaran = document.querySelector('input[name="pembayaran"]:checked').value;
        const total      = hitungTotal();

        document.getElementById('r-menu').textContent       = menuDipilih ? menuDipilih.nama : '-';
        document.getElementById('r-jumlah').textContent     = jumlah + ' porsi';
        document.getElementById('r-alamat').textContent     = alamat;
        document.getElementById('r-pengiriman').textContent = getPengirimanLabel();
        document.getElementById('r-pembayaran').textContent = pembayaran;
        document.getElementById('r-catatan').textContent    = catatan || '-';
        document.getElementById('r-total').textContent      = formatRupiah(total);

        const hasil = document.getElementById('hasilPesanan');
        hasil.classList.remove('hidden');
        hasil.scrollIntoView({ behavior: 'smooth', block: 'start' });

        btn.textContent = 'Pesanan Dikirim ✓';
    }, 1000);
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

document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    const menuId = params.get('menu');

    if (menuId && menuData[menuId]) {
        menuDipilih = menuData[menuId];
        document.getElementById('menuNama').textContent      = menuDipilih.nama;
        document.getElementById('menuDeskripsi').textContent = menuDipilih.deskripsi;
        document.getElementById('menuHarga').textContent     = formatRupiah(menuDipilih.harga);
        document.getElementById('menuGambar').src            = menuDipilih.gambar;
        document.getElementById('menuGambar').alt            = menuDipilih.nama;
    }

    document.querySelectorAll('input[name="pengiriman"]').forEach(el => {
        el.addEventListener('change', updateSummary);
    });

    updateSummary();
});
