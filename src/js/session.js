document.addEventListener('DOMContentLoaded', async function () {
    try {
        const res = await fetch('../backend/auth/check_session.php');
        const data = await res.json();

        if (data.loggedIn) {
            const loginBtns = document.querySelectorAll('a[href="login.html"]');

            loginBtns.forEach(loginBtn => {
                if (loginBtn.textContent.trim().toLowerCase() === 'login') {
                    const spanBtn = document.createElement('span');
                    spanBtn.innerHTML = `Selamat Datang, <b>${data.nama}</b>`;
                    spanBtn.className = 'text-white font-medium text-sm md:text-base px-2';
                    loginBtn.replaceWith(spanBtn);
                }
            });
        }
    } catch (error) {
        console.error('Gagal memverifikasi status login:', error);
    }
});
