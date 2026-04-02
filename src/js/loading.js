(function () {
    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'page-loader';
        overlay.innerHTML = `
            <div class="loader-content">
                <img src="assets/icon/wired-lineal-1927-food-truck-hover-pinch.gif" alt="Loading..." />
                <p>Loading...</p>
                <div class="loader-bar-wrap">
                    <div class="loader-bar" id="loader-bar"></div>
                </div>
                <span class="loader-percent" id="loader-percent">0%</span>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    let progressInterval = null;

    function startProgress() {
        const bar = document.getElementById('loader-bar');
        const percent = document.getElementById('loader-percent');
        if (!bar || !percent) return;

        let value = 0;
        bar.style.width = '0%';
        percent.textContent = '0%';

        clearInterval(progressInterval);
        progressInterval = setInterval(() => {
            const step = value < 70 ? Math.random() * 8 + 3 : Math.random() * 2 + 0.5;
            value = Math.min(value + step, 90);
            bar.style.width = value + '%';
            percent.textContent = Math.floor(value) + '%';
        }, 150);
    }

    function completeProgress(callback) {
        const bar = document.getElementById('loader-bar');
        const percent = document.getElementById('loader-percent');
        clearInterval(progressInterval);
        if (bar) bar.style.width = '100%';
        if (percent) percent.textContent = '100%';
        setTimeout(callback, 300);
    }

    function hideLoader(overlay) {
        completeProgress(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 600);
        });
    }

    function showLoader(overlay) {
        overlay.style.display = 'flex';
        overlay.classList.remove('fade-out');
        startProgress();
    }
    document.addEventListener('DOMContentLoaded', function () {
        const overlay = createOverlay();
        startProgress();

        window.addEventListener('load', function () {
            setTimeout(() => hideLoader(overlay), 500);
        });

        document.addEventListener('click', function (e) {
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href) return;

            const isInternal = !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('#') && !href.startsWith('mailto');
            if (!isInternal) return;

            e.preventDefault();
            showLoader(overlay);

            setTimeout(() => {
                window.location.href = href;
            }, 1500);
        });
    });
})();