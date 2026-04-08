document.addEventListener('DOMContentLoaded', function () {
    // Get URL Params for email
    const urlParams = new URLSearchParams(window.location.search);
    const emailToVerify = urlParams.get('email');

    if (!emailToVerify) {
        // Redirect to login if accessed directly without email
        window.location.href = 'login.html';
        return;
    }

    // Identify Mobile vs Desktop form by checking which button is visible
    const isDesktop = window.innerWidth >= 768; // Tailwind md breakpoint is 768px
    
    // We attach listeners to both just in case screen resizes
    setupForm('otpMobile', 'btnVerifyMobile', 'otpErrorMobile', 'formMessageMobile');
    setupForm('otpDesktop', 'btnVerifyDesktop', 'otpErrorDesktop', 'formMessageDesktop');

    function setupForm(otpId, btnId, errorId, msgId) {
        const otpInput = document.getElementById(otpId);
        const btnVerify = document.getElementById(btnId);
        const otpError = document.getElementById(errorId);
        const formMessage = document.getElementById(msgId);

        if (!otpInput || !btnVerify) return;

        function showMessage(msg, type = 'error') {
            formMessage.textContent = msg;
            formMessage.className = 'text-sm text-center px-4 py-2 rounded-lg ';
            formMessage.className += type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
            formMessage.classList.remove('hidden');
        }

        // Only allow numbers
        otpInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (otpError) {
                otpError.classList.add('hidden');
                otpError.textContent = '';
            }
        });

        btnVerify.addEventListener('click', async () => {
            const otpCode = otpInput.value.trim();
            if (otpCode.length !== 6) {
                otpError.textContent = 'Kode OTP harus 6 digit angka.';
                otpError.classList.remove('hidden');
                return;
            }

            btnVerify.disabled = true;
            btnVerify.textContent = 'Memproses...';
            
            formMessage.classList.add('hidden');

            const formData = new FormData();
            formData.append('email', emailToVerify);
            formData.append('otp', otpCode);

            try {
                const basePath = window.location.pathname.includes('/public/pages/') ? '../../' : './';
                const response = await fetch(basePath + 'auth/verify_otp.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    showMessage(result.message, 'success');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                } else {
                    showMessage(result.message || 'Verifikasi gagal. Coba lagi.', 'error');
                    btnVerify.disabled = false;
                    btnVerify.textContent = 'VERIFIKASI';
                }
            } catch (error) {
                console.error("Fetch Error Detail:", error);
                showMessage('Koneksi Error: ' + error.message, 'error');
                btnVerify.disabled = false;
                btnVerify.textContent = 'VERIFIKASI';
            }
        });

        const btnResend = otpId === 'otpMobile' ? document.getElementById('btnResendMobile') : document.getElementById('btnResendDesktop');
        if (btnResend) {
            btnResend.addEventListener('click', async () => {
                btnResend.disabled = true;
                const originalText = btnResend.textContent;
                btnResend.textContent = 'Mengirim...';
                formMessage.classList.add('hidden');

                const formData = new FormData();
                formData.append('email', emailToVerify);

                try {
                    const basePath = window.location.pathname.includes('/public/pages/') ? '../../' : './';
                    const response = await fetch(basePath + 'auth/resend_otp.php', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    
                    if (result.status === 'success') {
                        showMessage(result.message, 'success');
                        
                        let countdown = 60;
                        btnResend.textContent = `Tunggu ${countdown}s`;
                        const timer = setInterval(() => {
                            countdown--;
                            if (countdown <= 0) {
                                clearInterval(timer);
                                btnResend.textContent = originalText;
                                btnResend.disabled = false;
                            } else {
                                btnResend.textContent = `Tunggu ${countdown}s`;
                            }
                        }, 1000);

                    } else {
                        showMessage(result.message || 'Gagal mengirim ulang OTP.', 'error');
                        btnResend.disabled = false;
                        btnResend.textContent = originalText;
                    }
                } catch (error) {
                    console.error("Fetch Error Detail:", error);
                    showMessage('Koneksi Error: ' + error.message, 'error');
                    btnResend.disabled = false;
                    btnResend.textContent = originalText;
                }
            });
        }
    }
});
