document.addEventListener('DOMContentLoaded', () => {
    const menuContainer = document.getElementById('menu-items-container');
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('search-input');
    const addItemBtn = document.getElementById('add-item-btn');
    const modal = document.getElementById('menu-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const menuForm = document.getElementById('menu-form');
    const modalTitle = document.getElementById('modal-title');
    
    let allMenus = [];
    let allCategories = [];
    let editingMenuId = null;

    // Fetch Categories
    const fetchCategories = async () => {
        try {
            const response = await fetch('../../api/kategori/read.php');
            const result = await response.json();
            if (result.status === 'success') {
                allCategories = result.data;
                renderCategoryOptions();
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    // Render Category Options in Filter & Form
    const renderCategoryOptions = () => {
        const categorySelect = document.getElementById('item-category');
        
        // Filter dropdown
        categoryFilter.innerHTML = '<option value="all">All Categories</option>';
        allCategories.forEach(cat => {
            categoryFilter.innerHTML += `<option value="${cat.id_kategori}">${cat.nama_kategori}</option>`;
        });

        // Form select
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        allCategories.forEach(cat => {
            categorySelect.innerHTML += `<option value="${cat.id_kategori}">${cat.nama_kategori}</option>`;
        });
    };

    // Fetch Menus
    const fetchMenus = async () => {
        try {
            const response = await fetch('../../api/menu/read.php');
            const result = await response.json();
            if (result.status === 'success') {
                allMenus = result.data;
                renderMenus(allMenus);
            }
        } catch (error) {
            console.error('Error fetching menus:', error);
        }
    };

    // Render Menus to Grid
    const renderMenus = (menus) => {
        menuContainer.innerHTML = '';
        if (menus.length === 0) {
            menuContainer.innerHTML = '<div class="col-span-full text-center py-10 text-on-surface-variant font-medium">No menu items found.</div>';
            return;
        }

        menus.forEach(item => {
            const card = document.createElement('div');
            card.className = 'bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow group';
            card.innerHTML = `
                <div class="relative h-48 overflow-hidden bg-surface-container">
                    <img src="../../${item.gambar_url || 'assets/images/placeholder.webp'}" alt="${item.nama_menu}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    <div class="absolute top-3 right-3">
                        <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status_tersedia == 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
                            ${item.status_tersedia == 1 ? 'Available' : 'Out of Stock'}
                        </span>
                    </div>
                    <div class="absolute top-3 left-3">
                        <span class="px-2 py-1 bg-black/50 text-white rounded-full text-[10px] font-bold backdrop-blur-sm">
                            ${item.nama_kategori}
                        </span>
                    </div>
                </div>
                <div class="p-5">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold text-lg text-on-surface">${item.nama_menu}</h3>
                        <span class="font-black text-primary">Rp ${parseFloat(item.harga).toLocaleString('id-ID')}</span>
                    </div>
                    <p class="text-sm text-on-surface-variant line-clamp-2 mb-4 h-10">${item.deskripsi || 'No description available.'}</p>
                    <div class="flex gap-2">
                        <button onclick="editMenu(${item.id_menu})" class="flex-1 py-2 px-3 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined text-sm">edit</span> Edit
                        </button>
                        <button onclick="deleteMenu(${item.id_menu})" class="py-2 px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                    </div>
                </div>
            `;
            menuContainer.appendChild(card);
        });
    };

    // Filter Logic
    const filterMenus = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;

        const filtered = allMenus.filter(item => {
            const matchesSearch = item.nama_menu.toLowerCase().includes(searchTerm) || 
                                 item.deskripsi.toLowerCase().includes(searchTerm);
            const matchesCategory = selectedCategory === 'all' || item.id_kategori == selectedCategory;
            return matchesSearch && matchesCategory;
        });

        renderMenus(filtered);
    };

    searchInput.addEventListener('input', filterMenus);
    categoryFilter.addEventListener('change', filterMenus);

    // Modal Controls
    const openModal = (title, mode = 'add', data = null) => {
        modalTitle.innerText = title;
        editingMenuId = mode === 'edit' ? data.id_menu : null;
        
        if (mode === 'edit') {
            document.getElementById('item-name').value = data.nama_menu;
            document.getElementById('item-category').value = data.id_kategori;
            document.getElementById('item-price').value = data.harga;
            document.getElementById('item-description').value = data.deskripsi;
            document.getElementById('item-status').value = data.status_tersedia;
        } else {
            menuForm.reset();
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    addItemBtn.addEventListener('click', () => openModal('Add New Menu Item'));
    closeModalBtn.addEventListener('click', closeModal);

    // Form Submit
    menuForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(menuForm);
        
        const url = editingMenuId ? '../../api/menu/update.php' : '../../api/menu/create.php';
        if (editingMenuId) formData.append('id_menu', editingMenuId);

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            
            if (result.status === 'success') {
                closeModal();
                fetchMenus();
                // Optional: Show toast success
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error saving menu:', error);
            alert('An error occurred while saving.');
        }
    });

    // Global Functions for buttons in cards
    window.editMenu = (id) => {
        const menu = allMenus.find(m => m.id_menu == id);
        if (menu) openModal('Edit Menu Item', 'edit', menu);
    };

    window.deleteMenu = async (id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            const response = await fetch('../../api/menu/delete.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_menu: id })
            });
            const result = await response.json();
            if (result.status === 'success') {
                fetchMenus();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error deleting menu:', error);
        }
    };

    // Initialize
    fetchCategories();
    fetchMenus();
});
