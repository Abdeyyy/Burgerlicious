function initializeSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    const currentPage = window.location.pathname.split('/').pop();
    const basePath = window.location.pathname.includes('/public/pages/') ? '../../' : './';

    const menuItems = [
        { id: 'dashboard.html', icon: 'dashboard', label: 'Dashboard' },
        { id: 'menu_management.html', icon: 'restaurant_menu', label: 'Menu Management' },
        { id: 'order_queue.html', icon: 'pending_actions', label: 'Order Queue' },
        { id: 'analytics.html', icon: 'analytics', label: 'Analytics' },
        { id: 'promo_management.html', icon: 'campaign', label: 'Promos' },
        { id: 'flash_sale_management.html', icon: 'flash_on', label: 'Flash Sale' }
    ];

    const sidebarHTML = `
        <nav id="admin-sidebar" class="h-screen w-64 fixed left-0 top-0 bg-stone-50 dark:bg-stone-950 border-r border-stone-200 dark:border-stone-800 flex flex-col h-full py-6 font-['Be_Vietnam_Pro'] text-sm z-40">
            <div class="px-6 mb-10 flex justify-between items-center">
                <div>
                    <h1 class="text-xl font-bold text-stone-900 dark:text-stone-50">Admin Panel</h1>
                    <p class="text-xs text-stone-500 uppercase tracking-wider">Burgerlicious Management</p>
                </div>
                <button id="sidebar-close-btn" class="lg:hidden p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none cursor-pointer">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="flex-1 space-y-1">
                ${menuItems.map(item => {
                    const isActive = currentPage === item.id || (currentPage === '' && item.id === 'dashboard.html');
                    const activeClass = isActive 
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-semibold' 
                        : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800';
                    
                    return `
                        <a class="${activeClass} px-4 py-3 mx-2 flex items-center gap-3 rounded-full transition-all duration-200 ease-in-out"
                            href="${item.id}">
                            <span class="material-symbols-outlined" data-icon="${item.icon}">${item.icon}</span>
                            <span>${item.label}</span>
                        </a>
                    `;
                }).join('')}
            </div>
            <div class="mt-auto px-4">
                <a href="${basePath}auth/logout.php"
                    class="w-full py-3 px-4 text-red-600 font-bold hover:bg-red-50 rounded-full transition-colors flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined" data-icon="logout">logout</span>
                    Logout
                </a>
            </div>
        </nav>
    `;

    sidebarContainer.innerHTML = sidebarHTML;

    // Inject responsive CSS
    let style = document.getElementById('admin-sidebar-style');
    if (!style) {
        style = document.createElement('style');
        style.id = 'admin-sidebar-style';
        style.innerHTML = `
            @media (max-width: 1024px) {
                main.ml-64 {
                    margin-left: 0 !important;
                    padding: 1.5rem !important;
                    padding-top: 5rem !important;
                }
                #admin-sidebar {
                    transform: translateX(-100%);
                    transition: transform 0.3s ease-in-out;
                }
                #admin-sidebar.open {
                    transform: translateX(0);
                }
                .sidebar-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.4);
                    z-index: 30;
                    display: none;
                }
                .sidebar-overlay.open {
                    display: block;
                }
                main header.flex.justify-between {
                    flex-direction: column !important;
                    align-items: flex-start !important;
                    gap: 1rem !important;
                }
                main header.flex.justify-between > div.flex {
                    width: 100% !important;
                    justify-content: flex-start !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Create overlay
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    // Create hamburger toggle button
    let toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (!toggleBtn) {
        toggleBtn = document.createElement('button');
        toggleBtn.id = 'sidebar-toggle-btn';
        toggleBtn.className = "fixed top-4 left-4 z-30 p-2.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 shadow-md hover:bg-stone-100 dark:hover:bg-stone-800 lg:hidden flex items-center justify-center focus:outline-none cursor-pointer";
        toggleBtn.innerHTML = '<span class="material-symbols-outlined">menu</span>';
        document.body.appendChild(toggleBtn);
    }

    const sidebar = document.getElementById('admin-sidebar');
    const closeBtn = document.getElementById('sidebar-close-btn');

    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('open');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
    }

    toggleBtn.addEventListener('click', openSidebar);
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSidebar);
    }
    overlay.addEventListener('click', closeSidebar);
}

// Inisialisasi sidebar saat DOM siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSidebar);
} else {
    initializeSidebar();
}
