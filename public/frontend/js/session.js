document.addEventListener('DOMContentLoaded', async function () {
    try {
        const basePath = window.location.pathname.includes('/public/pages/') ? '../../' : './';
        const res = await fetch(basePath + 'auth/check_session.php');
        const data = await res.json();

        if (data.loggedIn) {
            // Cari semua <a> yang teksnya "login" (case-insensitive) — lebih robust
            const allLinks = document.querySelectorAll('a');
            const loginBtns = Array.from(allLinks).filter(a =>
                a.textContent.trim().toLowerCase() === 'login' &&
                (a.href.includes('login.html'))
            );

            // Buat Overlay
            const overlay = document.createElement('div');
            overlay.id = 'drawer-overlay';
            overlay.style.cssText = [
                'position:fixed', 'inset:0', 'background:rgba(0,0,0,0.5)',
                'z-index:90', 'display:none', 'opacity:0',
                'transition:opacity 0.3s ease'
            ].join(';');
            document.body.appendChild(overlay);

            // Buat Drawer
            const drawer = document.createElement('div');
            drawer.id = 'profile-drawer';
            drawer.style.cssText = [
                'position:fixed', 'top:0', 'left:0', 'height:100%', 'width:320px',
                'background:#fff', 'z-index:100',
                'transform:translateX(-100%)',
                'transition:transform 0.3s ease',
                'box-shadow:4px 0 24px rgba(0,0,0,0.15)',
                'display:flex', 'flex-direction:column',
                'font-family:inherit'
            ].join(';');

            drawer.innerHTML = `
                <div style="display:flex;align-items:center;padding:16px 24px;border-bottom:1px solid #e5e7eb;margin-top:8px;">
                    <img src="${basePath}assets/icon/profile.png" alt="Profile"
                        style="width:90px;height:90px;object-fit:contain;display:block;flex-shrink:0;">
                    <div style="margin-left:8px;flex:1;overflow:hidden;">
                        <h3 style="margin:0;font-size:18px;font-weight:700;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${data.nama}</h3>
                        <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Customer</p>
                    </div>
                    <button style="background:none;border:none;cursor:pointer;color:#9ca3af;padding:8px;font-size:18px;">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>

                <div style="flex:1;overflow-y:auto;padding:8px 0;">
                    ${[
                        { icon: 'far fa-calendar-alt', label: 'Aktivitas' },
                        { icon: 'fas fa-coins',        label: 'Promo dan Voucher' },
                        { icon: 'fas fa-globe',        label: 'Bahasa' },
                        { icon: 'fas fa-shield-alt',   label: 'Keamanan Akun' },
                        { icon: 'far fa-file-alt',     label: 'Ketentuan Layanan' },
                        { icon: 'fas fa-wallet',       label: 'Metode Pembayaran' },
                    ].map(item => `
                        <a href="#"
                            style="display:flex;align-items:center;padding:14px 24px;color:#374151;text-decoration:none;transition:background 0.2s;"
                            onmouseover="this.style.background='#f9fafb';this.style.color='#BA0000';"
                            onmouseout="this.style.background='';this.style.color='#374151';">
                            <i class="${item.icon}" style="width:24px;text-align:center;font-size:18px;"></i>
                            <span style="margin-left:16px;font-size:15px;font-weight:500;">${item.label}</span>
                        </a>
                    `).join('')}
                </div>

                <div style="padding:20px 24px;border-top:1px solid #f3f4f6;">
                    <a href="${basePath}auth/logout.php"
                        style="display:flex;align-items:center;color:#BA0000;font-weight:700;text-decoration:none;font-size:15px;"
                        onmouseover="this.style.color='#8F0919';" onmouseout="this.style.color='#BA0000';">
                        <i class="fas fa-sign-out-alt" style="width:24px;text-align:center;font-size:18px;"></i>
                        <span style="margin-left:8px;">Logout</span>
                    </a>
                </div>
            `;
            document.body.appendChild(drawer);

            function openDrawer() {
                overlay.style.display = 'block';
                setTimeout(() => {
                    overlay.style.opacity = '1';
                    drawer.style.transform = 'translateX(0)';
                }, 10);
            }

            function closeDrawer() {
                overlay.style.opacity = '0';
                drawer.style.transform = 'translateX(-100%)';
                setTimeout(() => { overlay.style.display = 'none'; }, 300);
            }

            overlay.addEventListener('click', closeDrawer);

            // Ganti semua tombol Login dengan ikon profile
            loginBtns.forEach(loginBtn => {
                const profileBtn = document.createElement('button');
                profileBtn.title = 'Profil Saya';
                // Gambar profile.png punya padding transparan ~15%, jadi perbesar ke 90px
                // agar lingkaran orange yang terlihat setara ~63px (sama dengan logo)
                profileBtn.style.cssText = [
                    'width:90px', 'height:90px',
                    'border:none',
                    'cursor:pointer',
                    'background:transparent',
                    'padding:0',
                    'display:flex',
                    'align-items:center',
                    'justify-content:center',
                    'transition:transform 0.2s,opacity 0.2s',
                    'flex-shrink:0'
                ].join(';');

                profileBtn.innerHTML = `<img src="${basePath}assets/icon/profile.png" alt="Profile" style="width:90px;height:90px;object-fit:contain;display:block;">`;

                profileBtn.addEventListener('mouseenter', () => {
                    profileBtn.style.opacity = '0.8';
                    profileBtn.style.transform = 'scale(1.08)';
                });
                profileBtn.addEventListener('mouseleave', () => {
                    profileBtn.style.opacity = '1';
                    profileBtn.style.transform = 'scale(1)';
                });
                profileBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openDrawer();
                });

                loginBtn.replaceWith(profileBtn);
            });
        }
    } catch (error) {
        console.error('Gagal memverifikasi status login:', error);
    }
});
