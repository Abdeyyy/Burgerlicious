document.addEventListener('DOMContentLoaded', () => {
    const promoGrid = document.getElementById('promo-grid');
    const promoLoading = document.getElementById('promo-loading');
    const promoEmpty = document.getElementById('promo-empty');
    const promoCount = document.getElementById('promo-count');

    const basePath = window.location.pathname.includes('/public/pages/') ? '../../' : './';

    // Badge styles based on promo type
    const badgeStyles = {
        percentage: { bg: '#BD0202', text: '#FFFFFF', label: 'Diskon' },
        fixed: { bg: '#FFAD5B', text: '#BD0202', label: 'Potongan' },
        bogo: { bg: '#2E7D32', text: '#FFFFFF', label: 'BOGO' }
    };

    // Format currency to Rupiah
    const formatRupiah = (num) => {
        return 'Rp ' + Number(num).toLocaleString('id-ID');
    };

    // Calculate remaining days
    const getRemainingDays = (endDate) => {
        const now = new Date();
        const end = new Date(endDate);
        const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        return diff;
    };

    // Format date to readable string
    const formatDate = (dateStr) => {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('id-ID', options);
    };

    // Build promo discount display text
    const getDiscountText = (promo) => {
        switch (promo.tipe_promo) {
            case 'percentage':
                return `${Number(promo.nilai_diskon)}%`;
            case 'fixed':
                return formatRupiah(promo.nilai_diskon);
            case 'bogo':
                return 'Buy 1 Get 1';
            default:
                return '';
        }
    };

    // Build promo card HTML
    const buildPromoCard = (promo, index) => {
        const badge = badgeStyles[promo.tipe_promo] || badgeStyles.percentage;
        const remaining = getRemainingDays(promo.tanggal_selesai);
        const isEndingSoon = remaining <= 3 && remaining > 0;
        const discountText = getDiscountText(promo);

        // Determine image source
        let imgSrc = `${basePath}assets/images/promo_default.png`;
        if (promo.gambar_url) {
            imgSrc = `${basePath}${promo.gambar_url}`;
        }

        // Badge rotation alternation
        const rotation = index % 2 === 0 ? '-rotate-3' : 'rotate-3';

        // Urgency badge
        let urgencyBadge = '';
        if (isEndingSoon) {
            urgencyBadge = `
                <div class="absolute top-6 right-6 z-20 bg-[#FF5722] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    ${remaining} hari lagi!
                </div>`;
        }

        // Category info
        let categoryInfo = '';
        if (promo.nama_kategori) {
            categoryInfo = `
                <div class="flex items-center gap-1.5 mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-[#FEBB19]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span class="text-[#FEBB19] text-xs font-medium">${promo.nama_kategori}</span>
                </div>`;
        }

        // Min order info
        let minOrderInfo = '';
        if (promo.min_order && Number(promo.min_order) > 0) {
            minOrderInfo = `
                <div class="flex items-center gap-1.5 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                    <span class="text-white/60 text-xs">Min. ${formatRupiah(promo.min_order)}</span>
                </div>`;
        }

        // Voucher code display
        let voucherCode = '';
        if (promo.kode_promo) {
            voucherCode = `
                <div class="mt-3 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20 
                            flex items-center justify-between gap-2 cursor-pointer group/code hover:bg-white/25 transition-colors"
                     onclick="copyPromoCode('${promo.kode_promo}', this)" title="Klik untuk menyalin kode">
                    <div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#FEBB19]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <span class="text-white font-bold tracking-widest text-sm">${promo.kode_promo}</span>
                    </div>
                    <span class="text-white/50 text-xs group-hover/code:text-white/80 transition-colors copy-label">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Salin
                    </span>
                </div>`;
        }

        return `
            <div class="group relative bg-white rounded-3xl p-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer h-[520px] promo-card"
                 style="animation: fadeInUp 0.5s ease-out ${index * 0.1}s both;">
                <!-- Type Badge -->
                <div class="absolute top-6 left-6 z-20 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md transform ${rotation}"
                     style="background-color: ${badge.bg}; color: ${badge.text};">
                    ${badge.label} ${promo.tipe_promo === 'bogo' ? '' : discountText}
                </div>
                ${urgencyBadge}

                <!-- Image & Overlay -->
                <div class="overflow-hidden rounded-2xl relative h-full w-full">
                    <img loading="lazy"
                         class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                         src="${imgSrc}" alt="${promo.nama_promo}"
                         onerror="this.src='${basePath}assets/images/promo_default.png'">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100"></div>
                    
                    <!-- Content Overlay -->
                    <div class="absolute bottom-0 left-0 p-6 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <!-- Discount Highlight -->
                        <div class="inline-block bg-[#FEBB19] text-[#8F0919] font-extrabold text-lg px-3 py-1 rounded-lg mb-2 shadow-md">
                            ${promo.tipe_promo === 'bogo' ? 'BOGO FREE' : (promo.tipe_promo === 'percentage' ? `Diskon ${discountText}` : `Hemat ${discountText}`)}
                        </div>

                        <h3 class="text-2xl font-bold text-white mb-1 drop-shadow-md">${promo.nama_promo}</h3>
                        
                        ${promo.deskripsi ? `<p class="text-white/70 text-sm mb-2 line-clamp-2">${promo.deskripsi}</p>` : ''}

                        <!-- Period -->
                        <div class="flex items-center gap-2 text-[#FEBB19] font-medium text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>${formatDate(promo.tanggal_mulai)} — ${formatDate(promo.tanggal_selesai)}</span>
                        </div>

                        ${categoryInfo}
                        ${minOrderInfo}
                        ${voucherCode}
                    </div>
                </div>
            </div>`;
    };

    // Copy promo code to clipboard
    window.copyPromoCode = async (code, el) => {
        try {
            await navigator.clipboard.writeText(code);
            const label = el.querySelector('.copy-label');
            const originalHTML = label.innerHTML;
            label.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-green-400">Tersalin!</span>`;
            setTimeout(() => { label.innerHTML = originalHTML; }, 2000);
        } catch (err) {
            // Fallback for older browsers
            const input = document.createElement('input');
            input.value = code;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
        }
    };

    // Fetch and render promos
    const loadPromos = async () => {
        promoLoading.classList.remove('hidden');
        promoGrid.innerHTML = '';
        promoEmpty.classList.add('hidden');

        try {
            const res = await fetch(`${basePath}api/promo/read_public.php`);
            const json = await res.json();

            promoLoading.classList.add('hidden');

            if (json.status !== 'success' || !json.data || json.data.length === 0) {
                promoEmpty.classList.remove('hidden');
                if (promoCount) promoCount.textContent = '0';
                return;
            }

            const promos = json.data;
            if (promoCount) promoCount.textContent = promos.length;

            promoGrid.innerHTML = promos.map((promo, i) => buildPromoCard(promo, i)).join('');

        } catch (err) {
            promoLoading.classList.add('hidden');
            promoEmpty.classList.remove('hidden');
            console.error('Gagal memuat promo:', err);
        }
    };

    // Start
    loadPromos();
});
