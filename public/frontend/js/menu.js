const fs = require('fs');
const file = 'd:/Project Kuliah/Burgerlicious/index.html';
let html = fs.readFileSync(file, 'utf8');

// 1. Fix images from h-16 to h-32/h-40 with hover scale effect
html = html.replace(/class="h-16 object-contain"/g, 'class="h-32 sm:h-40 w-full object-contain transform group-hover:scale-110 transition-transform duration-500"');

// 2. Change background of the image container to create contrast for larger images
// Original: bg-gray-50 p-6
html = html.replace(/class="flex justify-center items-center bg-gray-50 p-6"/g, 'class="flex justify-center items-center bg-gradient-to-b from-gray-50 to-white rounded-t-lg p-8 overflow-hidden"');

// 3. Inject relative wrapper with arrows for the carousel
const carouselStartStr = '<div class="w-full flex overflow-x-auto gap-8 pb-8 pt-4 px-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">';

const carouselReplacement = `<div class="relative group/slider">
                <!-- Tombol Kiri -->
                <button id="slider-left" class="absolute left-2 lg:-left-6 top-1/2 -translate-y-1/2 z-10 bg-white text-[#BA0000] p-4 rounded-full shadow-2xl opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hover:bg-[#FEBB19] hover:text-white hidden md:flex items-center justify-center border border-gray-100 hover:scale-110 focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>

                <div id="slider-container" class="w-full flex overflow-x-auto gap-8 pb-8 pt-4 px-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth">`;

if (html.includes(carouselStartStr)) {
    html = html.replace(carouselStartStr, carouselReplacement);
} else {
    console.error("Could not find carousel start string. Make sure it matches exactly.");
}

// 4. Inject closing tag for relative wrapper & Right Arrow
// The container ends with </div> \s* </div> \s* </section>
const regexEnd = /(<\/div>\s*<\/div>\s*<\/section>\s*<!-- About Section -->)/;
const replacementEnd = `            </div>

                <!-- Tombol Kanan -->
                <button id="slider-right" class="absolute right-2 lg:-right-6 top-1/2 -translate-y-1/2 z-10 bg-[#BA0000] text-white p-4 rounded-full shadow-2xl opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hover:bg-[#8F0919] hidden md:flex items-center justify-center hover:scale-110 focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </div>
    </section>

    <!-- About Section -->`;

html = html.replace(regexEnd, replacementEnd);

// 5. Inject scroll logic script at the bottom
if (!html.includes("const slider = document.getElementById('slider-container');")) {
    html = html.replace('</body>', 
`    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const slider = document.getElementById('slider-container');
            const btnLeft = document.getElementById('slider-left');
            const btnRight = document.getElementById('slider-right');
            
            if(slider && btnLeft && btnRight) {
                // Determine item width based on the first card
                const getScrollAmount = () => {
                    const card = slider.querySelector('.snap-center');
                    // Width + Gap (32px from gap-8)
                    return card ? card.offsetWidth + 32 : 300; 
                };

                btnLeft.addEventListener('click', () => {
                    slider.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
                });
                btnRight.addEventListener('click', () => {
                    slider.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
                });
            }
        });
    </script>
</body>`);
}

fs.writeFileSync(file, html);
console.log('Done!');
