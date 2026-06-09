document.addEventListener('DOMContentLoaded', function () {
    // Jalankan setup untuk Mobile dan Desktop
    setupForm('Mobile');
    setupForm('Desktop');

    function setupForm(suffix) {
        const step1Container = document.getElementById('step1' + suffix);
        const step2Container = document.getElementById('step2' + suffix);
        
        const emailInput = document.getElementById('email' + suffix);
        const btnSendOtp = document.getElementById('btnSendOtp' + suffix);
        const emailError = document.getElementById('emailError' + suffix);
        
        const otpInput = document.getElementById('otp' + suffix);
        const otpError = document.getElementById('otpError' + suffix);
        
        const newPasswordInput = document.getElementById('newPassword' + suffix);
        const newPasswordError = document.getElementById('newPasswordError' + suffix);
        
        const confirmPasswordInput = document.getElementById('confirmPassword' + suffix);
        const confirmPasswordError = document.getElementById('confirmPasswordError' + suffix);
        
        const showPasswordCheck = document.getElementById('showPassword' + suffix);
        const btnResend = document.getElementById('btnResend' + suffix);
        const btnResetPassword = document.getElementById('btnResetPassword' + suffix);
        
        const formMessage = document.getElementById('formMessage' + suffix);

        if (!btnSendOtp || !emailInput) return;

        let emailToReset = '';
        let isRequesting = false;

        function showMessage(msg, type = 'error') {
            formMessage.textContent = msg;
            formMessage.className = 'text-sm text-center px-4 py-2 rounded-lg ';
            formMessage.className += type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
            formMessage.classList.remove('hidden');
        }

        function clearMessage() {
            formMessage.textContent = '';
            formMessage.classList.add('hidden');
        }

        function showError(el, msg) {
            el.textContent = msg;
            el.classList.remove('hidden');
        }

        function clearError(el) {
            el.textContent = '';
            el.classList.add('hidden');
        }

        function validateEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        // Tampilkan/Sembunyikan password
        if (showPasswordCheck) {
            showPasswordCheck.addEventListener('change', function () {
                const type = this.checked ? 'text' : 'password';
                newPasswordInput.type = type;
                confirmPasswordInput.type = type;
            });
        }

        // Batasi OTP hanya angka
        if (otpInput) {
            otpInput.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9]/g, '');
                clearError(otpError);
            });
        }

        emailInput.addEventListener('input', () => clearError(emailError));
        newPasswordInput.addEventListener('input', () => clearError(newPasswordError));
        confirmPasswordInput.addEventListener('input', () => clearError(confirmPasswordError));

        // Submit form when pressing Enter key on Step 1 input
        emailInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendOtpRequest();
            }
        });

        // Submit form when pressing Enter key on Step 2 inputs
        const handleStep2Enter = function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                if (btnResetPassword) btnResetPassword.click();
            }
        };
        if (otpInput) otpInput.addEventListener('keydown', handleStep2Enter);
        if (newPasswordInput) newPasswordInput.addEventListener('keydown', handleStep2Enter);
        if (confirmPasswordInput) confirmPasswordInput.addEventListener('keydown', handleStep2Enter);

        // PENGIRIMAN OTP (STEP 1)
        async function sendOtpRequest() {
            if (isRequesting) return;

            const email = emailInput.value.trim();
            if (!email) {
                showError(emailError, 'Email tidak boleh kosong.');
                return;
            }
            if (!validateEmail(email)) {
                showError(emailError, 'Format email tidak valid.');
                return;
            }

            isRequesting = true;
            clearError(emailError);
            clearMessage();
            
            btnSendOtp.disabled = true;
            const originalText = btnSendOtp.textContent;
            btnSendOtp.textContent = 'Mengirim...';

            const formData = new FormData();
            formData.append('email', email);

            try {
                const basePath = window.location.pathname.includes('/public/pages/') ? '../../' : './';
                const response = await fetch(basePath + 'auth/forgot_password.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    emailToReset = email;
                    showMessage(result.message, 'success');
                    
                    // Transisi mulus ke Step 2
                    setTimeout(() => {
                        clearMessage();
                        step1Container.classList.add('hidden');
                        step2Container.classList.remove('hidden');
                        isRequesting = false;
                    }, 1500);
                } else {
                    showMessage(result.message || 'Gagal mengirim OTP.');
                    btnSendOtp.disabled = false;
                    btnSendOtp.textContent = originalText;
                    isRequesting = false;
                }
            } catch (error) {
                console.error(error);
                showMessage('Terjadi kesalahan koneksi server.');
                btnSendOtp.disabled = false;
                btnSendOtp.textContent = originalText;
                isRequesting = false;
            }
        }

        btnSendOtp.addEventListener('click', sendOtpRequest);

        // KIRIM ULANG OTP
        if (btnResend) {
            btnResend.addEventListener('click', async () => {
                if (isRequesting) return;
                isRequesting = true;

                btnResend.disabled = true;
                const originalText = btnResend.textContent;
                btnResend.textContent = 'Mengirim...';
                clearMessage();

                const formData = new FormData();
                formData.append('email', emailToReset);

                try {
                    const basePath = window.location.pathname.includes('/public/pages/') ? '../../' : './';
                    const response = await fetch(basePath + 'auth/forgot_password.php', {
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
                                isRequesting = false; // Reset lock when countdown ends
                            } else {
                                btnResend.textContent = `Tunggu ${countdown}s`;
                            }
                        }, 1000);
                    } else {
                        showMessage(result.message || 'Gagal mengirim ulang OTP.');
                        btnResend.disabled = false;
                        btnResend.textContent = originalText;
                        isRequesting = false;
                    }
                } catch (error) {
                    console.error(error);
                    showMessage('Terjadi kesalahan koneksi server.');
                    btnResend.disabled = false;
                    btnResend.textContent = originalText;
                    isRequesting = false;
                }
            });
        }

        // EKSEKUSI RESET PASSWORD (STEP 2)
        if (btnResetPassword) {
            btnResetPassword.addEventListener('click', async () => {
                if (isRequesting) return;

                const otp = otpInput.value.trim();
                const newPassword = newPasswordInput.value;
                const confirmPassword = confirmPasswordInput.value;

                let valid = true;
                clearError(otpError);
                clearError(newPasswordError);
                clearError(confirmPasswordError);
                clearMessage();

                if (!otp || otp.length !== 6) {
                    showError(otpError, 'Kode OTP harus 6 digit.');
                    valid = false;
                }
                if (!newPassword) {
                    showError(newPasswordError, 'Password baru tidak boleh kosong.');
                    valid = false;
                } else if (newPassword.length < 6) {
                    showError(newPasswordError, 'Password minimal 6 karakter.');
                    valid = false;
                }
                if (!confirmPassword) {
                    showError(confirmPasswordError, 'Konfirmasi password tidak boleh kosong.');
                    valid = false;
                } else if (newPassword !== confirmPassword) {
                    showError(confirmPasswordError, 'Konfirmasi password tidak cocok.');
                    valid = false;
                }

                if (!valid) return;

                isRequesting = true;
                btnResetPassword.disabled = true;
                btnResetPassword.textContent = 'Memproses...';

                const formData = new FormData();
                formData.append('email', emailToReset);
                formData.append('otp', otp);
                formData.append('password', newPassword);
                formData.append('confirmPassword', confirmPassword);

                try {
                    const basePath = window.location.pathname.includes('/public/pages/') ? '../../' : './';
                    const response = await fetch(basePath + 'auth/reset_password.php', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    
                    if (result.status === 'success') {
                        showMessage(result.message, 'success');
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 2000);
                    } else {
                        showMessage(result.message || 'Gagal mereset password.');
                        btnResetPassword.disabled = false;
                        btnResetPassword.textContent = 'RESET PASSWORD';
                        isRequesting = false;
                    }
                } catch (error) {
                    console.error(error);
                    showMessage('Terjadi kesalahan koneksi server.');
                    btnResetPassword.disabled = false;
                    btnResetPassword.textContent = 'RESET PASSWORD';
                    isRequesting = false;
                }
            });
        }
    }
});
