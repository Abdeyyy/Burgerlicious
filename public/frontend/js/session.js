document.addEventListener('DOMContentLoaded', async function () {
    try {
        // Menentukan prefix folder supaya URL tujuan selalu benar
        const basePath = window.location.pathname.includes('/public/pages/') ? '../../' : './';
        const res = await fetch(basePath + 'auth/check_session.php');
        const data = await res.json();

        if (data.loggedIn) {
            const loginBtns = document.querySelectorAll('a[href="login.html"], a[href="./public/pages/login.html"]');

            loginBtns.forEach(loginBtn => {
                if (loginBtn.textContent.trim().toLowerCase() === 'login') {
                    // Membuat container dropdown
                    const container = document.createElement('div');
                    container.className = 'relative inline-block text-left';

                    // Tombol Sapaan
                    const greetingBtn = document.createElement('button');
                    const firstName = data.nama.split(' ')[0]; 
                    // Menggunakan chevron dari FontAwesome (sudah di-load di index.html)
                    greetingBtn.innerHTML = `Halo, <b>${firstName}</b> <i class="fas fa-chevron-down ml-1.5 text-xs opacity-80"></i>`;
                    greetingBtn.className = 'flex items-center text-black md:text-black lg:text-white font-bold text-base md:text-lg px-4 py-2 drop-shadow-sm cursor-pointer hover:bg-black/5 lg:hover:bg-white/20 rounded-full transition outline-none';
                    
                    // Menu Dropdown
                    const dropdownMenu = document.createElement('div');
                    // Style box dropdown
                    dropdownMenu.className = 'hidden absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden z-[100] transform origin-top-right transition-all';
                    
                    // Link Profil
                    const profileLink = document.createElement('a');
                    profileLink.href = basePath + 'public/pages/profile.html';
                    profileLink.className = 'flex items-center px-4 py-3.5 text-sm text-gray-700 hover:bg-gray-50 transition border-b border-gray-100/50';
                    profileLink.innerHTML = '<i class="fas fa-user w-5 text-center mr-2 text-gray-400"></i> Profil Saya';
                    
                    // Link Logout
                    const logoutLink = document.createElement('a');
                    logoutLink.href = basePath + 'auth/logout.php';
                    logoutLink.className = 'flex items-center px-4 py-3.5 text-sm text-[#BA0000] hover:bg-red-50 transition font-semibold';
                    logoutLink.innerHTML = '<i class="fas fa-sign-out-alt w-5 text-center mr-2"></i> Logout';
                    
                    dropdownMenu.appendChild(profileLink);
                    dropdownMenu.appendChild(logoutLink);
                    
                    container.appendChild(greetingBtn);
                    container.appendChild(dropdownMenu);

                    // Event Listener untuk toggle dropdown
                    greetingBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        dropdownMenu.classList.toggle('hidden');
                    });
                    
                    // Menutup dropdown saat klik di luar area
                    document.addEventListener('click', (e) => {
                        if (!container.contains(e.target)) {
                            dropdownMenu.classList.add('hidden');
                        }
                    });

                    // Ganti tombol login asli dengan komponen dropdown
                    loginBtn.replaceWith(container);
                }
            });
        }
    } catch (error) {
        console.error('Gagal memverifikasi status login:', error);
    }
});
