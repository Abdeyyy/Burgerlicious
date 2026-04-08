document.addEventListener('DOMContentLoaded', async function () {
    try {
        // Menentukan prefix folder supaya URL tujuan selalu benar (baik sedang di beranda `index.html` atau di dalam folder `public/pages/`)
        const basePath = window.location.pathname.includes('/public/pages/') ? '../../' : './';
        // Melakukan request HTTP ke file backend PHP secara diam-diam (Asynchronous/AJAX)
        const res = await fetch(basePath + 'auth/check_session.php');
        const data = await res.json();

        // Jika file PHP merespon bahwa user sudah login lewat sesi aktif...
        if (data.loggedIn) {
            // Kita cari semua tombol bertuliskan href menuju halaman login.html
            const loginBtns = document.querySelectorAll('a[href="login.html"], a[href="./public/pages/login.html"]');

            loginBtns.forEach(loginBtn => {
                // Di sini kita ubah tombol "Login" menjadi sapaan nama depan user
                if (loginBtn.textContent.trim().toLowerCase() === 'login') {
                    const spanBtn = document.createElement('div');
                    // Mengambil hanya kata pertama dari nama lengkap user (misal: "Budi Santoso" jadi "Budi")
                    const firstName = data.nama.split(' ')[0]; 
                    spanBtn.innerHTML = `Halo, <b>${firstName}</b>`;
                    spanBtn.className = 'text-white font-bold text-base md:text-lg px-2 drop-shadow-sm truncate max-w-[150px] text-center cursor-default';
                    // Menimpa kancing Login dengan tulisan nama ini.
                    loginBtn.replaceWith(spanBtn);
                }
            });
        }
    } catch (error) {
        console.error('Gagal memverifikasi status login:', error);
    }
});
