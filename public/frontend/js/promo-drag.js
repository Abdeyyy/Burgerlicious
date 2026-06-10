document.addEventListener('DOMContentLoaded', () => {
    const marquee = document.getElementById('promo-marquee');
    if (!marquee) return;

    // Fetch active promos first
    fetch('api/promo/read_public.php')
        .then(res => res.json())
        .then(json => {
            if (json.status === 'success' && json.data && json.data.length > 0) {
                renderDynamicPromos(json.data);
            } else {
                showEmptyPromoState();
            }
        })
        .catch(err => {
            console.error('Gagal memuat promo dinamis:', err);
            showEmptyPromoState();
        });

    function showEmptyPromoState() {
        marquee.innerHTML = `
            <div class="w-full text-center py-12 text-white">
                <span class="text-4xl block mb-2">🎁</span>
                <p class="text-base font-bold">Nantikan Promo Menarik Selanjutnya!</p>
            </div>
        `;
    }

    function renderDynamicPromos(promos) {
        // Build track HTML
        // Make sure there are at least 4 items to scroll smoothly
        let trackItems = [...promos];
        while (trackItems.length < 4) {
            trackItems = [...trackItems, ...promos];
        }

        const dayTranslations = {
            'Monday': 'Senin',
            'Tuesday': 'Selasa',
            'Wednesday': 'Rabu',
            'Thursday': 'Kamis',
            'Friday': 'Jumat',
            'Saturday': 'Sabtu',
            'Sunday': 'Minggu'
        };

        const cardsHtml = trackItems.map((promo, index) => {
            let badgeText = 'Terbatas';
            let badgeBg = 'bg-red-600 text-white'; // default

            if (promo.hari_aktif) {
                const days = promo.hari_aktif.split(',').map(d => d.trim());
                const translatedDays = days.map(d => dayTranslations[d] || d);
                badgeText = `Setiap ${translatedDays.join(', ')}`;
                badgeBg = 'bg-yellow-400 text-red-600';
            } else {
                if (promo.tipe_promo === 'percentage') {
                    badgeText = `Diskon ${Number(promo.nilai_diskon)}%`;
                    badgeBg = 'bg-yellow-400 text-red-600';
                } else if (promo.tipe_promo === 'fixed') {
                    badgeText = `Hemat Rp ${Number(promo.nilai_diskon).toLocaleString('id-ID')}`;
                    badgeBg = 'bg-red-600 text-white';
                } else if (promo.tipe_promo === 'bogo') {
                    badgeText = 'Buy 1 Get 1';
                    badgeBg = 'bg-yellow-500 text-white';
                } else if (promo.tipe_promo === 'bundling') {
                    badgeText = 'Paket Bundling';
                    badgeBg = 'bg-[#8F0919] text-[#FEBB19]';
                }
            }

            const rotateClass = index % 2 === 0 ? 'rotate-3' : '-rotate-3';
            const imgSrc = promo.gambar_url ? promo.gambar_url : 'assets/images/Promo_mantap_kamis.png';
 
            return `
                <div onclick="window.location.href='public/pages/promo.html'" class="group relative bg-white rounded-3xl p-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer w-[320px] md:w-[460px] shrink-0 h-[200px] md:h-[290px] flex flex-col">
                    <div class="absolute top-6 left-6 z-20 ${badgeBg} text-xs font-extrabold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md transform ${rotateClass}">
                        ${badgeText}
                    </div>
                    <div class="overflow-hidden rounded-2xl relative flex-1">
                        <img loading="lazy" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out" 
                             src="${imgSrc}" 
                             alt="${promo.nama_promo}"
                             onerror="this.src='assets/images/Promo_mantap_kamis.png'">
                    </div>
                </div>
            `;
        }).join('');

        marquee.innerHTML = `
            <div class="animate-marquee flex gap-6 pr-6 shrink-0">
                ${cardsHtml}
            </div>
            <div class="animate-marquee flex gap-6 pr-6 shrink-0" aria-hidden="true">
                ${cardsHtml}
            </div>
        `;

        initMarquee();
    }

    function initMarquee() {
        const currentTracks = Array.from(marquee.children);
        if (currentTracks.length < 2) return;

        // Remove CSS animation to let JavaScript control the motion and dragging
        currentTracks.forEach(track => {
            track.classList.remove('animate-marquee');
        });

        let isDown = false;
        let startX;
        let scrollLeft;
        const scrollSpeed = 0.9; // matches the original 30s CSS scroll speed
        let animationFrameId = null;
        
        let trackWidth = currentTracks[0].offsetWidth;

        // Recalculate track width on resize to support responsiveness
        window.addEventListener('resize', () => {
            trackWidth = currentTracks[0].offsetWidth;
        });

        // Auto-scroll loop
        const step = () => {
            if (!isDown) {
                marquee.scrollLeft += scrollSpeed;
                
                // Seamless wrap around
                if (marquee.scrollLeft >= trackWidth) {
                    marquee.scrollLeft = 0;
                }
            }
            animationFrameId = requestAnimationFrame(step);
        };

        // Initialize auto-scroll
        step();

        // Mouse events
        marquee.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - marquee.offsetLeft;
            scrollLeft = marquee.scrollLeft;
            cancelAnimationFrame(animationFrameId);
        });

        marquee.addEventListener('mouseleave', () => {
            if (isDown) {
                isDown = false;
                step();
            }
        });

        marquee.addEventListener('mouseup', () => {
            if (isDown) {
                isDown = false;
                step();
            }
        });

        marquee.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - marquee.offsetLeft;
            const walk = (x - startX) * 1.5; // adjust sensitivity
            
            let newScrollLeft = scrollLeft - walk;
            
            // Wrap around during active drag
            if (newScrollLeft >= trackWidth) {
                newScrollLeft -= trackWidth;
                scrollLeft -= trackWidth;
            } else if (newScrollLeft < 0) {
                newScrollLeft += trackWidth;
                scrollLeft += trackWidth;
            }
            
            marquee.scrollLeft = newScrollLeft;
        });

        // Touch events for mobile/tablet drag support
        marquee.addEventListener('touchstart', (e) => {
            isDown = true;
            startX = e.touches[0].pageX - marquee.offsetLeft;
            scrollLeft = marquee.scrollLeft;
            cancelAnimationFrame(animationFrameId);
        });

        marquee.addEventListener('touchend', () => {
            if (isDown) {
                isDown = false;
                step();
            }
        });

        marquee.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            const x = e.touches[0].pageX - marquee.offsetLeft;
            const walk = (x - startX) * 1.5;
            
            let newScrollLeft = scrollLeft - walk;
            
            if (newScrollLeft >= trackWidth) {
                newScrollLeft -= trackWidth;
                scrollLeft -= trackWidth;
            } else if (newScrollLeft < 0) {
                newScrollLeft += trackWidth;
                scrollLeft += trackWidth;
            }
            
            marquee.scrollLeft = newScrollLeft;
        });
    }
});
