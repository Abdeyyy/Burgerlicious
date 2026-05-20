document.addEventListener('DOMContentLoaded', () => {
    const marquee = document.getElementById('promo-marquee');
    if (!marquee) return;

    const tracks = marquee.querySelectorAll('.animate-marquee');
    if (tracks.length < 2) return;

    // Remove CSS animation to let JavaScript control the motion and dragging
    tracks.forEach(track => {
        track.classList.remove('animate-marquee');
    });

    let isDown = false;
    let startX;
    let scrollLeft;
    const scrollSpeed = 0.9; // matches the original 30s CSS scroll speed
    let animationFrameId = null;
    
    // Track 1 width is exactly half of the duplicate tracks' width
    let trackWidth = tracks[0].offsetWidth;

    // Recalculate track width on resize to support responsiveness
    window.addEventListener('resize', () => {
        trackWidth = tracks[0].offsetWidth;
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
});
