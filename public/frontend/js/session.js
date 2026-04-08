document.addEventListener('DOMContentLoaded', async function () {
    try {
        const basePath = window.location.pathname.includes('/public/pages/') ? '../../' : './';
        const res = await fetch(basePath + 'auth/check_session.php');
        const data = await res.json();

        if (data.loggedIn) {
            const loginBtns = document.querySelectorAll('a[href="login.html"], a[href="./public/pages/login.html"]');

            loginBtns.forEach(loginBtn => {
                if (loginBtn.textContent.trim().toLowerCase() === 'login') {
                    const spanBtn = document.createElement('div');
                    const firstName = data.nama.split(' ')[0];
                    spanBtn.innerHTML = `Halo, <b>${firstName}</b>`;
                    spanBtn.className = 'text-white font-bold text-base md:text-lg px-2 drop-shadow-sm truncate max-w-[150px] text-center cursor-default';
                    loginBtn.replaceWith(spanBtn);
                }
            });
        }
    } catch (error) {
        console.error('Gagal memverifikasi status login:', error);
    }
});
