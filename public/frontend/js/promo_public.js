document.addEventListener('DOMContentLoaded', () => {
    const promoTrack = document.getElementById('promo-carousel-track');
    const promoContainer = document.getElementById('promo-carousel-container');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const dotsContainer = document.getElementById('carousel-dots');
    const promoLoading = document.getElementById('promo-loading');
    const promoEmpty = document.getElementById('promo-empty');
    const promoCount = document.getElementById('promo-count');

    const basePath = window.location.pathname.includes('/public/pages/') ? '../../' : './';

    // Badge styles based on promo type
    const badgeStyles = {
        percentage: { bg: '#BA0000', text: '#FFFFFF', label: 'Diskon' },
        fixed: { bg: '#FFAD5B', text: '#BA0000', label: 'Potongan' },
        bogo: { bg: '#2E7D32', text: '#FFFFFF', label: 'BOGO' },
        bundling: { bg: '#8F0919', text: '#FEBB19', label: 'Bundling' }
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
            case 'bundling':
                return `Special Price ${formatRupiah(promo.nilai_diskon)}`;
            default:
                return '';
        }
    };

    // Build promo card slide HTML
    const buildPromoCard = (promo, index) => {
        const badge = badgeStyles[promo.tipe_promo] || badgeStyles.percentage;
        const remaining = getRemainingDays(promo.tanggal_selesai);
        const isEndingSoon = remaining <= 3 && remaining > 0;
        const discountText = getDiscountText(promo);

        // Active Days Text & Status Today
        let activeDaysText = '';
        let isActiveToday = true;
        if (promo.hari_aktif) {
            const dayTranslations = {
                'Monday': 'Senin',
                'Tuesday': 'Selasa',
                'Wednesday': 'Rabu',
                'Thursday': 'Kamis',
                'Friday': 'Jumat',
                'Saturday': 'Sabtu',
                'Sunday': 'Minggu'
            };
            const days = promo.hari_aktif.split(',').map(d => d.trim());
            const translatedDays = days.map(d => dayTranslations[d] || d);
            activeDaysText = ` (Setiap hari ${translatedDays.join(', ')})`;
            
            // Check if today matches any active day
            const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }); // e.g. "Thursday"
            if (!days.includes(todayName)) {
                isActiveToday = false;
            }
        }

        // Build bundling requirements description
        let bundlingReqsText = '';
        if (promo.tipe_promo === 'bundling' && promo.bundling_items && promo.bundling_items.length > 0) {
            const itemsList = promo.bundling_items.map(item => {
                const name = item.nama_menu || item.nama_kategori;
                return `${item.jumlah} ${name}`;
            });
            bundlingReqsText = `
            <div class="flex items-center gap-1.5 text-white/90 text-xs md:text-sm mt-1.5 mb-3 font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#FEBB19]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>Paket: ${itemsList.join(' + ')}</span>
            </div>`;
        }

        // Determine image source
        let imgSrc = `${basePath}assets/images/promo_default.png`;
        if (promo.gambar_url) {
            imgSrc = `${basePath}${promo.gambar_url}`;
        }

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

        return `
            <div class="w-full shrink-0 relative aspect-video md:aspect-[21/9] overflow-hidden cursor-pointer select-none">
                <!-- Main Image -->
                <img loading="lazy"
                     class="w-full h-full object-cover transition-transform duration-700 ease-in-out"
                     src="${imgSrc}" alt="${promo.nama_promo}"
                     onerror="this.src='${basePath}assets/images/promo_default.png'">
                
                <!-- Bottom Dark Overlay to enhance text readability -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
                
                <!-- Top Left Badge -->
                <div class="absolute top-6 left-6 z-20 text-xs font-extrabold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md transform rotate-2"
                     style="background-color: ${badge.bg}; color: ${badge.text};">
                    ${badge.label} ${promo.tipe_promo === 'bogo' ? '' : (promo.tipe_promo === 'bundling' ? formatRupiah(promo.nilai_diskon) : discountText)}
                </div>
                ${urgencyBadge}

                <!-- Content Overlay -->
                <div class="absolute bottom-0 left-0 p-6 md:p-8 w-full z-10 text-left">
                    <!-- Discount Pill -->
                    <div class="inline-block bg-[#FEBB19] text-[#8F0919] font-extrabold text-xs md:text-sm px-2.5 py-1 rounded-lg mb-2 shadow-md">
                        ${promo.tipe_promo === 'bogo' ? 'BOGO FREE' : (promo.tipe_promo === 'percentage' ? `Diskon ${discountText}` : (promo.tipe_promo === 'bundling' ? `Harga Paket ${formatRupiah(promo.nilai_diskon)}` : `Hemat ${discountText}`))}
                    </div>

                    <h3 class="text-xl md:text-3xl font-extrabold text-white mb-1.5 drop-shadow-md">${promo.nama_promo}</h3>
                    
                    ${promo.deskripsi ? `<p class="text-white/75 text-xs md:text-sm mb-3 line-clamp-2 max-w-2xl">${promo.deskripsi}</p>` : ''}
                    ${bundlingReqsText}

                    <!-- Details Row -->
                    <div class="flex flex-wrap items-center gap-x-5 gap-y-1">
                        <div class="flex items-center gap-1.5 text-[#FEBB19] font-semibold text-xs md:text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>${formatDate(promo.tanggal_mulai)} — ${formatDate(promo.tanggal_selesai)}${activeDaysText}</span>
                        </div>

                        ${promo.min_order && Number(promo.min_order) > 0 ? `
                        <div class="flex items-center gap-1.5 text-white/60 text-xs md:text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#FEBB19]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                            </svg>
                            <span>Min. ${formatRupiah(promo.min_order)}</span>
                        </div>` : ''}
                    </div>

                    <!-- Voucher code -->
                    ${promo.kode_promo ? (
                        isActiveToday ? `
                        <div class="mt-3.5 inline-flex items-center gap-2.5 bg-white/15 backdrop-blur-md hover:bg-white/25 border border-white/20 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all duration-300 group/code"
                             onclick="event.stopPropagation(); copyPromoCode('${promo.kode_promo}', this)" title="Klik untuk menyalin kode">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#FEBB19]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                            <span class="text-white font-bold tracking-widest text-xs md:text-sm">${promo.kode_promo}</span>
                            <div class="h-3 w-px bg-white/30"></div>
                            <span class="text-white/70 text-xs font-semibold group-hover/code:text-white transition-colors copy-label">Salin</span>
                        </div>` : `
                        <div class="mt-3.5 inline-flex items-center gap-2.5 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl cursor-not-allowed transition-all duration-300" title="Promo tidak aktif hari ini">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span class="text-white/40 font-bold tracking-widest text-xs md:text-sm">${promo.kode_promo}</span>
                            <div class="h-3 w-px bg-white/20"></div>
                            <span class="text-white/40 text-xs font-semibold">Tidak Aktif Hari Ini</span>
                        </div>`
                    ) : ''}
                </div>
            </div>`;
    };

    // Copy promo code to clipboard
    window.copyPromoCode = async (code, el) => {
        try {
            await navigator.clipboard.writeText(code);
            const label = el.querySelector('.copy-label');
            const originalHTML = label.innerHTML;
            label.innerHTML = `<span class="text-green-400">Tersalin!</span>`;
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

    // Initialize carousel slider behavior
    const initCarousel = (slideCount) => {
        if (slideCount <= 0) return;

        let currentIndex = 0;
        let startX = 0;
        let currentTranslate = 0;
        let prevTranslate = 0;
        let isDragging = false;
        let autoPlayTimer = null;

        const updateCarousel = () => {
            const offset = -currentIndex * 100;
            promoTrack.style.transform = `translateX(${offset}%)`;

            // Update dots to match active red-pill / inactive gray dots style
            const dots = dotsContainer.querySelectorAll('.carousel-dot');
            dots.forEach((dot, i) => {
                if (i === currentIndex) {
                    dot.className = 'carousel-dot bg-[#BA0000] w-6 h-2 rounded-full transition-all duration-300 cursor-pointer';
                } else {
                    dot.className = 'carousel-dot bg-gray-300 w-2 h-2 rounded-full transition-all duration-300 cursor-pointer';
                }
            });
        };

        const nextSlide = () => {
            currentIndex = (currentIndex + 1) % slideCount;
            updateCarousel();
        };

        const prevSlide = () => {
            currentIndex = (currentIndex - 1 + slideCount) % slideCount;
            updateCarousel();
        };

        const startAutoPlay = () => {
            stopAutoPlay();
            autoPlayTimer = setInterval(nextSlide, 4000);
        };

        const stopAutoPlay = () => {
            if (autoPlayTimer) {
                clearInterval(autoPlayTimer);
                autoPlayTimer = null;
            }
        };

        // Navigation Buttons
        if (prevBtn) {
            prevBtn.onclick = () => {
                prevSlide();
                startAutoPlay();
            };
        }
        if (nextBtn) {
            nextBtn.onclick = () => {
                nextSlide();
                startAutoPlay();
            };
        }

        // Indicator Dots clicking
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot) => {
            dot.onclick = () => {
                const idx = parseInt(dot.getAttribute('data-index'), 10);
                currentIndex = idx;
                updateCarousel();
                startAutoPlay();
            };
        });

        // Swipe & Drag Events
        const handleDragStart = (e) => {
            isDragging = true;
            stopAutoPlay();
            startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            promoTrack.style.transition = 'none';
        };

        const handleDragMove = (e) => {
            if (!isDragging) return;
            const currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const diffX = currentX - startX;

            const width = promoContainer.offsetWidth;
            const percentage = (diffX / width) * 100;
            const baseOffset = -currentIndex * 100;
            currentTranslate = baseOffset + percentage;

            promoTrack.style.transform = `translateX(${currentTranslate}%)`;
        };

        const handleDragEnd = () => {
            if (!isDragging) return;
            isDragging = false;

            promoTrack.style.transition = 'transform 0.5s ease-out';

            const width = promoContainer.offsetWidth;
            const baseOffset = -currentIndex * 100;
            const diffPct = currentTranslate - baseOffset;

            if (diffPct < -15) {
                currentIndex = (currentIndex + 1) % slideCount;
            } else if (diffPct > 15) {
                currentIndex = (currentIndex - 1 + slideCount) % slideCount;
            }

            updateCarousel();
            startAutoPlay();
        };

        // Attach listeners
        promoTrack.addEventListener('mousedown', handleDragStart);
        promoTrack.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);

        promoTrack.addEventListener('touchstart', handleDragStart, { passive: true });
        promoTrack.addEventListener('touchmove', handleDragMove, { passive: true });
        promoTrack.addEventListener('touchend', handleDragEnd);

        // Autoplay play/pause on mouse hover
        promoContainer.onmouseenter = stopAutoPlay;
        promoContainer.onmouseleave = startAutoPlay;

        // Initialize state
        updateCarousel();
        startAutoPlay();
    };

    // Fetch and render promos
    const loadPromos = async () => {
        if (promoLoading) promoLoading.classList.remove('hidden');
        if (promoTrack) promoTrack.innerHTML = '';
        if (promoEmpty) promoEmpty.classList.add('hidden');

        try {
            const res = await fetch(`${basePath}api/promo/read_public.php`);
            const json = await res.json();

            if (promoLoading) promoLoading.classList.add('hidden');

            if (json.status !== 'success' || !json.data || json.data.length === 0) {
                if (promoEmpty) promoEmpty.classList.remove('hidden');
                if (promoCount) promoCount.textContent = '0';
                return;
            }

            const promos = json.data;
            if (promoCount) promoCount.textContent = promos.length;

            // Render slides
            promoTrack.innerHTML = promos.map((promo, i) => buildPromoCard(promo, i)).join('');

            // Render navigation dots
            if (dotsContainer) {
                dotsContainer.innerHTML = promos.map((_, i) => `
                    <button class="carousel-dot bg-gray-300 w-2 h-2 rounded-full transition-all duration-300 cursor-pointer" data-index="${i}"></button>
                `).join('');
            }

            // Initialize carousel actions
            initCarousel(promos.length);

        } catch (err) {
            if (promoLoading) promoLoading.classList.add('hidden');
            if (promoEmpty) promoEmpty.classList.remove('hidden');
            console.error('Gagal memuat promo:', err);
        }
    };

    // Start loading
    loadPromos();
});
