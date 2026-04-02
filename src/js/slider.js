// slider.js - Menu slider logic for index.html

document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('slider-container');
    const btnLeft = document.getElementById('slider-left');
    const btnRight = document.getElementById('slider-right');

    if (slider && btnLeft && btnRight) {
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
