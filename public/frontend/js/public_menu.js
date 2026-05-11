document.addEventListener('DOMContentLoaded', () => {
    const categoryContainer = document.getElementById('category-container');
    const menuContainer = document.getElementById('menu-container');
    const searchInput = document.getElementById('search-input');

    let allMenus = [];
    let currentCategoryId = null;

    // Load Categories
    async function loadCategories() {
        try {
            const response = await fetch('../../api/kategori/read.php');
            const data = await response.json();

            // Render "Semua Menu" button
            categoryContainer.innerHTML = `
                <a href="#" data-id="all"
                    class="category-link bg-[#FEBB19] text-[#BA0000] font-extrabold py-3.5 px-5 rounded-lg shadow-[0_4px_15px_rgba(254,187,25,0.4)] transition-all hover:translate-x-1">
                    Semua Menu
                </a>
            `;

            if (data.status === 'success') {
                data.data.forEach(category => {
                    const a = document.createElement('a');
                    a.href = '#';
                    a.dataset.id = category.id_kategori;
                    // Default style for inactive category
                    a.className = 'category-link bg-white/95 text-gray-800 font-bold py-3.5 px-5 rounded-lg shadow-md hover:bg-white hover:text-[#BA0000] transition-all hover:translate-x-1';
                    a.textContent = category.nama_kategori;
                    categoryContainer.appendChild(a);
                });
            }

            // Add event listeners to category links
            document.querySelectorAll('.category-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Update active styles
                    document.querySelectorAll('.category-link').forEach(l => {
                        l.className = 'category-link bg-white/95 text-gray-800 font-bold py-3.5 px-5 rounded-lg shadow-md hover:bg-white hover:text-[#BA0000] transition-all hover:translate-x-1';
                    });
                    e.target.className = 'category-link bg-[#FEBB19] text-[#BA0000] font-extrabold py-3.5 px-5 rounded-lg shadow-[0_4px_15px_rgba(254,187,25,0.4)] transition-all hover:translate-x-1';

                    currentCategoryId = e.target.dataset.id === 'all' ? null : e.target.dataset.id;
                    filterAndRenderMenus();
                });
            });

        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    // Load Menus
    async function loadMenus() {
        try {
            const response = await fetch('../../api/menu/read.php');
            const data = await response.json();

            if (data.status === 'success') {
                // Parse int for status if it comes as string, just to be safe
                allMenus = data.data.filter(menu => parseInt(menu.status_tersedia) === 1);
                filterAndRenderMenus();
            }
        } catch (error) {
            console.error('Error loading menus:', error);
            menuContainer.innerHTML = `<p class="text-white">Gagal memuat menu.</p>`;
        }
    }

    // Filter and Render
    function filterAndRenderMenus() {
        const searchTerm = searchInput.value.toLowerCase();
        
        const filteredMenus = allMenus.filter(menu => {
            const matchesCategory = currentCategoryId ? menu.id_kategori == currentCategoryId : true;
            const matchesSearch = menu.nama_menu.toLowerCase().includes(searchTerm) || (menu.deskripsi && menu.deskripsi.toLowerCase().includes(searchTerm));
            return matchesCategory && matchesSearch;
        });

        renderMenus(filteredMenus);
    }

    // Render HTML for menus
    function renderMenus(menus) {
        if (menus.length === 0) {
            menuContainer.innerHTML = `
                <div class="col-span-full text-center py-10">
                    <p class="text-white text-xl">Tidak ada menu yang ditemukan.</p>
                </div>
            `;
            return;
        }

        menuContainer.innerHTML = menus.map(menu => {
            const isSpicy = menu.nama_menu.toLowerCase().includes('spicy') || (menu.deskripsi && menu.deskripsi.toLowerCase().includes('pedas'));
            const badgeHtml = isSpicy 
                ? `<div class="absolute top-4 left-4 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-md z-10">Spicy 🔥</div>` 
                : `<div class="absolute top-4 left-4 bg-gradient-to-r from-[#FEBB19] to-yellow-400 text-[#BA0000] text-xs font-black px-3 py-1.5 rounded-lg shadow-md z-10">${menu.nama_kategori}</div>`;
                
            // Check image source, fallback to placeholder if not exists
            let imgSrc = menu.gambar_url ? `../../${menu.gambar_url}` : '../../assets/images/menu_placeholder.png';

            return `
            <a href="pesan.html?menu=${menu.id_menu}"
                class="bg-white rounded-xl p-5 shadow-2xl hover:shadow-[0_15px_30px_rgba(254,187,25,0.2)] transition-all duration-300 hover:-translate-y-2 flex flex-col items-center group relative border-2 border-transparent hover:border-[#FEBB19]">
                ${badgeHtml}
                <div class="w-40 h-40 sm:w-48 sm:h-48 mb-4 relative flex justify-center items-center">
                    <img loading="lazy" src="${imgSrc}" alt="${menu.nama_menu}"
                        class="w-full h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500 ease-out"
                        onerror="this.onerror=null;this.src='../../assets/images/menu_placeholder.png';">
                </div>
                <h3
                    class="font-extrabold text-xl text-center text-[#BA0000] mb-1 group-hover:text-[#8F0919] transition-colors leading-snug">
                    ${menu.nama_menu}</h3>
                <div class="mt-auto font-black text-[#FFAD5B] text-lg pt-4">Rp ${parseInt(menu.harga).toLocaleString('id-ID')}</div>
            </a>
            `;
        }).join('');
    }

    // Search input listener
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterAndRenderMenus();
        });
    }

    // Initialize
    loadCategories();
    loadMenus();
});
