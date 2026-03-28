document.addEventListener('DOMContentLoaded', async function() {
    try {
        const res = await fetch('auth/check_session.php');
        const data = await res.json();
        
        if (data.loggedIn) {
            // Mencari semua tombol/tulisan yang mengarah ke form login
            const loginBtns = document.querySelectorAll('a[href="login.html"]');
            
            loginBtns.forEach(loginBtn => {
                // Pastikan yang diubah hanya tombol "Login" di navbar (bukan tombol promo dll)
                if (loginBtn.textContent.trim().toLowerCase() === 'login') {
                    loginBtn.innerHTML = `Selamat Datang, <b>${data.nama}</b>`;
                    loginBtn.href = 'auth/logout.php';
                    loginBtn.title = 'Sesi Aktif - Klik untuk Logout';
                    
                    // Modifikasi desain tombol agar terlihat lebih menonjol sebagai identitas user
                    loginBtn.classList.remove('bg-white', 'text-black');
                    loginBtn.classList.add('bg-[#FEBB19]', 'text-[#5D0303]', 'font-bold', 'hover:bg-red-600', 'hover:text-white', 'border-0');
                    
                    // Tambahkan konfirmasi logout saat diklik
                    loginBtn.addEventListener('click', function(e) {
                        const confirmLogout = confirm('Apakah Anda yakin ingin logout?');
                        if (!confirmLogout) {
                            e.preventDefault();
                        }
                    });
                }
            });
        }
    } catch (error) {
        console.error('Gagal memverifikasi status login:', error);
    }
});
