document.addEventListener('DOMContentLoaded', function () {
    const emails    = document.querySelectorAll('#email');
    const passwords = document.querySelectorAll('#password');
    const showPasses= document.querySelectorAll('#showPassword');
    const rememberMes=document.querySelectorAll('#rememberMe');
    const btnLogins = document.querySelectorAll('#btnLogin');
    const emailErrs = document.querySelectorAll('#emailError');
    const passErrs  = document.querySelectorAll('#passwordError');
    const formMsgs  = document.querySelectorAll('#formMessage');

    for (let i = 0; i < btnLogins.length; i++) {
        setupForm(
            emails[i], passwords[i], showPasses[i], rememberMes[i], btnLogins[i], 
            emailErrs[i], passErrs[i], formMsgs[i]
        );
    }

    // Propagate redirect parameter to register links if present
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect');
    if (redirectUrl) {
        document.querySelectorAll('a[href*="register.html"]').forEach(link => {
            try {
                const url = new URL(link.href, window.location.href);
                url.searchParams.set('redirect', redirectUrl);
                link.href = url.pathname + url.search;
            } catch (e) {
                console.error('Failed to parse register URL:', e);
            }
        });
    }

    function setupForm(emailInput, passwordInput, showPassCheck, rememberMeCheck, submitBtn, emailError, passwordError, formMessage) {
        if (!submitBtn || !emailInput || !passwordInput) return;
        
        showPassCheck.addEventListener('change', function () {
            passwordInput.type = this.checked ? 'text' : 'password';
        });

        function showError(element, message) {
            element.textContent = message;
            element.classList.remove('hidden');
        }

        function clearError(element) {
            element.textContent = '';
            element.classList.add('hidden');
        }

        function showFormMessage(message, type = 'error') {
            formMessage.textContent = message;
            formMessage.className = 'text-sm text-center px-4 py-2 rounded-lg ';
            formMessage.className += type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700';
            formMessage.classList.remove('hidden');
        }

        function clearFormMessage() {
            formMessage.textContent = '';
            formMessage.classList.add('hidden');
        }

        function validateEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        function validate() {
            let valid = true;
            clearError(emailError);
            clearError(passwordError);
            clearFormMessage();

            const email    = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email) {
                showError(emailError, 'Email tidak boleh kosong.');
                valid = false;
            } else if (!validateEmail(email)) {
                showError(emailError, 'Format email tidak valid.');
                valid = false;
            }

            if (!password) {
                showError(passwordError, 'Password tidak boleh kosong.');
                valid = false;
            } else if (password.length < 6) {
                showError(passwordError, 'Password minimal 6 karakter.');
                valid = false;
            }

            return valid;
        }

        emailInput.addEventListener('input', () => clearError(emailError));
        passwordInput.addEventListener('input', () => clearError(passwordError));

        submitBtn.addEventListener('click', async function () {
            if (!validate()) return;

            // Memeriksa Google reCAPTCHA
            const recaptchaResponse = typeof grecaptcha !== 'undefined' ? grecaptcha.getResponse() : '';
            if (!recaptchaResponse) {
                showFormMessage('Silakan centang reCAPTCHA terlebih dahulu.');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Loading...';

            const formData = new FormData();
            formData.append('email', emailInput.value.trim());
            formData.append('password', passwordInput.value);
            formData.append('remember', rememberMeCheck && rememberMeCheck.checked ? '1' : '0');
            formData.append('g-recaptcha-response', recaptchaResponse);

            try {
                const basePath = window.location.pathname.includes('/public/pages/') ? '../../' : './';
                const response = await fetch(basePath + 'auth/login.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    showFormMessage(result.message, 'success');
                    setTimeout(() => { 
                        if (result.role === 'admin') {
                            window.location.href = basePath + 'public/pages/dashboard.html';
                        } else {
                            const params = new URLSearchParams(window.location.search);
                            const redirectVal = params.get('redirect');
                            if (redirectVal) {
                                window.location.href = decodeURIComponent(redirectVal);
                            } else {
                                window.location.href = basePath + 'index.html';
                            }
                        }
                    }, 1500);
                } else {
                    showFormMessage(result.message || 'Login gagal.');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'SIGN IN';
                    if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
                }
            } catch (error) {
                showFormMessage('Terjadi kesalahan pada server saat login.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'SIGN IN';
                if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
            }
        });
    }
});