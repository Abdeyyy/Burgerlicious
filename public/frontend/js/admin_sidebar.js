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
        <nav class="h-screen w-64 fixed left-0 top-0 bg-stone-50 dark:bg-stone-950 border-r border-stone-200 dark:border-stone-800 flex flex-col h-full py-6 font-['Be_Vietnam_Pro'] text-sm z-40">
            <div class="px-6 mb-10">
                <h1 class="text-xl font-bold text-stone-900 dark:text-stone-50">Admin Panel</h1>
                <p class="text-xs text-stone-500 uppercase tracking-wider">Burgerlicious Management</p>
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
}

// Inisialisasi sidebar saat DOM siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSidebar);
} else {
    initializeSidebar();
}
