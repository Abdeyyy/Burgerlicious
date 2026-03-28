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
                    const spanBtn = document.createElement('span');
                    spanBtn.innerHTML = `Selamat Datang, <b>${data.nama}</b>`;
                    spanBtn.className = 'text-black font-medium text-sm md:text-base px-2';
                    loginBtn.replaceWith(spanBtn);
                }
            });
        }
    } catch (error) {
        console.error('Gagal memverifikasi status login:', error);
    }
});
