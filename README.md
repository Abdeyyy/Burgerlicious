# 🍔 Burgerlicious - Web Application

Aplikasi web pemesanan dan katalog burger **Burgerlicious** yang dioptimalkan dengan **Tailwind CSS**, arsitektur direktori modular, serta integrasi sistem autentikasi PHP Native.

## 📁 Struktur Direktori Proyek

Proyek ini menggunakan pemisahan yang jelas antara laman publik, *resource* pihak ketiga, serta modul sistem pengguna akhir.

- **/auth/** : Berisi barisan logika otentikasi PHP (`login.php`, `register.php`, `check_session.php`) untuk memeriksa koneksi ke Database. Terdapat pula library `PHPMailer` untuk fungsi pengiriman OTP via E-Mail.
- **/config/** : Inti penyambung *Database*, berisi spesifik kredensial koneksi `db.php` XAMPP lokal (*localhost/root*).
- **/public/pages/** : Repositori khusus di mana semua file tampilan visual tambahan (selain `index.html`) dipisah dan disimpan. Contoh: `menu.html`, `promo.html`, dan `about.html`.
- **/public/frontend/** : Rumah bagi serangkaian *style* statis (`input.css` dan hasil jadi `output.css` milik Tailwind) serta file interaksi JavaScript murni (`session.js` untuk integrasi sapaan status login).
- **index.html** : Pintu masuk utama situs web (Homepage).

## 🚀 Persiapan dan Instalasi (XAMPP & Node.js)

Karena aplikasi ini mencakup basis data PHP dan dibangun menggunakan kelas-kelas *Tailwind CSS*, kita perlu melalui langkah *deploy* lokal sederhana:

**1. Menyalakan Backend Server (PHP/MySQL):**
Pastikan **Apache** dan **MySQL** pada Software XAMPP / LAMPP di komputermu sudah berjalan (Status: *Started* / *Running*).

**2. Melakukan Clone File ke Direktori Tepat:**
Pindahkan seluruh folder repositori ini (yang ditaut via VSCode atau Github) ke dalam direktori publik server web lokal agar program PHP bisa diterjemahkan.
- **Linux:** `/opt/lampp/htdocs/Burgerlicious`
- **Windows (Default):** `C:\xampp\htdocs\Burgerlicious`

**3. Compile Komponen Frontend (Tailwind CSS):**
Jika ada perubahaan *style*, desain, atau penambahan komponen HTML baru, pastikan utilitas *Node* berjalan memindai file `.html` kita. Jalankan ini di terminal:
```bash
./node_modules/.bin/tailwindcss -i ./public/frontend/css/input.css -o ./public/frontend/css/output.css
```
*(Atau bergantung pada *package.json* milik server lokal, seringkali bisa dipersingkat menjalankan `npm run dev` atau sejenisnya.*)

## 💡 Konfigurasi Database (Pertama Kali)
Apabila baru pertama kali menyalakan proyek, jangan lupa untuk:
1. Buka `phpMyAdmin` (biasanya di `http://localhost/phpmyadmin`).
2. Masukkan basis data kosong (Database) dengan nama `burgerlicious`.
3. Jalankan `setup_db.php` atau *import* file instruksi SQL yang tersedia di akar repositori untuk membentuk ruang tabel *(users, orders, dsb)* secara otomatis.

## 👨‍💻 Kontributor
Didokumentasikan khusus untuk masa Responsi Ujian. *Good Luck!*
