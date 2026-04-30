document.addEventListener('DOMContentLoaded', async function () {
    const basePath = window.location.pathname.includes('/public/pages/') ? '../../' : './';

    // Sembunyikan tombol Login SEGERA sebelum fetch, agar tidak ada glitch/flash
    const allLinks = document.querySelectorAll('a');
    const loginBtns = Array.from(allLinks).filter(a =>
        a.textContent.trim().toLowerCase() === 'login' &&
        a.href.includes('login.html')
    );
    loginBtns.forEach(btn => { btn.style.visibility = 'hidden'; });

    try {
        const res = await fetch(basePath + 'auth/check_session.php');
        const data = await res.json();

        if (!data.loggedIn) {
            loginBtns.forEach(btn => { btn.style.visibility = ''; });
            return;
        }

        const dropdown = document.createElement('div');
        dropdown.id = 'profile-dropdown';
        dropdown.style.cssText = [
            'position:fixed',
            'top:72px',
            'right:16px',
            'width:280px',
            'background:#fff',
            'border-radius:12px',
            'box-shadow:0 4px 24px rgba(0,0,0,0.18)',
            'z-index:9999',
            'display:none',
            'overflow:hidden',
            'font-family:inherit',
            'border:1px solid #e5e7eb'
        ].join(';');

        const menuItems = [
            { icon: 'far fa-calendar-alt', label: 'Aktivitas' },
            { icon: 'fas fa-coins', label: 'Promo dan Voucher' },
            { icon: 'fas fa-globe', label: 'Bahasa' },
            { icon: 'fas fa-shield-alt', label: 'Keamanan Akun' },
            { icon: 'far fa-file-alt', label: 'Ketentuan Layanan' },
            { icon: 'fas fa-wallet', label: 'Metode Pembayaran' },
        ];

        dropdown.innerHTML = `
            <!-- Header Profil -->
            <div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid #e5e7eb;gap:12px;">
                <img src="${basePath}assets/icon/profile.png" alt="Profile"
                    style="width:56px;height:56px;object-fit:contain;flex-shrink:0;">
                <div style="flex:1;min-width:0;">
                    <div style="font-size:17px;font-weight:700;color:#1c1e21;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${data.nama}</div>
                    <div style="font-size:13px;color:#65676b;margin-top:2px;">Customer</div>
                </div>
                <button id="dd-edit-btn" style="background:none;border:none;cursor:pointer;color:#65676b;padding:6px;font-size:17px;border-radius:50%;line-height:1;">
                    <i class="fas fa-pencil-alt"></i>
                </button>
            </div>

            <!-- Menu Items -->
            <div style="padding:6px 0;">
                ${menuItems.map(item => `
                    <a href="#"
                        style="display:flex;align-items:center;padding:10px 16px;color:#1c1e21;text-decoration:none;gap:14px;transition:background 0.15s;"
                        onmouseover="this.style.background='#f0f2f5';"
                        onmouseout="this.style.background='';">
                        <span style="width:32px;height:32px;background:#e4e6eb;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                            <i class="${item.icon}" style="font-size:15px;color:#1c1e21;"></i>
                        </span>
                        <span style="font-size:14px;font-weight:500;">${item.label}</span>
                    </a>
                `).join('')}

                <!-- Divider -->
                <div style="height:1px;background:#e5e7eb;margin:6px 0;"></div>

                <!-- Logout -->
                <a href="${basePath}auth/logout.php"
                    style="display:flex;align-items:center;padding:10px 16px;color:#BA0000;text-decoration:none;gap:14px;transition:background 0.15s;"
                    onmouseover="this.style.background='#fff0f0';"
                    onmouseout="this.style.background='';">
                    <span style="width:32px;height:32px;background:#ffe0e0;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fas fa-sign-out-alt" style="font-size:15px;color:#BA0000;"></i>
                    </span>
                    <span style="font-size:14px;font-weight:700;">Logout</span>
                </a>
            </div>
        `;
        document.body.appendChild(dropdown);

        // Toggle dropdown
        function openDropdown() {
            dropdown.style.display = 'block';
            const btnRect = profileBtn.getBoundingClientRect();
            // Kurangi ~14px padding transparan di bawah gambar profile.png
            dropdown.style.top = (btnRect.bottom - 14) + 'px';
            dropdown.style.right = (window.innerWidth - btnRect.right) + 'px';
        }

        function closeDropdown() {
            dropdown.style.display = 'none';
        }

        // Tutup dropdown saat klik di luar
        document.addEventListener('click', function (e) {
            if (!dropdown.contains(e.target) && e.target !== profileBtn && !profileBtn.contains(e.target)) {
                closeDropdown();
            }
        });

        // ── Ganti semua tombol Login dengan icon profile ──────────────
        let profileBtn; // referensi untuk posisi dropdown

        loginBtns.forEach(loginBtn => {
            profileBtn = document.createElement('button');
            profileBtn.title = 'Profil Saya';
            profileBtn.style.cssText = [
                'width:90px', 'height:90px',
                'border:none',
                'cursor:pointer',
                'background:transparent',
                'padding:0',
                'display:flex',
                'align-items:center',
                'justify-content:center',
                'transition:opacity 0.2s,transform 0.2s',
                'flex-shrink:0'
            ].join(';');

            profileBtn.innerHTML = `<img src="${basePath}assets/icon/profile.png" alt="Profile" style="width:90px;height:90px;object-fit:contain;display:block;">`;

            profileBtn.addEventListener('mouseenter', () => {
                profileBtn.style.opacity = '0.8';
                profileBtn.style.transform = 'scale(1.05)';
            });
            profileBtn.addEventListener('mouseleave', () => {
                profileBtn.style.opacity = '1';
                profileBtn.style.transform = 'scale(1)';
            });
            profileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (dropdown.style.display === 'none' || dropdown.style.display === '') {
                    openDropdown();
                } else {
                    closeDropdown();
                }
            });

            loginBtn.replaceWith(profileBtn);
        });

    } catch (error) {
        loginBtns.forEach(btn => { btn.style.visibility = ''; });
        console.error('Gagal memverifikasi status login:', error);
    }
});
