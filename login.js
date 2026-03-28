document.addEventListener('DOMContentLoaded', function () {
    const emails    = document.querySelectorAll('#email');
    const passwords = document.querySelectorAll('#password');
    const showPasses= document.querySelectorAll('#showPassword');
    const btnLogins = document.querySelectorAll('#btnLogin');
    const emailErrs = document.querySelectorAll('#emailError');
    const passErrs  = document.querySelectorAll('#passwordError');
    const formMsgs  = document.querySelectorAll('#formMessage');

    for (let i = 0; i < btnLogins.length; i++) {
        setupForm(
            emails[i], passwords[i], showPasses[i], btnLogins[i], 
            emailErrs[i], passErrs[i], formMsgs[i]
        );
    }

    function setupForm(emailInput, passwordInput, showPassCheck, submitBtn, emailError, passwordError, formMessage) {
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
            submitBtn.disabled = true;
            submitBtn.textContent = 'Loading...';

            const formData = new FormData();
            formData.append('email', emailInput.value.trim());
            formData.append('password', passwordInput.value);

            try {
                const response = await fetch('auth/login.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    showFormMessage(result.message, 'success');
                    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
                } else {
                    showFormMessage(result.message || 'Login gagal.');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'SIGN IN';
                }
            } catch (error) {
                showFormMessage('Terjadi kesalahan pada server saat login.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'SIGN IN';
            }
        });
    }
});