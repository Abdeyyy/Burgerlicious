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
        { id: 'promo_management.html', icon: 'campaign', label: 'Promos' }
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
                <div class="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl mb-4">
                    <img class="w-10 h-10 rounded-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8Cu_BIerUaUneo_LN-UBetnxt_RAVsG3RKh76Cd3_aIa2x1fs6W6x3sBlzSvmdraNm8JrNL3qRptRtDbGKWDT07KUjrO0cO_3-Uyv0o-YGtg2VLBeOIlDMO_5C9Lhiv-t10UO9VhDg2pGQtEurYnQI4FLc6YTSjtEVi3tDuqSgNyl_-reVQ7p5mMqc5i6FrqPbplc2SyKv4aX1PiqG_9DYi_624HH1nT9bd4vLj1GFtXfe0JawSEUE_mF-WLBEqlUiyukvI9sPhM" />
                    <div>
                        <p class="font-bold text-on-surface text-xs">Admin User</p>
                        <p class="text-[10px] text-on-surface-variant">Admin User Profile</p>
                    </div>
                </div>
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
